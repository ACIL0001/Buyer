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
import { motion } from 'framer-motion';
import { useSettingsStore } from "@/contexts/settingsStore";
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import app from '../../../config';
import EmailIcon from '@mui/icons-material/Email';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LockResetIcon from '@mui/icons-material/LockReset';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';

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
  width: '100%',
  maxWidth: '367px',
  minHeight: '522px',
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
  '& svg': {
    width: '30px',
    height: '30px',
    color: '#1C274C',
    opacity: 0.5,
  }
});

const TitleText = styled(Typography)({
  position: 'absolute',
  width: '263px',
  height: '36px',
  left: '50px',
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
  left: '50px',
  top: '133px',
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '21px',
  textAlign: 'center',
  color: '#757575',
});

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  position: 'absolute',
  top: '199px',
  left: '0',
  width: '100%',
  justifyContent: 'center',
  '& .MuiToggleButton-root': {
    height: '44px',
    background: '#FFFFFF',
    borderRadius: '10px !important',
    border: 'none',
    textTransform: 'none',
    fontFamily: "'Inter', sans-serif",
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: '19px',
    color: '#000000',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    '&.Mui-selected': {
      background: '#f5f5f5',
      color: '#080341',
      '&:hover': {
        background: '#eeeeee',
      },
    },
    '&:hover': {
      background: '#f9f9f9',
    },
    '& svg': {
      width: '24px',
      height: '24px',
      color: '#080341',
    }
  },
}));

const StyledTextField = styled(TextField)({
  position: 'absolute',
  width: '315px',
  height: '44px',
  left: '28px',
  top: '268px',
  '& .MuiOutlinedInput-root': {
    height: '44px',
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
    fontSize: '12px',
    '&::placeholder': {
      color: '#C4C4C4',
      opacity: 1,
    },
  },
});

const StyledLoadingButton = styled(LoadingButton)({
  position: 'absolute',
  width: '315px',
  height: '44px',
  left: '31px',
  top: '337px',
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
  left: '54px',
  top: '398px',
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

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const { logoUrl } = useSettingsStore();
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
      <Fade in timeout={600}>
        <StyledCard elevation={0}>
          <IconFrame>
            <LockResetIcon />
          </IconFrame>

          <TitleText variant="h4">
            Mot de passe oublié ?
          </TitleText>

          <SubtitleText>
            Choisissez votre méthode de réinitialisation
          </SubtitleText>

          <StyledToggleButtonGroup
            value={method}
            exclusive
            onChange={handleMethodChange}
            aria-label="reset method"
          >
            <ToggleButton value="email" sx={{ position: 'absolute', left: '66px', width: '95px' }}>
              <EmailIcon />
              Email
            </ToggleButton>
            <ToggleButton value="phone" sx={{ position: 'absolute', left: '167px', width: '135px' }}>
              <PhoneAndroidIcon />
              Téléphone
            </ToggleButton>
          </StyledToggleButtonGroup>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                position: 'absolute',
                top: '425px',
                left: '28px',
                width: '315px',
                borderRadius: '10px',
                zIndex: 10,
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
                top: '425px',
                left: '28px',
                width: '315px',
                borderRadius: '10px',
                zIndex: 10,
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
                helperText={formik.touched.email && formik.errors.email}
              />
            ) : (
              <StyledTextField
                fullWidth
                placeholder="Numéro de téléphone"
                {...formik.getFieldProps('phone')}
                error={Boolean(formik.touched.phone && formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
            )}

            <StyledLoadingButton
              type="submit"
              variant="contained"
              loading={formik.isSubmitting}
            >
              Envoyer le code
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
