"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Link } from '@mui/material';
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
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#FFFFFF',
        overflowX: 'hidden'
      }}
    >
      {/* ── Left: Image Background ── */}
      <Box
        sx={{
          flex: { xs: 0, md: '0 0 50%', lg: '0 0 701px' },
          minHeight: '100vh',
          position: 'relative',
          backgroundImage: 'url("/assets/images/login background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Typography
          sx={{
            position: 'absolute',
            width: '508px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 400,
            fontSize: { md: '32px', lg: '40px' },
            lineHeight: '140%',
            letterSpacing: '-2%',
            color: '#FFFFFF',
            textAlign: 'left'
          }}
        >
          Contents de vous retrouver !
        </Typography>
      </Box>

      {/* ── Right: Form Section ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          px: 3,
        }}
      >
        <Box 
          sx={{ 
            width: '252.6px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start' 
          }}
        >
          <Typography 
            sx={{ 
              color: '#757575', 
              fontWeight: 600, 
              fontSize: '19.7568px', 
              fontFamily: '"Poppins", sans-serif',
              width: '128px',
              height: '28px',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              mb: '5.64px' 
            }}
          >
            Se connecter
          </Typography>
          <Typography 
            sx={{ 
              color: '#757575', 
              fontSize: '9.87838px', 
              fontWeight: 400,
              fontFamily: '"Poppins", sans-serif',
              width: '125px',
              height: '14px',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              mb: '42.36px' // exact gap to first entry field
            }}
          >
            Heureux de vous retrouver
          </Typography>

          {/* Render the refactored LoginForm component */}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <LoginForm />
          </Box>

          <Typography
            sx={{
              width: '100%',
              mt: 4,
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 400,
              fontSize: '9.88px',
              lineHeight: '140%',
              letterSpacing: '-2%',
              color: '#757575',
              textAlign: 'center'
            }}
          >
            Vous n'avez pas de compte ?{' '}
            <Link
              component={NextLink}
              href="/auth/register"
              sx={{ 
                color: '#5b9eff', 
                textDecoration: 'none', 
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              S'inscrire
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
