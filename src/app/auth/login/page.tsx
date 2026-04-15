"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Link } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import NextLink from 'next/link';
import LoginForm from '../../../sections/auth/login/LoginForm';
import useAuth from '../../../hooks/useAuth';

// ----------------------------------------------------------------------

export default function Login() {
  const { isLogged, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLogged) {
      sessionStorage.removeItem('profile_note_shown_session');
      const loginCount = user?.loginCount ?? 0;
      if (loginCount <= 5) {
        router.replace('/profile');
      } else {
        router.replace('/');
      }
    }
  }, [isLogged, router, user?.loginCount]);

  if (isLogged) return null;

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* ── Left Section: Background Image ── */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          backgroundImage: 'url("/assets/images/login background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4
        }}
      >
        <Typography
          sx={{
            width: '100%',
            maxWidth: '508px',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 400,
            fontSize: { md: '32px', lg: '40px' },
            lineHeight: '140%',
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            textAlign: 'left',
            zIndex: 1,
          }}
        >
          Content de vous retrouver !
        </Typography>
      </Box>

      {/* ── Right Section: Login Form area ── */}
      <Box 
        sx={{ 
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          px: { xs: 3, md: 4 },
          // Use height-based logic for all screen widths
          justifyContent: 'flex-start',
          pt: '244px', 
          
          '@media (max-height: 830px)': {
            pt: '140px'
          },
          '@media (max-height: 700px)': {
            pt: '40px',
            justifyContent: 'center'
          },
          overflowY: 'auto',
          minHeight: '100vh'
        }}
      >
        {/* Form Group container */}
        <Box 
          sx={{ 
            width: '100%',
            maxWidth: '400px', // Responsive best practice
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Heading Group */}
          <Box sx={{ mb: '32px' }}>
            <Typography 
              sx={{ 
                width: '128px',
                height: '28px',
                color: 'rgba(117, 117, 117, 1)', 
                fontWeight: 600, 
                fontSize: '19.76px', 
                fontFamily: '"Poppins", sans-serif',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                mb: '5.64px'
              }}
            >
              Se connecter
            </Typography>
            <Typography 
              sx={{ 
                width: '125px',
                height: '14px',
                color: 'rgba(117, 117, 117, 1)', 
                fontSize: '9.88px', 
                fontWeight: 400,
                fontFamily: '"Poppins", sans-serif',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
              }}
            >
              Heureux de vous retrouver
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ width: '100%' }}>
            <LoginForm />
          </Box>

          {/* Footer Link */}
          <Typography
            sx={{
              mt: { 
                xs: '32px', 
                md: '287px' // 621 (link top) - 334 (form top) = 287px
              }, 
              '@media (max-height: 800px)': {
                mt: '40px' // Pull up on shorter screens
              },
              width: { xs: 'auto', md: '202px' },
              height: '14px',
              fontSize: '9.88px',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 400,
              color: '#757575',
              lineHeight: '140%',
              letterSpacing: '-0.02em', // -2%
              textAlign: 'left',
              ml: { md: '46px' }, // 979 (link left) - 933 (form container left) = 46px
              opacity: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', md: 'flex-start' },
              whiteSpace: 'nowrap'
            }}
          >
            Pas encore de compte ?{' '}
            <Link 
              component={NextLink} 
              href="/auth/register" 
              sx={{ 
                fontWeight: 600, 
                color: '#007AFF', 
                fontSize: '9.88px',
                fontFamily: '"Poppins", sans-serif',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                ml: 0.5,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Créer un compte
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
