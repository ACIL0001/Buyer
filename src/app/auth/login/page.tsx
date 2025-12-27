"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, styled, Box, Link, alpha } from '@mui/material';
import { useTranslation } from 'react-i18next';
import NextLink from 'next/link';
import LoginForm from '../../../sections/auth/login/LoginForm';
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
  padding: theme.spacing(3, 0),
  '@media (max-width: 599px)': {
    padding: '32px 0 8px',
  },
  '@media (min-width: 600px) and (max-width: 959px)': {
    padding: '36px 0 8px',
  },
  '@media (min-width: 960px)': {
    padding: '48px 0 8px',
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
  padding: theme.spacing(3),
  paddingTop: '16px',
  position: 'relative',
  zIndex: 10,
  maxWidth: '460px',
  width: 'auto',
  margin: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2.5),
    margin: theme.spacing(1.5),
    borderRadius: '20px',
    maxWidth: '100%',
  },
  '@media (min-width: 480px) and (max-width: 639px)': {
    padding: theme.spacing(3),
    margin: theme.spacing(2, 1.8),
    borderRadius: '22px',
  },
  '@media (min-width: 640px) and (max-width: 767px)': {
    padding: theme.spacing(3.5),
    margin: theme.spacing(2),
    borderRadius: '26px',
    maxWidth: '440px',
  },
  '@media (min-width: 768px)': {
    padding: theme.spacing(4),
    margin: theme.spacing(2.5),
    borderRadius: '30px',
    maxWidth: '460px',
  },
}));

// ----------------------------------------------------------------------

export default function Login() {
  const { t } = useTranslation();
  const { isLogged } = useAuth();
  const router = useRouter();
  const { width } = useResponsive();
  const smUp = width >= 600;

  useEffect(() => {
    if (isLogged) {
      router.replace('/');
    }
  }, [isLogged, router]);

  if (isLogged) {
    return null;
  }

  return (
    <RootStyle>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          mb: { xs: 1.5, sm: 2.5 },
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
              // Responsive sizes via style or className if needed, but style is safer here
              // Emulating the sx responsive logic manually since img isn't MUI
            }}
            className="w-auto h-12 sm:h-16 md:h-[70px] max-w-[130px] sm:max-w-[160px] md:max-w-[180px]"
          />
        </NextLink>
      </Box>

      {/* Glassmorphism Content Container */}
      <GlassContainer>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            mb: 2, 
            textAlign: 'center', 
            fontWeight: 800,
            background: `linear-gradient(135deg, #0063b1 0%, #00a3e0 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            fontSize: {
              xs: '1.4rem',
              sm: '1.6rem',
              md: '1.9rem',
              lg: '2.3rem',
            },
          }}
        >
            Se connecter
          </Typography>
          
          <LoginForm />

          {!smUp && (
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ 
              mt: 3,
              fontSize: { xs: '0.85rem', sm: '0.875rem' },
              color: 'primary.main',
              fontWeight: 600,
            }}
          >
              Pas encore de compte&nbsp;?&nbsp;
            <Link
              component={NextLink}
              href="/auth/register"
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
                  Créez un compte
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
          Pas encore de compte&nbsp;?&nbsp;
          <Link 
            component={NextLink}
            href="/auth/register"
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
            Créez un compte
          </Link>
        </Typography>
      )}
    </RootStyle>
  );
}
