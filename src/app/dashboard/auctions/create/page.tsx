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
  useTheme,
  alpha,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import * as Yup from 'yup';
import { useFormik, FormikProvider } from 'formik';
import { useTranslation } from 'react-i18next';
import { 
    MdStore, 
    MdCheck, 
    MdGavel, 
    MdFlashOn, 
    MdCalendarToday,
    MdCalendarViewMonth,
    MdDateRange,
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

const BID_TYPES = {
  PRODUCT: "PRODUCT",
  SERVICE: "SERVICE",
};

const AUCTION_TYPES = {
  CLASSIC: "CLASSIC",
  EXPRESS: "EXPRESS",
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

export default function CreateAuctionPage() {
    const theme = useTheme();
    const router = useRouter();
    const { auth, isLogged } = useAuth();
    const { t } = useTranslation();
    
    // State
    const [activeStep, setActiveStep] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Formik
    const validationSchema = Yup.object().shape({
        bidType: Yup.string().required(t('createAuction.errors.selectBidType')),
        auctionType: Yup.string().required(t('createAuction.errors.selectBidType')),
        productCategory: Yup.string().required(t('createAuction.errors.categoryRequired')),
        title: Yup.string().min(3).required(t('createAuction.errors.titleRequired')),
        description: Yup.string().min(10).required(t('createAuction.errors.descriptionRequired')),
        startingPrice: Yup.number().min(1).required(t('createAuction.errors.startingPricePositive')),
        duration: Yup.number().nullable().required(t('createAuction.errors.noDuration')),
        place: Yup.string().required(t('createAuction.errors.placeRequired')),
        wilaya: Yup.string().required(t('createAuction.errors.wilayaRequired')),
        quantity: Yup.string().when('bidType', {
            is: BID_TYPES.PRODUCT,
            then: (schema) => schema.required(t('createAuction.errors.quantityRequired')),
            otherwise: (schema) => schema.notRequired(),
        }),
        reservePrice: Yup.number().min(0).required(t('createAuction.errors.reservePriceRequired')),
        contactNumber: Yup.string().matches(
            /^[0-9]{10}$/,
            'Le numéro de contact doit contenir 10 chiffres'
        ).optional(),
    });

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            bidType: '',
            auctionType: '',
            productCategory: '',
            productSubCategory: '',
            startingPrice: '',
            duration: null,
            place: '',
            wilaya: '',
            quantity: '',
            isPro: false,
            hidden: false,
            professionalOnly: false,
            reservePrice: '',
            contactNumber: '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => {
            await handleSubmit(values);
        },
    });

    useEffect(() => {
        if (!isLogged) {
            router.push('/auth/login');
            return;
        }
        loadCategories();
    }, [isLogged]);

    const loadCategories = async () => {
        try {
            const { CategoryAPI } = await import('@/services/category');
            const response = await CategoryAPI.getCategoryTree();
            let categoryData = [];
            if (response?.data && Array.isArray(response.data)) categoryData = response.data;
            else if (Array.isArray(response)) categoryData = response;
            
            if (categoryData.length > 0) setCategories(categoryData);
        } catch (error) {
            console.error('Error loading categories', error);
        }
    };

    const validateStep = (step: number) => {
        const { values } = formik;
        switch (step) {
            case 0: return !!values.bidType && !!values.auctionType;
            case 1: return !!values.productCategory;
            case 2: return !!values.title && !!values.description && !!values.startingPrice && !!values.duration && !!values.place && !!values.wilaya;
            default: return true;
        }
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        formik.validateForm().then((errors) => {
             // force touch to show errors if any
             formik.setTouched(
                 Object.keys(formik.initialValues).reduce((acc, key) => ({ ...acc, [key]: true }), {})
             );
        });
    };

    const handleBack = () => {
        const prevStep = activeStep - 1;
        setActiveStep(prevStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Unselect values for the step we are going back to
        if (prevStep === 0) {
            formik.setFieldValue('bidType', '');
            formik.setFieldValue('auctionType', '');
        } else if (prevStep === 1) {
            formik.setFieldValue('productCategory', '');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setIsSubmitting(true);
            const { AuctionsAPI } = await import('@/services/auctions');
            
            const startDate = new Date();
            const endDate = new Date(startDate);
            
            if (values.auctionType === 'EXPRESS') {
                endDate.setHours(endDate.getHours() + Number(values.duration));
            } else {
                endDate.setDate(endDate.getDate() + Number(values.duration));
            }

            const payload = {
                ...values,
                startingAt: startDate.toISOString(),
                endingAt: endDate.toISOString(),
                owner: auth?.user?._id,
                professionalOnly: values.professionalOnly,
                hidden: values.hidden === true,
            };
            
            if (!payload.productSubCategory || payload.productSubCategory === '') {
                delete payload.productSubCategory;
            }

            const formData = new FormData();
            formData.append('data', JSON.stringify(payload));

            images.forEach((image) => {
                formData.append('thumbs[]', image);
            });
            
            await AuctionsAPI.create(formData);
            router.push('/dashboard/auctions');
        } catch (error) {
            console.error('Error creating auction:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        formik.values.bidType ? (formik.values.bidType === BID_TYPES.PRODUCT ? t('createAuction.product') : t('createAuction.service')) : t('createAuction.steps.type'),
        categories.find(c => c._id === formik.values.productCategory)?.name || t('createAuction.steps.category'),
        t('createAuction.steps.details')
    ];

    const getDurationIcon = (val: number) => {
        if(val <= 2) return MdFlashOn;
        if(val <= 7) return MdCalendarToday;
        if(val <= 15) return MdCalendarViewMonth;
        return MdDateRange;
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                            {t('createAuction.chooseType')}
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={12}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>{t('createAuction.typeOfListing')}</Typography>
                                <Grid container spacing={2}>
                                    {[BID_TYPES.PRODUCT, BID_TYPES.SERVICE].map((type) => (
                                        <Grid size={{ xs: 6, md: 6 }} key={type}>
                                            <SelectionCard 
                                                title={type === BID_TYPES.PRODUCT ? t('createAuction.product') : t('createAuction.service')}
                                                description={type === BID_TYPES.PRODUCT ? t('createAuction.productDesc') : t('createAuction.serviceDesc')}
                                                icon={type === BID_TYPES.PRODUCT ? <MdStore /> : <MdEmail />}
                                                selected={formik.values.bidType === type}
                                                onClick={() => {
                                                formik.setFieldValue('bidType', type);
                                                // Check if other field is already set (using current render's value)
                                                if(formik.values.auctionType) {
                                                    setTimeout(() => {
                                                        setActiveStep(prev => prev + 1);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }, 300); 
                                                }
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>

                        <Grid size={12}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>{t('createAuction.auctionStyle')}</Typography>
                            <Grid container spacing={2}>
                                {[AUCTION_TYPES.CLASSIC, AUCTION_TYPES.EXPRESS].map((type) => (
                                    <Grid size={{ xs: 6, md: 6 }} key={type}>
                                        <SelectionCard 
                                            title={type === AUCTION_TYPES.CLASSIC ? t('createAuction.classic') : t('createAuction.express')}
                                            description={type === AUCTION_TYPES.CLASSIC ? t('createAuction.classicDesc') : t('createAuction.expressDesc')}
                                            icon={type === AUCTION_TYPES.CLASSIC ? <MdGavel /> : <MdFlashOn />}
                                            selected={formik.values.auctionType === type}
                                            onClick={() => {
                                                formik.setFieldValue('auctionType', type);
                                                if(formik.values.bidType) {
                                                    setTimeout(() => {
                                                        setActiveStep(prev => prev + 1);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }, 300);
                                                }
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>
            );

        case 1:
            const filteredCats = categories.filter(c => c.type === formik.values.bidType || !c.type);
            return (
                <Box>
                        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                        {t('createAuction.selectCategory')}
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        {filteredCats.map((category) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={category._id}>
                                <SelectionCard
                                    title={category.name}
                                    icon={<MdKeyboardArrowRight />}
                                    selected={formik.values.productCategory === category._id}
                                    onClick={() => {
                                        formik.setFieldValue('productCategory', category._id);
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
                const timeOptions = formik.values.auctionType === AUCTION_TYPES.EXPRESS 
                    ? [2, 4, 8, 24]
                    : [2, 7, 15, 30, 60];

                return (
                    <Grid container spacing={3}>
                         {/* DURATION SECTION */}
                         <Grid size={12}>
                             <Typography variant="h6" gutterBottom fontWeight="bold">{t('createAuction.duration')}</Typography>
                             <Grid container spacing={2}>
                                {timeOptions.map((val) => {
                                    const Icon = getDurationIcon(val);
                                    const label = formik.values.auctionType === AUCTION_TYPES.EXPRESS ? `${val} ${t('createAuction.hours')}` : `${val} ${t('createAuction.days')}`;
                                    
                                    return (
                                        <Grid size={{ xs: 6, md: 3 }} key={val}>
                                            <SelectionCard 
                                                title={label}
                                                icon={<Icon />}
                                                selected={formik.values.duration === val}
                                                onClick={() => formik.setFieldValue('duration', val)}
                                            />
                                        </Grid>
                                    );
                                })}
                             </Grid>
                             <Divider sx={{ my: 4 }} />
                         </Grid>

                        {/* BASIC INFO */}
                        <Grid size={{ xs: 12, md: 8 }}>
                             <Typography variant="h6" gutterBottom fontWeight="bold">{t('createAuction.itemDetails')}</Typography>
                             <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                 <TextField
                                    fullWidth
                                    label={t('createAuction.titleLabel')}
                                    variant="outlined"
                                    {...formik.getFieldProps('title')}
                                    error={formik.touched.title && Boolean(formik.errors.title)}
                                    helperText={formik.touched.title && formik.errors.title}
                                    sx={{ mb: 3 }}
                                 />
                                 <TextField
                                    fullWidth
                                    multiline
                                    rows={5}
                                    label={t('createAuction.descriptionLabel')}
                                    variant="outlined"
                                    {...formik.getFieldProps('description')}
                                    error={formik.touched.description && Boolean(formik.errors.description)}
                                    helperText={formik.touched.description && formik.errors.description}
                                 />
                             </Box>
                        </Grid>

                        {/* PRICING & QUANTITY */}
                        <Grid size={{ xs: 12, md: 4 }}>
                             <Typography variant="h6" gutterBottom fontWeight="bold">{t('createAuction.pricing')}</Typography>
                             <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                 <TextField
                                    fullWidth
                                    type="number"
                                    label={t('createAuction.startingPrice')}
                                    InputProps={{ endAdornment: <InputAdornment position="end">DA</InputAdornment> }}
                                    variant="outlined"
                                    {...formik.getFieldProps('startingPrice')}
                                    error={formik.touched.startingPrice && Boolean(formik.errors.startingPrice)}
                                    helperText={formik.touched.startingPrice && formik.errors.startingPrice}
                                 />
                                 
                                 <TextField
                                    fullWidth
                                    type="number"
                                    label={t('createAuction.reservePrice')}
                                    placeholder={t('createAuction.optional')}
                                    InputProps={{ endAdornment: <InputAdornment position="end">DA</InputAdornment> }}
                                    variant="outlined"
                                    {...formik.getFieldProps('reservePrice')}
                                    error={formik.touched.reservePrice && Boolean(formik.errors.reservePrice)}
                                    helperText={(formik.touched.reservePrice && formik.errors.reservePrice) || t('createAuction.reservePriceHelp')}
                                 />

                                 {formik.values.bidType === BID_TYPES.PRODUCT && (
                                     <TextField
                                        fullWidth
                                        label={t('createAuction.quantity')}
                                        type="text"
                                        variant="outlined"
                                        {...formik.getFieldProps('quantity')}
                                        error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                                        helperText={formik.touched.quantity && formik.errors.quantity}
                                     />
                                 )}
                             </Box>
                        </Grid>
                        
                        {/* LOCATION */}
                        <Grid size={{ xs: 12, md: 6 }}>
                             <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>{t('createAuction.location')}</Typography>
                             <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                 <TextField
                                    fullWidth
                                    select
                                    label={t('createAuction.wilaya')}
                                    variant="outlined"
                                    {...formik.getFieldProps('wilaya')}
                                    error={formik.touched.wilaya && Boolean(formik.errors.wilaya)}
                                    helperText={formik.touched.wilaya && formik.errors.wilaya}
                                    sx={{ mb: 3 }}
                                 >
                                     {WILAYAS.map((w) => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                                 </TextField>
                                 <TextField
                                    fullWidth
                                    label={t('createAuction.address')}
                                    variant="outlined"
                                    InputProps={{ startAdornment: <InputAdornment position="start"><MdLocationOn /></InputAdornment> }}
                                    {...formik.getFieldProps('place')}
                                    error={formik.touched.place && Boolean(formik.errors.place)}
                                    helperText={formik.touched.place && formik.errors.place}
                                 />
                             </Box>
                         </Grid>



                        {/* VISIBILITY SETTINGS */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>{t('createAuction.settings')}</Typography>
                            <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                <FormControlLabel
                                    control={<Switch checked={formik.values.hidden} onChange={formik.handleChange} name="hidden" />}
                                    label={
                                        <Box>
                                            <Typography variant="body1" fontWeight="bold">{t('createAuction.hiddenListing')}</Typography>
                                            <Typography variant="caption" color="text.secondary">{t('createAuction.hiddenDesc')}</Typography>
                                        </Box>
                                    }
                                    sx={{ mb: 2, width: '100%', alignItems: 'flex-start' }}
                                />

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
                            </Box>
                        </Grid>

                        {/* IMAGES */}
                        <Grid size={12}>
                             <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>{t('createAuction.images')}</Typography>
                             <RichFileUpload 
                                files={images}
                                onFilesChange={setImages}
                                accept="image/*"
                                subtitle={t('createAuction.uploadImages')}
                             />
                        </Grid>
                    </Grid>
                );
            default:
                return null;
        }
    };

    return (
        <FormikProvider value={formik}>
            <WizardWrapper 
                title={t('createAuction.title')}
                subtitle={t('createAuction.subtitle')}
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
                    submitLabel={t('createAuction.publishAuction')}
                    backLabel={t('createAuction.back')}
                    nextLabel={t('createAuction.nextStep')}
                    hideNext={activeStep === 0 || activeStep === 1}
                />
            </WizardWrapper>
        </FormikProvider>
    );
}
