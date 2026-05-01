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
  Stack,
  Divider,
  Skeleton,
  Container,
  Button,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as Yup from 'yup';
import { useFormik, FormikProvider } from 'formik';
import { useTranslation } from 'react-i18next';
import { 
    MdStore, 
    MdImage,
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
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '@/hooks/useAuth';
import { useSettingsStore } from '@/contexts/settingsStore';

// Shared Components
import RichFileUpload from '@/components/shared/wizard/RichFileUpload';

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
    const { auctionColor } = useSettingsStore();

    const pageTheme = React.useMemo(() => createTheme(theme, {
        palette: {
            primary: { 
                main: '#002795',
                contrastText: '#fff'
            },
        },
        typography: {
            fontFamily: "'DM Sans', sans-serif",
        },
    }), [theme]);
    
    // State
    const [categories, setCategories] = useState<any[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    
    // Formik
    const validationSchema = Yup.object().shape({
        bidType: Yup.string().required(t('createAuction.errors.selectBidType')),
        productCategory: Yup.string().required(t('createAuction.errors.categoryRequired')),
        title: Yup.string().min(3).required(t('createAuction.errors.titleRequired')),
        description: Yup.string().min(10, 'La description doit contenir au moins 10 caractères').required('La description est requise'),
        startingPrice: Yup.number().min(1).required(t('createAuction.errors.startingPricePositive')),
        duration: Yup.number().nullable().required(t('createAuction.errors.noDuration')),
        place: Yup.string().required(t('createAuction.errors.placeRequired')),
        wilaya: Yup.string().required(t('createAuction.errors.wilayaRequired')),
        quantity: Yup.string().required(t('createAuction.errors.quantityRequired')),
        reservePrice: Yup.number()
            .when('startingPrice', ([startingPrice], schema) => {
                return startingPrice ? schema.moreThan(startingPrice, "Le prix de réserve doit être supérieur au prix initial.") : schema;
            })
            .required('Le prix de réserve est requis'),
        size: Yup.string().optional(),
        color: Yup.string().optional(),
    });

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            bidType: '',
            auctionType: AUCTION_TYPES.CLASSIC,
            productCategory: '',
            productSubCategory: '',
            startingPrice: '',
            duration: '',
            place: '',
            wilaya: '',
            quantity: '',
            isPro: false,
            hidden: false,
            professionalOnly: false,
            reservePrice: '',
            contactNumber: '',
            size: '',
            color: '',
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
        const savedSession = sessionStorage.getItem('mazadclick-create-auction-draft');
        if (savedSession) {
            try {
                const { values } = JSON.parse(savedSession);
                if (values) {
                    // Sanitize null values to empty strings to avoid React value prop errors
                    const sanitizedValues = Object.keys(values).reduce((acc: any, key) => {
                        acc[key] = values[key] ?? formik.initialValues[key as keyof typeof formik.initialValues];
                        return acc;
                    }, {});
                    formik.setValues({ ...formik.initialValues, ...sanitizedValues });
                }
            } catch (e) {
                console.error("Failed to restore session draft", e);
            }
        }
        setIsHydrated(true);
    }, [isLogged]);

    // Save session state on change
    useEffect(() => {
        if (isHydrated) {
            sessionStorage.setItem('mazadclick-create-auction-draft', JSON.stringify({
                values: formik.values
            }));
        }
    }, [formik.values, isHydrated]);

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
            sessionStorage.removeItem('mazadclick-create-auction-draft');
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
        } catch (error) { console.error(error); } finally { setIsLoadingCategories(false); }
    };

    const fieldLabelStyle = {
        color: '#002795',
        fontWeight: 700,
        fontSize: '0.95rem',
        mb: 1,
        display: 'block'
    };

    const inputStyle = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            '& fieldset': { borderColor: '#D1D1D1', borderWidth: '1.6px' },
            '&:hover fieldset': { borderColor: '#cbd5e1' },
            '&.Mui-focused fieldset': { borderColor: '#002795', borderWidth: '1.6px' },
        },
        '& .MuiInputBase-input': { padding: '12px 16px' }
    };

    const cardStyle = {
        p: { xs: 3, md: 5 },
        backgroundColor: '#ffffff',
        borderRadius: '32px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    };

    if (!isHydrated) return null;

    return (
        <ThemeProvider theme={pageTheme}>
            <Box sx={{ 
                minHeight: '100vh', 
                backgroundColor: '#f8fafc', 
                p: { xs: 1, md: 2, xl: 4 }, 
                display: 'flex', 
                justifyContent: 'center',
                overflow: 'auto'
            }}>
                <Container maxWidth="lg" sx={{
                    width: '100%',
                    p: '0 !important',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    pb: 10
                }}>
                    <FormikProvider value={formik}>
                        <Grid container spacing={2.75}>
                            {/* LEFT COLUMN: INFORMATION */}
                            <Grid size={{ xs: 12, md: 7.5 }}>
                                <Stack spacing={2.75}>
                                    <Box sx={cardStyle}>
                                        <Typography 
                                            variant="h4" 
                                            sx={{ 
                                                color: '#002795', 
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 600, 
                                                fontSize: '22px',
                                                lineHeight: '130%',
                                                mb: 1, 
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            Informations enchère
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                                            Remplissez les détails ci-dessous pour publier votre enchère.
                                        </Typography>

                                        {/* MODERN SEGMENTED SELECTOR */}
                                        <Box sx={{ mb: 4 }}>
                                            <Typography sx={{ ...fieldLabelStyle, mb: 1.5 }}>Type d'enchère</Typography>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                backgroundColor: '#F8FAFC', 
                                                p: 0.75, 
                                                borderRadius: '16px',
                                                width: 'fit-content',
                                                border: '1px solid #E2E8F0'
                                            }}>
                                                {[
                                                    { id: 'CLASSIC', label: 'Enchère Classique', icon: '⚖️' },
                                                    { id: 'EXPRESS', label: 'Enchère Express', icon: '⚡' }
                                                ].map((type) => (
                                                    <Box
                                                        key={type.id}
                                                        onClick={() => formik.setFieldValue('auctionType', type.id)}
                                                        sx={{
                                                            px: 3,
                                                            py: 1.25,
                                                            borderRadius: '12px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1.5,
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            backgroundColor: formik.values.auctionType === type.id ? '#ffffff' : 'transparent',
                                                            color: formik.values.auctionType === type.id ? '#002795' : '#64748b',
                                                            boxShadow: formik.values.auctionType === type.id ? '0 4px 12px rgba(0,39,149,0.1)' : 'none',
                                                            '&:hover': {
                                                                color: formik.values.auctionType === type.id ? '#002795' : '#002795'
                                                            }
                                                        }}
                                                    >
                                                        <Typography sx={{ fontSize: '18px' }}>{type.icon}</Typography>
                                                        <Typography sx={{ 
                                                            fontSize: '0.95rem', 
                                                            fontWeight: formik.values.auctionType === type.id ? 700 : 500,
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {type.label}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>

                                        <Grid container spacing={2.5}>
                                            <Grid size={{ xs: 12 }}>
                                                <Typography sx={fieldLabelStyle}>Délai</Typography>
                                                <TextField 
                                                    select fullWidth variant="outlined" 
                                                    placeholder="choisir un delai"
                                                    {...formik.getFieldProps('duration')} 
                                                    sx={inputStyle}
                                                    SelectProps={{ displayEmpty: true }}
                                                >
                                                    <MenuItem value="" disabled>choisir un delai</MenuItem>
                                                    {formik.values.auctionType === AUCTION_TYPES.EXPRESS ? (
                                                        [1, 2, 4, 12, 24].map(v => (
                                                            <MenuItem key={v} value={v}>{v} {v === 1 ? 'heure' : 'heures'}</MenuItem>
                                                        ))
                                                    ) : (
                                                        [1, 2, 3, 5, 7, 10, 15, 30].map(v => (
                                                            <MenuItem key={v} value={v}>{v} {v === 1 ? 'jour' : 'jours'}</MenuItem>
                                                        ))
                                                    )}
                                                </TextField>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography sx={fieldLabelStyle}>Nom produit</Typography>
                                                <TextField
                                                    fullWidth placeholder="Nom" variant="outlined"
                                                    {...formik.getFieldProps('title')}
                                                    error={formik.touched.title && !!formik.errors.title}
                                                    helperText={formik.touched.title && formik.errors.title}
                                                    sx={inputStyle}
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography sx={fieldLabelStyle}>Description</Typography>
                                                <TextField
                                                    fullWidth placeholder="Description détaillée du produit ou service" 
                                                    variant="outlined" multiline rows={4}
                                                    {...formik.getFieldProps('description')}
                                                    error={formik.touched.description && !!formik.errors.description}
                                                    helperText={formik.touched.description && formik.errors.description}
                                                    sx={inputStyle}
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography sx={fieldLabelStyle}>Taille ou poids</Typography>
                                                <TextField
                                                    fullWidth placeholder="Taille" variant="outlined"
                                                    {...formik.getFieldProps('size')}
                                                    sx={inputStyle}
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography sx={fieldLabelStyle}>Couleur</Typography>
                                                <TextField
                                                    fullWidth placeholder="Couleur" variant="outlined"
                                                    {...formik.getFieldProps('color')}
                                                    sx={inputStyle}
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography sx={fieldLabelStyle}>Categorie</Typography>
                                                <TextField
                                                    select fullWidth variant="outlined"
                                                    placeholder="Selectionner catégorie"
                                                    {...formik.getFieldProps('productCategory')}
                                                    sx={inputStyle}
                                                    SelectProps={{ displayEmpty: true }}
                                                >
                                                    <MenuItem value="" disabled>Selectionner catégorie</MenuItem>
                                                    {categories.map(cat => <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>)}
                                                </TextField>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography sx={fieldLabelStyle}>Prix</Typography>
                                                <TextField
                                                    fullWidth type="number" placeholder="Prix" variant="outlined"
                                                    {...formik.getFieldProps('startingPrice')}
                                                    sx={inputStyle}
                                                    InputProps={{ endAdornment: <InputAdornment position="end">DA</InputAdornment> }}
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography sx={fieldLabelStyle}>Quantité</Typography>
                                                <TextField
                                                    fullWidth placeholder="Entrer quantité en stock" variant="outlined"
                                                    {...formik.getFieldProps('quantity')}
                                                    sx={inputStyle}
                                                />
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography sx={fieldLabelStyle}>Status enchère</Typography>
                                                <TextField
                                                    select fullWidth variant="outlined"
                                                    placeholder="Select status product"
                                                    {...formik.getFieldProps('bidType')}
                                                    sx={inputStyle}
                                                    SelectProps={{ displayEmpty: true }}
                                                >
                                                    <MenuItem value="" disabled>Select status product</MenuItem>
                                                    <MenuItem value={BID_TYPES.PRODUCT}>Produit</MenuItem>
                                                    <MenuItem value={BID_TYPES.SERVICE}>Service</MenuItem>
                                                </TextField>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* SECONDARY CARD: LOCATION */}
                                    <Box sx={cardStyle}>
                                        <Typography variant="h5" sx={{ color: '#002795', fontWeight: 600, fontSize: '20px', mb: 3 }}>
                                            Information Localisation
                                        </Typography>
                                        <Grid container spacing={2.5}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography sx={fieldLabelStyle}>Wilaya</Typography>
                                                <TextField select fullWidth variant="outlined" placeholder="Wilaya" {...formik.getFieldProps('wilaya')} sx={inputStyle} SelectProps={{ displayEmpty: true }}>
                                                    <MenuItem value="" disabled>Wilaya</MenuItem>
                                                    {WILAYAS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                                                </TextField>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <Typography sx={fieldLabelStyle}>Localisation</Typography>
                                                <TextField fullWidth placeholder="Localisation" variant="outlined" {...formik.getFieldProps('place')} sx={inputStyle} />
                                            </Grid>
                                        </Grid>
                                    </Box>

                                </Stack>
                            </Grid>

                            {/* RIGHT COLUMN: MEDIA & ACTIONS */}
                            <Grid size={{ xs: 12, md: 4.5 }}>
                                <Stack spacing={4}>
                                    <Box sx={cardStyle}>
                                        <Typography variant="h5" sx={{ color: '#002795', fontWeight: 700, fontSize: '20px', mb: 2 }}>
                                            Paramètres avancés
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12 }}>
                                                <Typography sx={fieldLabelStyle}>Prix de réserve (DA)</Typography>
                                                <TextField 
                                                    fullWidth type="number" 
                                                    placeholder="Entrer le prix de réserve" 
                                                    variant="outlined" 
                                                    {...formik.getFieldProps('reservePrice')} 
                                                    error={formik.touched.reservePrice && !!formik.errors.reservePrice}
                                                    helperText={formik.touched.reservePrice && formik.errors.reservePrice}
                                                    sx={inputStyle} 
                                                />
                                                <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block', lineHeight: 1.2 }}>
                                                    <Typography component="span" sx={{ fontWeight: 700, color: '#002795' }}>Note :</Typography> L'enchère n'est conclue que si une offre atteint ou dépasse ce prix.
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <Stack spacing={2}>
                                                   <FormControlLabel
                                                       control={<Switch checked={formik.values.hidden} onChange={formik.handleChange} name="hidden" />}
                                                       label={
                                                           <Box>
                                                               <Typography variant="body2" fontWeight="bold">Masquer l'utilisateur</Typography>
                                                               <Typography variant="caption" color="text.secondary">Publier anonymement</Typography>
                                                           </Box>
                                                       }
                                                   />
                                                   {auth.user?.type === 'PROFESSIONAL' && (
                                                       <FormControlLabel
                                                           control={<Switch checked={formik.values.professionalOnly} onChange={formik.handleChange} name="professionalOnly" />}
                                                           label={
                                                               <Box>
                                                                   <Typography variant="body2" fontWeight="bold">Professionnels uniquement</Typography>
                                                                   <Typography variant="caption" color="text.secondary">Visible uniquement par les comptes professionnels</Typography>
                                                               </Box>
                                                           }
                                                       />
                                                   )}
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Box sx={{
                                        width: '100%',
                                        maxWidth: '475px',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '24px',
                                        border: '1px solid #E7E7E7',
                                        p: 'clamp(16px, 3vw, 24px)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px',
                                        boxSizing: 'border-box'
                                    }}>
                                        <Typography variant="h5" sx={{ color: '#002795', fontWeight: 600, fontSize: 'clamp(1rem, 2vw, 1.375rem)', mb: 0, lineHeight: 1.2 }}>
                                            Image offre/ service
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0, lineHeight: 1.4 }}>
                                            <Typography component="span" sx={{ color: '#002795', fontWeight: 700 }}>Note :</Typography> Format photos SVG, PNG, or JPG (Max size 4mb)
                                        </Typography>

                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                                            gap: 'clamp(8px, 2vw, 16px)',
                                            width: '100%',
                                        }}>
                                            {[1, 2, 3, 4].map((i) => {
                                                const file = images[i - 1];
                                                const preview = file ? URL.createObjectURL(file) : null;
                                                return (
                                                    <Box
                                                        key={i}
                                                        onClick={() => {
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = 'image/*';
                                                            input.onchange = (e: any) => {
                                                                const newFile = e.target.files[0];
                                                                if (newFile) {
                                                                    const newImages = [...images];
                                                                    newImages[i - 1] = newFile;
                                                                    setImages(newImages.filter(Boolean));
                                                                }
                                                            };
                                                            input.click();
                                                        }}
                                                        sx={{
                                                            width: '100%',
                                                            aspectRatio: '94.75 / 97',
                                                            borderRadius: '8px',
                                                            border: '1px dashed #1A71F6',
                                                            backgroundColor: '#EEF7FF',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            cursor: 'pointer',
                                                            overflow: 'hidden',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                backgroundColor: '#e0edff',
                                                                borderColor: '#002795'
                                                            }
                                                        }}
                                                    >
                                                        {preview ? (
                                                            <Box component="img" src={preview} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <>
                                                                <Box sx={{ color: '#1A71F6', fontSize: '28px', display: 'flex' }}>
                                                                    <MdImage />
                                                                </Box>
                                                                <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
                                                                    Photo {i}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>

                                    <Button
                                        fullWidth variant="contained"
                                        onClick={() => formik.handleSubmit()}
                                        disabled={isSubmitting || !formik.isValid}
                                        sx={{
                                            borderRadius: '12px', textTransform: 'none', fontWeight: 700, py: 1.5, fontSize: '1rem',
                                            backgroundColor: '#002795', '&:hover': { backgroundColor: '#001e75' },
                                            boxShadow: '0 10px 20px -5px rgba(0,39,149,0.3)',
                                        }}
                                    >
                                        {isSubmitting ? 'En cours...' : "Publier l'enchère"}
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </FormikProvider>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
