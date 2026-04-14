'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Header } from '../header/Header';
import DashboardSidebar from './DashboardSidebar';
import { useLanguage } from '@/contexts/LanguageContext';

const APP_BAR_MOBILE = 64;
const APP_BAR_DESKTOP = 196;
const DRAWER_WIDTH = 280;

interface MainStyleProps {
  isRTL?: boolean;
}

const MainStyle = styled('main', {
  shouldForwardProp: (prop) => prop !== 'isRTL',
})<MainStyleProps>(({ theme, isRTL }) => ({
  flexGrow: 1,
  overflow: 'auto',
  minHeight: '100%',
  paddingTop: APP_BAR_MOBILE + 24,
  paddingBottom: theme.spacing(10),
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.up('lg')]: {
    paddingTop: APP_BAR_DESKTOP,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { isRTL } = useLanguage();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Header />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <DashboardSidebar isOpenSidebar={open} onCloseSidebar={() => setOpen(false)} />
        <MainStyle isRTL={isRTL}>
          {children}
        </MainStyle>
      </Box>
    </Box>
  );
}
