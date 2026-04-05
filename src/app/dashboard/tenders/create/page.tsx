'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  TextField,
  Typography,
  MenuItem,
  useTheme,
  FormControlLabel,
  Switch,
  Button,
  Container,
  Stack,
  Divider,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as Yup from 'yup';
import { useFormik, FormikProvider } from 'formik';
import { useTranslation } from 'react-i18next';
import React from 'react';
import useAuth from '@/hooks/useAuth';
import { MdStore, MdImage, MdGavel, MdFlashOn } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import RichFileUpload from '@/components/shared/wizard/RichFileUpload';

// Services
import { CategoryAPI } from '@/services/category';
import { TendersAPI } from '@/services/tenders';

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
            primary: { main: '#002795', contrastText: '#fff' },
        },
        typography: { fontFamily: "'DM Sans', sans-serif" },
    }), [theme]);
    
    // State
    const [categories, setCategories] = useState<any[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // Formik
    const validationSchema = Yup.object().shape({
        title: Yup.string().min(3).required(t('createTender.errors.titleRequired')),
        category: Yup.string().required(t('createTender.errors.selectionRequired')),
        description: Yup.string().min(10).required(t('createTender.errors.descriptionRequired')),
        evaluationType: Yup.string().required(t('createTender.errors.selectionRequired')),
        wilaya: Yup.string().required(t('createTender.errors.wilayaRequired')),
        location: Yup.string().required(t('createTender.errors.locationRequired')),
    });

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            tenderType: 'PRODUCT',
            auctionType: TENDER_AUCTION_TYPES.CLASSIC,
            evaluationType: '', // MOINS_DISANT or MIEUX_DISANT
            category: '',
            duration: '',
            location: '',
            wilaya: '',
            quantity: '',
            isPro: false,
            hidden: false,
            professionalOnly: false,
            price: '', 
            contactNumber: '',
        },
        validationSchema,
        validateOnChange: false,
        validateOnBlur: true,
        onSubmit: async (values) => { await handleSubmit(values); },
    });

    useEffect(() => {
        if (!isLogged) { router.push('/auth/login'); return; }
        loadCategories();
        const savedSession = sessionStorage.getItem('mazadclick-create-tender-draft');
        if (savedSession) {
            try {
                const { values } = JSON.parse(savedSession);
                if (values) formik.setValues({ ...formik.initialValues, ...values });
            } catch (e) { console.error("Failed to restore session draft", e); }
        }
        setIsHydrated(true);
    }, [isLogged]);

    useEffect(() => {
        if (isHydrated) {
            sessionStorage.setItem('mazadclick-create-tender-draft', JSON.stringify({ values: formik.values }));
        }
    }, [formik.values, isHydrated]);

    const loadCategories = async () => {
        try {
            const response = await CategoryAPI.getCategoryTree();
            setCategories(response?.data || response || []);
        } catch (error) { console.error('Error loading categories', error); }
    };

    const handleSubmit = async (values: any) => {
        setIsSubmitting(true);
        try {
            const startDate = new Date();
            const endDate = new Date(startDate);
            if (values.auctionType === 'EXPRESS') endDate.setHours(endDate.getHours() + Number(values.duration || 24));
            else endDate.setDate(endDate.getDate() + Number(values.duration || 7));

            const payload = {
                ...values,
                place: values.location,
                startingAt: startDate.toISOString(),
                endingAt: endDate.toISOString(),
                owner: auth?.user?._id,
                maxBudget: values.evaluationType === 'MOINS_DISANT' && values.price ? Number(values.price) : undefined,
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(payload));
            attachments.forEach((file) => formData.append('attachments[]', file));

            await TendersAPI.create(formData);
            sessionStorage.removeItem('mazadclick-create-tender-draft');
            router.push('/dashboard/tenders');
        } catch (error) { console.error('Error creating tender', error); }
        finally { setIsSubmitting(false); }
    };

    const fieldLabelStyle = {
        color: '#002795', fontWeight: 600, fontSize: '18px', mb: 1.2, display: 'block'
    };

    const inputStyle = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px', backgroundColor: '#ffffff',
            '& fieldset': { borderColor: '#D1D1D1', borderWidth: '1.6px' },
            '&:hover fieldset': { borderColor: '#b1b1b1' },
            '&.Mui-focused fieldset': { borderColor: '#002795', borderWidth: '1.6px' },
        },
        '& .MuiInputBase-input': { padding: '14px 16px' }
    };

    const cardStyle = {
        p: { xs: 3, md: 5 }, backgroundColor: '#ffffff', borderRadius: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
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
                <Container maxWidth={false} sx={{ 
                    width: { xl: '1161px' }, 
                    transform: { xl: 'scale(0.82)', lg: 'scale(0.8)' },
                    transformOrigin: 'top center',
                    p: '0 !important', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px',
                    pb: 10
                }}>
                    
                    {/* TOP SELECTORS - PREMIUM DROP LISTS */}
                    <Box sx={{ ...cardStyle, mb: 1, py: 4, px: 6 }}>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="h6" sx={{ color: '#002795', fontWeight: 800, mb: 2 }}>
                                    Méthode d'offre
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Choisir une méthode"
                                    {...formik.getFieldProps('evaluationType')}
                                    sx={inputStyle}
                                    SelectProps={{ displayEmpty: true }}
                                >
                                    <MenuItem value="" disabled>Choisir une méthode</MenuItem>
                                    <MenuItem value="MOINS_DISANT">✨ Moins disant</MenuItem>
                                    <MenuItem value="MIEUX_DISANT">🏆 Mieux disant</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="h6" sx={{ color: '#002795', fontWeight: 800, mb: 2 }}>
                                    Type d'appel d'offre
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Choisir un type"
                                    {...formik.getFieldProps('auctionType')}
                                    sx={inputStyle}
                                    SelectProps={{ displayEmpty: true }}
                                >
                                    <MenuItem value="CLASSIC">⚖️ Appel d'offre Classique</MenuItem>
                                    <MenuItem value="EXPRESS">⚡ Appel d'offre Express</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Box>

                    {formik.values.evaluationType ? (
                        <FormikProvider value={formik}>
                            <Grid container spacing={4}>
                                {/* LEFT COLUMN */}
                                <Grid size={{ xs: 12, md: 7.5 }}>
                                    <Stack spacing={4}>
                                        <Box sx={cardStyle}>
                                            <Typography variant="h5" sx={{ color: '#002795', fontWeight: 700, fontSize: '24px', mb: 1 }}>
                                                Détails de l'offre
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
                                                {formik.values.evaluationType === 'MOINS_DISANT' 
                                                    ? "Appel d'offre basé sur le critère du prix." 
                                                    : "Appel d'offre basé sur la qualité de l'expertise."}
                                            </Typography>

                                            <Grid container spacing={3}>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={fieldLabelStyle}>Titre</Typography>
                                                    <TextField fullWidth placeholder="Titre" {...formik.getFieldProps('title')} sx={inputStyle} />
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={fieldLabelStyle}>Catégorie</Typography>
                                                    <TextField select fullWidth {...formik.getFieldProps('category')} sx={inputStyle} SelectProps={{ displayEmpty: true }}>
                                                        <MenuItem value="" disabled>Categories</MenuItem>
                                                        {categories.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={fieldLabelStyle}>Description</Typography>
                                                    <TextField fullWidth multiline rows={8} placeholder="Description offre" {...formik.getFieldProps('description')} sx={inputStyle} />
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={fieldLabelStyle}>Statut de produit</Typography>
                                                    <TextField select fullWidth {...formik.getFieldProps('tenderType')} sx={inputStyle} SelectProps={{ displayEmpty: true }}>
                                                        <MenuItem value="" disabled>select statut product</MenuItem>
                                                        <MenuItem value="PRODUCT">Produit</MenuItem>
                                                        <MenuItem value="SERVICE">Service</MenuItem>
                                                    </TextField>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Box sx={cardStyle}>
                                            <Typography variant="h5" sx={{ color: '#002795', fontWeight: 700, fontSize: '22px', mb: 3 }}>
                                                Configuration & Localisation
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Typography sx={fieldLabelStyle}>Délai</Typography>
                                                    <TextField select fullWidth {...formik.getFieldProps('duration')} sx={inputStyle} SelectProps={{ displayEmpty: true }}>
                                                        <MenuItem value="" disabled>Choisir un délai</MenuItem>
                                                        {formik.values.auctionType === 'EXPRESS' ? (
                                                            [1, 2, 4, 12, 24].map(v => (
                                                                <MenuItem key={v} value={v}>{v} {v === 1 ? 'heure' : 'heures'}</MenuItem>
                                                            ))
                                                        ) : (
                                                            [2, 7, 15, 30, 60].map(v => <MenuItem key={v} value={v}>{v} jours</MenuItem>)
                                                        )}
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    {formik.values.evaluationType === 'MOINS_DISANT' ? (
                                                        <>
                                                            <Typography sx={fieldLabelStyle}>Budget (DA)</Typography>
                                                            <TextField fullWidth type="number" placeholder="Optionnel" {...formik.getFieldProps('price')} sx={inputStyle} />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Typography sx={fieldLabelStyle}>Quantité</Typography>
                                                            <TextField fullWidth placeholder="Ex: 100 unités / 5 lots" {...formik.getFieldProps('quantity')} sx={inputStyle} />
                                                        </>
                                                    )}
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Typography sx={fieldLabelStyle}>Wilaya</Typography>
                                                    <TextField select fullWidth {...formik.getFieldProps('wilaya')} sx={inputStyle} SelectProps={{ displayEmpty: true }}>
                                                        <MenuItem value="" disabled>Wilaya</MenuItem>
                                                        {WILAYAS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Typography sx={fieldLabelStyle}>Localisation</Typography>
                                                    <TextField fullWidth placeholder="Commune, Quartier..." {...formik.getFieldProps('location')} sx={inputStyle} />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Stack>
                                </Grid>

                                {/* RIGHT COLUMN */}
                                <Grid size={{ xs: 12, md: 4.5 }}>
                                    <Stack spacing={4}>
                                        <Box sx={cardStyle}>
                                            <Typography variant="h5" sx={{ color: '#002795', fontWeight: 700, fontSize: '20px', mb: 2 }}>
                                                Paramètres avancés
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12 }}>
                                                    <Stack spacing={1}>
                                                        <FormControlLabel control={<Switch checked={formik.values.professionalOnly} {...formik.getFieldProps('professionalOnly')} />} label="Professionnels uniquement" />
                                                        <FormControlLabel control={<Switch checked={formik.values.isPro} {...formik.getFieldProps('isPro')} />} label="Compte Professionnel" />
                                                        <FormControlLabel control={<Switch checked={formik.values.hidden} {...formik.getFieldProps('hidden')} />} label="Masquer mon identité" />
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Box sx={{ 
                                            width: '475px',
                                            height: '215px',
                                            backgroundColor: '#ffffff',
                                            borderRadius: '24px',
                                            border: '1px solid #E7E7E7',
                                            p: '24px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px',
                                            opacity: 1,
                                            boxSizing: 'border-box'
                                        }}>
                                            <Typography variant="h5" sx={{ color: '#002795', fontWeight: 700, fontSize: '22px', mb: 0, lineHeight: 1 }}>
                                                Image offre/ service
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0, lineHeight: 1 }}>
                                                <Typography component="span" sx={{ color: '#002795', fontWeight: 700 }}>Note :</Typography> Format photos SVG, PNG, or JPG (Max size 4mb)
                                            </Typography>
                                            
                                            <Box sx={{ 
                                                display: 'flex', 
                                                gap: '16px', 
                                                width: '427px', 
                                                height: '97px', 
                                                opacity: 1
                                            }}>
                                                {[1, 2, 3, 4].map((i) => {
                                                    const file = attachments[i - 1];
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
                                                                        const newAttachments = [...attachments];
                                                                        newAttachments[i - 1] = newFile;
                                                                        setAttachments(newAttachments.filter(Boolean));
                                                                    }
                                                                };
                                                                input.click();
                                                            }}
                                                            sx={{
                                                                width: '94.75px',
                                                                height: '97px',
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
                                            fullWidth variant="contained" size="large"
                                            onClick={() => formik.handleSubmit()}
                                            disabled={isSubmitting || !formik.isValid}
                                            sx={{
                                                borderRadius: '16px', py: 2, fontWeight: 800, fontSize: '1.2rem',
                                                backgroundColor: '#002795', '&:hover': { backgroundColor: '#001e75' },
                                                boxShadow: '0 8px 30px rgba(0,39,149,0.3)', transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {isSubmitting ? 'Publication en cours...' : "Publier l'offre"}
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </FormikProvider>
                    ) : (
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                            <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '1.2rem' }}>
                                Veuillez choisir une méthode d'évaluation pour continuer.
                            </Typography>
                        </Box>
                    )}
                </Container>
            </Box>
        </ThemeProvider>
    );
}
