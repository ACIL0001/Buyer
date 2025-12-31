import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import { 
  Box, 
  Divider, 
  Typography, 
  MenuItem, 
  Avatar, 
  IconButton, 
  Badge,
  Button
} from '@mui/material';
import MenuPopover from '../MenuPopover';
import Iconify from '../Iconify';
import useAuth from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import app from '@/config';

import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export default function AccountPopover() {
  const { t } = useTranslation();
  const router = useRouter();
  const { auth, clear, logout: authLogout } = useAuth();
  const { isRTL } = useLanguage();

  const [open, setOpen] = useState(null);

  const handleOpen = (event: any) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  const logout = () => {
    if (authLogout) authLogout();
    else clear();
    // Use window.location to force a full refresh and clear state
    const loginUrl = `${app.baseURL.replace(/\/$/, '')}/auth/login`; // Assuming app.baseURL points to API, usually we want the frontend URL.
    // Fallback to local hardcoded if config invalid for frontend redirect
    // Better to use router if it's the same app
    router.push('/auth/login');
  };

  // Helper to get consistent avatar URL
  const getAvatarUrl = () => {
    if (!auth?.user) return '';

    // Priority 1: photoURL
    const photoURL = auth.user?.photoURL;
    if (photoURL && photoURL.trim() !== '') {
        let url = photoURL.trim();
        if (url.includes('&') && !url.includes('?')) {
            url = url.replace('&', '?');
        }
        if (url.startsWith('http://localhost')) {
            const apiBase = app.baseURL.replace(/\/$/, '');
            url = url.replace(/http:\/\/localhost:3000/g, apiBase)
                    .replace(/http:\/\/localhost/g, apiBase);
             return url;
        }
        if (url.startsWith('/static/')) {
            return `${app.baseURL.replace(/\/$/, '')}${url}`;
        }
        if (url.startsWith('/')) {
            return `${app.baseURL.replace(/\/$/, '')}/static${url}`;
        }
        if (!url.startsWith('http')) {
            return `${app.baseURL.replace(/\/$/, '')}/static/${url}`;
        }
        // Handle legacy api.mazad.click URLs
        if (url.startsWith('https://api.mazad.click')) {
            return url.replace('https://api.mazad.click', app.baseURL.replace(/\/$/, ''));
        }
        return url;
    }

    // Priority 2: avatar string (from registration)
    const avatar = auth.user?.avatar as any;
    if (typeof avatar === 'string' && avatar.trim() !== '') {
        let avatarUrl;
        if (avatar.startsWith('http')) {
                avatarUrl = avatar
                .replace('http://localhost:3000', app.baseURL.replace(/\/$/, ''))
                .replace('https://api.mazad.click', app.baseURL.replace(/\/$/, ''));
        } else if (avatar.startsWith('/static/')) {
            avatarUrl = `${app.baseURL.replace(/\/$/, '')}${avatar}`;
        } else if (avatar.startsWith('/')) {
            avatarUrl = `${app.baseURL.replace(/\/$/, '')}/static${avatar}`;
        } else {
            avatarUrl = `${app.baseURL.replace(/\/$/, '')}/static/${avatar}`;
        }
        return avatarUrl;
    }

    // Priority 3: avatar object
    if (auth.user?.avatar && typeof auth.user.avatar === 'object') {
        const avatarObj = auth.user.avatar as any;
        if (avatarObj.fullUrl) {
            let fullUrl = avatarObj.fullUrl;
            if (fullUrl.includes('localhost')) {
                fullUrl = fullUrl.replace(/http:\/\/localhost:3000/g, app.baseURL.replace(/\/$/, ''))
                                 .replace(/http:\/\/localhost/g, app.baseURL.replace(/\/$/, ''));
            }
            return fullUrl;
        }
        
        if (avatarObj.url) {
            if (avatarObj.url.includes('localhost')) {
                return avatarObj.url.replace(/http:\/\/localhost:3000/g, app.baseURL.replace(/\/$/, ''))
                                    .replace(/http:\/\/localhost/g, app.baseURL.replace(/\/$/, ''));
            }
            const path = avatarObj.url.startsWith('/') ? avatarObj.url : `/${avatarObj.url}`;
            const finalPath = path.startsWith('/static/') ? path : `/static${path}`;
            return `${app.baseURL.replace(/\/$/, '')}${finalPath}`;
        }
        
        if (avatarObj.filename) {
            return `${app.baseURL.replace(/\/$/, '')}/static/${avatarObj.filename}`;
        }
    }

    return '';
  };

  const userDisplayName = (auth?.user as any)?.socialReason || (auth?.user as any)?.entreprise || `${auth?.user?.firstName || t('common.user')} ${auth?.user?.lastName || ''}`.trim();
  const userEmail = auth?.user?.email || 'user@example.com';
  const avatarUrl = getAvatarUrl();
  const userInitial = (auth?.user?.firstName?.[0] || 'U').toUpperCase();

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          p: 0,
          width: 44,
          height: 44,
          border: (theme) => `2px solid ${open ? theme.palette.primary.main : 'transparent'}`,
          transition: 'all 0.2s ease',
          ...(Boolean(open) ? {
            transform: 'scale(1.05)',
             boxShadow: (theme: any) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
          } : {}),
        }}
      >
        <Avatar
          src={avatarUrl}
          alt={userDisplayName}
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'transparent',
            fontSize: '1.1rem',
            fontWeight: 700,
          }}
        >
          {userInitial}
        </Avatar>
      </IconButton>

      <MenuPopover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleClose}
        sx={{
          p: 1,
          mt: 1.5,
          ml: 0.75,
          width: 230,
          '& .MuiPaper-root': {
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.04)',
            overflow: 'hidden'
          },
        }}
      >
        {/* User Info Header - Compact */}
        <Box sx={{ 
          p: 1.5,
          mb: 0.5,
          background: 'linear-gradient(to right, #f8f9fa, #ffffff)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <Avatar 
            src={avatarUrl} 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'transparent',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
             {userInitial}
          </Avatar>
          
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
              {userDisplayName}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {userEmail}
            </Typography>
          </Box>
        </Box>

        {/* Menu Options */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Home Link */}
          <MenuItem
            component={Link}
            href="/"
            onClick={handleClose}
            sx={{ 
              p: 1,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              color: 'text.primary',
              textDecoration: 'none',
              minHeight: '40px',
              '&:hover': {
                bgcolor: '#f0f7ff',
                color: 'primary.main',
                transform: 'translateX(3px)'
              }
            }}
          >
            <Box sx={{ 
              mr: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '6px',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main'
            }}>
              <Iconify icon="eva:home-fill" width={18} height={18} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {t('common.home')}
            </Typography>
          </MenuItem>

          {/* Profile Link */}
          <MenuItem
            component={Link}
            href="/profile"
            onClick={handleClose}
            sx={{ 
              p: 1,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              color: 'text.primary',
              textDecoration: 'none',
              minHeight: '40px',
              '&:hover': {
                bgcolor: '#f0f7ff',
                color: 'primary.main',
                transform: 'translateX(3px)'
              }
            }}
          >
            <Box sx={{ 
              mr: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '6px',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main'
            }}>
              <Iconify icon="eva:person-fill" width={18} height={18} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {t('common.profile')}
            </Typography>
          </MenuItem>
        </Box>

        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

        {/* Logout */}
        <MenuItem 
          onClick={() => {
            handleClose();
            logout();
          }}
          sx={{ 
            p: 1,
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            color: 'error.main',
            minHeight: '40px',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
              transform: 'translateX(3px)'
            }
          }}
        >
          <Box sx={{ 
            mr: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '6px',
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
            color: 'error.main'
          }}>
            <Iconify icon="eva:log-out-fill" width={18} height={18} />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
             {t('common.logout')}
          </Typography>
        </MenuItem>
      </MenuPopover>
    </>
  );
}
