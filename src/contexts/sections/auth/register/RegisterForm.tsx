import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { useFormik, Form, FormikProvider } from 'formik';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '../../../app/api/auth';
import { TermsAPI } from '../../../app/api/terms';
import { CategoryAPI } from '../../../app/api/category';
import { authStore } from '../../../contexts/authStore';
import { styled, useTheme } from '@mui/material/styles';
import { WILAYAS } from '../../../constants/wilayas';
import * as mammoth from 'mammoth';
// material
import {
  Stack,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Box,
  Grid,
  ToggleButtonGroup,
  Alert,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  MenuItem,
  Autocomplete,
  Avatar,
  Badge,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
// component
import Iconify from '../../../components/Iconify';
import { CLIENT_TYPE } from '../../../types/User';

function alpha(color: string, value: number) {
  return `rgba(${hexToRgb(color)}, ${value})`;
}

function hexToRgb(hex: string) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// Styled components
const StyledTextField = styled((props: any) => <TextField size="small" {...props} />)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '0.95rem',
    
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
      borderColor: alpha(theme.palette.primary.main, 0.3),
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
      transform: 'translateY(-2px)',
    },
    '& fieldset': {
      border: 'none',
    },
  },
}));

const PhotoUploadBox = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  margin: '0 auto',
  position: 'relative',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const TermsAgreementBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: 12,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  backgroundColor: alpha(theme.palette.background.paper, 0.4),
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(1),
}));

const DocumentPage = styled('div')(({ theme }) => ({
  backgroundColor: '#ffffff',
  width: '100%',
  // maxWidth: '210mm', // Removed A4 constraint to fill modal
  minHeight: '50vh', // Reduced constraint
  padding: theme.spacing(3), // Reduced padding from 20mm
  // boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)', // Optional: remove shadow if filling space
  margin: '0 auto',
  color: '#000000',
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '12pt',
  lineHeight: 1.6,
  overflowWrap: 'break-word',
  '& h1': { fontSize: '24pt', fontWeight: 'bold', marginBottom: '24pt', textAlign: 'center' },
  '& h2': { fontSize: '18pt', fontWeight: 'bold', marginTop: '18pt', marginBottom: '12pt', borderBottom: '1px solid #eee', paddingBottom: '4px' },
  '& h3': { fontSize: '14pt', fontWeight: 'bold', marginTop: '14pt', marginBottom: '10pt' },
  '& p': { marginBottom: '12pt', textAlign: 'justify' },
  '& ul, & ol': { marginBottom: '12pt', paddingLeft: '24pt' },
  '& li': { marginBottom: '6pt' },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
}));
// Import config to get base URL
import app from '../../../../config';

const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    // Remove leading slash from url if present to avoid double slash if baseURL has one
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    const cleanBase = app.route.endsWith('/') ? app.route : `${app.route}/`;
    return `${cleanBase}${cleanPath}`;
};

// Terms Modal Component
function TermsModal({ open, onClose, termsContent, termsAttachment, isLoading }: { 
  open: boolean; 
  onClose: () => void; 
  termsContent: string;
  termsAttachment?: { url: string; mimetype: string };
  isLoading: boolean;
}) {
  const [docxContent, setDocxContent] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState(false);

  useEffect(() => {
    if (open && termsAttachment && (termsAttachment.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        setIsConverting(true);
        setConversionError(false);
        fetch(getFullUrl(termsAttachment.url))
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.arrayBuffer();
            })
            .then(arrayBuffer => mammoth.convertToHtml({ arrayBuffer }))
            .then(result => {
                setDocxContent(result.value);
                setIsConverting(false);
            })
            .catch(error => {
                console.error("Error converting DOCX:", error);
                setConversionError(true);
                setIsConverting(false);
            });
    }
  }, [open, termsAttachment]);

  // Determine what to show
  const hasAttachment = !!termsAttachment;
  const isPdf = termsAttachment?.mimetype === 'application/pdf';
  const isDocx = termsAttachment?.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  // If content is just a placeholder "Document attached", don't show it if we have an attachment
  const showTextContent = !hasAttachment || (termsContent && termsContent.trim() !== 'Document attached' && termsContent.trim().length > 20);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      scroll="paper"
      PaperProps={{
        sx: { 
            borderRadius: 3,
            height: '80vh', // Fixed height for better PDF viewing
            maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
          borderBottom: '1px solid #e0e0e0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          bgcolor: '#f8fafc',
          color: '#1e293b'
      }}>
        <Typography variant="h6" component="span" fontWeight="bold">Conditions Générales d'Utilisation</Typography>
        <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc', flex: 1, overflow: 'hidden' }}>
        {isLoading || isConverting ? (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
             {hasAttachment ? (
                <Box sx={{ flexGrow: 1, height: '100%', bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
                     {isPdf ? (
                        <iframe 
                            src={`${getFullUrl(termsAttachment.url)}#toolbar=0&navpanes=0&scrollbar=0`}
                            width="100%" 
                            height="100%" 
                            style={{ border: 'none', flexGrow: 1 }}
                            title="Terms PDF"
                        />
                    ) : isDocx && !conversionError ? (
                        <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
                            <DocumentPage dangerouslySetInnerHTML={{ __html: docxContent }} />
                        </Box>
                    ) : (   
                         // Fallback structure
                         <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" p={3} textAlign="center">
                            <Typography variant="h6" gutterBottom>
                                Document complet disponible
                            </Typography>
                             <Typography variant="body2" color="text.secondary" paragraph>
                                Veuillez télécharger le fichier pour consulter les termes et conditions complets.
                            </Typography>
                            <Button 
                                variant="contained" 
                                color="primary"
                                startIcon={<Iconify icon="eva:download-fill" />}
                                href={getFullUrl(termsAttachment.url)}
                                target="_blank"
                                download
                            >
                                Télécharger le document ({termsAttachment.mimetype.split('/').pop()?.toUpperCase()})
                            </Button>
                         </Box>
                    )}
                </Box>
             ) : (
                <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1, bgcolor: 'white' }}>
                    <DocumentPage dangerouslySetInnerHTML={{ 
                        __html: termsContent || `
                        <div style="font-family: inherit; color: #334155; text-align: center; padding: 40px;">
                           <p>Le contenu des termes et conditions n'est pas disponible pour le moment.</p>
                        </div>
                        ` 
                    }} />
                </Box>
             )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ mr: 1 }}>
          Fermer
        </Button>
        <Button onClick={onClose} variant="contained" color="primary">
          J'accepte
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [termsAttachment, setTermsAttachment] = useState<{ url: string; mimetype: string } | undefined>(undefined);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const RegisterSchema = Yup.object().shape({
    firstName: Yup.string().required('Le prénom est requis').min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: Yup.string().required('Le nom est requis').min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: Yup.string().email('Format d\'email invalide').required('L\'email est requis'),
    password: Yup.string().required('Le mot de passe est requis').min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    phone: Yup.string().required('Le numéro de téléphone est requis'), 
    birthDate: Yup.date().required('La date de naissance est requise').max(new Date(), 'La date doit être dans le passé'),
    wilaya: Yup.string().required('La wilaya est requise'),
    socialReason: Yup.string().nullable(),
    activitySector: Yup.array().of(Yup.string()).nullable(),
    jobTitle: Yup.string().nullable(),
    entity: Yup.string().nullable(),
    promoCode: Yup.string().nullable(),
  });

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      birthDate: '',
      wilaya: '',
      socialReason: '',
      activitySector: [],
      jobTitle: '',
      entity: '',
      promoCode: '',
      type: CLIENT_TYPE.CLIENT,
      photo: null, 
    },
    validationSchema: RegisterSchema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
        if (!termsAccepted) {
            setErrors({ email: 'Vous devez accepter les termes et conditions pour continuer' });
            return;
        }

      try {
        // Send phone number exactly as entered (e.g. 055...)
        const formatPhoneNumber = (phone: string): string => {
          return phone.replace(/\s/g, ''); // Just remove spaces
        };

        const userData: any = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            phone: formatPhoneNumber(values.phone),
            type: CLIENT_TYPE.CLIENT,
            birthDate: values.birthDate,
            wilaya: values.wilaya,
            companyName: values.socialReason, // Mapped to new backend field
            activitySector: Array.isArray(values.activitySector) ? values.activitySector.join(', ') : values.activitySector,
            // socialReason: values.socialReason, // Deprecated/Removed from backend
            jobTitle: values.jobTitle,
            // entity: values.entity, // Removed
            promoCode: values.promoCode,
        };

        let payload: any = userData;
        
        // Log the payload for debugging
        console.log('📝 Register payload:', { 
            userData, 
            hasPhoto: !!values.photo,
            payloadType: values.photo ? 'FormData' : 'JSON'
        });

        if (values.photo) {
            const formData = new FormData();
            Object.keys(userData).forEach(key => {
                if (userData[key] !== null && userData[key] !== undefined) {
                    formData.append(key, userData[key]);
                }
            });
            formData.append('avatar', values.photo);
            payload = formData;
        }

        const signupRes: any = await AuthAPI.signup(payload);
        
        // Handle success/redirect
        router.push(`/otp-verification?phone=${encodeURIComponent(userData.phone)}`);
        
      } catch (error: any) {
        console.error('Registration error detailed:', error);
        console.error('Response data:', error?.response?.data);
        
        let errorMessage = 'Une erreur est survenue lors de l\'inscription.';
        if (error?.response?.data?.message) {
            errorMessage = Array.isArray(error.response.data.message) 
                ? error.response.data.message.join(', ') // Join array messages
                : error.response.data.message;
        } else if (error?.message) {
            errorMessage = error.message;
        }
        setErrors({ email: errorMessage });
      } finally {
        setSubmitting(false);
      }
    },
  });

  /* State for categories */
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await CategoryAPI.getCategories();
        if (response.success && Array.isArray(response.data)) {
          setCategories(response.data);
        } else if (Array.isArray(response)) {
            // Handle case where response might be the array directly (legacy)
             setCategories(response);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const { errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue, values } = formik;

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFieldValue('photo', file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleOpenTerms = async () => {
      setTermsModalOpen(true);
      if (!termsContent) {
          setIsLoadingTerms(true);
          try {
              const latestResponse: any = await TermsAPI.getLatest();
              let content = '';
              let attachment = undefined;

              if (latestResponse?.success && latestResponse?.data) {
                  content = latestResponse.data.content;
                  if (latestResponse.data.attachment) {
                      attachment = latestResponse.data.attachment;
                  }
              } else if (latestResponse?.content) {
                  // Legacy/Direct match
                  content = latestResponse.content;
                   if (latestResponse.attachment) {
                      attachment = latestResponse.attachment;
                  }
              } else {
                  // Fallback to public
                  const publicResponse: any = await TermsAPI.getPublic();
                   if (publicResponse?.success && Array.isArray(publicResponse?.data) && publicResponse.data.length > 0) {
                      content = publicResponse.data[0].content;
                       if (publicResponse.data[0].attachment) {
                          attachment = publicResponse.data[0].attachment;
                      }
                  } else if (Array.isArray(publicResponse) && publicResponse.length > 0) {
                      content = publicResponse[0].content;
                      if (publicResponse[0].attachment) {
                          attachment = publicResponse[0].attachment;
                      }
                  }
              }
              
              setTermsContent(content);
              setTermsAttachment(attachment);

          } catch (error) {
              console.error("Failed to load terms", error);
          } finally {
              setIsLoadingTerms(false);
          }
      }
  };

  return (
    <FormikProvider value={formik}>
      <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          
          {/* Section 1: Informations Personnelles */}
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 12 }}>
                <StyledTextField
                    fullWidth
                    label="Code Promo (Optionnel)"
                    {...getFieldProps('promoCode')}
                    error={Boolean(touched.promoCode && errors.promoCode)}
                    helperText={touched.promoCode && errors.promoCode}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StyledTextField
                fullWidth
                label="Nom"
                {...getFieldProps('lastName')}
                error={Boolean(touched.lastName && errors.lastName)}
                helperText={touched.lastName && errors.lastName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StyledTextField
                fullWidth
                label="Prénom"
                {...getFieldProps('firstName')}
                error={Boolean(touched.firstName && errors.firstName)}
                helperText={touched.firstName && errors.firstName}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <StyledTextField
                    fullWidth
                    label="Date de naissance"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    {...getFieldProps('birthDate')}
                    error={Boolean(touched.birthDate && errors.birthDate)}
                    helperText={touched.birthDate && errors.birthDate}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                    options={WILAYAS}
                    renderInput={(params) => (
                        <StyledTextField
                            {...params}
                            label="Wilaya"
                            error={Boolean(touched.wilaya && errors.wilaya)}
                            helperText={touched.wilaya && errors.wilaya}
                        />
                    )}
                    onChange={(_, value) => setFieldValue('wilaya', value)}
                />
            </Grid>
          </Grid>

          {/* Section 2: Coordonnées */}
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <StyledTextField
                    fullWidth
                    label="Email"
                    type="email"
                    {...getFieldProps('email')}
                    error={Boolean(touched.email && errors.email)}
                    helperText={touched.email && errors.email}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <StyledTextField
                    fullWidth
                    label="Numéro de téléphone"
                    {...getFieldProps('phone')}
                    error={Boolean(touched.phone && errors.phone)}
                    helperText={touched.phone && errors.phone}
                />
            </Grid>
          </Grid>

          {/* Profile Photo Upload */}
          <Box display="flex" justifyContent="center" mb={1}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handlePhotoChange}
            />
            <label htmlFor="photo-upload">
              <PhotoUploadBox>
                <Avatar
                    src={photoPreview || ''}
                    sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                    }}
                >
                    {!photoPreview && <Iconify icon="eva:camera-fill" width={32} height={32} />}
                </Avatar>
                {photoPreview && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            bgcolor: 'primary.main',
                            borderRadius: '50%',
                            p: 0.5,
                            border: '2px solid white',
                            display: 'flex'
                        }}
                    >
                        <Iconify icon="eva:edit-fill" width={16} height={16} color="white" />
                    </Box>
                )}
              </PhotoUploadBox>
              <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1, color: 'text.secondary' }}>
                Photo de profil (Optionnel)
              </Typography>
            </label>
          </Box>

          {/* Section 3: Informations Professionnelles (Optionnel) */}
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 1 }}>
            Informations Professionnelles (Pour Entreprises)
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 12 }}>
                <StyledTextField
                    fullWidth
                    label="Nom d'entreprise"
                    {...getFieldProps('socialReason')}
                    error={Boolean(touched.socialReason && errors.socialReason)}
                    helperText={touched.socialReason && errors.socialReason}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 12 }}>
                <Autocomplete
                    multiple
                    options={categories.map(c => c.name)}
                    loading={loadingCategories}
                    renderInput={(params) => (
                        <StyledTextField
                            {...params}
                            label="Secteur d'activité"
                            error={Boolean(touched.activitySector && errors.activitySector)}
                            helperText={touched.activitySector && errors.activitySector}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loadingCategories ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    onChange={(_, value) => setFieldValue('activitySector', value)}
                    value={values.activitySector || []}
                    filterSelectedOptions
                />
            </Grid>
            {/* Entity field removed */}
            <Grid size={{ xs: 12, sm: 12 }}>
                <StyledTextField
                    fullWidth
                    label="Poste"
                    {...getFieldProps('jobTitle')}
                    error={Boolean(touched.jobTitle && errors.jobTitle)}
                    helperText={touched.jobTitle && errors.jobTitle}
                />
            </Grid>

          </Grid>

          {/* Section 4: Sécurité */}
          <StyledTextField
            fullWidth
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            {...getFieldProps('password')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            error={Boolean(touched.password && errors.password)}
            helperText={touched.password && errors.password}
          />

          {/* Terms Agreement */}
          <TermsAgreementBox>
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  J'accepte les{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        handleOpenTerms();
                    }}
                    sx={{ fontWeight: 'bold' }}
                  >
                    termes et conditions
                  </Link>
                </Typography>
              }
            />
          </TermsAgreementBox>

          <LoadingButton fullWidth size="large" type="submit" variant="contained" loading={isSubmitting}>
            S'inscrire
          </LoadingButton>
        </Stack>
      </Form>
      
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        termsContent={termsContent}
        termsAttachment={termsAttachment}
        isLoading={isLoadingTerms}
      />
    </FormikProvider>
  );
}
