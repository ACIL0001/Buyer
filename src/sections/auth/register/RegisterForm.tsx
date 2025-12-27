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

// Terms Modal Component
function TermsModal({ open, onClose, termsContent, isLoading }: { 
  open: boolean; 
  onClose: () => void; 
  termsContent: string;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Termes et Conditions d'Utilisation</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: termsContent || '<p>Pas de termes disponibles.</p>' }} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
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
        const userData: any = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            phone: values.phone.replace(/\s/g, ''),
            type: CLIENT_TYPE.CLIENT,
            birthDate: values.birthDate,
            wilaya: values.wilaya,
            socialReason: values.socialReason,
            jobTitle: values.jobTitle,
            entity: values.entity,
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
              const latestTerms: any = await TermsAPI.getLatest();
              if (latestTerms && latestTerms.content) {
                  setTermsContent(latestTerms.content);
              } else {
                  // Fallback
                  const publicTermsList: any = await TermsAPI.getPublic();
                  if (publicTermsList && publicTermsList.length > 0) {
                      setTermsContent(publicTermsList[0].content);
                  }
              }
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
            <Grid size={{ xs: 12, sm: 6 }}>
                <StyledTextField
                    fullWidth
                    label="Raison Sociale"
                    {...getFieldProps('socialReason')}
                    error={Boolean(touched.socialReason && errors.socialReason)}
                    helperText={touched.socialReason && errors.socialReason}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <StyledTextField
                    fullWidth
                    label="Entité"
                    {...getFieldProps('entity')}
                    error={Boolean(touched.entity && errors.entity)}
                    helperText={touched.entity && errors.entity}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
        isLoading={isLoadingTerms}
      />
    </FormikProvider>
  );
}
