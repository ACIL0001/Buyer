import { alpha, styled } from '@mui/material/styles';
import { Box, Stack, AppBar, Toolbar, IconButton } from '@mui/material';
import { MdMenu } from 'react-icons/md';
import useAuth from '@/hooks/useAuth';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationBell from '@/components/NotificationBell';
import ChatNotifications from '@/components/chat/ChatNotifications';
import AccountPopover from './AccountPopover';

const DRAWER_WIDTH = 280;
const APPBAR_MOBILE = 64;
const APPBAR_DESKTOP = 92;

const RootStyle = styled(AppBar)(({ theme }) => ({
  boxShadow: 'none',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)', // Fix on Mobile
  backgroundColor: alpha(theme.palette.background.default, 0.72),
  [theme.breakpoints.up('lg')]: {
    width: `calc(100% - ${DRAWER_WIDTH + 1}px)`,
  },
}));

const ToolbarStyle = styled(Toolbar)(({ theme }) => ({
  minHeight: APPBAR_MOBILE,
  [theme.breakpoints.up('lg')]: {
    minHeight: APPBAR_DESKTOP,
    padding: theme.spacing(0, 5),
  },
}));

export default function DashboardNavbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
    const { auth } = useAuth();
    const user = auth?.user;

    return (
        <RootStyle>
            <ToolbarStyle>
                <IconButton 
                    onClick={onOpenSidebar} 
                    sx={{ mr: 1, color: 'text.primary', display: { lg: 'none' } }}
                >
                    <MdMenu />
                </IconButton>

                <Box sx={{ flexGrow: 1 }} />

                <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
                    <div style={{ marginRight: '8px' }}>
                        <LanguageSwitcher />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <ChatNotifications variant="header" />
                    </div>

                    <NotificationBell />

                    <AccountPopover />
                </Stack>
            </ToolbarStyle>
        </RootStyle>
    );
}
