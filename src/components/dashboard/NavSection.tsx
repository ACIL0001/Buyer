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
  const [open, setOpen] = useState(false);
  const isActive = active(item.path || '');
  const { title, path, icon, children } = item;

  const hasChildren = children && children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setOpen(!open);
    }
  };

  return (
    <>
      <Link 
        href={hasChildren ? '#' : (path || '#')} 
        className={`figma-sidebar-item ${isActive ? 'active' : ''}`}
        style={{ textDecoration: 'none' }}
        onClick={handleClick}
      >
        <div className="figma-sidebar-icon">
          {icon && icon}
        </div>
        <span className="figma-sidebar-text">{title}</span>
        {hasChildren && (
          <i 
            className={`bi bi-chevron-down figma-sidebar-expand-icon ${open ? 'expanded' : ''}`} 
            style={{ fontSize: '12px', marginLeft: 'auto', transition: 'transform 0.2s' }}
          ></i>
        )}
      </Link>
      
      {hasChildren && open && (
        <div className="figma-sidebar-sub-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {children.map((child: any) => {
             const isChildActive = active(child.path);
             return (
               <Link 
                 key={child.title}
                 href={child.path} 
                 className={`figma-sidebar-item figma-sidebar-sub-item ${isChildActive ? 'active' : ''}`}
                 style={{ textDecoration: 'none', paddingLeft: '40px', height: '36px' }}
               >
                 <span className="figma-sidebar-text figma-sidebar-sub-text" style={{ fontSize: '13px', color: '#727272' }}>
                   {child.title}
                 </span>
               </Link>
             );
          })}
        </div>
      )}
    </>
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
