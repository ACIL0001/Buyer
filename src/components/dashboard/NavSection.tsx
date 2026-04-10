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
  const isActiveRoot = active(item.path || '');
  const { title, path, icon, children } = item;
  const [open, setOpen] = useState(isActiveRoot);

  const handleOpen = (e: React.MouseEvent) => {
    if (children) {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  };

  const activeRootStyle = {
    color: '#212B36',
    fontWeight: 700,
  };

  const navItemContent = (
    <ListItemStyle
      onClick={handleOpen}
      sx={{
        ...(isActiveRoot && activeRootStyle),
      }}
    >
      <ListItemIconStyle sx={{ color: isActiveRoot ? '#212B36' : '#919EAB' }}>
        {icon && icon}
      </ListItemIconStyle>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {isActiveRoot && (
          <Box 
            sx={{ 
              position: 'absolute',
              bottom: '2px',
              left: '-4px',
              right: '-4px',
              height: '10px',
              bgcolor: '#FFF200',
              zIndex: -1,
              opacity: 0.8
            }}
          />
        )}
        <ListItemText 
          disableTypography 
          primary={title} 
          sx={{ 
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif'
          }} 
        />
      </Box>
      {children && (
        <Box sx={{ ml: 'auto', display: 'flex', color: '#919EAB' }}>
          {open ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
        </Box>
      )}
    </ListItemStyle>
  );

  if (children) {
    return (
      <>
        {navItemContent}
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((child: any) => {
              const isActiveSub = active(child.path);
              return (
                <Link key={child.title} href={child.path} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <ListItemStyle
                    sx={{
                      pl: 7, // Indentation for sub-items
                      height: 40,
                      ...(isActiveSub && {
                        color: 'text.primary',
                        fontWeight: 600,
                      }),
                    }}
                  >
                    <ListItemText 
                      disableTypography 
                      primary={child.title} 
                      sx={{ fontSize: '13px' }} 
                    />
                  </ListItemStyle>
                </Link>
              );
            })}
          </List>
        </Collapse>
      </>
    );
  }

  return (
    <Link href={path || '#'} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
      {navItemContent}
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
    <Box sx={{ mb: 4 }}>
      <Typography 
        sx={{ 
          px: 3, 
          mb: 1.5, 
          fontSize: '11px', 
          fontWeight: 700, 
          color: '#919EAB', 
          textTransform: 'uppercase',
          letterSpacing: '1.2px'
        }}
      >
        {title}
      </Typography>
      <List disablePadding>
        {items.map((item: any) => (
          <NavItem key={item.title} item={item} active={match} />
        ))}
      </List>
    </Box>
  );

  return (
    <Box {...other} sx={{ mt: 2 }}>
      {renderSection('GENERAL', generalItems)}
      {renderSection('Outils', toolItems.length > 0 ? toolItems : [
        { title: 'Comptes et réglages', path: '/dashboard/settings', icon: <MdSettings size={22} />},
        { title: 'Aide', path: '/dashboard/help', icon: <MdHelpOutline size={22} />}
      ])}
    </Box>
  );
}
