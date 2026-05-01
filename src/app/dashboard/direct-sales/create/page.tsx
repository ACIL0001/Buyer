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
    MdAddAPhoto,
    MdHandshake, 
    MdFlashOn,
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
import RichFileUpload from '@/components/shared/wizard/RichFileUpload';

const DIRECT_SALE_TYPES = {
    PRODUCT: 'PRODUCT',
    SERVICE: 'SERVICE',
};

const AUCTION_TYPES = {
    CLASSIC: 'CLASSIC',
    EXPRESS: 'EXPRESS',
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
            quantity: '',
            wilaya: '',
            location: '',
            auctionType: AUCTION_TYPES.CLASSIC,
            duration: '',
            isPro: false,
            hidden: false,
            professionalOnly: false,
            contactNumber: '',
            // New fields from design
            size: '',
            color: '',
            status: '',
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
                const { values } = JSON.parse(savedSession);
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
                values: formik.values
            }));
        }
    }, [formik.values, isHydrated]);

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
        '& .MuiInputBase-input': {
            padding: '12px 16px',
        }
    };

    const cardStyle = {
        p: { xs: 3, md: 5 },
        backgroundColor: '#ffffff',
        borderRadius: '32px',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    };

    const actionButtonStyle = {
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 700,
        py: 1.5,
        px: 4,
        fontSize: '1rem',
        transition: 'all 0.2s ease',
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
                overflow: 'auto',
                fontFamily: "'DM Sans', sans-serif"
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
                                <Box sx={{ ...cardStyle }}>
                                    <Typography 
                                        variant="h4" 
                                        sx={{ 
                                            color: '#002795', 
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontWeight: 600, 
                                            fontSize: '22px',
                                            lineHeight: '130%',
                                            letterSpacing: '0%',
                                            mb: 1, 
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {t('createDirectSale.title', 'Informations produit')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#94a3b8', mb: 5 }}>
                                        {t('createDirectSale.subtitle', 'Remplissez les détails ci-dessous pour publier votre annonce.')}
                                    </Typography>

                                    <Grid container spacing={3}>


                                        <Grid size={{ xs: 12 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.descriptionLabel', 'Description')}</Typography>
                                            <TextField
                                                fullWidth
                                                placeholder="description"
                                                variant="outlined" multiline rows={4}
                                                {...formik.getFieldProps('description')}
                                                error={formik.touched.description && !!formik.errors.description}
                                                helperText={formik.touched.description && formik.errors.description}
                                                sx={inputStyle}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.titleLabel', 'Nom de produit')}</Typography>
                                            <TextField
                                                fullWidth
                                                placeholder="Nom"
                                                variant="outlined"
                                                {...formik.getFieldProps('title')}
                                                error={formik.touched.title && !!formik.errors.title}
                                                helperText={formik.touched.title && formik.errors.title}
                                                sx={inputStyle}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.size', 'Taille ou poids')}</Typography>
                                            <TextField
                                                fullWidth
                                                placeholder="Taille"
                                                variant="outlined"
                                                {...formik.getFieldProps('size')}
                                                sx={inputStyle}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.color', 'Couleurs')}</Typography>
                                            <TextField
                                                fullWidth
                                                placeholder="Couleur"
                                                variant="outlined"
                                                {...formik.getFieldProps('color')}
                                                sx={inputStyle}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.productCategory', 'Catégories')}</Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                variant="outlined"
                                                placeholder="Sélectionner catégorie"
                                                {...formik.getFieldProps('productCategory')}
                                                error={formik.touched.productCategory && !!formik.errors.productCategory}
                                                sx={inputStyle}
                                                SelectProps={{ native: false, displayEmpty: true }}
                                            >
                                                <MenuItem value="" disabled>Sélectionner catégorie</MenuItem>
                                                {categories.map(cat => (
                                                    <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.price', 'Prix')}</Typography>
                                            <TextField
                                                fullWidth type="number"
                                                placeholder="Prix"
                                                variant="outlined"
                                                {...formik.getFieldProps('price')}
                                                error={formik.touched.price && !!formik.errors.price}
                                                sx={inputStyle}
                                                InputProps={{ endAdornment: <InputAdornment position="end">DA</InputAdornment> }}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.quantity', 'Quantité')}</Typography>
                                            <TextField
                                                fullWidth
                                                placeholder="entree quantité en stock"
                                                variant="outlined"
                                                {...formik.getFieldProps('quantity')}
                                                sx={inputStyle}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12 }}>
                                            <Typography sx={fieldLabelStyle}>Statut de produit</Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                variant="outlined"
                                                placeholder="Produit ou Service"
                                                {...formik.getFieldProps('saleType')}
                                                sx={inputStyle}
                                                SelectProps={{ displayEmpty: true }}
                                            >
                                                <MenuItem value="" disabled>Produit ou Service</MenuItem>
                                                <MenuItem value={DIRECT_SALE_TYPES.PRODUCT}>Produit</MenuItem>
                                                <MenuItem value={DIRECT_SALE_TYPES.SERVICE}>Service</MenuItem>
                                            </TextField>
                                        </Grid>
                                        
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.wilaya', 'Wilaya')}</Typography>
                                            <TextField select fullWidth variant="outlined" placeholder="Sélectionner Wilaya" {...formik.getFieldProps('wilaya')} sx={inputStyle} SelectProps={{ displayEmpty: true }}>
                                                <MenuItem value="" disabled>Sélectionner Wilaya</MenuItem>
                                                {WILAYAS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                                            </TextField>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography sx={fieldLabelStyle}>{t('createDirectSale.location', 'Localisation')}</Typography>
                                            <TextField 
                                                fullWidth 
                                                placeholder="Ex: Alger Center"
                                                variant="outlined"
                                                {...formik.getFieldProps('location')} 
                                                sx={inputStyle}
                                            />
                                        </Grid>

                                        {/* Contact (Optional but keep function) */}
                                        <Grid size={{ xs: 12 }}>
                                             <Typography sx={fieldLabelStyle}>Contact (Optionnel)</Typography>
                                             <TextField
                                                 fullWidth
                                                 placeholder="Ex: 0555123456"
                                                 variant="outlined"
                                                 {...formik.getFieldProps('contactNumber')}
                                                 error={formik.touched.contactNumber && !!formik.errors.contactNumber}
                                                 sx={inputStyle}
                                                 InputProps={{ startAdornment: <InputAdornment position="start"><MdPhone /></InputAdornment> }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                                
                                {/* SETTINGS CARD (Secondary) */}
                                {/* Advanced Settings Moving to Right Column */}
                            </Grid>

                            {/* RIGHT COLUMN: MEDIA & ACTIONS */}
                            <Grid size={{ xs: 12, md: 4.5 }}>
                                <Stack spacing={4}>
                                    <Box sx={cardStyle}>
                                        <Typography variant="h5" sx={{ color: '#002795', fontWeight: 700, fontSize: '20px', mb: 2 }}>
                                            Paramètres avancés
                                        </Typography>
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
                                        <Typography 
                                            variant="h5" 
                                            sx={{ 
                                                color: '#002795', 
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontWeight: 600, 
                                                fontSize: '22px',
                                                lineHeight: '130%',
                                                letterSpacing: '0%',
                                                mb: 0,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            Image offre/ service
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#002795', fontWeight: 600, display: 'block', mb: 0 }}>
                                            Note : <span style={{ color: '#94a3b8', fontWeight: 400 }}>Format photos SVG, PNG, or JPG (Max size 4mb)</span>
                                        </Typography>

                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                                            gap: 'clamp(8px, 2vw, 16px)',
                                            width: '100%',
                                        }}>
                                            {[1, 2, 3, 4].map((i) => {
                                                const file = mediaFiles[i - 1];
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
                                                                    const newFiles = [...mediaFiles];
                                                                    newFiles[i - 1] = newFile;
                                                                    setMediaFiles(newFiles.filter(Boolean));
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

                                    <Stack spacing={2} sx={{ alignItems: 'flex-end' }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={() => formik.handleSubmit()}
                                            disabled={isSubmitting || !formik.isValid}
                                            sx={{
                                                ...actionButtonStyle,
                                                backgroundColor: '#002795',
                                                '&:hover': { backgroundColor: '#001e75', transform: 'translateY(-2px)' },
                                                boxShadow: '0 10px 20px -5px rgba(0,39,149,0.3)',
                                            }}
                                        >
                                            {isSubmitting ? 'En cours...' : t('createDirectSale.publishSale', 'Publier Produit')}
                                        </Button>

                                    </Stack>
                                </Stack>
                            </Grid>
                        </Grid>
                    </FormikProvider>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
