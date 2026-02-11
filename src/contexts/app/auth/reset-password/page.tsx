"use client";

import React, { useState, useEffect, Suspense } from 'react'; // Added Suspense
import { useRouter, useSearchParams } from 'next/navigation';
import { Typography, styled, Box, TextField, Button, Alert, Link, alpha, IconButton, InputAdornment } from '@mui/material';
import NextLink from 'next/link';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import app from '../../../config';
import Iconify from '../../../components/Iconify';

const RootStyle = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  position: 'relative',
  background: theme.palette.common.white,
  padding: theme.spacing(3, 0),
  paddingTop: '40px',
}));

const GlassContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.85)} 0%,
    ${alpha(theme.palette.background.paper, 0.75)} 100%
  )`,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: 'none',
  boxShadow: `
    0 6px 24px 0 ${alpha(theme.palette.common.black, 0.12)},
    inset 0 1px 0 0 ${alpha(theme.palette.common.white, 0.4)},
    inset 0 -1px 0 0 ${alpha(theme.palette.common.black, 0.04)}
  `,
  borderRadius: '28px',
  padding: theme.spacing(4),
  position: 'relative',
  zIndex: 10,
  maxWidth: '560px',
  width: '100%',
  margin: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    maxWidth: '100%',
  },
}));

function ResetPasswordContent() { // Separate component for Suspense boundary
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: initialEmail,
      code: '',
      newPassword: '',
      confirmPassword: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: Yup.string().email('Email invalide').required('Email requis'),
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
        await axios.post(`${app.baseURL}auth/reset-password-email`, {
             email: values.email,
             code: values.code,
             newPassword: values.newPassword
        });
        
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
       <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          mb: { xs: 1, sm: 2 },
        }}
      >
        <NextLink href="/" passHref>
          <img
            src="/assets/img/logo.png"
            alt="MazadClick"
            style={{
              height: 'auto',
              maxHeight: '70px',
              maxWidth: '180px',
            }}
          />
        </NextLink>
      </Box>

      <GlassContainer>
        <Typography variant="h4" paragraph align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Réinitialiser le mot de passe
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 5 }} align="center">
          Entrez le code reçu par email ainsi que votre nouveau mot de passe.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            label="Adresse Email"
            {...formik.getFieldProps('email')}
            error={Boolean(formik.touched.email && formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            sx={{ mb: 3 }}
            disabled={!!initialEmail}
          />

          <TextField
             fullWidth
             label="Code OTP"
             {...formik.getFieldProps('code')}
             error={Boolean(formik.touched.code && formik.errors.code)}
             helperText={formik.touched.code && formik.errors.code}
             sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Nouveau mot de passe"
            {...formik.getFieldProps('newPassword')}
            error={Boolean(formik.touched.newPassword && formik.errors.newPassword)}
            helperText={formik.touched.newPassword && formik.errors.newPassword}
            sx={{ mb: 3 }}
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

         <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Confirmer le mot de passe"
            {...formik.getFieldProps('confirmPassword')}
            error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            sx={{ mb: 3 }}
          />

          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={formik.isSubmitting}
          >
            Réinitialiser
          </LoadingButton>

          <Button
            fullWidth
            size="large"
            onClick={() => router.push('/auth/login')}
            sx={{ mt: 1 }}
          >
            Annuler
          </Button>
        </form>
      </GlassContainer>
    </RootStyle>
  );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
