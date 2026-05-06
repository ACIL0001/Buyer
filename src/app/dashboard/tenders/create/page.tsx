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
import { MdStore, MdImage, MdGavel, MdFlashOn, MdOutlinePrivacyTip, MdWorkOutline } from 'react-icons/md';
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
        price: Yup.number().when('evaluationType', ([type], schema) => {
            return type === 'MOINS_DISANT' ? schema.required('Le budget est requis pour le moins disant') : schema.optional();
        }),
        quantity: Yup.string().required('La quantité est requise'),
        duration: Yup.number().required('Le délai est requis'),
        tenderType: Yup.string().required('Le statut du produit est requis'),
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
 
    // Auto-scroll to first error
    useEffect(() => {
        if (formik.submitCount > 0 && !formik.isValid) {
            const firstErrorKey = Object.keys(formik.errors)[0];
            const element = document.getElementsByName(firstErrorKey)[0];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
        }
    }, [formik.submitCount, formik.isValid, formik.errors]);

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
            '&:hover fieldset': { borderColor: '#cbd5e1' },
            '&.Mui-focused fieldset': { borderColor: '#002795', borderWidth: '1.6px' },
            '&.Mui-error fieldset': { borderColor: '#ef4444', borderWidth: '2px' },
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
                <Container maxWidth="lg" sx={{
                    width: '100%',
                    p: '0 !important',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    pb: 10
                }}>
                    
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
                                                {!formik.values.evaluationType 
                                                    ? "Veuillez choisir une méthode et un type pour configurer votre offre."
                                                    : formik.values.evaluationType === 'MOINS_DISANT' 
                                                        ? "Appel d'offre basé sur le critère du prix." 
                                                        : "Appel d'offre basé sur la qualité de l'expertise."}
                                            </Typography>

                                            {/* MODERN INTEGRATED SELECTORS */}
                                            <Box sx={{ display: 'flex', gap: 4, mb: 5, flexWrap: 'wrap' }}>
                                                <Box>
                                                    <Typography sx={{ color: '#002795', fontWeight: 700, fontSize: '0.9rem', mb: 1.5 }}>Méthode d'offre</Typography>
                                                    <Box sx={{ display: 'flex', backgroundColor: '#F8FAFC', p: 0.75, borderRadius: '16px', border: '1px solid #E2E8F0', width: 'fit-content' }}>
                                                        {[
                                                            { id: 'MOINS_DISANT', label: 'Moins disant', icon: '✨' },
                                                            { id: 'MIEUX_DISANT', label: 'Mieux disant', icon: '🏆' }
                                                        ].map((m) => (
                                                            <Box
                                                                key={m.id}
                                                                onClick={() => formik.setFieldValue('evaluationType', m.id)}
                                                                sx={{
                                                                    px: 2.5, py: 1, borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    backgroundColor: formik.values.evaluationType === m.id ? '#ffffff' : 'transparent',
                                                                    color: formik.values.evaluationType === m.id ? '#002795' : '#64748b',
                                                                    boxShadow: formik.values.evaluationType === m.id ? '0 4px 12px rgba(0,39,149,0.1)' : 'none',
                                                                }}
                                                            >
                                                                <Typography sx={{ fontSize: '1rem' }}>{m.icon}</Typography>
                                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: formik.values.evaluationType === m.id ? 700 : 500 }}>{m.label}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>

                                                <Box>
                                                    <Typography sx={{ color: '#002795', fontWeight: 700, fontSize: '0.9rem', mb: 1.5 }}>Type d'appel d'offre</Typography>
                                                    <Box sx={{ display: 'flex', backgroundColor: '#F8FAFC', p: 0.75, borderRadius: '16px', border: '1px solid #E2E8F0', width: 'fit-content' }}>
                                                        {[
                                                            { id: 'CLASSIC', label: 'Classique', icon: '⚖️' },
                                                            { id: 'EXPRESS', label: 'Express', icon: '⚡' }
                                                        ].map((t) => (
                                                            <Box
                                                                key={t.id}
                                                                onClick={() => formik.setFieldValue('auctionType', t.id)}
                                                                sx={{
                                                                    px: 2.5, py: 1, borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    backgroundColor: formik.values.auctionType === t.id ? '#ffffff' : 'transparent',
                                                                    color: formik.values.auctionType === t.id ? '#002795' : '#64748b',
                                                                    boxShadow: formik.values.auctionType === t.id ? '0 4px 12px rgba(0,39,149,0.1)' : 'none',
                                                                }}
                                                            >
                                                                <Typography sx={{ fontSize: '1rem' }}>{t.icon}</Typography>
                                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: formik.values.auctionType === t.id ? 700 : 500 }}>{t.label}</Typography>
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Grid container spacing={3}>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={fieldLabelStyle}>Titre</Typography>
                                                    <TextField fullWidth placeholder="Titre" {...formik.getFieldProps('title')} sx={inputStyle} error={(formik.touched.title || formik.submitCount > 0) && !!formik.errors.title} helperText={(formik.touched.title || formik.submitCount > 0) && formik.errors.title} />
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={fieldLabelStyle}>Catégorie</Typography>
                                                    <TextField select fullWidth {...formik.getFieldProps('category')} sx={inputStyle} SelectProps={{ displayEmpty: true }} error={(formik.touched.category || formik.submitCount > 0) && !!formik.errors.category} helperText={(formik.touched.category || formik.submitCount > 0) && formik.errors.category}>
                                                        <MenuItem value="" disabled>Categories</MenuItem>
                                                        {categories.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={fieldLabelStyle}>Description</Typography>
                                                    <TextField fullWidth multiline rows={8} placeholder="Description offre" {...formik.getFieldProps('description')} sx={inputStyle} error={(formik.touched.description || formik.submitCount > 0) && !!formik.errors.description} helperText={(formik.touched.description || formik.submitCount > 0) && formik.errors.description} />
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={fieldLabelStyle}>Statut de produit</Typography>
                                                    <TextField select fullWidth {...formik.getFieldProps('tenderType')} sx={inputStyle} SelectProps={{ displayEmpty: true }} error={(formik.touched.tenderType || formik.submitCount > 0) && !!formik.errors.tenderType} helperText={(formik.touched.tenderType || formik.submitCount > 0) && formik.errors.tenderType}>
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
                                                    <TextField select fullWidth {...formik.getFieldProps('duration')} sx={inputStyle} SelectProps={{ displayEmpty: true }} error={(formik.touched.duration || formik.submitCount > 0) && !!formik.errors.duration} helperText={(formik.touched.duration || formik.submitCount > 0) && formik.errors.duration}>
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
                                                    <Typography sx={fieldLabelStyle}>Quantité</Typography>
                                                    <TextField fullWidth placeholder="Ex: 100 unités / 5 lots" {...formik.getFieldProps('quantity')} sx={inputStyle} error={(formik.touched.quantity || formik.submitCount > 0) && !!formik.errors.quantity} helperText={(formik.touched.quantity || formik.submitCount > 0) && formik.errors.quantity} />
                                                </Grid>
                                                {formik.values.evaluationType === 'MOINS_DISANT' && (
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <Typography sx={fieldLabelStyle}>Budget (DA)</Typography>
                                                        <TextField 
                                                            fullWidth type="number" 
                                                            placeholder="Entrer le budget" 
                                                            {...formik.getFieldProps('price')} 
                                                            error={(formik.touched.price || formik.submitCount > 0) && !!formik.errors.price}
                                                            helperText={(formik.touched.price || formik.submitCount > 0) && formik.errors.price}
                                                            sx={inputStyle} 
                                                        />
                                                    </Grid>
                                                )}
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Typography sx={fieldLabelStyle}>Wilaya</Typography>
                                                    <TextField select fullWidth {...formik.getFieldProps('wilaya')} sx={inputStyle} SelectProps={{ displayEmpty: true }} error={(formik.touched.wilaya || formik.submitCount > 0) && !!formik.errors.wilaya} helperText={(formik.touched.wilaya || formik.submitCount > 0) && formik.errors.wilaya}>
                                                        <MenuItem value="" disabled>Wilaya</MenuItem>
                                                        {WILAYAS.map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                                                    </TextField>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Typography sx={fieldLabelStyle}>Localisation</Typography>
                                                    <TextField fullWidth placeholder="Commune, Quartier..." {...formik.getFieldProps('location')} sx={inputStyle} error={(formik.touched.location || formik.submitCount > 0) && !!formik.errors.location} helperText={(formik.touched.location || formik.submitCount > 0) && formik.errors.location} />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Stack>
                                </Grid>

                                {/* RIGHT COLUMN */}
                                <Grid size={{ xs: 12, md: 4.5 }}>
                                    <Stack spacing={4}>
                                        <Box sx={cardStyle}>
                                            <Typography variant="h6" sx={{ color: '#002795', fontWeight: 700, fontSize: '16px', mb: 2 }}>
                                                Paramètres avancés
                                            </Typography>
                                            <Stack spacing={1.5}>
                                                <Box sx={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    p: 1.5, borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{ p: 1, backgroundColor: '#ffffff', borderRadius: '8px', display: 'flex', color: '#002795', border: '1px solid #e2e8f0' }}>
                                                            <MdOutlinePrivacyTip size={18} />
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.85rem' }}>Anonyme</Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Publier anonymement</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Switch size="small" checked={formik.values.hidden} onChange={formik.handleChange} name="hidden" />
                                                </Box>

                                                <Box sx={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    p: 1.5, borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{ p: 1, backgroundColor: '#ffffff', borderRadius: '8px', display: 'flex', color: '#002795', border: '1px solid #e2e8f0' }}>
                                                            <MdWorkOutline size={18} />
                                                        </Box>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.85rem' }}>Pros Uniquement</Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Visible par les comptes pro</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Switch size="small" checked={formik.values.professionalOnly} onChange={formik.handleChange} name="professionalOnly" />
                                                </Box>
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
                                            <Typography variant="h5" sx={{ color: '#002795', fontWeight: 700, fontSize: 'clamp(1rem, 2vw, 1.375rem)', mb: 0, lineHeight: 1.2 }}>
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
                                            disabled={isSubmitting}
                                            sx={{
                                                borderRadius: '12px', textTransform: 'none', fontWeight: 700, py: 1.5, fontSize: '1rem',
                                                backgroundColor: '#002795', '&:hover': { backgroundColor: '#001e75' },
                                                boxShadow: '0 10px 20px -5px rgba(0,39,149,0.3)',
                                            }}
                                        >
                                            {isSubmitting ? 'Publication en cours...' : "Publier l'offre"}
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
