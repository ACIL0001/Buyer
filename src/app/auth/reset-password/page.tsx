"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Typography, 
  styled, 
  Box, 
  TextField, 
  Button, 
  Alert, 
  alpha,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  Chip
} from '@mui/material';
import NextLink from 'next/link';
import { LoadingButton } from '@mui/lab';
import Iconify from '../../../components/Iconify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import app from '../../../config';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EmailIcon from '@mui/icons-material/Email';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SecurityIcon from '@mui/icons-material/Security';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const RootStyle = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  background: '#ffffff',
  padding: theme.spacing(2),
  overflow: 'hidden',
}));

const GlassContainer = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%,
    ${alpha(theme.palette.background.paper, 0.9)} 100%
  )`,
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `
    0 24px 48px ${alpha(theme.palette.common.black, 0.2)},
    0 12px 24px ${alpha(theme.palette.common.black, 0.12)},
    inset 0 1px 0 ${alpha(theme.palette.common.white, 0.1)}
  `,
  borderRadius: '24px',
  padding: theme.spacing(4),
  position: 'relative',
  zIndex: 10,
  maxWidth: '480px',
  width: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `
      0 32px 64px ${alpha(theme.palette.common.black, 0.24)},
      0 16px 32px ${alpha(theme.palette.common.black, 0.16)}
    `,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2.5),
    borderRadius: '24px',
  },
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  '& img': {
    height: 'auto',
    maxHeight: '60px',
    maxWidth: '180px',
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 64,
  height: 64,
  borderRadius: '16px',
  background: `linear-gradient(135deg, #1976d2, #42a5f5)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  marginBottom: theme.spacing(2.5),
  boxShadow: `0 8px 24px ${alpha('#1976d2', 0.4)}`,
  '& svg': {
    fontSize: 32,
    color: theme.palette.common.white,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.default, 0.7),
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      },
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const OTPTextField = styled(StyledTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '0.5rem',
    textAlign: 'center',
    '& input': {
      textAlign: 'center',
    },
  },
}));

const StyledLoadingButton = styled(LoadingButton)(({ theme }) => ({
  borderRadius: '16px',
  padding: theme.spacing(1.75),
  fontSize: '1.1rem',
  fontWeight: 700,
  textTransform: 'none',
  background: `linear-gradient(135deg, #1976d2, #42a5f5)`,
  boxShadow: `0 8px 24px ${alpha('#1976d2', 0.4)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: `linear-gradient(135deg, #1565c0, #1e88e5)`,
    transform: 'translateY(-2px)',
    boxShadow: `0 12px 32px ${alpha('#1976d2', 0.5)}`,
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

const ResendButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: theme.spacing(1, 2),
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none',
  color: theme.palette.primary.main,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'scale(1.05)',
  },
  '&.Mui-disabled': {
    color: theme.palette.text.disabled,
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  padding: theme.spacing(1.5),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  color: theme.palette.text.primary,
  border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.action.hover, 0.08),
    borderColor: theme.palette.error.main,
    color: theme.palette.error.main,
  },
}));

const MethodChip = styled(Chip)(({ theme }) => ({
  borderRadius: '12px',
  padding: theme.spacing(2, 1),
  fontSize: '0.95rem',
  fontWeight: 600,
  background: alpha(theme.palette.info.main, 0.1),
  color: theme.palette.info.main,
  border: `2px solid ${alpha(theme.palette.info.main, 0.3)}`,
  '& .MuiChip-icon': {
    color: theme.palette.info.main,
  },
}));

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = (searchParams.get('method') as 'email' | 'phone') || 'email';
  const initialEmail = searchParams.get('email') || '';
  const initialPhone = searchParams.get('phone') || '';
  const identifier = method === 'email' ? initialEmail : initialPhone;
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleResendCode = async () => {
    try {
      setError(null);
      const payload = method === 'email' 
        ? { email: identifier }
        : { phone: identifier };
      
      await axios.post(`${app.baseURL}auth/forgot-password`, payload);
      setSuccess('Code renvoyé avec succès !');
      setResendCountdown(60);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors du renvoi du code.');
    }
  };

  const formik = useFormik({
    initialValues: {
      email: initialEmail,
      phone: initialPhone,
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: method === 'email' 
        ? Yup.string().email('Email invalide').required('Email requis')
        : Yup.string(),
      phone: method === 'phone'
        ? Yup.string().required('Téléphone requis')
        : Yup.string(),
      code: Yup.string().required('Code OTP requis').min(5, 'Code trop court'),
      newPassword: Yup.string().required('Nouveau mot de passe requis').min(6, 'Doit contenir au moins 6 caractères'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Les mots de passe doivent correspondre')
        .required('Confirmation requise'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      setSuccess(null);
      try {
        if (method === 'email') {
          await axios.post(`${app.baseURL}auth/reset-password-email`, {
            email: values.email,
            code: values.code,
            newPassword: values.newPassword
          });
        } else {
          await axios.post(`${app.baseURL}auth/reset-password/confirm`, {
            phone: values.phone,
            code: values.code,
            newPassword: values.newPassword
          });
        }
        
        setSuccess('Mot de passe réinitialisé avec succès !');
        setTimeout(() => {
            router.push('/auth/login');
        }, 2000);

      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Une erreur est survenue.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <RootStyle>
      <Container maxWidth="sm">
        <Fade in timeout={600}>
          <div>
            <LogoBox>
              <NextLink href="/" passHref>
                <img src="/assets/img/logo.png" alt="MazadClick" />
              </NextLink>
            </LogoBox>

            <Slide direction="up" in timeout={800}>
              <GlassContainer elevation={0}>
                <IconWrapper>
                  <LockOpenIcon />
                </IconWrapper>

                <Typography 
                  variant="h4" 
                  align="center" 
                  sx={{ 
                    fontWeight: 800, 
                    color: 'text.primary',
                    mb: 1.5,
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Réinitialiser le mot de passe
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
                  <MethodChip
                    icon={method === 'email' ? <EmailIcon /> : <PhoneAndroidIcon />}
                    label={method === 'email' ? 'Via Email' : 'Via SMS'}
                  />
                </Box>

                <Typography 
                  sx={{ 
                    color: 'text.secondary', 
                    mb: 3,
                    textAlign: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }}
                >
                  {method === 'email' 
                    ? 'Entrez le code reçu par email ainsi que votre nouveau mot de passe.'
                    : 'Entrez le code reçu par SMS ainsi que votre nouveau mot de passe.'}
                </Typography>

                {error && (
                  <Fade in>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2.5, 
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { fontSize: 24 },
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}
                
                {success && (
                  <Fade in>
                    <Alert 
                      severity="success" 
                      icon={<CheckCircleIcon fontSize="inherit" />}
                      sx={{ 
                        mb: 2.5, 
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { fontSize: 24 },
                      }}
                    >
                      {success}
                    </Alert>
                  </Fade>
                )}

                <form onSubmit={formik.handleSubmit}>
                  {method === 'email' ? (
                    <StyledTextField
                      fullWidth
                      label="Adresse Email"
                      {...formik.getFieldProps('email')}
                      error={Boolean(formik.touched.email && formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                      sx={{ mb: 2.5 }}
                      disabled={!!initialEmail}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  ) : (
                    <StyledTextField
                      fullWidth
                      label="Numéro de téléphone"
                      {...formik.getFieldProps('phone')}
                      error={Boolean(formik.touched.phone && formik.errors.phone)}
                      helperText={formik.touched.phone && formik.errors.phone}
                      sx={{ mb: 2.5 }}
                      disabled={!!initialPhone}
                      InputProps={{
                        startAdornment: <PhoneAndroidIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  )}

                  <OTPTextField
                    fullWidth
                    label="Code OTP"
                    {...formik.getFieldProps('code')}
                    error={Boolean(formik.touched.code && formik.errors.code)}
                    helperText={formik.touched.code && formik.errors.code}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <SecurityIcon sx={{ mr: 1, color: 'info.main' }} />,
                    }}
                  />

                  {method === 'phone' && (
                    <Box sx={{ mb: 3, textAlign: 'right' }}>
                      <ResendButton
                        size="small"
                        onClick={handleResendCode}
                        disabled={resendCountdown > 0}
                        startIcon={<RefreshIcon />}
                      >
                        {resendCountdown > 0 
                          ? `Renvoyer dans ${resendCountdown}s` 
                          : 'Renvoyer le code'}
                      </ResendButton>
                    </Box>
                  )}

                  <StyledTextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Nouveau mot de passe"
                    {...formik.getFieldProps('newPassword')}
                    error={Boolean(formik.touched.newPassword && formik.errors.newPassword)}
                    helperText={formik.touched.newPassword && formik.errors.newPassword}
                    sx={{ mb: 2.5 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <StyledTextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    label="Confirmer le mot de passe"
                    {...formik.getFieldProps('confirmPassword')}
                    error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    sx={{ mb: 3 }}
                  />

                  <StyledLoadingButton
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    loading={formik.isSubmitting}
                    startIcon={<CheckCircleIcon />}
                  >
                    Réinitialiser
                  </StyledLoadingButton>

                  <CancelButton
                    fullWidth
                    size="large"
                    onClick={() => router.push('/auth/login')}
                    sx={{ mt: 2 }}
                  >
                    Annuler
                  </CancelButton>
                </form>
              </GlassContainer>
            </Slide>
          </div>
        </Fade>
      </Container>
    </RootStyle>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
