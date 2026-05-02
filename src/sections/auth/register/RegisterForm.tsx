import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { useFormik, Form, FormikProvider } from 'formik';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '../../../app/api/auth';
import { TermsAPI } from '../../../app/api/terms';
import { CategoryAPI } from '../../../app/api/category';
import { styled } from '@mui/material/styles';
import { WILAYAS } from '../../../constants/wilayas';
const POSTES = [
  'Directeur Général',
  'Gérant',
  'Responsable Commercial',
  'Responsable des Achats',
  'Responsable Marketing',
  'Employé',
  'Autre',
];
import * as mammoth from 'mammoth';
// material
import {
  TextField,
  IconButton,
  InputAdornment,
  Typography,
  Box,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
// component
import Iconify from '../../../components/Iconify';
import { CLIENT_TYPE } from '../../../types/User';

/* ─── helpers ─── */
const DocumentPage = styled('div')(({ theme }) => ({
  backgroundColor: '#ffffff',
  width: '100%',
  minHeight: '50vh',
  padding: theme.spacing(3),
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
  [theme.breakpoints.down('md')]: { padding: theme.spacing(2) },
}));

import app from '../../../config';
const getFullUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  const cleanBase = app.route.endsWith('/') ? app.route : `${app.route}/`;
  return `${cleanBase}${cleanPath}`;
};

/* ─── Terms Modal ─── */
function TermsModal({
  open,
  onClose,
  termsContent,
  termsAttachment,
  isLoading,
}: {
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
    if (
      open &&
      termsAttachment &&
      termsAttachment.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      setIsConverting(true);
      setConversionError(false);
      fetch(getFullUrl(termsAttachment.url))
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
          return r.arrayBuffer();
        })
        .then((ab) => mammoth.convertToHtml({ arrayBuffer: ab }))
        .then((result) => {
          setDocxContent(result.value);
          setIsConverting(false);
        })
        .catch((err) => {
          console.error('Error converting DOCX:', err);
          setConversionError(true);
          setIsConverting(false);
        });
    }
  }, [open, termsAttachment]);

  const hasAttachment = !!termsAttachment;
  const isPdf = termsAttachment?.mimetype === 'application/pdf';
  const isDocx =
    termsAttachment?.mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const showTextContent =
    !hasAttachment ||
    (termsContent &&
      termsContent.trim() !== 'Document attached' &&
      termsContent.trim().length > 20);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 3, height: '80vh', maxHeight: '90vh' } }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#f8fafc',
          color: '#1e293b',
        }}
      >
        <Typography variant="h6" component="span" fontWeight="bold">
          Conditions Générales d'Utilisation
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8fafc',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {isLoading || isConverting ? (
          <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {showTextContent ? (
              <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1, bgcolor: 'white' }}>
                <Typography
                  component="div"
                  variant="body1"
                  sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}
                >
                  {termsContent ||
                    "Le contenu des termes et conditions n'est pas disponible pour le moment."}
                </Typography>
              </Box>
            ) : hasAttachment ? (
              <Box
                sx={{
                  flexGrow: 1,
                  height: '100%',
                  bgcolor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {isPdf ? (
                  <iframe
                    src={`${getFullUrl(termsAttachment!.url)}#toolbar=0&navpanes=0&scrollbar=0`}
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
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    height="100%"
                    p={3}
                    textAlign="center"
                  >
                    <Typography variant="h6" gutterBottom>
                      Document complet disponible
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Veuillez télécharger le fichier pour consulter les termes et conditions
                      complets.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Iconify icon="eva:download-fill" />}
                      href={getFullUrl(termsAttachment!.url)}
                      target="_blank"
                      download
                    >
                      Télécharger le document (
                      {termsAttachment!.mimetype.split('/').pop()?.toUpperCase()})
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1, bgcolor: 'white' }}>
                <Typography component="div" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  Le contenu des termes et conditions n'est pas disponible pour le moment.
                </Typography>
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

/* ─── Figma token helpers ─── */
const FIELD_HEIGHT = '44px';
const COL_WIDTH = '300px';
const COL_GAP = '24px';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    height: FIELD_HEIGHT,
    borderRadius: '25px',
    backgroundColor: '#FFFFFF',
    '& fieldset': { border: '1px solid #757575', borderRadius: '25px' },
    '&:hover fieldset': { borderColor: '#002896' },
    '&.Mui-focused fieldset': { borderColor: '#002896', borderWidth: '1px' },
  },
  '& .MuiOutlinedInput-input': {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '13px',
    color: '#2D3748',
    py: 0,
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: '#999999',
    opacity: 1,
  },
  '& .MuiFormHelperText-root': {
    fontFamily: '"Poppins", sans-serif',
    fontSize: '10px',
    color: '#d32f2f',
    margin: '2px 0 0',
  },
};

const labelSx = {
  fontFamily: '"Poppins", sans-serif',
  fontWeight: 400,
  fontSize: '13px',
  lineHeight: '140%',
  letterSpacing: '-0.02em',
  color: '#757575',
  mb: '4px',
  display: 'block',
};

/* Figma "Entry field" wrapper */
function EntryField({
  label,
  width = COL_WIDTH,
  children,
}: {
  label: string;
  width?: string;
  children: React.ReactNode;
}) {
  const parts = label.split(' *');
  const hasAsterisk = label.includes(' *');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width }}>
      {label && (
        <Typography component="label" sx={{ ...labelSx, color: '#454545' }}>
          {parts[0]}
          {hasAsterisk && <span style={{ color: '#d32f2f', marginLeft: '2px', fontSize: '16px' }}>*</span>}
        </Typography>
      )}
      <Box>{children}</Box>
    </Box>
  );
}

/* Thin reusable text input */
function FigmaField({
  fieldProps,
  placeholder,
  type = 'text',
  error,
  helperText,
  endAdornment,
  sx,
}: {
  fieldProps: any;
  placeholder?: string;
  type?: string;
  error?: boolean;
  helperText?: any;
  endAdornment?: React.ReactNode;
  sx?: any;
}) {
  return (
    <TextField
      fullWidth
      size="small"
      type={type}
      placeholder={placeholder}
      {...fieldProps}
      error={error}
      helperText={helperText}
      InputProps={{ endAdornment }}
      sx={{ ...fieldSx, ...sx }}
    />
  );
}

/* Native checkbox styled to Figma spec */
function FigmaCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Box
      component="input"
      type="checkbox"
      checked={checked}
      onChange={onChange}
      sx={{
        appearance: 'none',
        WebkitAppearance: 'none',
        width: '18px',
        height: '18px',
        minWidth: '18px',
        border: '1px solid #757575',
        borderRadius: '2px',
        cursor: 'pointer',
        flexShrink: 0,
        backgroundColor: checked ? '#002896' : 'transparent',
        position: 'relative',
        transition: 'background-color 0.15s',
        '&:checked::after': {
          content: '"✓"',
          position: 'absolute',
          top: '-1px',
          left: '2px',
          fontSize: '13px',
          color: '#FFFFFF',
          lineHeight: 1,
        },
      }}
    />
  );
}

/* ─────────────────────────────────────────── */
export default function RegisterForm({ profileType }: { profileType?: CLIENT_TYPE }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [termsAttachment, setTermsAttachment] = useState<
    { url: string; mimetype: string } | undefined
  >(undefined);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  /* ── Validation schema ── */
  const RegisterSchema = Yup.object().shape({
    firstName: profileType === CLIENT_TYPE.CLIENT 
      ? Yup.string().required('Le prénom est requis').min(2, 'Le prénom doit contenir au moins 2 caractères')
      : Yup.string().nullable(),
    lastName: profileType === CLIENT_TYPE.CLIENT 
      ? Yup.string().required('Le nom est requis').min(2, 'Le nom doit contenir au moins 2 caractères')
      : Yup.string().nullable(),
    email: Yup.string()
      .email("Format d'email invalide")
      .required("L'email est requis"),
    phone: Yup.string().required('Le numéro de téléphone est requis'),
    birthDate: profileType === CLIENT_TYPE.CLIENT 
      ? Yup.date().required('La date de naissance est requise').max(new Date(), 'La date doit être dans le passé')
      : Yup.date().nullable(),
    wilaya: Yup.string().required('La wilaya est requise'),
    socialReason: profileType === CLIENT_TYPE.PROFESSIONAL 
      ? Yup.string().required('La designation entreprise est requise')
      : Yup.string().nullable(),
    activitySector: profileType === CLIENT_TYPE.PROFESSIONAL
      ? Yup.array().of(Yup.string()).min(1, 'Veuillez choisir au moins un secteur').required('Le secteur d\'activité est requis')
      : Yup.array().of(Yup.string()).nullable(),
    jobTitle: Yup.string().nullable(),
    promoCode: Yup.string().nullable(),
    password: Yup.string()
      .required('Le mot de passe est requis')
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: Yup.string()
      .required('Veuillez confirmer votre mot de passe')
      .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas'),
  });

  /* ── Formik ── */
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      wilaya: '',
      socialReason: '',
      activitySector: [] as string[],
      jobTitle: '',
      promoCode: '',
      password: '',
      confirmPassword: '',
      type: profileType || CLIENT_TYPE.CLIENT,
    },
    validationSchema: RegisterSchema,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      if (!termsAccepted) {
        setErrors({ email: 'Vous devez accepter les termes et conditions pour continuer' });
        return;
      }
      try {
        const formatPhone = (p: string) => p.replace(/\s/g, '');
        const userData: any = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          phone: formatPhone(values.phone),
          type: CLIENT_TYPE.CLIENT,
          birthDate: values.birthDate,
          wilaya: values.wilaya,
          companyName: values.socialReason,
          activitySector: Array.isArray(values.activitySector)
            ? values.activitySector.join(', ')
            : values.activitySector,
          jobTitle: values.jobTitle,
          promoCode: values.promoCode,
        };
        await AuthAPI.signup(userData);
        router.push(`/otp-verification?phone=${encodeURIComponent(userData.phone)}`);
      } catch (error: any) {
        console.error('Registration error:', error);
        let msg = "Une erreur est survenue lors de l'inscription.";
        if (error?.response?.data?.message) {
          msg = Array.isArray(error.response.data.message)
            ? error.response.data.message.join(', ')
            : error.response.data.message;
        } else if (error?.message) {
          msg = error.message;
        }
        setErrors({ email: msg });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue, values } =
    formik;

  /* ── Fetch categories ── */
  useEffect(() => {
    setLoadingCategories(true);
    CategoryAPI.getCategories()
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) setCategories(res.data);
        else if (Array.isArray(res)) setCategories(res);
      })
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  /* ── Open terms ── */
  const handleOpenTerms = async () => {
    setTermsModalOpen(true);
    if (!termsContent) {
      setIsLoadingTerms(true);
      try {
        const latest: any = await TermsAPI.getLatest();
        let content = '';
        let attachment;
        if (latest?.success && latest?.data) {
          content = latest.data.content;
          if (latest.data.attachment) attachment = latest.data.attachment;
        } else if (latest?.content) {
          content = latest.content;
          if (latest.attachment) attachment = latest.attachment;
        } else {
          const pub: any = await TermsAPI.getPublic();
          const arr = pub?.success && Array.isArray(pub?.data) ? pub.data : Array.isArray(pub) ? pub : [];
          if (arr.length) {
            content = arr[0].content;
            if (arr[0].attachment) attachment = arr[0].attachment;
          }
        }
        setTermsContent(content);
        setTermsAttachment(attachment);
      } catch {
        /* ignore */
      } finally {
        setIsLoadingTerms(false);
      }
    }
  };

  /* ── Eye-icon adornment ── */
  const eyeAdornment = (show: boolean, toggle: () => void) => (
    <InputAdornment position="end">
      <IconButton onClick={toggle} edge="end" sx={{ p: '4px' }}>
        <Iconify
          icon={show ? 'eva:eye-fill' : 'eva:eye-off-fill'}
          sx={{ width: 18, height: 18, color: '#757575' }}
        />
      </IconButton>
    </InputAdornment>
  );

  /* ── Autocomplete field with Figma styling ── */
  const figmaAutoSx = {
    ...fieldSx,
    '& .MuiOutlinedInput-root': {
      ...fieldSx['& .MuiOutlinedInput-root'],
      height: FIELD_HEIGHT,
    },
  };

  const figmaRadius25Sx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '25px',
      '& fieldset': {
        borderRadius: '25px',
      },
    },
  };

  const figmaAutoSxRadius25 = {
    ...figmaAutoSx,
    ...figmaRadius25Sx,
  };

  return (
    <FormikProvider value={formik}>
      <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
        {/* Error message */}
        {touched.email && errors.email && (
          <Typography sx={{ fontFamily: '"Poppins", sans-serif', fontSize: '12px', color: '#d32f2f', mb: '6px' }}>
            {errors.email}
          </Typography>
        )}

        {profileType === CLIENT_TYPE.PROFESSIONAL ? (
          /* ─── ENTERPRISE LAYOUT ─── */
          <>
            {/* Row 0: Code promo (optionnel) */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
              <EntryField label="Code promo (optionnel)">
                <FigmaField
                  fieldProps={getFieldProps('promoCode')}
                  placeholder="Entrez un code promo"
                />
              </EntryField>
              <Box sx={{ display: { xs: 'none', md: 'block' }, width: COL_WIDTH }} />
            </Box>


            {/* Row 1: Designation entreprise | Secteur d'activité */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
              <EntryField label="Designation entreprise *">
                <FigmaField
                  fieldProps={getFieldProps('socialReason')}
                  placeholder="Nom de votre entreprise"
                  error={Boolean(touched.socialReason && errors.socialReason)}
                  helperText={touched.socialReason && errors.socialReason}
                  sx={figmaRadius25Sx}
                />
              </EntryField>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width: COL_WIDTH }}>
                <Typography component="label" sx={{ ...labelSx, color: '#454545' }}>
                  Secteur d'activité <span style={{ color: '#d32f2f', fontSize: '16px' }}>*</span>
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={categories.map((c) => c.name)}
                  loading={loadingCategories}
                  componentsProps={{
                    paper: {
                      sx: {
                        '& .MuiAutocomplete-option': {
                          fontSize: '13px',
                          fontFamily: '"Poppins", sans-serif',
                          padding: '6px 10px',
                          minHeight: 'auto',
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Secteur d'activité"
                      error={Boolean(touched.activitySector && errors.activitySector)}
                      helperText={touched.activitySector && (errors.activitySector as string)}
                      sx={figmaAutoSxRadius25}
                    />
                  )}
                  onChange={(_, value) => setFieldValue('activitySector', value)}
                  value={values.activitySector || []}
                />
              </Box>
            </Box>

            {/* Row 2: E-mail professionnel | Numéro de téléphone Professionnel */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
              <EntryField label="E-mail professionnel *">
                <FigmaField
                  fieldProps={getFieldProps('email')}
                  placeholder="Entrez votre adresse e-mail professionnel"
                  type="email"
                  error={Boolean(touched.email && errors.email)}
                  helperText={touched.email && errors.email}
                />
              </EntryField>
              <EntryField label="Numéro de téléphone Professionnel *">
                <FigmaField
                  fieldProps={getFieldProps('phone')}
                  placeholder="Numéro de téléphone pro"
                  error={Boolean(touched.phone && errors.phone)}
                  helperText={touched.phone && errors.phone}
                />
              </EntryField>
            </Box>

            {/* Row 3: Poste | Wilaya */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
              <EntryField label="Poste">
                <FigmaField
                  fieldProps={getFieldProps('jobTitle')}
                  placeholder="Quel poste occupez-vous ?"
                  error={Boolean(touched.jobTitle && errors.jobTitle)}
                  helperText={touched.jobTitle && errors.jobTitle}
                />
              </EntryField>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width: COL_WIDTH }}>
                <Typography component="label" sx={{ ...labelSx, color: '#454545' }}>
                  Wilaya <span style={{ color: '#d32f2f', fontSize: '16px' }}>*</span>
                </Typography>
                <Autocomplete
                  options={WILAYAS}
                  size="small"
                  componentsProps={{
                    paper: {
                      sx: {
                        '& .MuiAutocomplete-option': {
                          fontSize: '13px',
                          fontFamily: '"Poppins", sans-serif',
                          padding: '6px 10px',
                          minHeight: 'auto',
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Ou résidez-vous ?"
                      error={Boolean(touched.wilaya && errors.wilaya)}
                      helperText={touched.wilaya && errors.wilaya}
                      sx={figmaAutoSx}
                    />
                  )}
                  onChange={(_, value) => setFieldValue('wilaya', value)}
                />
              </Box>
            </Box>
          </>
        ) : (
          /* ─── PARTICULAR LAYOUT ─── */
          <>
            {/* Row 0: Code promo (optionnel) */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
              <EntryField label="Code promo (optionnel)">
                <FigmaField
                  fieldProps={getFieldProps('promoCode')}
                  placeholder="Entrez un code promo"
                />
              </EntryField>
              <Box sx={{ display: { xs: 'none', md: 'block' }, width: COL_WIDTH }} />
            </Box>


            {/* Row 1: Nom | Prénom */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
              <EntryField label="Nom *">
                <FigmaField
                  fieldProps={getFieldProps('lastName')}
                  placeholder="Votre nom"
                  error={Boolean(touched.lastName && errors.lastName)}
                  helperText={touched.lastName && errors.lastName}
                  sx={figmaRadius25Sx}
                />
              </EntryField>
              <EntryField label="Prénom *">
                <FigmaField
                  fieldProps={getFieldProps('firstName')}
                  placeholder="Votre prénom"
                  error={Boolean(touched.firstName && errors.firstName)}
                  helperText={touched.firstName && errors.firstName}
                  sx={figmaRadius25Sx}
                />
              </EntryField>
            </Box>

            {/* Row 2: Date de naissance | E-mail professionnel */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
              <EntryField label="Date de naissance *">
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...getFieldProps('birthDate')}
                  error={Boolean(touched.birthDate && errors.birthDate)}
                  helperText={touched.birthDate && errors.birthDate}
                  sx={{
                    ...fieldSx,
                    '& input[type="date"]': {
                      fontFamily: '"Poppins", sans-serif',
                      fontSize: '13px',
                      color: '#2D3748',
                      height: FIELD_HEIGHT,
                      boxSizing: 'border-box',
                    },
                  }}
                />
              </EntryField>
              <EntryField label="Email *">
                <FigmaField
                  fieldProps={getFieldProps('email')}
                  placeholder="Entrez votre e-mail"
                  type="email"
                  error={Boolean(touched.email && errors.email)}
                  helperText={touched.email && errors.email}
                />
              </EntryField>
            </Box>

            {/* Row 3: Numéro de téléphone | Wilaya de résidence */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
              <EntryField label="Numéro de téléphone *">
                <FigmaField
                  fieldProps={getFieldProps('phone')}
                  placeholder="Votre numéro de téléphone"
                  error={Boolean(touched.phone && errors.phone)}
                  helperText={touched.phone && errors.phone}
                />
              </EntryField>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', width: COL_WIDTH }}>
                <Typography component="label" sx={{ ...labelSx, color: '#454545' }}>
                  Wilaya de résidence <span style={{ color: '#d32f2f', fontSize: '16px' }}>*</span>
                </Typography>
                <Autocomplete
                  options={WILAYAS}
                  size="small"
                  componentsProps={{
                    paper: {
                      sx: {
                        '& .MuiAutocomplete-option': {
                          fontSize: '13px',
                          fontFamily: '"Poppins", sans-serif',
                          padding: '6px 10px',
                          minHeight: 'auto',
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Où résidez-vous ?"
                      error={Boolean(touched.wilaya && errors.wilaya)}
                      helperText={touched.wilaya && errors.wilaya}
                      sx={figmaAutoSx}
                    />
                  )}
                  onChange={(_, value) => setFieldValue('wilaya', value)}
                />
              </Box>
            </Box>

          </>
        )}

        {/* Row Last: Mot de passe | Confirmer le mot de passe (Shared by both) */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, mb: '16px' }}>
          <EntryField label="Mot de passe *">
            <FigmaField
              fieldProps={getFieldProps('password')}
              placeholder="***************"
              type={showPassword ? 'text' : 'password'}
              error={Boolean(touched.password && errors.password)}
              helperText={touched.password && errors.password}
              endAdornment={eyeAdornment(showPassword, () => setShowPassword(!showPassword))}
            />
          </EntryField>
          <EntryField label="Confirmer mot de passe *">
            <FigmaField
              fieldProps={getFieldProps('confirmPassword')}
              placeholder="***************"
              type={showConfirmPassword ? 'text' : 'password'}
              error={Boolean(touched.confirmPassword && errors.confirmPassword)}
              helperText={touched.confirmPassword && errors.confirmPassword}
              endAdornment={eyeAdornment(showConfirmPassword, () =>
                setShowConfirmPassword(!showConfirmPassword)
              )}
            />
          </EntryField>
        </Box>

        {/* ── Remember me ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '10px',
            width: '160px',
            height: '18px',
            mb: '14px',
          }}
        >
          <FigmaCheckbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              color: '#454545',
              whiteSpace: 'nowrap',
            }}
          >
            Se rappeler de moi
          </Typography>
        </Box>

        {/* ── Terms & Privacy ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            maxWidth: '500px',
            mb: '28px',
          }}
        >
          <FigmaCheckbox
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize: '13px',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              color: '#454545',
              flex: 1,
            }}
          >
            J'accepte les{' '}
            <Link
              component="button"
              type="button"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleOpenTerms();
              }}
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '13px',
                color: '#007AFF',
                letterSpacing: '-0.02em',
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Termes et la politique de confidentialité
            </Link>
          </Typography>
        </Box>

        {/* ── Buttons row ── */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: COL_GAP, height: { xs: 'auto', md: FIELD_HEIGHT }, alignItems: { xs: 'stretch', md: 'center' } }}>
          {/* Create account */}
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{
              width: COL_WIDTH,
              height: FIELD_HEIGHT,
              borderRadius: '25px',
              background: '#002896',
              color: '#FFFFFF',
              textTransform: 'none',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              lineHeight: '15px',
              letterSpacing: '-0.02em',
              boxShadow: 'none',
              flexShrink: 0,
              '&:hover': { background: '#001b69', boxShadow: 'none' },
            }}
          >
            Create account
          </LoadingButton>

          {/* Google sign-in */}
          <Box
            sx={{
              flex: 1,
              height: FIELD_HEIGHT,
              position: 'relative',
              cursor: 'pointer',
              '&:hover': { opacity: 0.9 },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundColor: '#2D3748',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {/* Google SVG icon */}
              <Box
                component="svg"
                viewBox="0 0 24 24"
                sx={{ width: '18px', height: '18px', flexShrink: 0 }}
              >
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  lineHeight: '15px',
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                Sign-in with google
              </Typography>
            </Box>
          </Box>
        </Box>
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
