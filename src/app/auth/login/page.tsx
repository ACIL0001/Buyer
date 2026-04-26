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
        position: 'relative',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      <Box sx={{ position: 'relative', width: '1438px', height: '848px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'row' }}>
        
        {/* ── Left Section: Background Image (701px) ── */}
        <Box
          sx={{
            width: '701px',
            minWidth: '701px',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
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
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(0deg)',
              width: '701px',
              height: '848px',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: 1,
              display: 'block',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: '137px',
              top: '250px',
              width: '548px',
              height: '320px',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.32) 0%, transparent 75%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
          <Typography
            sx={{
              position: 'absolute',
              width: '508px',
              height: '56px',
              left: '97px',
              top: '398px',
              zIndex: 2,
              fontFamily: '"Poppins", sans-serif',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '40px',
              lineHeight: '140%',
              letterSpacing: '-0.02em', // Equivalent to -2%
              color: '#FFFFFF',
              opacity: 1,
            }}
          >
            Content de vous retrouver !
          </Typography>
        </Box>

        {/* ── Right Section: Absolute Form Box ── */}
        <Box sx={{ flex: 1, position: 'relative', backgroundColor: '#FFFFFF' }}>
          
          {/* Header Texts */}
          <Box sx={{ position: 'absolute', left: '230px', top: '198px', width: '178px', height: '70px' }}>
            <Typography 
               sx={{ 
                 position: 'absolute',
                 left: '0%',
                 top: '0%',
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
                 position: 'absolute',
                 left: '0%',
                 bottom: '0%',
                 fontFamily: '"Poppins", sans-serif',
                 fontWeight: 400,
                 fontSize: '14px',
                 lineHeight: '140%',
                 letterSpacing: '-0.02em',
                 color: '#757575',
               }}
            >
              Heureux de vous retrouver
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
            <LoginForm />
          </Box>

          {/* Footer Texts */}
          <Typography
            sx={{
              position: 'absolute',
              width: '170px',
              height: '17px',
              left: '246px',
              top: '620px',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              color: '#757575',
              whiteSpace: 'nowrap'
            }}
          >
            Vous n’avez pas de compte ?
          </Typography>
          <Link
            component={NextLink}
            href="/auth/register"
            sx={{
              position: 'absolute',
              width: '52px',
              height: '17px',
              left: '428px',
              top: '620px',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              color: '#007AFF',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            S’inscrire
          </Link>

        </Box>
      </Box>
    </Box>
  );
}
