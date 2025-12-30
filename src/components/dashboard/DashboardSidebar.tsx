import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Drawer, Typography, Avatar, useMediaQuery, useTheme, alpha, Chip } from '@mui/material';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import NavSection from './NavSection';
import useNavConfig from './NavConfig';
import useAuth from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

const DRAWER_WIDTH = 280;

// ... other imports
import app, { getFrontendUrl } from '@/config';
import { CLIENT_TYPE } from '@/types/User';

// ... (previous imports)

// Helper function to get avatar URL (reused from Header/Profile)
const getAvatarUrl = (user: any) => {
    if (!user) return '';

    // Priority 1: photoURL
    const photoURL = user?.photoURL;
    if (photoURL && photoURL.trim() !== '') {
        let url = photoURL.trim();
        if (url.includes('&') && !url.includes('?')) {
            url = url.replace('&', '?');
        }
        if (url.startsWith('http://localhost:3000')) {
            return url.replace('http://localhost:3000', app.baseURL.replace(/\/$/, ''));
        }
        if (url.startsWith('http://localhost/')) {
            return url.replace('http://localhost', app.baseURL.replace(/\/$/, ''));
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
        // Handle legacy api.mazad.click URLs in photoURL
        if (url.startsWith('https://api.mazad.click')) {
            return url.replace('https://api.mazad.click', app.baseURL.replace(/\/$/, ''));
        }
        return url;
    }

    // Priority 2: avatar string (from registration)
    const avatar = user?.avatar;
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
    if (avatar) {
        if (avatar.fullUrl) {
        let fullUrl = avatar.fullUrl;
        if (fullUrl.startsWith('http://localhost:3000')) {
            fullUrl = fullUrl.replace('http://localhost:3000', app.baseURL.replace(/\/$/, ''));
        }
        return fullUrl;
        }
        
        if (avatar.url) {
        if (avatar.url.startsWith('http')) {
            return avatar.url.replace('http://localhost:3000', app.baseURL.replace(/\/$/, ''));
        }
        const path = avatar.url.startsWith('/') ? avatar.url : `/${avatar.url}`;
        const finalPath = path.startsWith('/static/') ? path : `/static${path}`;
        return `${app.baseURL.replace(/\/$/, '')}${finalPath}`;
        }
        
        if (avatar.filename) {
        return `${app.baseURL.replace(/\/$/, '')}/static/${avatar.filename}`;
        }
    }

    return '';
};

export default function DashboardSidebar({ isOpenSidebar, onCloseSidebar }: { isOpenSidebar: boolean, onCloseSidebar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { auth } = useAuth();
  const user = auth?.user;
  const navConfig = useNavConfig();
  const { isRTL } = useLanguage();

  useEffect(() => {
    if (isOpenSidebar) {
      onCloseSidebar();
    }
  }, [pathname]);

  const renderContent = (
    <SimpleBar style={{ maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2.5, py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Logo - Click to go to home page */}
         <Box 
            component="img" 
            src="/assets/logo.black.png" 
            sx={{ 
              width: 140, 
              height: 'auto', 
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': {
                opacity: 0.8
              }
            }}
            alt="MazadClick"
            onClick={() => router.push(getFrontendUrl())}
         />
      </Box>

      <Box sx={{ mb: 5, mx: 2.5 }}>
         <Box sx={{ 
             display: 'flex', 
             alignItems: 'center', 
             p: 2, 
             borderRadius: 2.5,
             bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
             border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
         }}>
             <Avatar 
                src={getAvatarUrl(user)} 
                alt={(user as any)?.entreprise || user?.firstName || 'User'}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'transparent',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  border: (theme) => `2px solid ${theme.palette.background.paper}`,
                  boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
            >
                {((user as any)?.entreprise || user?.firstName || 'U')?.charAt(0).toUpperCase()}
            </Avatar>
             <Box sx={{ ml: isRTL ? 0 : 2, mr: isRTL ? 2 : 0, flex: 1, minWidth: 0 }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                     <Typography 
                       variant="subtitle2" 
                       sx={{ 
                         color: 'text.primary', 
                         fontWeight: 600,
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         whiteSpace: 'nowrap',
                       }}
                     >
                         {(user as any)?.socialReason || (user as any)?.entreprise || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                     </Typography>
                     {user?.type === CLIENT_TYPE.PROFESSIONAL && (
                       <Chip 
                         label="PRO" 
                         size="small" 
                         sx={{ 
                           height: 20,
                           fontSize: '0.65rem',
                           fontWeight: 700,
                           bgcolor: (theme) => theme.palette.primary.main,
                           color: 'white',
                           '& .MuiChip-label': {
                             px: 1,
                           }
                         }} 
                       />
                     )}
                 </Box>
                 <Typography 
                   variant="body2" 
                   sx={{ 
                     color: 'text.secondary',
                     fontSize: '0.8125rem',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     whiteSpace: 'nowrap',
                   }}
                 >
                     {user?.email || 'user@example.com'}
                 </Typography>
             </Box>
         </Box>
      </Box>

      <NavSection navConfig={navConfig} />
    </SimpleBar>
  );

  return (
    <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
      {isDesktop ? (
        <Drawer
          open
          variant="permanent"
          anchor={isRTL ? 'right' : 'left'}
          PaperProps={{
            sx: {
              width: DRAWER_WIDTH,
              bgcolor: 'background.default',
              borderRightStyle: isRTL ? 'none' : 'dashed',
              borderLeftStyle: isRTL ? 'dashed' : 'none',
              right: isRTL ? 0 : 'auto',
              left: isRTL ? 'auto' : 0,
            },
          }}
        >
          {renderContent}
        </Drawer>
      ) : (
        <Drawer
          open={isOpenSidebar}
          onClose={onCloseSidebar}
          anchor={isRTL ? 'right' : 'left'}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: DRAWER_WIDTH } }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}
