"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Link, IconButton } from '@mui/material';
import NextLink from 'next/link';
import RegisterForm from '../../../sections/auth/register/RegisterForm';
import useAuth from '../../../hooks/useAuth';
import Iconify from '../../../components/Iconify';
import { CLIENT_TYPE } from '../../../types/User';

// ----------------------------------------------------------------------

export default function Register() {
  const { isLogged } = useAuth();
  const router = useRouter();

  // Step 0: Selection, Step 1: Form
  const [step, setStep] = React.useState(0);
  const [selectedProfile, setSelectedProfile] = React.useState<CLIENT_TYPE | null>(null);

  useEffect(() => {
    if (isLogged) {
      router.replace('/');
    }
  }, [isLogged, router]);

  if (isLogged) return null;

  const handleSelectProfile = (profile: CLIENT_TYPE) => {
    setSelectedProfile(profile);
    setStep(1);
  };

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
        justifyContent: step === 0 ? 'center' : 'flex-start',
        alignItems: 'stretch',
      }}
    >
      {step === 0 ? (
        /* ── STEP 0: FULL SCREEN PROFILE SELECTION ── */
        <Box 
          sx={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#FFFFFF', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            py: 4,
            overflowY: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6, px: 2, textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 700,
                fontSize: { xs: '28px', md: '40px' },
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#002896',
                mb: 2,
                maxWidth: '1022px'
              }}
            >
              Choisissez le profil qui correspond à votre utilisation
            </Typography>

            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: '19.7568px',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#757575',
              }}
            >
              Sélectionnez votre type de profil
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 }, px: 2, width: '100%', maxWidth: '1100px', justifyContent: 'center' }}>
            {/* Enterprise Card */}
            <Box
              onClick={() => handleSelectProfile(CLIENT_TYPE.PROFESSIONAL)}
              sx={{
                boxSizing: 'border-box',
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                aspectRatio: '500 / 355',
                background: '#FFFFFF',
                border: '1px solid #DBDADE',
                boxShadow: '0px 5px 30px rgba(0, 0, 0, 0.25), 0px 4px 4px rgba(0, 0, 0, 0.25)',
                borderRadius: '35px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: 'clamp(20px, 5vw, 94px) clamp(20px, 5vw, 94px)',
                gap: 'clamp(16px, 3vw, 36px)',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              <Box
                sx={{
                  width: 'clamp(64px, 12vw, 100px)',
                  height: 'clamp(64px, 12vw, 100px)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box component="img" src="/assets/images/company.svg" sx={{ width: '100%', height: '100%' }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                  lineHeight: '140%',
                  letterSpacing: '-0.02em',
                  color: '#757575',
                }}
              >
                Je suis une entreprise
              </Typography>
            </Box>

            {/* Individual Card (Particulier) */}
            <Box
              onClick={() => handleSelectProfile(CLIENT_TYPE.CLIENT)}
              sx={{
                boxSizing: 'border-box',
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                aspectRatio: '500 / 355',
                background: '#FFFFFF',
                border: '1px solid #DBDADE',
                boxShadow: '0px 5px 30px rgba(0, 0, 0, 0.25), 0px 4px 4px rgba(0, 0, 0, 0.25)',
                borderRadius: '35px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: 'clamp(20px, 5vw, 94px) clamp(20px, 5vw, 94px)',
                gap: 'clamp(16px, 3vw, 36px)',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              <Box
                sx={{
                  width: 'clamp(64px, 12vw, 100px)',
                  height: 'clamp(64px, 12vw, 100px)',
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box component="img" src="/assets/images/businessman.svg" sx={{ width: '100%', height: '100%' }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                  lineHeight: '140%',
                  letterSpacing: '-0.02em',
                  color: '#757575',
                }}
              >
                Je suis un particulier
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        /* ── STEP 1: REGISTRATION FORM WITH BACKGROUND IMAGE ── */
        <Box 
          sx={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#FFFFFF', 
            display: 'flex', 
            flexDirection: 'row', 
          }}
        >
          {/* Left Panel: Image */}
          <Box
            sx={{
              width: { xs: '0', md: '50%', lg: '55%', xl: '701px' },
              minWidth: { xs: 0, md: '320px' },
              maxWidth: { xl: '701px' },
              height: '100%',
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
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(0deg)',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                opacity: 1,
                display: 'block',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: 'clamp(24px, 8vw, 137px)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 'clamp(280px, 60%, 548px)',
                aspectRatio: '548 / 320',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.32) 0%, transparent 75%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            <Typography
              sx={{
                position: 'absolute',
                maxWidth: 'min(508px, 75%)',
                left: 'clamp(20px, 6vw, 97px)',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                whiteSpace: 'pre-line',
              }}
            >
              Bienvenue{'\n'}
              Creez votre compte{'\n'}
              <Box component="span" sx={{ fontWeight: 700 }}>Mazadclick</Box>{'\n'}
              et commencez a{'\n'}
              vendre en toute simplicité
            </Typography>
          </Box>

          {/* Right Panel: White Form Area */}
          <Box
            sx={{
              flex: 1,
              height: '100%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflowY: 'auto',
              px: { xs: 2, sm: 4, md: 4 },
              py: { xs: 4, md: 0 },
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: '640px',
                py: '20px',
              }}
            >
              <Box
                sx={{
                  mt: '24px',
                  mb: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={() => setStep(0)} size="small" sx={{ color: '#002896', ml: -1 }}>
                     <Iconify icon="eva:arrow-back-fill" />
                  </IconButton>
                  <Typography
                    sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 600,
                      fontSize: '30px',
                      lineHeight: '140%',
                      letterSpacing: '-0.02em',
                      color: '#757575',
                    }}
                  >
                    Creer un compte
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '140%',
                    letterSpacing: '-0.02em',
                    color: '#757575',
                    ml: '34px'
                  }}
                >
                  {selectedProfile === CLIENT_TYPE.PROFESSIONAL ? 'Entreprise' : 'Particulier'}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    borderRadius: '25px',
                    backgroundColor: '#FFFFFF',
                    '& fieldset': {
                      border: '1px solid #757575',
                      borderRadius: '25px',
                    },
                    '&:hover fieldset': { borderColor: '#002896' },
                    '&.Mui-focused fieldset': { borderColor: '#002896', borderWidth: '1px' },
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: '13px',
                    color: '#2D3748',
                    padding: '0 14px',
                  },
                  '& .MuiInputBase-input::placeholder': { color: '#757575', opacity: 1 },
                }}
              >
                <RegisterForm profileType={selectedProfile || undefined} />
              </Box>

              <Typography
                sx={{
                  mt: '28px',
                  width: '100%',
                  fontFamily: '"Poppins", sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '140%',
                  letterSpacing: '-0.02em',
                  color: '#757575',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
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
                    fontSize: '14px',
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
      )}
    </Box>
  );
}
