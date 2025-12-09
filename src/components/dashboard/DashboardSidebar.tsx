import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Box, Drawer, Typography, Avatar, useMediaQuery, useTheme, alpha } from '@mui/material';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import NavSection from './NavSection';
import useNavConfig from './NavConfig';
import useAuth from '@/hooks/useAuth';

const DRAWER_WIDTH = 280;

export default function DashboardSidebar({ isOpenSidebar, onCloseSidebar }: { isOpenSidebar: boolean, onCloseSidebar: () => void }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const { auth } = useAuth();
  const user = auth?.user;
  const navConfig = useNavConfig();

  useEffect(() => {
    if (isOpenSidebar) {
      onCloseSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderContent = (
    <SimpleBar style={{ maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2.5, py: 3, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        {/* Placeholder Logo */}
         <Box 
            component="img" 
            src="/assets/icons/logo/logo_single.svg" 
            sx={{ width: 40, height: 40, cursor: 'pointer' }}
            alt="MazadClick"
            onError={(e: any) => {e.target.style.display='none'}}
         />
        <Typography variant="h5" color="primary" fontWeight="bold">
            MazadClick
        </Typography>
      </Box>

      <Box sx={{ mb: 5, mx: 2.5 }}>
         <Box sx={{ 
             display: 'flex', 
             alignItems: 'center', 
             p: 2, 
             borderRadius: 2,
             bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
         }}>
             <Avatar 
                src={typeof user?.avatar === 'string' ? user?.avatar : (user?.photoURL || '')} 
                alt={user?.firstName || 'User'} 
            >
                {user?.firstName?.charAt(0).toUpperCase()}
            </Avatar>
             <Box sx={{ ml: 2 }}>
                 <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                     {user?.firstName} {user?.lastName}
                 </Typography>
                 <Typography variant="body2" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                     {user?.type || 'Buyer'}
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
          PaperProps={{
            sx: {
              width: DRAWER_WIDTH,
              bgcolor: 'background.default',
              borderRightStyle: 'dashed',
            },
          }}
        >
          {renderContent}
        </Drawer>
      ) : (
        <Drawer
          open={isOpenSidebar}
          onClose={onCloseSidebar}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: DRAWER_WIDTH } }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}
