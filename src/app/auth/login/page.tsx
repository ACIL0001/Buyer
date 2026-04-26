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
        height: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* ── Left Section: Background Image (50% of viewport) ── */}
      <Box
        sx={{
          width: '50%',
          minWidth: '50%',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src="/assets/images/login background.jpg"
          alt="Background"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '548px',
            height: '320px',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.32) 0%, transparent 75%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        <Typography
          sx={{
            position: 'absolute',
            width: '80%',
            maxWidth: '508px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            fontFamily: '"Poppins", sans-serif',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: 'clamp(24px, 3vw, 40px)',
            lineHeight: '140%',
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          Content de vous retrouver !
        </Typography>
      </Box>

      {/* ── Right Section: Form ── */}
      <Box
        sx={{
          flex: 1,
          height: '100vh',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '340px',
            px: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {/* Header Texts */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#757575',
              }}
            >
              Se connecter
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#757575',
                mt: 0.5,
              }}
            >
              Heureux de vous retrouver
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ width: '100%' }}>
            <LoginForm />
          </Box>

          {/* Footer Texts */}
          <Box
            sx={{
              mt: 3,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#757575',
                whiteSpace: 'nowrap',
              }}
            >
              Vous n'avez pas de compte ?
            </Typography>
            <Link
              component={NextLink}
              href="/auth/register"
              sx={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#007AFF',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              S'inscrire
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
