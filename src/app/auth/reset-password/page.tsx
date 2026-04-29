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
import { useSettingsStore } from "@/contexts/settingsStore";
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import axios from 'axios';
import app from '../../../config';
import EmailIcon from '@mui/icons-material/Email';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const RootStyle = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f8f9fa',
  padding: theme.spacing(2),
}));

const StyledCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  width: '367px',
  height: '666px',
  background: '#FFFFFF',
  border: '1px solid #DBDADE',
  boxShadow: '0px 5px 30px rgba(0, 0, 0, 0.25), 0px 4px 4px rgba(0, 0, 0, 0.25)',
  borderRadius: '35px',
  overflow: 'hidden',
}));

const IconFrame = styled(Box)({
  position: 'absolute',
  width: '50px',
  height: '50px',
  left: '148px',
  top: '21px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const TitleText = styled(Typography)({
  position: 'absolute',
  width: '232px',
  height: '72px',
  left: '65px',
  top: '84px',
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: '24px',
  lineHeight: '36px',
  textAlign: 'center',
  color: '#757575',
});

const SubtitleText = styled(Typography)({
  position: 'absolute',
  width: '259px',
  height: '42px',
  left: '54px',
  top: '169px',
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '21px',
  textAlign: 'center',
  color: '#757575',
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  position: 'absolute',
  width: '315px',
  left: '23px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#FFFFFF',
    '& fieldset': {
      borderColor: '#C2C2C2',
    },
    '&:hover fieldset': {
      borderColor: '#B0B0B0',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0096E3',
    },
  },
  '& .MuiInputBase-input': {
    padding: '10px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    '&::placeholder': {
      color: '#C4C4C4',
      opacity: 1,
    },
  },
}));

const CodeTextField = styled(StyledTextField)({
  top: '328px',
  '& .MuiOutlinedInput-root': {
    height: '37px',
    borderColor: '#0096E3',
    '& fieldset': {
      borderColor: '#0096E3',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#0096E3',
    fontSize: '10px',
    transform: 'translate(14px, -10px) scale(1)',
    background: '#FFFFFF',
    padding: '0 4px',
    fontFamily: "'Inter', sans-serif",
  }
});

const PasswordTextField = styled(StyledTextField)({
  '& .MuiOutlinedInput-root': {
    height: '46px',
    borderColor: '#0096E3',
    '& fieldset': {
      borderColor: '#0096E3',
    },
  },
});

const DotsOverlay = styled(Box)({
  position: 'absolute',
  width: '157px',
  height: '7px',
  left: '31px',
  top: '19px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '8px',
  pointerEvents: 'none',
  '& div': {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#757575',
  }
});

const ConfirmLabel = styled(Typography)({
  position: 'absolute',
  width: '165px',
  height: '18px',
  left: '18px',
  top: '502px',
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 400,
  fontSize: '12px',
  lineHeight: '18px',
  color: '#757575',
});

const StyledLoadingButton = styled(LoadingButton)({
  position: 'absolute',
  width: '315px',
  height: '44px',
  left: '23px',
  top: '538px',
  background: 'linear-gradient(180deg, #0096E3 0%, rgba(0, 83, 125, 0.7) 100%)',
  borderRadius: '10px',
  textTransform: 'none',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '24px',
  color: '#FFFFFF',
  boxShadow: 'none',
  '&:hover': {
    background: 'linear-gradient(180deg, #0082c4 0%, rgba(0, 69, 104, 0.8) 100%)',
  },
});

const BackLinkBox = styled(Box)({
  position: 'absolute',
  width: '259px',
  height: '18px',
  left: '53px',
  top: '599px',
  textAlign: 'center',
  '& a': {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    fontSize: '12px',
    lineHeight: '18px',
    color: '#757575',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
});

function ResetPasswordContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = (searchParams.get('method') as 'email' | 'phone') || 'email';
  const initialEmail = searchParams.get('email') || '';
  const initialPhone = searchParams.get('phone') || '';
  const identifier = method === 'email' ? initialEmail : initialPhone;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const renderDots = () => (
    <DotsOverlay>
      {[...Array(11)].map((_, i) => (
        <div key={i} />
      ))}
    </DotsOverlay>
  );

  return (
    <RootStyle>
      <Fade in timeout={600}>
        <StyledCard elevation={0}>
          <IconFrame>
            <Box sx={{ 
              width: '54px', 
              height: '40px', 
              border: '1px solid #d0d0d0', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2b2b43',
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '1px'
            }}>
              ***
            </Box>
          </IconFrame>

          <TitleText>
            Réinitialiser le mot<br />de passe
          </TitleText>

          <SubtitleText>
            Entrez le code reçu par mail et choisissez un nouveua mot de passe
          </SubtitleText>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                position: 'absolute',
                top: '215px',
                left: '23px',
                width: '315px',
                borderRadius: '10px',
                zIndex: 10,
                py: 0,
                fontSize: '12px'
              }}
            >
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                position: 'absolute',
                top: '215px',
                left: '23px',
                width: '315px',
                borderRadius: '10px',
                zIndex: 10,
                py: 0,
                fontSize: '12px'
              }}
            >
              {success}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            {method === 'email' ? (
              <StyledTextField
                fullWidth
                placeholder="Adresse E-mail"
                {...formik.getFieldProps('email')}
                error={Boolean(formik.touched.email && formik.errors.email)}
                sx={{ top: '255px', height: '44px' }}
                disabled={!!initialEmail}
              />
            ) : (
              <StyledTextField
                fullWidth
                placeholder="Numéro de téléphone"
                {...formik.getFieldProps('phone')}
                error={Boolean(formik.touched.phone && formik.errors.phone)}
                sx={{ top: '255px', height: '44px' }}
                disabled={!!initialPhone}
              />
            )}

            <CodeTextField
              fullWidth
              label="Code"
              placeholder=""
              {...formik.getFieldProps('code')}
              error={Boolean(formik.touched.code && formik.errors.code)}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ position: 'absolute', top: '385px', left: '23px', width: '315px' }}>
              <PasswordTextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                {...formik.getFieldProps('newPassword')}
                error={Boolean(formik.touched.newPassword && formik.errors.newPassword)}
                sx={{ position: 'relative', left: 0, top: 0, width: '100%' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#757575' }}>
                        <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {!formik.values.newPassword && renderDots()}
            </Box>

            <Box sx={{ position: 'absolute', top: '451px', left: '23px', width: '315px' }}>
              <PasswordTextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                {...formik.getFieldProps('confirmPassword')}
                error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                sx={{ position: 'relative', left: 0, top: 0, width: '100%' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#757575' }}>
                        <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {!formik.values.confirmPassword && renderDots()}
            </Box>

            <ConfirmLabel>
              Confirmez mot de passe
            </ConfirmLabel>

            <StyledLoadingButton
              type="submit"
              variant="contained"
              loading={formik.isSubmitting}
            >
              Réinitialiser
            </StyledLoadingButton>

            <BackLinkBox>
              <NextLink href="/auth/login">
                Retour a la connextion
              </NextLink>
            </BackLinkBox>
          </form>
        </StyledCard>
      </Fade>
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
