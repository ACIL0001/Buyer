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
import './DashboardSidebar.css';

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

  const getDisplayRole = (user: any) => {
    if (!user) return 'Client';
    const type = user.type?.toUpperCase();
    if (type === 'PROFESSIONAL' || type === 'RESELLER' || type === 'SELLER') {
      return 'Entreprise';
    }
    return 'Client';
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'Alpha Store';
    const name = user.socialReason || user.companyName || user.entity;
    if (name && name.trim() !== '') return name;
    
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    
    return user.name || user.displayName || 'Alpha Store';
  };

  const renderContent = (
    <div className="figma-dashboard-sidebar">
      {/* Top Company Card */}
      <div className="figma-sidebar-company-card">
        <img 
          src={getAvatarUrl(user) || "/assets/img/logo.png"} 
          className="figma-sidebar-avatar" 
          alt="Profile" 
        />
        <div className="figma-sidebar-user-info">
          <span className="figma-sidebar-user-role">{getDisplayRole(user)}</span>
          <span className="figma-sidebar-user-name">
            {getDisplayName(user)}
          </span>
        </div>
      </div>

      <div className="figma-sidebar-group">
        <NavSection navConfig={navConfig} />
      </div>

      {/* Bottom Account Card */}
      <div className="figma-sidebar-account-card">
        <img 
          src={getAvatarUrl(user) || "/assets/img/avatar.png"} 
          className="figma-sidebar-avatar" 
          alt="User" 
        />
        <div className="figma-sidebar-user-info">
          <span className="figma-sidebar-user-name">
            {getDisplayName(user)}
          </span>
          <span className="figma-sidebar-user-role">{getDisplayRole(user)}</span>
        </div>
        <i className="bi bi-chevron-down" style={{ marginLeft: 'auto', color: '#454545' }}></i>
      </div>
    </div>
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
              borderRight: '1px solid #E7E7E7',
              borderLeft: isRTL ? '1px solid #E7E7E7' : 'none',
              position: 'relative',
              height: 'auto',
              minHeight: '100%',
              overflowX: 'hidden',
              marginTop: '196px', // Clear desktop header
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
          PaperProps={{ 
            sx: { 
              width: DRAWER_WIDTH, 
              bgcolor: 'white', 
              height: 'auto',
              marginTop: '64px', // Clear mobile header
            } 
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}
