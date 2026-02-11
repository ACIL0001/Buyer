'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BsBell, BsCheck, BsCheckAll } from 'react-icons/bs';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  userId: string;
  data?: any;
}

export default function DatabaseNotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('notifications.justNow');
    if (diffInMinutes < 60) return t('notifications.minutesAgo', { minutes: diffInMinutes });
    if (diffInMinutes < 1440) return t('notifications.hoursAgo', { hours: Math.floor(diffInMinutes / 60) });
    return t('notifications.daysAgo', { days: Math.floor(diffInMinutes / 1440) });
  };

  const handleNotificationClick = (notification: Notification) => {
    const { type, data } = notification;
    const titleLower = notification.title?.toLowerCase() || '';
    const messageLower = notification.message?.toLowerCase() || '';

    let redirectPath: string | null = null;
    
    // 1. PUBLIC CREATION NOTIFICATIONS
    if (type === 'TENDER_CREATED') {
        const id = data?._id || data?.id || data?.tenderId;
        if (id) redirectPath = `/tender-details/${id}`;
    }
    else if (type === 'AUCTION_CREATED' || 
            (type === 'BID_CREATED' && (titleLower.includes('créée') || titleLower.includes('created')))) {
        const id = data?._id || data?.id || data?.auctionId;
        if (id) redirectPath = `/auction-details/${id}`;
    }
    else if (type === 'DIRECT_SALE_CREATED') {
        const id = data?._id || data?.id || data?.directSaleId;
        if (id) redirectPath = `/direct-sale/${id}`;
    }
    // 2. CHAT REDIRECTION
    else if (data?.chatId) {
        redirectPath = `/dashboard/chat?conversationId=${data.chatId}`;
    }
    // 3. SELLER NOTIFICATIONS
    else {
         const isSellerReceivingTenderBid = !titleLower.includes('créée') &&
                                          type === 'NEW_OFFER' && 
                                          (data?.tender || data?.tenderId || 
                                           messageLower.includes('soumission') ||
                                           messageLower.includes('appel d\'offres'));
        
        const isSellerReceivingAuctionBid = !titleLower.includes('créée') &&
                                            (type === 'BID_CREATED' ||
                                            (type === 'NEW_OFFER' && 
                                             (data?.auction || data?.auctionId ||
                                              messageLower.includes('enchère'))));
        
        const isSellerReceivingDirectSaleOrder = (
            (titleLower.includes('nouvelle') && titleLower.includes('commande') && !titleLower.includes('créée')) ||
            (type === 'ORDER' && !titleLower.includes('confirmée') && !titleLower.includes('confirmed')) ||
            (type === 'NEW_OFFER' && (titleLower.includes('commande') || messageLower.includes('commande')))
        );

        if (isSellerReceivingTenderBid) {
            redirectPath = '/dashboard/tender-bids?tab=received';
        }
        else if (isSellerReceivingAuctionBid) {
            redirectPath = '/dashboard/offers?tab=received';
        }
        else if (isSellerReceivingDirectSaleOrder) {
            redirectPath = '/dashboard/direct-sales/orders?tab=received';
        }
        // 4. BUYER NOTIFICATIONS
        else if (type === 'OFFER_ACCEPTED') {
             const tenderId = data?.tender?._id || data?.tenderId || data?.tender;
             if (tenderId && typeof tenderId === 'string') redirectPath = `/tender-details/${tenderId}`;
             else {
                 const auctionId = data?.auction?._id || data?.auctionId || data?.auction;
                 if (auctionId && typeof auctionId === 'string') redirectPath = `/auction-details/${auctionId}`;
                 else {
                     const dsId = data?.directSale?._id || data?.directSaleId;
                     if (dsId && typeof dsId === 'string') redirectPath = `/direct-sale/${dsId}`;
                 }
             }
        }
        else if (type === 'ORDER' && (titleLower.includes('confirmée') || titleLower.includes('confirmed'))) {
             redirectPath = '/dashboard/direct-sales/orders';
        }
    }

    if (redirectPath) {
        router.push(redirectPath);
    }
    
    // Always mark as read if not read
    if (!notification.read) {
        handleMarkAsRead(notification._id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return <BsBell size={16} color="#0063b1" />;
      case 'auction':
        return <BsBell size={16} color="#28a745" />;
      case 'system':
        return <BsBell size={16} color="#ffc107" />;
      default:
        return <BsBell size={16} color="#666" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('notifications.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchNotifications}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('notifications.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BsBell size={24} color="#0063b1" />
                <h1 className="text-2xl font-semibold text-gray-900">
                  {t('notifications.title')}
                </h1>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              {notifications.filter(n => !n.read).length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {t('notifications.markAllAsRead')}
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title || t('notifications.defaultTitle')}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message || t('notifications.defaultMessage')}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {notification.read ? (
                            <BsCheckAll size={16} color="#28a745" />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification._id);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <BsCheck size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BsBell size={24} color="#ccc" />
                </div>
                <p className="text-gray-500 text-lg">{t('notifications.noNotifications')}</p>
                <p className="text-gray-400 text-sm mt-2">{t('notifications.noNotificationsSubtext')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 