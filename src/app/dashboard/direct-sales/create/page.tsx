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
  Skeleton,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '@/hooks/useAuth';
import { useSettingsStore } from '@/contexts/settingsStore';

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
    const { directSaleColor } = useSettingsStore();

    const pageTheme = React.useMemo(() => createTheme(theme, {
        palette: {
            primary: { 
                main: directSaleColor || '#d97706',
                light: directSaleColor || '#d97706',
                dark: directSaleColor || '#d97706',
                contrastText: '#fff'
            },
            secondary: { 
                main: directSaleColor || '#d97706',
                light: directSaleColor || '#d97706',
                dark: directSaleColor || '#d97706',
                contrastText: '#fff'
            },
        },
        components: {
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: '16px',
                        backgroundColor: alpha('#888', 0.05),
                        '& fieldset': { borderColor: 'transparent', transition: 'all 0.2s ease' },
                        transition: 'all 0.2s ease-in-out',
                        '&:hover fieldset': {
                            borderColor: alpha('#888', 0.15),
                        },
                        '&.Mui-focused': {
                            backgroundColor: theme.palette.background.paper,
                            '& fieldset': {
                                borderColor: theme.palette.primary.main,
                                borderWidth: '2px',
                            },
                        },
                    }
                }
            },
            MuiSwitch: {
                styleOverrides: {
                    root: {
                        width: 42,
                        height: 26,
                        padding: 0,
                        '& .MuiSwitch-switchBase': {
                            padding: 0,
                            margin: 2,
                            transitionDuration: '300ms',
                            '&.Mui-checked': {
                                transform: 'translateX(16px)',
                                color: '#fff',
                                '& + .MuiSwitch-track': {
                                    backgroundColor: directSaleColor || '#d97706',
                                    opacity: 1,
                                    border: 0,
                                },
                            },
                        },
                        '& .MuiSwitch-thumb': {
                            boxSizing: 'border-box',
                            width: 22,
                            height: 22,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        },
                        '& .MuiSwitch-track': {
                            borderRadius: 26 / 2,
                            backgroundColor: '#E9E9EA',
                            opacity: 1,
                        },
                    }
                }
            }
        }
    }), [theme, directSaleColor]);

    const [activeStep, setActiveStep] = useState(0);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

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
        
        // Restore session state
        const savedSession = sessionStorage.getItem('mazadclick-create-directsale-draft');
        if (savedSession) {
            try {
                const { step, values } = JSON.parse(savedSession);
                if (step !== undefined) setActiveStep(step);
                if (values) formik.setValues(values);
            } catch (e) {
                console.error("Failed to restore session draft", e);
            }
        }
        setIsHydrated(true);
    }, [isLogged]);

    // Save session state on change
    useEffect(() => {
        if (isHydrated) {
            sessionStorage.setItem('mazadclick-create-directsale-draft', JSON.stringify({
                step: activeStep,
                values: formik.values
            }));
        }
    }, [activeStep, formik.values, isHydrated]);

    const loadCategories = async () => {
        try {
            const cached = sessionStorage.getItem('mazadclick-categories-cache');
            if (cached) {
                setCategories(JSON.parse(cached));
                setIsLoadingCategories(false);
            }

            const { CategoryAPI } = await import('@/services/category');
            const response = await CategoryAPI.getCategoryTree();
            let categoryData: any[] = [];
            if (response?.data && Array.isArray(response.data)) categoryData = response.data;
            else if (Array.isArray(response)) categoryData = response;
            
            if (categoryData.length > 0) {
                setCategories(categoryData);
                sessionStorage.setItem('mazadclick-categories-cache', JSON.stringify(categoryData));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingCategories(false);
        }
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
            sessionStorage.removeItem('mazadclick-create-directsale-draft');
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
                             <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4 }}>
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
                             <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                             <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4 }}>
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
                             <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4 }}>
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
                            <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4 }}>
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
        <ThemeProvider theme={pageTheme}>
        <FormikProvider value={formik}>
            <WizardWrapper 
                title={t('createDirectSale.title')}
                subtitle={t('createDirectSale.subtitle')}
                onBack={activeStep > 0 ? handleBack : undefined}
                backLabel={t('createDirectSale.back')}
            >
                <WizardStepper activeStep={activeStep} steps={steps} />
                
                <Box sx={{ minHeight: 200, position: 'relative' }}>
                    {(!isHydrated || isLoadingCategories) ? (
                        <Box sx={{ p: 2 }}>
                            <Skeleton variant="text" width="40%" height={50} sx={{ mx: 'auto', mb: 3 }} />
                            <Grid container spacing={2}>
                                {[1, 2].map((i) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 4 }} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderStepContent(activeStep)}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </Box>

                <WizardNavigation 
                    onNext={activeStep < steps.length - 1 ? handleNext : () => formik.handleSubmit()}
                    isLastStep={activeStep === steps.length - 1}
                    isSubmitting={isSubmitting}
                    disableNext={!validateStep(activeStep)}
                    submitLabel={t('createDirectSale.publishSale')}
                    hideNext={activeStep === 0 || activeStep === 1}
                    nextLabel={t('createDirectSale.nextStep')}
                />
            </WizardWrapper>
        </FormikProvider>
        </ThemeProvider>
    );
}
