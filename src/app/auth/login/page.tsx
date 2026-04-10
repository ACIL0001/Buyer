"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Link } from '@mui/material';
import { useTranslation } from 'react-i18next';
import NextLink from 'next/link';
import LoginForm from '../../../sections/auth/login/LoginForm';
import useAuth from '../../../hooks/useAuth';
import { useSettingsStore } from "@/contexts/settingsStore";

// ----------------------------------------------------------------------

export default function Login() {
  const { t } = useTranslation();
  const { logoUrl } = useSettingsStore();
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
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#020b1a',
      }}
    >
      {/* ── Geometric Polygon Background ── */}
      <Box
        component="svg"
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      >
        <defs>
          <radialGradient id="glow1" cx="30%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0a3a8a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#020b1a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow2" cx="75%" cy="35%" r="40%">
            <stop offset="0%" stopColor="#1565c0" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#020b1a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="#020b1a" />
        <rect width="1440" height="900" fill="url(#glow1)" />
        <rect width="1440" height="900" fill="url(#glow2)" />

        {/* Dark polygon facets */}
        <polygon points="0,0 260,0 120,180" fill="#071428" opacity="0.9"/>
        <polygon points="260,0 500,0 380,220 120,180" fill="#0a1e3d" opacity="0.85"/>
        <polygon points="500,0 740,0 620,260 380,220" fill="#061225" opacity="0.9"/>
        <polygon points="740,0 980,0 900,200 620,260" fill="#0c1f40" opacity="0.8"/>
        <polygon points="980,0 1200,0 1100,160 900,200" fill="#071530" opacity="0.9"/>
        <polygon points="1200,0 1440,0 1440,200 1100,160" fill="#0a1c38" opacity="0.85"/>

        <polygon points="0,0 120,180 0,320" fill="#040f22" opacity="0.95"/>
        <polygon points="0,320 120,180 280,380 100,520" fill="#071428" opacity="0.8"/>
        <polygon points="120,180 380,220 320,400 280,380" fill="#0d2248" opacity="0.75"/>
        <polygon points="380,220 620,260 560,440 320,400" fill="#061225" opacity="0.85"/>
        <polygon points="620,260 900,200 860,420 560,440" fill="#091a38" opacity="0.8"/>
        <polygon points="900,200 1100,160 1060,380 860,420" fill="#0b2040" opacity="0.75"/>
        <polygon points="1100,160 1440,200 1440,400 1060,380" fill="#071530" opacity="0.85"/>

        <polygon points="0,320 100,520 0,600" fill="#040d1f" opacity="0.9"/>
        <polygon points="100,520 280,380 360,560 200,680" fill="#071428" opacity="0.8"/>
        <polygon points="280,380 560,440 500,620 360,560" fill="#0a1e3d" opacity="0.85"/>
        <polygon points="560,440 860,420 800,600 500,620" fill="#061530" opacity="0.8"/>
        <polygon points="860,420 1060,380 1020,560 800,600" fill="#0c2244" opacity="0.75"/>
        <polygon points="1060,380 1440,400 1440,580 1020,560" fill="#071428" opacity="0.85"/>

        <polygon points="0,600 200,680 160,800 0,900" fill="#040f22" opacity="0.9"/>
        <polygon points="200,680 360,560 480,720 320,900" fill="#071428" opacity="0.8"/>
        <polygon points="360,560 500,620 440,800 320,900" fill="#0a1c38" opacity="0.85"/>
        <polygon points="500,620 800,600 740,800 440,800" fill="#061225" opacity="0.9"/>
        <polygon points="800,600 1020,560 960,760 740,800" fill="#091a38" opacity="0.8"/>
        <polygon points="1020,560 1440,580 1440,900 960,760" fill="#071428" opacity="0.85"/>
        <polygon points="0,900 160,800 320,900" fill="#040d1f" opacity="0.9"/>
        <polygon points="320,900 440,800 740,800 600,900" fill="#061225" opacity="0.85"/>
        <polygon points="600,900 740,800 960,760 1440,900" fill="#071428" opacity="0.8"/>
      </Box>

      {/* ── Left: Welcome Text ── */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          pl: { md: 8, lg: 12 },
          pr: 4,
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            color: '#ffffff',
            fontSize: { md: '2rem', lg: '2.75rem' },
            fontWeight: 300,
            lineHeight: 1.4,
            fontFamily: "'Inter', 'DM Sans', sans-serif",
          }}
        >
          Contents de vous retrouver !
        </Typography>
      </Box>

      {/* ── Right: Glass Form Card ── */}
      <Box
        sx={{
          width: { xs: '100%', md: '480px', lg: '520px' },
          minWidth: { md: '420px' },
          mx: { xs: 2, sm: 'auto', md: 0 },
          mr: { md: 8, lg: 12 },
          zIndex: 2,
          backgroundColor: 'rgba(10, 25, 58, 0.65)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          p: { xs: 3, sm: 4 },
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
          <NextLink href="/" passHref>
            <Box component="img"
              src={logoUrl || "/assets/img/logo.png"}
              alt="MazadClick"
              sx={{ height: '40px', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
          </NextLink>
        </Box>

        {/* Title */}
        <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.6rem', mb: 0.5, fontFamily: "'Inter', sans-serif" }}>
          Se connecter
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', mb: 3.5 }}>
          Heureux de vous retrouver
        </Typography>

        {/* Form (dark-themed via CSS vars override) */}
        <Box
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: '10px',
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
              '&.Mui-focused fieldset': { borderColor: '#1a6ef6', borderWidth: '1.5px' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#6fa8ff' },
            '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.3)' },
            '& .MuiInputAdornment-root svg': { color: 'rgba(255,255,255,0.4)' },
            '& .MuiIconButton-root': { color: 'rgba(255,255,255,0.5)' },
            '& .MuiFormHelperText-root': { color: '#ff8a80' },
            '& .MuiAlert-root': {
              backgroundColor: 'rgba(211,47,47,0.15)',
              color: '#ff8a80',
              border: '1px solid rgba(211,47,47,0.3)',
              borderRadius: '10px',
            },
            '& .MuiLoadingButton-root': {
              background: 'linear-gradient(135deg, #1a6ef6 0%, #0d47a1 100%)',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 700,
              py: 1.4,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(26,110,246,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2979ff 0%, #1565c0 100%)',
                boxShadow: '0 12px 32px rgba(26,110,246,0.5)',
                transform: 'translateY(-1px)',
              },
            },
            '& .MuiLink-root': { color: '#5b9eff', fontWeight: 500 },
          }}
        >
          <LoginForm />
        </Box>

        {/* Footer link */}
        <Typography
          variant="body2"
          align="center"
          sx={{ mt: 3, color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}
        >
          Vous n'avez pas de compte ?{' '}
          <Link
            component={NextLink}
            href="/auth/register"
            sx={{ color: '#5b9eff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Se connecter
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
