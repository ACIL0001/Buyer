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
            px: 3,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(24px, 3vw, 40px)',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              color: '#002896',
              textAlign: 'center',
              mb: 1,
            }}
          >
            Choisissez le profil qui correspond à votre utilisation
          </Typography>

          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(14px, 1.5vw, 19.76px)',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              color: '#757575',
              textAlign: 'center',
              mb: 6,
            }}
          >
            Sélectionnez votre type de profil
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 4,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              maxWidth: '1100px',
            }}
          >
            {/* Enterprise Card */}
            <Box
              onClick={() => handleSelectProfile(CLIENT_TYPE.PROFESSIONAL)}
              sx={{
                boxSizing: 'border-box',
                width: { xs: '90%', sm: '400px', md: '500px' },
                height: '355px',
                background: '#FFFFFF',
                border: '1px solid #DBDADE',
                boxShadow: '0px 5px 30px rgba(0, 0, 0, 0.25), 0px 4px 4px rgba(0, 0, 0, 0.25)',
                borderRadius: '35px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                px: '94px',
                gap: 5,
              }}
            >
              <Box sx={{ color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="ph:buildings-bold" width={72} height={72} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: '24px',
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
                width: { xs: '90%', sm: '400px', md: '500px' },
                height: '355px',
                background: '#FFFFFF',
                border: '1px solid #DBDADE',
                boxShadow: '0px 5px 30px rgba(0, 0, 0, 0.25), 0px 4px 4px rgba(0, 0, 0, 0.25)',
                borderRadius: '35px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                px: '103px',
                gap: 5,
              }}
            >
              <Box sx={{ color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="ph:user-bold" width={72} height={72} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: '24px',
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
        <>
          {/* Left Panel: Image (50% of viewport) */}
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
                fontFamily: '"DM Sans", sans-serif',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: 'clamp(24px, 3vw, 40px)',
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                whiteSpace: 'pre-line',
                textAlign: 'center',
              }}
            >
              {`Bienvenue\nCreez votre compte\nMazadclick\net commencez a\nvendre en toute simplicité`}
            </Typography>
          </Box>

          {/* Right Panel: White Form Area */}
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
              overflowY: 'auto',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: '527px',
                px: 3,
                py: 3,
              }}
            >
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
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
                      fontSize: '24px',
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
                    fontSize: '14px',
                    lineHeight: '140%',
                    letterSpacing: '-0.02em',
                    color: '#757575',
                    ml: '34px',
                  }}
                >
                  {selectedProfile === CLIENT_TYPE.PROFESSIONAL ? 'Entreprise' : 'Particulier'}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    height: '33.87px',
                    borderRadius: '25px',
                    backgroundColor: '#FFFFFF',
                    '& fieldset': {
                      border: '0.71px solid #757575',
                      borderRadius: '25px',
                    },
                    '&:hover fieldset': { borderColor: '#002896' },
                    '&.Mui-focused fieldset': { borderColor: '#002896', borderWidth: '0.71px' },
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: '"Poppins", sans-serif',
                    fontSize: '9.87838px',
                    color: '#2D3748',
                    padding: '0 12px',
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
                  fontSize: '9.87838px',
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
        </>
      )}
    </Box>
  );
}
