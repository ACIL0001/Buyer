import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdDashboard, 
 
  MdGavel, 
  MdEmail, 
  MdStore, 
  MdLocalShipping, 
 
  MdCategory, 
  MdSettings, 
  MdMessage, 
  MdChat, 
  MdNotifications, 
  MdReport,
  MdRateReview,

  MdAddCircle,
  MdList,
  MdShoppingCart
} from 'react-icons/md';
import { Badge, Box } from '@mui/material';

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
  // const { totalUnreadCount: messageNotificationCount } = useMessageNotifications(); // Mocked for now
  const messageNotificationCount = 0;

  return [
    {
      title: t('dashboard.navigation.dashboard', 'Dashboard'),
      path: '/dashboard',
      icon: getIcon(MdDashboard),
    },

    {
      title: t('dashboard.navigation.auctions', 'Auctions'),
      path: '/dashboard/auctions',
      icon: getIcon(MdGavel),
      children: [
        {
          title: t('dashboard.navigation.myAuctions', 'My Auctions'),
          path: '/dashboard/auctions',
          icon: getIcon(MdList),
        },
        {
          title: t('dashboard.navigation.createAuction', 'Create Auction'),
          path: '/dashboard/auctions/create',
          icon: getIcon(MdAddCircle),
        },
        {
          title: t('dashboard.navigation.offers', 'Offers'),
          path: '/dashboard/offers',
          icon: getIcon(MdLocalShipping), // Placeholder
        },
      ],
    },
    {
      title: t('dashboard.navigation.tenders', 'Tenders'),
      path: '/dashboard/tenders',
      icon: getIcon(MdEmail),
      children: [
        {
          title: t('dashboard.navigation.myTenders', 'My Tenders'),
          path: '/dashboard/tenders',
          icon: getIcon(MdList),
        },
        {
          title: t('dashboard.navigation.newTender', 'New Tender'),
          path: '/dashboard/tenders/create',
          icon: getIcon(MdAddCircle),
        },
        {
          title: t('dashboard.navigation.receivedBids', 'Received Bids'),
          path: '/dashboard/tender-bids',
          icon: getIcon(MdEmail),
        },
      ],
    },
    {
      title: t('dashboard.navigation.directSales', 'Direct Sales'),
      path: '/dashboard/direct-sales',
      icon: getIcon(MdStore),
      children: [
        {
          title: t('dashboard.navigation.mySales', 'My Sales'),
          path: '/dashboard/direct-sales',
          icon: getIcon(MdStore),
        },
        {
          title: t('dashboard.navigation.createSale', 'Create Sale'),
          path: '/dashboard/direct-sales/create',
          icon: getIcon(MdAddCircle),
        },
        {
          title: t('dashboard.navigation.orders', 'Orders'),
          path: '/dashboard/direct-sales/orders',
          icon: getIcon(MdShoppingCart),
        },
      ],
    },
    // Skipping some administrative items for initial buyer dashboard
    {
      title: t('dashboard.navigation.chat', 'Chat'),
      path: '/dashboard/chat',
      icon: getIcon(MdChat, messageNotificationCount),
    },
  ];
};

export default useNavConfig;
