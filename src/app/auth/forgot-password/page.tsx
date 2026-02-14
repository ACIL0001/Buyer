"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Typography, 
  styled, 
  Box, 
  TextField, 
  Button, 
  Alert, 
  ToggleButton, 
  ToggleButtonGroup, 
  alpha,
  Container,
  Paper,
  Fade,
  Slide
} from '@mui/material';
import NextLink from 'next/link';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import app from '../../../config';
import EmailIcon from '@mui/icons-material/Email';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LockResetIcon from '@mui/icons-material/LockReset';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
    ${alpha('#ffffff', 0.95)} 0%,
    ${alpha('#ffffff', 0.9)} 100%
  )`,
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${alpha('#1976d2', 0.1)}`,
  boxShadow: `
    0 24px 48px ${alpha('#000000', 0.2)},
    0 12px 24px ${alpha('#000000', 0.12)},
    inset 0 1px 0 ${alpha('#ffffff', 0.8)}
  `,
  borderRadius: '24px',
  padding: theme.spacing(3),
  position: 'relative',
  zIndex: 10,
  maxWidth: '480px',
  width: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `
      0 32px 64px ${alpha('#000000', 0.24)},
      0 16px 32px ${alpha('#1976d2', 0.16)}
    `,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2.5),
    borderRadius: '20px',
  },
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
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
  marginBottom: theme.spacing(2),
  boxShadow: `0 8px 24px ${alpha('#1976d2', 0.4)}`,
  '& svg': {
    fontSize: 32,
    color: '#ffffff',
  },
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  width: '100%',
  backgroundColor: alpha('#f5f5f5', 0.8),
  borderRadius: '16px',
  padding: theme.spacing(0.5),
  border: 'none',
  '& .MuiToggleButton-root': {
    flex: 1,
    border: 'none',
    borderRadius: '12px',
    padding: theme.spacing(1.5),
    textTransform: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: theme.palette.text.secondary,
    '&.Mui-selected': {
      background: `linear-gradient(135deg, #1976d2, #42a5f5)`,
      color: '#ffffff',
      boxShadow: `0 4px 12px ${alpha('#1976d2', 0.4)}`,
      '&:hover': {
        background: `linear-gradient(135deg, #1565c0, #1e88e5)`,
      },
    },
    '&:hover': {
      backgroundColor: alpha('#1976d2', 0.08),
    },
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    backgroundColor: alpha('#f5f5f5', 0.5),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: alpha('#e3f2fd', 0.7),
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1976d2',
      },
    },
    '&.Mui-focused': {
      backgroundColor: alpha('#ffffff', 0.9),
      boxShadow: `0 0 0 4px ${alpha('#1976d2', 0.1)}`,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1976d2',
        borderWidth: 2,
      },
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
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

const BackButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  padding: theme.spacing(1.5),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  color: theme.palette.text.primary,
  border: `2px solid ${alpha('#e0e0e0', 0.5)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha('#1976d2', 0.08),
    borderColor: '#1976d2',
    transform: 'translateX(-4px)',
  },
}));

export default function ForgotPassword() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [method, setMethod] = useState<'email' | 'phone'>('email');

  const handleMethodChange = (event: React.MouseEvent<HTMLElement>, newMethod: 'email' | 'phone' | null) => {
    if (newMethod !== null) {
      setMethod(newMethod);
      formik.resetForm();
      setError(null);
      setSuccess(null);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      phone: '',
    },
    validationSchema: Yup.object({
      email: method === 'email' 
        ? Yup.string().email('Email invalide').required('Email requis')
        : Yup.string(),
      phone: method === 'phone'
        ? Yup.string()
            .required('Numéro de téléphone requis')
            .matches(/^(\+213|213|0)?[5-7][0-9]{8}$/, 'Numéro de téléphone algérien invalide (ex: +213660295655)')
        : Yup.string(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      setSuccess(null);
      try {
        const payload = method === 'email' 
          ? { email: values.email }
          : { phone: values.phone };

        const response = await axios.post(`${app.baseURL}auth/forgot-password`, payload);
        
        const successMessage = method === 'email'
          ? 'Un code de réinitialisation a été envoyé à votre email.'
          : 'Un code de réinitialisation a été envoyé à votre téléphone.';
        
        setSuccess(successMessage);
        
        setTimeout(() => {
          const identifier = method === 'email' ? values.email : values.phone;
          router.push(`/auth/reset-password?method=${method}&${method}=${encodeURIComponent(identifier)}`);
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
                  <LockResetIcon />
                </IconWrapper>

                <Typography 
                  variant="h4" 
                  align="center" 
                  sx={{ 
                    fontWeight: 800, 
                    color: 'text.primary',
                    mb: 1.5,
                    background: 'linear-gradient(135deg, #1976d2, #9c27b0)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Mot de passe oublié ?
                </Typography>

                <Typography 
                  sx={{ 
                    color: 'text.secondary', 
                    mb: 4,
                    textAlign: 'center',
                    fontSize: '1rem',
                    fontWeight: 500,
                  }}
                >
                  Choisissez votre méthode de réinitialisation
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <StyledToggleButtonGroup
                    value={method}
                    exclusive
                    onChange={handleMethodChange}
                    aria-label="reset method"
                  >
                    <ToggleButton value="email">
                      <EmailIcon sx={{ mr: 1, fontSize: 20 }} />
                      Email
                    </ToggleButton>
                    <ToggleButton value="phone">
                      <PhoneAndroidIcon sx={{ mr: 1, fontSize: 20 }} />
                      Téléphone
                    </ToggleButton>
                  </StyledToggleButtonGroup>
                </Box>

                {error && (
                  <Fade in>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: '12px',
                        '& .MuiAlert-icon': {
                          fontSize: 24,
                        },
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
                      sx={{ 
                        mb: 3, 
                        borderRadius: '12px',
                        '& .MuiAlert-icon': {
                          fontSize: 24,
                        },
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
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  ) : (
                    <StyledTextField
                      fullWidth
                      label="Numéro de téléphone"
                      placeholder="+213660295655"
                      {...formik.getFieldProps('phone')}
                      error={Boolean(formik.touched.phone && formik.errors.phone)}
                      helperText={formik.touched.phone && formik.errors.phone || 'Format: +213XXXXXXXXX ou 0XXXXXXXXX'}
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: <PhoneAndroidIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  )}

                  <StyledLoadingButton
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    loading={formik.isSubmitting}
                  >
                    Envoyer le code
                  </StyledLoadingButton>

                  <BackButton
                    fullWidth
                    size="large"
                    onClick={() => router.push('/auth/login')}
                    sx={{ mt: 2 }}
                    startIcon={<ArrowBackIcon />}
                  >
                    Retour à la connexion
                  </BackButton>
                </form>
              </GlassContainer>
            </Slide>
          </div>
        </Fade>
      </Container>
    </RootStyle>
  );
}
