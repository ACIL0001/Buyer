import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Box } from '@mui/material';
import { 
  MdOutlineHome, 
  MdOutlineTrendingUp, 
  MdOutlineStorefront, 
  MdOutlineLayers,
  MdOutlineGroup,
  MdOutlineDescription,
  MdOutlineSettings,
  MdOutlineHelpOutline,
  MdOutlineMessage,
  MdOutlineNotifications
} from 'react-icons/md';

const getIcon = (IconComponent: React.ComponentType<any>, badgeContent?: number) => {
  const icon = <IconComponent size={22} />;
  
  if (badgeContent && badgeContent > 0) {
    return (
      <Badge
        badgeContent={badgeContent}
        color="error"
        max={99}
        sx={{ marginRight: 1 }}
      >
        {icon}
      </Badge>
    );
  }
  return <Box component="span" sx={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</Box>;
};

const useNavConfig = () => {
  const { t } = useTranslation();
  const messageNotificationCount = 0;

  return [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: getIcon(MdOutlineHome),
    },
    {
      title: 'Enchère',
      path: '/dashboard/auctions',
      icon: getIcon(MdOutlineTrendingUp),
      children: [
        {
          title: 'Mes enchères',
          path: '/dashboard/auctions',
        },
        {
          title: 'Créer une enchère',
          path: '/dashboard/auctions/create/',
        },
        {
          title: 'Mes offres',
          path: '/dashboard/offers',
        },
      ],
    },
    {
      title: 'Soumission',
      path: '/dashboard/tenders',
      icon: getIcon(MdOutlineLayers),
      children: [
        {
          title: 'Mes appels d\'offres',
          path: '/dashboard/tenders',
        },
        {
          title: 'Nouvel appel d\'offres',
          path: '/dashboard/tenders/create/',
        },
        {
          title: 'Soumissions reçues',
          path: '/dashboard/tender-bids',
        },
      ],
    },
    {
      title: 'Vente directe',
      path: '/dashboard/direct-sales',
      icon: getIcon(MdOutlineStorefront),
      children: [
        {
          title: 'Mes ventes',
          path: '/dashboard/direct-sales',
        },
        {
          title: 'Créer une vente',
          path: '/dashboard/direct-sales/create/',
        },
        {
          title: 'Commandes',
          path: '/dashboard/direct-sales/orders',
        },
      ],
    },
    {
      title: 'Messages',
      path: '/dashboard/messages',
      icon: getIcon(MdOutlineMessage),
    },
    {
      title: 'Notifications',
      path: '/dashboard/notifications',
      icon: getIcon(MdOutlineNotifications),
    },
  ];
};

export default useNavConfig;
