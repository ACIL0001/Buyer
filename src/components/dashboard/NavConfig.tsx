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
  MdOutlineHelpOutline
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
          title: t('dashboard.navigation.myAuctions', 'My Auctions'),
          path: '/dashboard/auctions',
        },
        {
          title: t('dashboard.navigation.createAuction', 'Create Auction'),
          path: '/dashboard/auctions/create/',
        },
        {
          title: t('dashboard.navigation.offers', 'Offers'),
          path: '/dashboard/offers',
        },
      ],
    },
    {
      title: 'Appel d\'offres',
      path: '/dashboard/tenders',
      icon: getIcon(MdOutlineLayers),
      children: [
        {
          title: t('dashboard.navigation.myTenders', 'My Tenders'),
          path: '/dashboard/tenders',
        },
        {
          title: t('dashboard.navigation.newTender', 'New Tender'),
          path: '/dashboard/tenders/create/',
        },
        {
          title: t('dashboard.navigation.receivedBids', 'Received Bids'),
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
          title: t('dashboard.navigation.mySales', 'My Sales'),
          path: '/dashboard/direct-sales',
        },
        {
          title: t('dashboard.navigation.createSale', 'Create Sale'),
          path: '/dashboard/direct-sales/create/',
        },
        {
          title: t('dashboard.navigation.orders', 'Orders'),
          path: '/dashboard/direct-sales/orders',
        },
      ],
    },
    {
      title: 'Clients',
      path: '/dashboard/clients',
      icon: getIcon(MdOutlineGroup),
    },
    {
      title: 'Transactions',
      path: '/dashboard/transactions',
      icon: getIcon(MdOutlineDescription),
    },
  ];
};

export default useNavConfig;
