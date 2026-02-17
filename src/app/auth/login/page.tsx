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
  justifyContent: 'flex-start',
  position: 'relative',
  background: theme.palette.common.white,
  padding: theme.spacing(3, 0),
  paddingTop: '40px',
  '@media (max-width: 599px)': {
    paddingTop: '20px',
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
  maxWidth: '560px',
  width: '100%',
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
    maxWidth: '520px',
  },
  '@media (min-width: 768px)': {
    padding: theme.spacing(4),
    margin: theme.spacing(2.5),
    borderRadius: '30px',
    maxWidth: '560px',
  },
}));

// ----------------------------------------------------------------------

export default function Login() {
  const { t } = useTranslation();
  const { isLogged, user } = useAuth();
  const router = useRouter();
  const { width } = useResponsive();
  const smUp = width >= 600;


  useEffect(() => {
    if (isLogged) {
        console.log('🔐 ===== LOGIN SUCCESS - REDIRECT LOGIC =====');
        console.log('💾 Before clear - SessionStorage:', {
            profile_note_shown: sessionStorage.getItem('profile_note_shown_session'),
        });
        
        // Clear session storage so profile notice shows fresh on this login
        sessionStorage.removeItem('profile_note_shown_session');
        
        console.log('💾 After clear - SessionStorage:', {
            profile_note_shown: sessionStorage.getItem('profile_note_shown_session'),
            cleared: sessionStorage.getItem('profile_note_shown_session') === null
        });
        
        // First 5 logins: redirect to profile page to encourage profile completion
        // After 5 logins: redirect to home page
        const loginCount = user?.loginCount ?? 0;
        
        console.log('🔄 Login redirect logic:', { 
            loginCount, 
            isUndefined: user?.loginCount === undefined,
            redirectTo: loginCount <= 5 ? '/profile' : '/' 
        });
        
        if (loginCount <= 5) {
            console.log('➡️ Redirecting to /profile (loginCount <= 5)');
            router.replace('/profile');
        } else {
            console.log('➡️ Redirecting to / (loginCount > 5)');
            router.replace('/');
        }
    }
  }, [isLogged, router, user?.loginCount]);

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
            mb: 3, 
            textAlign: 'center', 
            fontWeight: 800,
            background: `linear-gradient(135deg, #0063b1 0%, #00a3e0 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            fontSize: {
              xs: '1.25rem',
              sm: '1.45rem',
              md: '1.75rem',
              lg: '2.0rem',
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

          {/* Secure Vault Message */}
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: '12px',
                background: (theme) => alpha(theme.palette.success.main, 0.08),
                border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
              }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ color: '#2e7d32' }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <Typography
                variant="caption"
                sx={{
                  color: 'success.main',
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  letterSpacing: '0.01em',
                }}
              >
                LOGICIEL SÉCURISÉ
              </Typography>
            </Box>
            
            <Typography
              variant="caption"
              align="center"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.78rem', sm: '0.82rem' },
                lineHeight: 1.6,
                maxWidth: '320px',
                fontWeight: 500,
                fontStyle: 'italic',
                '& span': {
                    color: 'primary.main',
                    fontWeight: 700,
                }
              }}
            >
              "Nous veillons à utiliser le <span>coffre-fort sécurisé intégré</span> du téléphone pour protéger vos données."
            </Typography>
          </Box>
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
