import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from "@/contexts/settingsStore";
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
  const { logoUrl } = useSettingsStore();
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
    <SimpleBar style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mt: 4, mb: 5, mx: 2.5 }}>
         <Box sx={{ 
             display: 'flex', 
             alignItems: 'center', 
             p: '15px 20px', 
             borderRadius: '16px',
             bgcolor: 'white',
             border: '1px solid #E6E6E6',
             boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)',
             gap: '15px'
         }}>
             <Box 
                component="img"
                src={logoUrl || "/assets/img/logo.png"}
                sx={{
                  width: 32,
                  height: 32,
                  objectFit: 'contain'
                }}
             />
             <Box sx={{ flex: 1, minWidth: 0 }}>
                 <Typography 
                   sx={{ 
                     color: '#A0A0A0', 
                     fontSize: '12px',
                     fontWeight: 400,
                     mb: '-2px',
                     fontFamily: 'Roboto, sans-serif'
                   }}
                 >
                     Entreprise
                 </Typography>
                 <Typography 
                   sx={{ 
                     color: '#1A1A1A', 
                     fontSize: '16px',
                     fontWeight: 700,
                     fontFamily: 'Roboto, sans-serif',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     whiteSpace: 'nowrap',
                   }}
                 >
                     {(user as any)?.entreprise || (user as any)?.socialReason || 'Alpha Store'}
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
              bgcolor: 'white',
              borderRight: '1px solid #E6E6E6',
              borderLeft: isRTL ? '1px solid #E6E6E6' : 'none',
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
          PaperProps={{ sx: { width: DRAWER_WIDTH, bgcolor: 'white' } }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}
