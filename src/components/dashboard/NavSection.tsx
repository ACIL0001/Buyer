import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box, List, Collapse, ListItemText, ListItemIcon, ListItemButton, styled, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { MdExpandLess, MdExpandMore, MdSettings, MdHelpOutline } from 'react-icons/md';
import Link from 'next/link';

// ----------------------------------------------------------------------

const ListItemStyle = styled((props: any) => <ListItemButton disableGutters {...props} />)(({ theme }) => ({
  ...theme.typography.body2,
  height: 48,
  position: 'relative',
  textTransform: 'none',
  padding: '0 24px',
  color: '#919EAB',
  fontWeight: 400,
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: alpha(theme.palette.action.hover, 0.04),
  }
}));

const ListItemIconStyle = styled(ListItemIcon)({
  minWidth: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'inherit',
});

// ----------------------------------------------------------------------

function NavItem({ item, active }: { item: any; active: (path: string) => boolean }) {
  const isActive = active(item.path || '');
  const { title, path, icon } = item;

  return (
    <Link 
      href={path || '#'} 
      className={`figma-sidebar-item ${isActive ? 'active' : ''}`}
      style={{ textDecoration: 'none' }}
    >
      <div className="figma-sidebar-icon">
        {icon && icon}
      </div>
      <span className="figma-sidebar-text">{title}</span>
    </Link>
  );
}

export default function NavSection({ navConfig, ...other }: any) {
  const pathname = usePathname();
  const match = (path: string) => (path ? pathname === path : false);

  const generalItems = navConfig.filter((item: any) => 
    !item.path.includes('settings') && !item.path.includes('help') && !item.title.toLowerCase().includes('aide')
  );
  
  const toolItems = navConfig.filter((item: any) => 
    item.path.includes('settings') || item.path.includes('help') || item.title.toLowerCase().includes('aide')
  );

  const renderSection = (title: string, items: any[]) => (
    <div className="figma-sidebar-list">
      <div className="figma-sidebar-label">{title}</div>
      {items.map((item: any) => (
        <NavItem key={item.title} item={item} active={match} />
      ))}
    </div>
  );

  return (
    <div {...other} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {renderSection('GENERAL', generalItems)}
      {renderSection('Outils', toolItems.length > 0 ? toolItems : [
        { title: 'Comptes et réglages', path: '/dashboard/settings', icon: <i className="bi bi-gear" style={{ fontSize: '18px' }} />},
        { title: 'Aide', path: '/dashboard/help', icon: <i className="bi bi-question-circle" style={{ fontSize: '18px' }} />}
      ])}
    </div>
  );
}
