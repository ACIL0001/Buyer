"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography, styled, Box, Link, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import NextLink from 'next/link';
import RegisterForm from '../../../sections/auth/register/RegisterForm';
import useAuth from '../../../hooks/useAuth';
import useResponsive from '../../../hooks/useResponsive';

// ----------------------------------------------------------------------

// Root container with white background
const RootStyle = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  background: theme.palette.common.white,
  padding: theme.spacing(1, 0),
  '@media (max-width: 599px)': {
    padding: '12px 0 8px',
  },
  '@media (min-width: 600px) and (max-width: 959px)': {
    padding: '16px 0 8px',
  },
  '@media (min-width: 960px)': {
    padding: '20px 0 8px',
  },
}));

// Glassmorphism container
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
  padding: theme.spacing(2),
  paddingTop: '16px',
  position: 'relative',
  zIndex: 10,
  maxWidth: '700px',
  width: 'auto',
  margin: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2.5),
    margin: theme.spacing(1),
    borderRadius: '20px',
    maxWidth: '100%',
  },
  '@media (min-width: 480px) and (max-width: 639px)': {
    padding: theme.spacing(2),
    margin: theme.spacing(1, 1),
    borderRadius: '22px',
  },
  '@media (min-width: 640px) and (max-width: 767px)': {
    padding: theme.spacing(2.5),
    margin: theme.spacing(1.5),
    borderRadius: '26px',
    maxWidth: '600px',
  },
  '@media (min-width: 768px)': {
    padding: theme.spacing(3),
    margin: theme.spacing(2),
    borderRadius: '30px',
    maxWidth: '800px',
  },
}));

// ----------------------------------------------------------------------

export default function Register() {
  const { t } = useTranslation();
  const { isLogged } = useAuth();
  const router = useRouter();
  const { width } = useResponsive();
  const smUp = width >= 600;

  if (isLogged) {
    router.replace('/');
    return null;
  }

  return (
    <RootStyle>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          mb: { xs: 1, sm: 1.5 },
        }}
      >
        <NextLink href="/" passHref>
          <img
            src="/assets/img/logo.png"
            alt="MazadClick"
            style={{
              height: 'auto',
              maxHeight: '60px',
              maxWidth: '150px',
            }}
            className="w-auto h-10 sm:h-12 md:h-[60px] max-w-[110px] sm:max-w-[140px] md:max-w-[150px]"
          />
        </NextLink>
      </Box>

      {/* Glassmorphism Content Container */}
      <GlassContainer>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            mb: 1, 
            textAlign: 'center', 
            fontWeight: 800,
            background: `linear-gradient(135deg, #0063b1 0%, #00a3e0 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            fontSize: {
              xs: '1.2rem',
              sm: '1.4rem',
              md: '1.8rem',
              lg: '2rem',
            },
          }}
        >
          Créez un compte
        </Typography>
        
        <RegisterForm />

        {!smUp && (
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ 
              mt: 1.5,
              fontSize: { xs: '0.85rem', sm: '0.875rem' },
              color: 'primary.main',
              fontWeight: 600,
            }}
          >
            Vous avez déjà un compte&nbsp;?&nbsp;
            <Link
              component={NextLink}
              href="/auth/login"
              variant="subtitle2" 
              sx={{
                fontSize: { xs: '0.85rem', sm: '0.875rem' },
                color: 'primary.main',
                textDecoration: 'underline',
                fontWeight: 700,
                '&:hover': {
                  textDecoration: 'none',
                  opacity: 0.9,
                },
              }}
            >
              Connectez-vous
            </Link>
          </Typography>
        )}
      </GlassContainer>

      {smUp && (
        <Typography
          variant="body2"
          align="center"
          sx={{
            mt: 2,
            color: 'primary.main',
            fontSize: { sm: '0.85rem', md: '0.9rem' },
            fontWeight: 600,
          }}
        >
          Vous avez déjà un compte&nbsp;?&nbsp;
          <Link
            component={NextLink}
            href="/auth/login"
            variant="subtitle2"
            sx={{
              color: 'primary.main',
              textDecoration: 'underline',
              fontWeight: 700,
              '&:hover': {
                textDecoration: 'none',
                opacity: 0.9,
              },
            }}
          >
            Connectez-vous
          </Link>
        </Typography>
      )}
    </RootStyle>
  );
}
