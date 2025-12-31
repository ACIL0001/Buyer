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
import { normalizeImageUrl } from '@/utils/url';
import { CLIENT_TYPE } from '@/types/User';

// ... (previous imports)

// Helper function to get avatar URL (reused from Header/Profile)
// Helper function to get avatar URL (reused from Header/Profile)
const getAvatarUrl = (user: any) => {
    if (!user) return '';

    // Priority 1: photoURL
    if (user.photoURL && user.photoURL.trim() !== '') {
        return normalizeImageUrl(user.photoURL);
    }

    // Priority 2: avatar string (from registration)
    if (user.avatar) {
         if (typeof user.avatar === 'string' && user.avatar.trim() !== '') {
            return normalizeImageUrl(user.avatar);
         }
         
         // Priority 3: avatar object
         if (user.avatar.fullUrl) return normalizeImageUrl(user.avatar.fullUrl);
         if (user.avatar.url) return normalizeImageUrl(user.avatar.url);
         if (user.avatar.filename) return normalizeImageUrl(user.avatar.filename);
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
