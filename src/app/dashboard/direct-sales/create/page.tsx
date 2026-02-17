'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  TextField,
  Typography,
  InputAdornment,
  MenuItem,
  FormControlLabel,
  Switch,
  useTheme,
  alpha,
  Stack,
  Divider,
} from '@mui/material';
import * as Yup from 'yup';
import { useFormik, FormikProvider } from 'formik';
import { useTranslation } from 'react-i18next';
import { 
    MdStore, 
    MdHandshake, 
    MdKeyboardArrowRight,
    MdLocationOn,
    MdEmail,
    MdPhone,
} from 'react-icons/md';
import useAuth from '@/hooks/useAuth';

// Shared Wizard Components
import WizardWrapper from '@/components/shared/wizard/WizardWrapper';
import WizardStepper from '@/components/shared/wizard/WizardStepper';
import SelectionCard from '@/components/shared/wizard/SelectionCard';
import RichFileUpload from '@/components/shared/wizard/RichFileUpload';
import WizardNavigation from '@/components/shared/wizard/WizardNavigation';

const DIRECT_SALE_TYPES = {
    PRODUCT: 'PRODUCT',
    SERVICE: 'SERVICE',
};

const WILAYAS = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 
    'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
    'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
    'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
    "M'Sila", 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi',
    'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt',
    'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla',
    'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane',
];

export default function CreateDirectSalePage() {
    const theme = useTheme();
    const router = useRouter();
    const { auth, isLogged } = useAuth();
    const { t } = useTranslation();

    const [activeStep, setActiveStep] = useState(0);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validationSchema = Yup.object().shape({
        title: Yup.string().min(3).required(t('createDirectSale.errors.titleRequired')),
        description: Yup.string().min(10).required(t('createDirectSale.errors.descriptionRequired')),
        saleType: Yup.string().required(t('createDirectSale.errors.selectionRequired')),
        productCategory: Yup.string().required(t('createDirectSale.errors.selectionRequired')),
        price: Yup.number().positive().required(t('createDirectSale.errors.priceRequired')),
        wilaya: Yup.string().required(t('createDirectSale.errors.wilayaRequired')),
        location: Yup.string().required(t('createDirectSale.errors.locationRequired')),
        contactNumber: Yup.string().matches(
            /^[0-9]{10}$/,
            'Le numéro de contact doit contenir 10 chiffres'
        ).optional(),
    });

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            saleType: '',
            productCategory: '',
            price: '',
            quantity: '1',
            wilaya: '',
            location: '',
            isPro: false,
            hidden: false,
            professionalOnly: false,
            contactNumber: '',
        },
        validationSchema,
        validateOnChange: false,
        onSubmit: async (values) => {
            await handleSubmit(values);
        },
    });

    useEffect(() => {
        if (!isLogged) router.push('/auth/login');
        loadCategories();
    }, [isLogged]);

    const loadCategories = async () => {
        try {
            const { CategoryAPI } = await import('@/services/category');
            const response = await CategoryAPI.getCategoryTree();
            let categoryData: any[] = [];
            if (response?.data && Array.isArray(response.data)) categoryData = response.data;
            else if (Array.isArray(response)) categoryData = response;
            if (categoryData.length > 0) setCategories(categoryData);
        } catch (error) { console.error(error); }
    };

    const validateStep = (step: number) => {
        const { values } = formik;
        switch(step) {
            case 0: return !!values.saleType;
            case 1: return !!values.productCategory;
            case 2: return !!values.title && !!values.description && !!values.price && !!values.wilaya && !!values.location;
            default: return true;
        }
    };

    const handleNext = () => {
        if(validateStep(activeStep)) {
            setActiveStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
             // force touch 
             formik.submitForm(); // easiest way to trigger validation display
        }
    };

    const handleBack = () => {
        const prevStep = activeStep - 1;
        setActiveStep(prevStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Unselect values for the step we are going back to
        if (prevStep === 0) {
            formik.setFieldValue('saleType', '');
        } else if (prevStep === 1) {
            formik.setFieldValue('productCategory', '');
        }
    };

    const handleSubmit = async (values: any) => {
        setIsSubmitting(true);
        try {
            const { DirectSaleAPI } = await import('@/services/direct-sale');
            const formData = new FormData();
            
            const dataPayload = {
               owner: auth.user?._id,
               ...values,
               place: values.location, 
               quantity: values.quantity,
               price: parseFloat(values.price),
               professionalOnly: values.professionalOnly, // explicitly mapping it though it's already in values
               hidden: values.hidden === true,
            };
            console.log('📤 Direct Sale Payload:', dataPayload);
            console.log('📞 Contact Number in payload:', dataPayload.contactNumber);
            formData.append('data', JSON.stringify(dataPayload));
            mediaFiles.forEach(f => {
                if(f.type.startsWith('image')) formData.append('thumbs[]', f);
                else formData.append('videos[]', f); // Assuming API handles videos[]
            });

            await DirectSaleAPI.create(formData);
            router.push('/dashboard/direct-sales');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        formik.values.saleType ? (formik.values.saleType === DIRECT_SALE_TYPES.PRODUCT ? t('createDirectSale.product') : t('createDirectSale.service')) : t('createDirectSale.steps.type'),
        categories.find(c => c._id === formik.values.productCategory)?.name || t('createDirectSale.steps.category'),
        t('createDirectSale.steps.details')
    ];

    const renderStepContent = (step: number) => {
        switch(step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                            {t('createDirectSale.whatSelling')}
                        </Typography>
                        <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <SelectionCard
                                    title={t('createDirectSale.product')}
                                    description={t('createDirectSale.productDesc')}
                                    icon={<MdStore />}
                                    selected={formik.values.saleType === DIRECT_SALE_TYPES.PRODUCT}
                                    onClick={() => {
                                        formik.setFieldValue('saleType', DIRECT_SALE_TYPES.PRODUCT);
                                        setTimeout(() => {
                                            setActiveStep(prev => prev + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }, 300);
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <SelectionCard
                                    title={t('createDirectSale.service')}
                                    description={t('createDirectSale.serviceDesc')}
                                    icon={<MdEmail />}
                                    selected={formik.values.saleType === DIRECT_SALE_TYPES.SERVICE}
                                    onClick={() => {
                                        formik.setFieldValue('saleType', DIRECT_SALE_TYPES.SERVICE);
                                        setTimeout(() => {
                                            setActiveStep(prev => prev + 1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }, 300);
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );
            case 1:
                const filteredCats = categories.filter(c => c.type === formik.values.saleType || !c.type);
                return (
                    <Box>
                        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                            {t('createDirectSale.selectCategory')}
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            {filteredCats.map(cat => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={cat._id}>
                                    <SelectionCard
                                        title={cat.name}
                                        icon={<MdKeyboardArrowRight />}
                                        selected={formik.values.productCategory === cat._id}
                                        onClick={() => {
                                            formik.setFieldValue('productCategory', cat._id);
                                            setTimeout(() => {
                                                setActiveStep(prev => prev + 1);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }, 300);
                                        }}
                                        className="h-full"
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            case 2:
                return (
                    <Grid container spacing={3}>
                         {/* BASIC INFO */}
                        <Grid size={{ xs: 12, md: 8 }}>
                             <Typography variant="h6" fontWeight="bold" gutterBottom>{t('createDirectSale.fillDetails')}</Typography>
                             <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                 <TextField 
                                    label={t('createDirectSale.titleLabel')} 
                                    fullWidth 
                                    variant="outlined"
                                    {...formik.getFieldProps('title')} 
                                    error={formik.touched.title && !!formik.errors.title}
                                    helperText={formik.touched.title && formik.errors.title}
                                    sx={{ mb: 3 }}
                                />
                                <TextField 
                                    label={t('createDirectSale.descriptionLabel')} 
                                    fullWidth multiline rows={5} 
                                    variant="outlined"
                                    {...formik.getFieldProps('description')} 
                                    error={formik.touched.description && !!formik.errors.description}
                                    helperText={formik.touched.description && formik.errors.description}
                                />
                             </Box>
                        </Grid>

                        {/* PRICING & QUANTITY */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>{t('createDirectSale.pricing')}</Typography>
                             <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField 
                                    label={t('createDirectSale.price')} 
                                    fullWidth type="number" 
                                    variant="outlined"
                                    InputProps={{ endAdornment: <InputAdornment position="end">DA</InputAdornment> }}
                                    {...formik.getFieldProps('price')} 
                                    error={formik.touched.price && !!formik.errors.price}
                                    helperText={formik.touched.price && formik.errors.price}
                                />
                                <TextField 
                                    label={t('createDirectSale.quantity')} 
                                    fullWidth type="text" 
                                    variant="outlined"
                                    {...formik.getFieldProps('quantity')} 
                                />
                             </Box>
                        </Grid>
                        
                        {/* LOCATION */}
                        <Grid size={{ xs: 12, md: 6 }}>
                             <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>{t('createDirectSale.location')}</Typography>
                             <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <TextField select label={t('createDirectSale.wilaya')} fullWidth variant="outlined" {...formik.getFieldProps('wilaya')} sx={{ mb: 3 }}>
                                    {WILAYAS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                                </TextField>
                                <TextField 
                                    label={t('createDirectSale.place')} 
                                    fullWidth 
                                    variant="outlined"
                                    InputProps={{ startAdornment: <InputAdornment position="start"><MdLocationOn /></InputAdornment> }}
                                    {...formik.getFieldProps('location')} 
                                />
                             </Box>
                         </Grid>

                         {/* CONTACT NUMBER */}
                         <Grid size={{ xs: 12, md: 6 }}>
                             <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>Contact (Optionnel)</Typography>
                             <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                 <TextField
                                     fullWidth
                                     label="Numéro de contact"
                                     placeholder="Ex: 0555123456"
                                     variant="outlined"
                                     InputProps={{ 
                                         startAdornment: <InputAdornment position="start"><MdPhone /></InputAdornment> 
                                     }}
                                     helperText="Si non fourni, votre numéro d'inscription sera affiché"
                                     {...formik.getFieldProps('contactNumber')}
                                     error={formik.touched.contactNumber && !!formik.errors.contactNumber}
                                />
                             </Box>
                         </Grid>

                         {/* SETTINGS */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>{t('createDirectSale.settings')}</Typography>
                            <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <FormControlLabel
                                    control={<Switch checked={formik.values.hidden} onChange={formik.handleChange} name="hidden" />}
                                    label={
                                        <Box>
                                            <Typography variant="body1" fontWeight="bold">Masquer l'utilisateur</Typography>
                                            <Typography variant="caption" color="text.secondary">{t('createDirectSale.anonymousDesc')}</Typography>
                                        </Box>
                                    }
                                    sx={{ mb: 2, width: '100%', alignItems: 'flex-start' }}
                                />

                                {auth.user?.type === 'PROFESSIONAL' && (
                                <FormControlLabel
                                    control={<Switch checked={formik.values.professionalOnly} onChange={formik.handleChange} name="professionalOnly" />}
                                    label={
                                        <Box>
                                            <Typography variant="body1" fontWeight="bold">Professionnels uniquement</Typography>
                                            <Typography variant="caption" color="text.secondary">Visible uniquement par les comptes professionnels</Typography>
                                        </Box>
                                    }
                                    sx={{ width: '100%', alignItems: 'flex-start' }}
                                />
                                )}
                            </Box>
                        </Grid>

                        {/* MEDIA */}
                        <Grid size={12}>
                             <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>{t('createDirectSale.media')}</Typography>
                             <RichFileUpload 
                                files={mediaFiles}
                                onFilesChange={setMediaFiles}
                                accept="image/*,video/*"
                                subtitle={t('createDirectSale.uploadMedia')}
                             />
                        </Grid>
                    </Grid>
                );
            default: return null;
        }
    };

    return (
        <FormikProvider value={formik}>
            <WizardWrapper 
                title={t('createDirectSale.title')}
                subtitle={t('createDirectSale.subtitle')}
            >
                <WizardStepper activeStep={activeStep} steps={steps} />
                
                <Box sx={{ minHeight: 400 }}>
                    {renderStepContent(activeStep)}
                </Box>

                <WizardNavigation 
                    onBack={activeStep > 0 ? handleBack : undefined}
                    onNext={activeStep < steps.length - 1 ? handleNext : () => formik.handleSubmit()}
                    isLastStep={activeStep === steps.length - 1}
                    isSubmitting={isSubmitting}
                    disableNext={!validateStep(activeStep)}
                    submitLabel={t('createDirectSale.publishSale')}
                    hideNext={activeStep === 0 || activeStep === 1}
                    backLabel={t('createDirectSale.back')}
                    nextLabel={t('createDirectSale.nextStep')}
                />
            </WizardWrapper>
        </FormikProvider>
    );
}
