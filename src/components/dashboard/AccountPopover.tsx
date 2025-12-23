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
  Badge
} from '@mui/material';
import MenuPopover from '../MenuPopover';
import Iconify from '../Iconify';
import useAuth from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import app from '@/config';

import { useTranslation } from 'react-i18next';

export default function AccountPopover() {
  const { t } = useTranslation();
  const router = useRouter();
  const { auth, clear, logout: authLogout } = useAuth();
  const { isRTL } = useLanguage();

  const MENU_OPTIONS = [
    {
      label: t('common.home'),
      icon: 'eva:home-fill',
      linkTo: '/dashboard',
    },
    {
      label: t('common.profile'),
      icon: 'eva:person-fill',
      linkTo: '/dashboard/profile',
    },
  ];

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
    router.push('/login');
  };

  return (
    <>
      {/* Avatar Button */}
      <IconButton
        onClick={handleOpen}
        sx={{
          p: 0,
          width: 40,
          height: 40,
          ...(open ? {
            '&:before': {
              zIndex: 1,
              content: "''",
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              position: 'absolute',
              bgcolor: (theme) => alpha(theme.palette.grey[900], 0.1),
            },
          } : {}),
        }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: isRTL ? 'left' : 'right' }}
          variant="dot"
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#44b700',
              color: '#44b700',
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
              width: 10,
              height: 10,
              borderRadius: '50%',
            }
          }}
        >
          <Avatar 
            src={(() => {
              const avatar: any = auth?.user?.avatar;
              const base = (app.baseURL || '').replace(/\/$/, '');
              if (!avatar) return '';
              const raw = avatar.fullUrl || avatar.url || avatar.path || avatar.filename || '';
              if (!raw) return '';
              if (/^https?:\/\//i.test(raw)) {
                return raw.replace('http://localhost:3000', base);
              }
              const path = raw.startsWith('/') ? raw : `/${raw}`;
              const finalPath = path.startsWith('/static/') ? path : `/static${path}`;
              return `${base}${finalPath}`;
            })()} 
            alt={(auth?.user as any)?.entreprise || auth?.user?.firstName || t('common.user')}
            sx={{
              width: 40,
              height: 40,
              cursor: 'pointer',
              bgcolor: (theme) => theme.palette.primary.main,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {((auth?.user as any)?.entreprise || auth?.user?.firstName || 'U')?.charAt(0)}
          </Avatar>
        </Badge>
      </IconButton>

      <MenuPopover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleClose}
        sx={{
          p: 0,
          mt: 1.5,
          ml: isRTL ? 0 : 0.75,
          mr: isRTL ? 0.75 : 0,
          width: 220,
          '& .MuiPaper-root': {
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {/* Compact User Header */}
        <Box sx={{ 
          py: 1.5, 
          px: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fafafa'
        }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, fontSize: '14px' }}>
            {(auth?.user as any)?.entreprise || `${auth?.user?.firstName || t('common.user')} ${auth?.user?.lastName || ''}`.trim()}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '12px' }} noWrap>
            {auth?.user?.email || 'user@example.com'}
          </Typography>
        </Box>

        {/* Menu Options */}
        <Box sx={{ py: 0.5 }}>
          {MENU_OPTIONS.map((option) => (
            <MenuItem
              key={option.label}
              component={Link}
              href={option.linkTo}
              onClick={handleClose}
              sx={{ 
                typography: 'body2',
                fontSize: '14px',
                py: 1.25,
                px: 2,
                gap: 1.25,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                }
              }}
            >
              <Iconify 
                icon={option.icon} 
                sx={{ 
                  width: 18, 
                  height: 18,
                  color: 'text.secondary',
                  flexShrink: 0
                }} 
              />
              {option.label}
            </MenuItem>
          ))}
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* Logout */}
        <MenuItem 
          onClick={() => {
            handleClose();
            logout();
          }}
          sx={{ 
            typography: 'body2',
            fontSize: '14px',
            color: 'error.main',
            py: 1.25,
            px: 2,
            gap: 1.25,
            '&:hover': {
              bgcolor: '#fff5f5',
            }
          }}
        >
          <Iconify 
            icon="eva:log-out-fill" 
            sx={{ 
              width: 18, 
              height: 18,
              flexShrink: 0
            }} 
          />
          {t('common.logout')}
        </MenuItem>
      </MenuPopover>
    </>
  );
}
