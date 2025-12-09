import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdDashboard, 
  MdPeople, 
  MdGavel, 
  MdEmail, 
  MdStore, 
  MdLocalShipping, 
  MdFastfood, 
  MdCategory, 
  MdSettings, 
  MdMessage, 
  MdChat, 
  MdNotifications, 
  MdReport,
  MdRateReview,
  MdPerson,
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
      title: t('navigation.dashboard', 'Dashboard'),
      path: '/dashboard',
      icon: getIcon(MdDashboard),
    },
    {
      title: t('navigation.users', 'Users'),
      path: '/dashboard/users',
      icon: getIcon(MdPeople),
      children: [
        {
          title: t('navigation.clients', 'Clients'),
          path: '/dashboard/users/clients',
          icon: getIcon(MdPerson),
        },
        {
          title: t('navigation.restaurants', 'Restaurants'),
          path: '/dashboard/users/restaurants',
          icon: getIcon(MdFastfood),
        },
        {
          title: t('navigation.riders', 'Riders'),
          path: '/dashboard/users/riders',
          icon: getIcon(MdLocalShipping),
        },
      ],
    },
    {
      title: t('navigation.auctions', 'Auctions'),
      path: '/dashboard/auctions',
      icon: getIcon(MdGavel),
      children: [
        {
          title: t('navigation.auctions', 'All Auctions'),
          path: '/dashboard/auctions',
          icon: getIcon(MdList),
        },
        {
          title: t('navigation.addAuction', 'Create Auction'),
          path: '/dashboard/auctions/create',
          icon: getIcon(MdAddCircle),
        },
        {
          title: t('navigation.offers', 'Offers'),
          path: '/dashboard/offers',
          icon: getIcon(MdLocalShipping), // Placeholder
        },
      ],
    },
    {
      title: t('navigation.tenders', 'Tenders'),
      path: '/dashboard/tenders',
      icon: getIcon(MdEmail),
      children: [
        {
          title: t('navigation.myTenders', 'My Tenders'),
          path: '/dashboard/tenders',
          icon: getIcon(MdList),
        },
        {
          title: t('navigation.newTender', 'New Tender'),
          path: '/dashboard/tenders/create',
          icon: getIcon(MdAddCircle),
        },
        {
          title: t('navigation.receivedOffers', 'Received Bids'),
          path: '/dashboard/tender-bids',
          icon: getIcon(MdEmail),
        },
      ],
    },
    {
      title: t('navigation.directSales', 'Direct Sales'),
      path: '/dashboard/direct-sales',
      icon: getIcon(MdStore),
      children: [
        {
          title: t('navigation.myDirectSales', 'My Sales'),
          path: '/dashboard/direct-sales',
          icon: getIcon(MdStore),
        },
        {
          title: t('navigation.createDirectSale', 'Create Sale'),
          path: '/dashboard/direct-sales/create',
          icon: getIcon(MdAddCircle),
        },
        {
          title: t('navigation.myOrders', 'Orders'),
          path: '/dashboard/direct-sales/orders',
          icon: getIcon(MdShoppingCart),
        },
      ],
    },
    // Skipping some administrative items for initial buyer dashboard
    {
      title: t('navigation.chat', 'Chat'),
      path: '/dashboard/chat',
      icon: getIcon(MdChat, messageNotificationCount),
    },
     {
      title: t('navigation.notifications', 'Notifications'),
      path: '/dashboard/notifications',
      icon: getIcon(MdNotifications),
    },
  ];
};

export default useNavConfig;
