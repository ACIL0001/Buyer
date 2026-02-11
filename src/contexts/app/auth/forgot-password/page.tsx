"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, styled, Box, TextField, Button, Alert, Link, alpha } from '@mui/material';
import NextLink from 'next/link';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AuthAPI } from '../../api/auth'; // Ensure this path is correct
// If AuthAPI is not available, we might need to add the method there or call axios directly.
import axios from 'axios';
import app from '../../../../config';

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

export default function ForgotPassword() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Email invalide').required('Email requis'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      setSuccess(null);
      try {
        // We can add this method to AuthAPI later, but direct call is fine for now
        // Assuming AuthAPI.forgotPassword exists or we use axios
        const response = await axios.post(`${app.baseURL}auth/forgot-password`, {
             email: values.email
        });
        
        setSuccess('Un code de réinitialisation a été envoyé à votre email.');
        // Redirect to reset password page after short delay? 
        // Or just let user click link? 
        // Better to redirect passing email as query param
        setTimeout(() => {
            router.push(`/auth/reset-password?email=${encodeURIComponent(values.email)}`);
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
          Mot de passe oublié ?
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 5 }} align="center">
          Entrez l'adresse email associée à votre compte et nous vous enverrons un code pour réinitialiser votre mot de passe.
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
          />

          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={formik.isSubmitting}
          >
            Envoyer le code
          </LoadingButton>

          <Button
            fullWidth
            size="large"
            onClick={() => router.push('/auth/login')}
            sx={{ mt: 1 }}
          >
            Retour
          </Button>
        </form>
      </GlassContainer>
    </RootStyle>
  );
}
