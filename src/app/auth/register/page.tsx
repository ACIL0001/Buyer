"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Link } from '@mui/material';
import NextLink from 'next/link';
import RegisterForm from '../../../sections/auth/register/RegisterForm';
import useAuth from '../../../hooks/useAuth';

// ----------------------------------------------------------------------

export default function Register() {
  const { isLogged } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLogged) {
      router.replace('/');
    }
  }, [isLogged, router]);

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
      }}
    >
      {/* ── Left: Background Image Panel (701px) ── */}
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
        {/* Background image — Figma: width 701, height 848, angle 0 deg, opacity 1 */}
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
        {/* Subtle shadow under text for legibility */}
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

        {/* Welcome Text — Figma: position absolute, width 508px, height 280px, left 157px, top 270px */}
        <Typography
          sx={{
            position: 'absolute',
            width: '508px',
            height: '280px',
            left: '157px',
            top: '270px',
            zIndex: 2,
            fontFamily: '"DM Sans", sans-serif',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '40px',
            lineHeight: '140%',
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            whiteSpace: 'pre-line',
          }}
        >
          {`Bienvenue\nCreez votre compte\nMazadclick\net commencez a\nvendre en toute simplicité`}
        </Typography>
      </Box>

      {/* ── Right: White Form Area ── */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          position: 'relative',
          overflowY: 'auto',
          px: 0,
        }}
      >
        {/* Inner container anchored from left edge of right panel */}
        {/* Figma: form group left: 839px from page edge → 839 - 701 = 138px from right panel edge */}
        <Box
          sx={{
            width: '527.79px',
            ml: '138px',
            py: '20px',
          }}
        >
          {/* Title Group — top: 157px from page → top of right section */}
          <Box
            sx={{
              width: '164px',
              mt: '24px',
              mb: '32px', // gap between title and first field row (245.91 - 157 - 47.64 ≈ 41px)
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 600,
                fontSize: '19.7568px',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#757575',
                width: '164px',
                mb: '5.64px',
              }}
            >
              Creer un compte
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 400,
                fontSize: '9.87838px',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#757575',
                width: '126px',
              }}
            >
              Entreprise ou indépendant
            </Typography>
          </Box>

          {/* RegisterForm — all logic/validation/API preserved */}
          <Box
            sx={{
              width: '527.79px',
              // Override MUI defaults to match the Figma white-bg style
              '& .MuiOutlinedInput-root': {
                height: '33.87px',
                borderRadius: '3.52799px',
                backgroundColor: '#FFFFFF',
                '& fieldset': {
                  border: '0.705598px solid #757575',
                  borderRadius: '3.52799px',
                },
                '&:hover fieldset': { borderColor: '#002896' },
                '&.Mui-focused fieldset': { borderColor: '#002896', borderWidth: '0.705598px' },
              },
              '& .MuiInputBase-input': {
                fontFamily: '"Poppins", sans-serif',
                fontSize: '9.87838px',
                color: '#2D3748',
                padding: '0 12px',
              },
              '& .MuiInputBase-input::placeholder': { color: '#757575', opacity: 1 },
              '& .MuiInputLabel-root': {
                fontFamily: '"Poppins", sans-serif',
                fontSize: '9.87838px',
                color: '#757575',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#002896' },
              '& .MuiFormHelperText-root': { fontSize: '8px', color: '#d32f2f' },
              '& .MuiLoadingButton-root': {
                width: '252.6px',
                height: '33.87px',
                borderRadius: '3.52799px',
                background: '#002896',
                color: '#FFFFFF',
                textTransform: 'none',
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 600,
                fontSize: '9.87838px',
                lineHeight: '15px',
                letterSpacing: '-0.02em',
                boxShadow: 'none',
                '&:hover': { background: '#001b69', boxShadow: 'none' },
              },
              '& .MuiCheckbox-root': { p: 0, color: '#757575' },
              '& .MuiFormControlLabel-label': {
                fontFamily: '"Poppins", sans-serif',
                fontSize: '9.87838px',
                color: '#757575',
                letterSpacing: '-0.02em',
              },
              '& .MuiLink-root': {
                fontFamily: '"Poppins", sans-serif',
                fontSize: '9.87838px',
                color: '#007AFF',
                letterSpacing: '-0.02em',
              },
              '& .MuiAlert-root': {
                borderRadius: '3.52799px',
                fontSize: '9px',
              },

            }}
          >
            <RegisterForm />
          </Box>

          {/* Footer: "Vous avez déjà un compte ?" */}
          {/* Figma: left: 1030.92px from page → 1030.92 - 701 = 329.92px from right panel left edge */}
          {/* Simplified: centered under the form */}
          <Typography
            sx={{
              mt: '28px',
              width: '202px',
              height: '14px',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 400,
              fontSize: '9.87838px',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              color: '#757575',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              ml: '191.92px', // 1030.92 - 839 = 191.92px from form left
            }}
          >
            Vous avez déjà un compte ?{' '}
            <Link
              component={NextLink}
              href="/auth/login"
              sx={{
                color: '#007AFF',
                fontWeight: 400,
                textDecoration: 'none',
                fontSize: '9.87838px',
                fontFamily: '"Poppins", sans-serif',
                letterSpacing: '-0.02em',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Se connecter
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
