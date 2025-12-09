import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Box, List, Collapse, ListItemText, ListItemIcon, ListItemButton, styled } from '@mui/material';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';
import Link from 'next/link';

// ----------------------------------------------------------------------

const ListItemStyle = styled((props: any) => <ListItemButton disableGutters {...props} />)(({ theme }) => ({
  ...theme.typography.body2,
  height: 48,
  position: 'relative',
  textTransform: 'capitalize',
  color: theme.palette.text.secondary,
  borderRadius: theme.shape.borderRadius,
}));

const ListItemIconStyle = styled(ListItemIcon)({
  width: 22,
  height: 22,
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// ----------------------------------------------------------------------

function NavItem({ item, active }: { item: any; active: (path: string) => boolean }) {
  const theme = useTheme();
  const isActiveRoot = active(item.path);
  const { title, path, icon, children } = item;
  const [open, setOpen] = useState(isActiveRoot);

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const activeRootStyle = {
    color: 'primary.main',
    fontWeight: 'fontWeightMedium',
    bgcolor: (theme: any) => alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
  };

  const activeSubStyle = {
    color: 'text.primary',
    fontWeight: 'fontWeightMedium',
  };

  if (children) {
    return (
      <>
        <ListItemStyle
          onClick={handleOpen}
          sx={{
            ...(isActiveRoot && activeRootStyle),
          }}
        >
          <ListItemIconStyle>{icon && icon}</ListItemIconStyle>
          <ListItemText disableTypography primary={title} />
          {open ? <MdExpandLess /> : <MdExpandMore />}
        </ListItemStyle>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((child: any) => {
              const isActiveSub = active(child.path);

              return (
                <Link key={child.title} href={child.path} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                  <ListItemStyle
                    sx={{
                      ...(isActiveSub && activeSubStyle),
                    }}
                  >
                    <ListItemIconStyle>
                      <Box
                        component="span"
                        sx={{
                          width: 4,
                          height: 4,
                          display: 'flex',
                          borderRadius: '50%',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'text.disabled',
                          transition: (theme) => theme.transitions.create('transform'),
                          ...(isActiveSub && {
                            transform: 'scale(2)',
                            bgcolor: 'primary.main',
                          }),
                        }}
                      />
                    </ListItemIconStyle>
                    <ListItemText disableTypography primary={child.title} />
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
    <Link href={path} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
      <ListItemStyle
        sx={{
          ...(isActiveRoot && activeRootStyle),
        }}
      >
        <ListItemIconStyle>{icon && icon}</ListItemIconStyle>
        <ListItemText disableTypography primary={title} />
      </ListItemStyle>
    </Link>
  );
}

import { alpha, useTheme } from '@mui/material/styles';

export default function NavSection({ navConfig, ...other }: any) {
  const pathname = usePathname();

  const match = (path: string) => (path ? pathname === path : false);

  return (
    <Box {...other}>
      <List disablePadding sx={{ p: 1 }}>
        {navConfig.map((item: any) => (
          <NavItem key={item.title} item={item} active={match} />
        ))}
      </List>
    </Box>
  );
}
