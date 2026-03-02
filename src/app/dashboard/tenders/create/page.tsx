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
  Skeleton,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as Yup from 'yup';
import { useFormik, FormikProvider } from 'formik';
import { useTranslation } from 'react-i18next';
import { 
    MdStore, 
    MdCheck, 
    MdGavel, 
    MdFlashOn, 
    MdTrendingDown,
    MdStar,
    MdKeyboardArrowRight,
    MdAccessTime,
    MdLocationOn,
    MdEmail,
    MdPaid,
    MdPhone,
} from 'react-icons/md';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '@/hooks/useAuth';

// Shared Wizard Components
import WizardWrapper from '@/components/shared/wizard/WizardWrapper';
import WizardStepper from '@/components/shared/wizard/WizardStepper';
import SelectionCard from '@/components/shared/wizard/SelectionCard';
import RichFileUpload from '@/components/shared/wizard/RichFileUpload';
import WizardNavigation from '@/components/shared/wizard/WizardNavigation';

const TENDER_TYPES = {
    PRODUCT: "PRODUCT",
    SERVICE: "SERVICE",
};
  
const TENDER_AUCTION_TYPES = {
    CLASSIC: "CLASSIC",
    EXPRESS: "EXPRESS",
};

const TENDER_EVALUATION_TYPES = {
    MOINS_DISANT: "MOINS_DISANT",
    MIEUX_DISANT: "MIEUX_DISANT",
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

export default function CreateTenderPage() {
    const theme = useTheme();
    const router = useRouter();
    const { auth, isLogged } = useAuth();
    const { t } = useTranslation();

    const pageTheme = React.useMemo(() => createTheme(theme, {
        palette: {
            primary: { main: '#059669' }, // Green
            secondary: { main: '#10b981' }, // Lighter green
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
                                    backgroundColor: '#059669',
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
    }), [theme]);
    
    // State
    const [activeStep, setActiveStep] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    // Formik
    const validationSchema = Yup.object().shape({
        tenderType: Yup.string().required(t('createTender.errors.selectionRequired')),
        auctionType: Yup.string().required(t('createTender.errors.selectionRequired')),
        evaluationType: Yup.string().required(t('createTender.errors.selectionRequired')),
        category: Yup.string().required(t('createTender.errors.selectionRequired')),
        title: Yup.string().min(3).required(t('createTender.errors.titleRequired')),
        description: Yup.string().min(10).required(t('createTender.errors.descriptionRequired')),
        duration: Yup.number().nullable().required(t('createTender.errors.durationRequired')),
        wilaya: Yup.string().required(t('createTender.errors.wilayaRequired')),
        location: Yup.string().required(t('createTender.errors.locationRequired')),
        contactNumber: Yup.string().matches(
            /^[0-9]{10}$/,
            'Le numéro de contact doit contenir 10 chiffres'
        ).optional(),
    });

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            tenderType: '',
            auctionType: '',
            evaluationType: '',
            category: '',
            duration: null,
            location: '',
            wilaya: '',
            quantity: '',
            isPro: false,
            hidden: false,
            professionalOnly: false,
            price: '', // Budget
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
        
        // Restore session state
        const savedSession = sessionStorage.getItem('mazadclick-create-tender-draft');
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
            sessionStorage.setItem('mazadclick-create-tender-draft', JSON.stringify({
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
            console.error('Error loading categories', error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const steps = [
        formik.values.tenderType ? (formik.values.tenderType === TENDER_TYPES.PRODUCT ? t('createTender.product') : t('createTender.service')) : t('createTender.steps.type'),
        formik.values.evaluationType ? (formik.values.evaluationType === TENDER_EVALUATION_TYPES.MOINS_DISANT ? t('createTender.lowestPrice') : t('createTender.bestOffer')) : t('createTender.steps.evaluation'),
        categories.find(c => c._id === formik.values.category)?.name || t('createTender.steps.category'),
        t('createTender.steps.details')
    ];

    const validateStep = (step: number) => {
        const { values } = formik;
        switch (step) {
            case 0: return !!values.tenderType && !!values.auctionType;
            case 1: return !!values.evaluationType;
            case 2: return !!values.category;
            case 3: return !!values.title && !!values.description && !!values.duration && !!values.wilaya && !!values.location;
            default: return true;
        }
    };


    const handleNext = () => {
        if(validateStep(activeStep)) {
            setActiveStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        const prevStep = activeStep - 1;
        setActiveStep(prevStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Unselect values for the step we are going back to
        if (prevStep === 0) {
            formik.setFieldValue('tenderType', '');
            formik.setFieldValue('auctionType', '');
        } else if (prevStep === 1) {
            formik.setFieldValue('evaluationType', '');
        } else if (prevStep === 2) {
            formik.setFieldValue('category', '');
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            setIsSubmitting(true);
            const { TendersAPI } = await import('@/services/tenders');
            
            const startDate = new Date();
            const endDate = new Date(startDate);
            // Tender duration
            if (values.auctionType === 'EXPRESS') {
                endDate.setHours(endDate.getHours() + Number(values.duration));
            } else {
                endDate.setDate(endDate.getDate() + Number(values.duration));
            }

            const payload = {
                ...values,
                place: values.location,
                startingAt: startDate.toISOString(),
                endingAt: endDate.toISOString(),
                owner: auth?.user?._id,
                professionalOnly: values.professionalOnly,
                hidden: values.hidden === true,
                maxBudget: values.price ? Number(values.price) : undefined,
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(payload));
            
            attachments.forEach((file) => {
                formData.append('attachments[]', file);
            });

            await TendersAPI.create(formData);
            sessionStorage.removeItem('mazadclick-create-tender-draft');
            router.push('/dashboard/tenders');
        } catch (error) {
            console.error('Error creating tender', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                            {t('createTender.chooseType')}
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={12}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>{t('createTender.typeOfListing')}</Typography>
                                <Grid container spacing={2}>
                                    {[TENDER_TYPES.PRODUCT, TENDER_TYPES.SERVICE].map(type => (
                                         <Grid size={{ xs: 6, md: 6 }} key={type}>
                                            <SelectionCard
                                                title={type === TENDER_TYPES.PRODUCT ? t('createTender.product') : t('createTender.service')}
                                                description={type === TENDER_TYPES.PRODUCT ? t('createTender.productDesc') : t('createTender.serviceDesc')}
                                                icon={type === TENDER_TYPES.PRODUCT ? <MdStore /> : <MdEmail />}
                                                selected={formik.values.tenderType === type}
                                                onClick={() => {
                                                    formik.setFieldValue('tenderType', type);
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
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>{t('createTender.tenderMode')}</Typography>
                                <Grid container spacing={2}>
                                    {[TENDER_AUCTION_TYPES.CLASSIC, TENDER_AUCTION_TYPES.EXPRESS].map(type => (
                                         <Grid size={{ xs: 6, md: 6 }} key={type}>
                                            <SelectionCard
                                                title={type === TENDER_AUCTION_TYPES.CLASSIC ? t('createTender.classic') : t('createTender.express')}
                                                description={type === TENDER_AUCTION_TYPES.CLASSIC ? t('createTender.classicDesc') : t('createTender.expressDesc')}
                                                icon={type === TENDER_AUCTION_TYPES.CLASSIC ? <MdGavel /> : <MdFlashOn />}
                                                selected={formik.values.auctionType === type}
                                                onClick={() => {
                                                    formik.setFieldValue('auctionType', type);
                                                    if(formik.values.tenderType) {
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
                return (
                    <Box>
                         <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                            {t('createTender.evaluationType')}
                        </Typography>
                        <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                            {[TENDER_EVALUATION_TYPES.MOINS_DISANT, TENDER_EVALUATION_TYPES.MIEUX_DISANT].map(type => (
                                 <Grid size={{ xs: 12, md: 5 }} key={type}>
                                    <SelectionCard
                                        title={type === TENDER_EVALUATION_TYPES.MOINS_DISANT ? t('createTender.lowestPrice') : t('createTender.bestOffer')}
                                        description={type === TENDER_EVALUATION_TYPES.MOINS_DISANT ? t('createTender.lowestPriceDesc') : t('createTender.bestOfferDesc')}
                                        icon={type === TENDER_EVALUATION_TYPES.MOINS_DISANT ? <MdTrendingDown /> : <MdStar />}
                                        selected={formik.values.evaluationType === type}
                                        onClick={() => {
                                            formik.setFieldValue('evaluationType', type);
                                            setTimeout(() => {
                                                setActiveStep(prev => prev + 1);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }, 300);
                                        }}
                                    />
                                 </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
                            {t('createTender.selectCategory')}
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            {categories.filter(c => c.type === formik.values.tenderType || !c.type).map(cat => (
                                 <Grid size={{ xs: 12, sm: 6, md: 3 }} key={cat._id}>
                                    <SelectionCard
                                        title={cat.name}
                                        icon={<MdKeyboardArrowRight />}
                                        selected={formik.values.category === cat._id}
                                        onClick={() => {
                                            formik.setFieldValue('category', cat._id);
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
            case 3:
                const durationOptions = formik.values.auctionType === TENDER_AUCTION_TYPES.EXPRESS ? [2, 4, 8, 24] : [2, 7, 15, 30, 60];
                return (
                    <Grid container spacing={3}>
                         {/* DURATION */}
                         <Grid size={12}>
                             <Typography variant="h6" gutterBottom fontWeight="bold">{t('createTender.duration')}</Typography>
                             <Grid container spacing={2}>
                                {durationOptions.map(val => (
                                    <Grid size={{ xs: 6, md: 3 }} key={val}>
                                        <SelectionCard
                                            title={`${val} ${formik.values.auctionType === TENDER_AUCTION_TYPES.EXPRESS ? t('createTender.hours') : t('createTender.days')}`}
                                            icon={<MdAccessTime />}
                                            selected={formik.values.duration === val}
                                            onClick={() => formik.setFieldValue('duration', val)}
                                        />
                                    </Grid>
                                ))}
                             </Grid>
                             <Divider sx={{ my: 4 }} />
                         </Grid>

                        {/* PROJECT INFO */}
                        <Grid size={{ xs: 12, md: 8 }}>
                             <Typography variant="h6" gutterBottom fontWeight="bold">{t('createTender.projectInfo')}</Typography>
                             <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4 }}>
                                 <TextField
                                    fullWidth
                                    label={t('createTender.tenderTitle')}
                                    placeholder={t('createTender.tenderTitlePlaceholder')}
                                    variant="outlined"
                                    {...formik.getFieldProps('title')}
                                    error={formik.touched.title && !!formik.errors.title}
                                    helperText={formik.touched.title && formik.errors.title}
                                    sx={{ mb: 3 }}
                                 />
                                 <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label={t('createTender.specifications')}
                                    placeholder={t('createTender.specificationsPlaceholder')}
                                    variant="outlined"
                                    {...formik.getFieldProps('description')}
                                    error={formik.touched.description && !!formik.errors.description}
                                    helperText={formik.touched.description && formik.errors.description}
                                 />
                             </Box>
                        </Grid>

                        {/* BUDGET & QUANTITY */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                {formik.values.evaluationType === TENDER_EVALUATION_TYPES.MIEUX_DISANT 
                                    ? "Quantité et Détails" 
                                    : t('createTender.budgetAndDetails')}
                            </Typography>
                            <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {formik.values.evaluationType !== TENDER_EVALUATION_TYPES.MIEUX_DISANT && (
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label={t('createTender.budgetEstimate')}
                                        placeholder={t('createTender.optional')}
                                        InputProps={{ endAdornment: <InputAdornment position="end">DA</InputAdornment> }}
                                        variant="outlined"
                                        {...formik.getFieldProps('price')}
                                        error={formik.touched.price && !!formik.errors.price}
                                        helperText={formik.touched.price && formik.errors.price}
                                    />
                                )}
                                 {(formik.values.tenderType === TENDER_TYPES.PRODUCT || formik.values.tenderType === TENDER_TYPES.SERVICE) && (
                                     <TextField
                                        fullWidth
                                        label={t('createTender.quantity')}
                                        type="text"
                                        variant="outlined"
                                        {...formik.getFieldProps('quantity')}
                                        error={formik.touched.quantity && !!formik.errors.quantity}
                                        helperText={formik.touched.quantity && formik.errors.quantity}
                                     />
                                 )}
                            </Box>
                        </Grid>

                        {/* LOCATION */}
                        <Grid size={{ xs: 12, md: 6 }}>
                             <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>{t('createTender.location')}</Typography>
                             <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4 }}>
                                 <TextField
                                    fullWidth
                                    select
                                    label={t('createTender.wilaya')}
                                    variant="outlined"
                                    {...formik.getFieldProps('wilaya')}
                                    error={formik.touched.wilaya && !!formik.errors.wilaya}
                                    helperText={formik.touched.wilaya && formik.errors.wilaya}
                                    sx={{ mb: 3 }}
                                 >
                                    {WILAYAS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                                 </TextField>
                                 <TextField
                                    fullWidth
                                    label={t('createTender.address')}
                                    variant="outlined"
                                    InputProps={{ startAdornment: <InputAdornment position="start"><MdLocationOn /></InputAdornment> }}
                                    {...formik.getFieldProps('location')}
                                    error={formik.touched.location && !!formik.errors.location}
                                    helperText={formik.touched.location && formik.errors.location}
                                />
                             </Box>
                        </Grid>



                        {/* SETTINGS */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>{t('createTender.settings')}</Typography>
                            <Box sx={{ p: { xs: 3, md: 4 }, backgroundColor: alpha(theme.palette.text.primary, 0.02), borderRadius: 4 }}>
                                <FormControlLabel
                                    control={<Switch checked={formik.values.hidden} onChange={formik.handleChange} name="hidden" />}
                                    label={
                                        <Box>
                                            <Typography variant="body1" fontWeight="bold">Masquer l'utilisateur</Typography>
                                            <Typography variant="caption" color="text.secondary">{t('createTender.hiddenDesc')}</Typography>
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

                        {/* ATTACHMENTS */}
                        <Grid size={12}>
                             <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ mt: 2 }}>{t('createTender.attachments')}</Typography>
                             <RichFileUpload 
                                files={attachments}
                                onFilesChange={setAttachments}
                                subtitle={t('createTender.uploadAttachments')}
                             />
                        </Grid>
                    </Grid>
                );
            default:
                return null;
        }
    };

    return (
        <ThemeProvider theme={pageTheme}>
        <FormikProvider value={formik}>
            <WizardWrapper 
                title={t('createTender.title')}
                subtitle={t('createTender.subtitle')}
                onBack={activeStep > 0 ? handleBack : undefined}
                backLabel={t('createTender.back')}
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
                    hideNext={activeStep === 0 || activeStep === 1 || activeStep === 2}
                    nextLabel={t('createTender.nextStep')}
                    submitLabel={t('createTender.publishTender')}
                />
            </WizardWrapper>
        </FormikProvider>
        </ThemeProvider>
    );
}
