"use client";
import { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BsBell, BsHammer, BsTrophy, BsExclamationCircle, BsChat } from 'react-icons/bs';
import useNotification from '@/hooks/useNotification';
import useTotalNotifications from '@/hooks/useTotalNotifications';
import { useTranslation } from 'react-i18next';

// Fallback icon component
const FallbackIcon = () => <BsBell size={16} color="#666" />;

interface NotificationBellProps {
  variant?: 'header' | 'sidebar';
  onOpenChange?: (isOpen: boolean) => void;
}

const NotificationBell = memo(function NotificationBell({ variant = 'header', onOpenChange }: NotificationBellProps) {
  // Always call hooks in the same order - useState first, then other hooks
  const [isOpen, setIsOpen] = useState(false);
  const [clickedNotificationId, setClickedNotificationId] = useState<string | null>(null);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debug component mounts
  useEffect(() => {
    console.log('🔔 NotificationBell mounted/remounted');
    return () => {
      console.log('🔔 NotificationBell unmounted');
    };
  }, []);
  
  // Always call hooks in consistent order - never conditionally
  const { t } = useTranslation();
  const { notifications, loading, markAsRead, markAllAsRead, refresh } = useNotification();
  
  // Use combined notification counts
  const { totalUnreadCount, generalUnreadCount, adminUnreadCount, refreshAll } = useTotalNotifications();

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpenChange) {
      onOpenChange(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Refresh all notifications when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      refreshAll();
      if (onOpenChange) {
        onOpenChange(true);
      }
    }
  }, [isOpen, refreshAll, onOpenChange]);

  // Debug logging
  useEffect(() => {
    console.log('NotificationBell - notifications:', notifications);
    console.log('NotificationBell - notification counts:', { 
      totalUnreadCount, 
      generalUnreadCount, 
      adminUnreadCount 
    });
  }, [notifications, totalUnreadCount, generalUnreadCount, adminUnreadCount]);

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('notifications.justNow');
    if (diffInMinutes < 60) return t('notifications.minutesAgo', { minutes: diffInMinutes });
    if (diffInMinutes < 1440) return t('notifications.hoursAgo', { hours: Math.floor(diffInMinutes / 60) });
    return t('notifications.daysAgo', { days: Math.floor(diffInMinutes / 1440) });
  };

  const getNotificationIcon = (type: string) => {
    if (!type) {
      return <FallbackIcon />;
    }
    
    try {
      switch (type) {
        case 'BID_CREATED':
          return <BsHammer size={16} color="#0063b1" />;
        case 'BID_ENDED':
          return <BsExclamationCircle size={16} color="#ffc107" />;
        case 'BID_WON':
          return <BsTrophy size={16} color="#ffd700" />;
        default:
          return <FallbackIcon />;
      }
    } catch (error) {
      console.error('Error rendering notification icon for type:', type, error);
      return <FallbackIcon />;
    }
  };

  const router = useRouter();

  const handleMarkAsRead = async (notificationId: string) => {
    // Set clicked state for visual feedback
    setClickedNotificationId(notificationId);
    
    const notification = notifications.find(n => n._id === notificationId);

    if (!notification) {
      setClickedNotificationId(null);
      return;
    }

    // ENHANCED DIAGNOSTIC LOGGING
    console.log('🔍 ============ DETAILED NOTIFICATION DEBUG ============');
    console.log('🔍 Notification ID:', notification._id);
    console.log('🔍 Notification Type:', notification.type);
    console.log('🔍 Title:', notification.title);
    console.log('🔍 Message:', notification.message);
    console.log('🔍 Data Object:', notification.data);
    console.log('🔍 Data._id:', notification.data?._id);
    console.log('🔍 Data.id:', notification.data?.id);
    console.log('🔍 Data.auctionId:', notification.data?.auctionId);
    console.log('🔍 Data.auction:', notification.data?.auction);
    console.log('🔍 Data.auction._id:', notification.data?.auction?._id);
    console.log('🔍 Data.auction.id:', notification.data?.auction?.id);
    console.log('🔍 Full Object:', JSON.stringify(notification, null, 2));
    console.log('🔍 ====================================================');

    // REDIRECT LOGIC FIRST - Execute navigation BEFORE state changes
    try {
        // Cast notification.data as any for flexible property access
        const data = notification.data as any;

        // DEBUG: Log the entire notification to understand its structure
        console.log('📢 NOTIFICATION DEBUG:', {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: data
        });

        let redirectPath: string | null = null;

        // 1. PUBLIC CREATION NOTIFICATIONS (Prioritize these - for newly created items)
        if (notification.type === 'TENDER_CREATED') {
            const id = data?._id || data?.id || data?.tenderId;
            if (id) {
               console.log('🚀 Redirecting to Tender (Created):', id);
               redirectPath = `/tenders/details/${id}`;
            }
        }
        else if (notification.type === 'AUCTION_CREATED') {
            const id = data?._id || data?.id || data?.auctionId;
            if (id) {
               console.log('🚀 Redirecting to Auction (Created):', id);
               redirectPath = `/auctions/details/${id}`;
            }
        }
        else if (notification.type === 'DIRECT_SALE_CREATED') {
            const id = data?._id || data?.id || data?.directSaleId;
            if (id) {
               console.log('🚀 Redirecting to Direct Sale (Created):', id);
               redirectPath = `/direct-sales/details/${id}`;
            }
        }
        // 2. CHAT REDIRECTION
        else if (data?.chatId) {
            console.log('🚀 Redirecting to Chat:', data.chatId);
            redirectPath = `/dashboard/chat?conversationId=${data.chatId}`;
        }
        else {
            // 3. SELLER NOTIFICATIONS - Redirect to dashboard management pages with "received" tab
            
            const titleLower = notification.title?.toLowerCase() || '';
            const messageLower = notification.message?.toLowerCase() || '';
            
            console.log('🔍 Checking seller notifications:', {
                titleLower,
                messageLower,
                type: notification.type,
                hasCommande: titleLower.includes('commande') || messageLower.includes('commande'),
                hasNouvelle: titleLower.includes('nouvelle'),
                hasConfirmee: titleLower.includes('confirmée') || titleLower.includes('confirmed')
            });

            // Check if user is receiving offers/bids on THEIR items
            // IMPORTANT: Exclude CREATED types which should go to details pages above
            const isSellerReceivingTenderBid = !titleLower.includes('créée') &&
                                              notification.type === 'NEW_OFFER' &&
                                              (data?.tender || data?.tenderId || 
                                               messageLower.includes('soumission') ||
                                               messageLower.includes('appel d\'offres'));
            
            const isSellerReceivingAuctionBid = !titleLower.includes('créée') &&
                                                (notification.type === 'BID_CREATED' ||
                                                (notification.type === 'NEW_OFFER' && 
                                                (data?.auction || data?.auctionId ||
                                                  messageLower.includes('enchère'))));
            
            // Seller receiving a new order (nouvelle commande)
            const isSellerReceivingDirectSaleOrder = (
                (titleLower.includes('nouvelle') && titleLower.includes('commande') && !titleLower.includes('créée')) ||
                (notification.type === 'ORDER' && !titleLower.includes('confirmée') && !titleLower.includes('confirmed')) ||
                (notification.type === 'NEW_OFFER' && (titleLower.includes('commande') || messageLower.includes('commande')))
            );

            console.log('🎯 Seller notification checks:', {
                isSellerReceivingTenderBid,
                isSellerReceivingAuctionBid,
                isSellerReceivingDirectSaleOrder
            });

            // Redirect sellers to their dashboard "received" tab to manage incoming offers/orders
            if (isSellerReceivingTenderBid) {
                console.log('🔄 Redirecting to Tender Bids Dashboard (Received Tab)');
                redirectPath = '/dashboard/tender-bids?tab=received';
            }
            else if (isSellerReceivingAuctionBid) {
                console.log('🔄 Redirecting to Auction Offers Dashboard (Received Tab)');
                redirectPath = '/dashboard/offers?tab=received';
            }
            else if (isSellerReceivingDirectSaleOrder) {
                console.log('✅ REDIRECTING: Direct Sales Orders Dashboard (Received Tab) - Nouvelle Commande');
                redirectPath = '/dashboard/direct-sales/orders?tab=received';
            }
            // 4. BUYER NOTIFICATIONS - When buyer's offer is accepted
            else if (notification.type === 'OFFER_ACCEPTED') {
                // Buyer's offer was accepted - go to the item details to see it
                const tenderId = data?.tender?._id || data?.tenderId || data?.tender;
                if (tenderId && typeof tenderId === 'string') {
                  console.log('🔄 Redirecting to Tender Details (Accepted):', tenderId);
                  redirectPath = `/tenders/details/${tenderId}`;
                }
                else {
                    const auctionId = data?.auction?._id || data?.auctionId || data?.auction;
                    if (auctionId && typeof auctionId === 'string') {
                        console.log('🔄 Redirecting to Auction Details (Accepted):', auctionId);
                        redirectPath = `/auctions/details/${auctionId}`;
                    }
                    else {
                        const dsId = data?.directSale?._id || data?.directSaleId;
                        if (dsId && typeof dsId === 'string') {
                            console.log('🔄 Redirecting to Direct Sale Details (Accepted):', dsId);
                            redirectPath = `/direct-sales/details/${dsId}`;
                        }
                    }
                }
            }
            // 5. ORDER CONFIRMED - Buyer receives confirmation
            else if (notification.type === 'ORDER' && 
                     (titleLower.includes('confirmée') || titleLower.includes('confirmed'))) {
                console.log('🔄 Redirecting to My Purchases');
                redirectPath = '/dashboard/direct-sales/orders';
            }
        }

        if (!redirectPath) {
            console.log('⚠️ No redirect condition matched for this notification');
        }

        // Execute the redirect FIRST, before marking as read and closing dropdown
        if (redirectPath) {
            console.log('🎯 Executing redirect to:', redirectPath);
            router.push(redirectPath);
        }
        
    } catch (e) {
        console.error("❌ Error handling notification redirection", e);
    }

    // THEN mark as read and close dropdown
    await markAsRead(notificationId);
    setIsOpen(false);
    
    // Clear clicked state after a short delay
    setTimeout(() => {
      setClickedNotificationId(null);
    }, 300);
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllAsRead(true);
    await markAllAsRead();
    setIsMarkingAllAsRead(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen ? '#f1f1f1' : '#f8f9fa',
          border: 'none',
          borderRadius: '50%',
          width: variant === 'header' ? '40px' : '48px',
          height: variant === 'header' ? '40px' : '48px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: isOpen ? '0 4px 15px rgba(0,0,0,0.08)' : '0 2px 10px rgba(0,0,0,0.05)'
        }}
        onMouseOver={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
            e.currentTarget.style.background = '#f1f1f1';
          }
        }}
        onMouseOut={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            e.currentTarget.style.background = '#f8f9fa';
          }
        }}
        title={t('notifications.title')}
      >
        <BsBell size={variant === 'header' ? 20 : 24} color={isOpen ? '#0063b1' : '#666'} />
        {totalUnreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ff3366',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: 'bold',
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 0 0 2px #fff',
            animation: totalUnreadCount > 0 ? 'pulse 2s ease-in-out infinite' : 'none'
          }}>
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          width: '360px',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to right, #fafafa, #ffffff)'
          }}>
            <div style={{ 
              fontWeight: 600, 
              color: '#333',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <BsBell size={18} color="#0063b1" />
              {t('notifications.title')}
              {totalUnreadCount > 0 && (
                <span style={{
                  background: '#ff3366',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {totalUnreadCount}
                </span>
              )}
            </div>
            {generalUnreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isMarkingAllAsRead ? '#999' : '#0063b1',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isMarkingAllAsRead ? 'not-allowed' : 'pointer',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  transition: 'all 0.2s ease',
                  opacity: isMarkingAllAsRead ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!isMarkingAllAsRead) {
                    e.currentTarget.style.background = 'rgba(0, 99, 177, 0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isMarkingAllAsRead) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {isMarkingAllAsRead ? t('notifications.processing') : t('notifications.markAllAsRead')}
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                <div style={{ 
                  width: '40px',
                  height: '40px',
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #0063b1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '15px'
                }}></div>
                <span>{t('notifications.loading')}</span>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: clickedNotificationId === notification._id
                      ? 'rgba(0, 99, 177, 0.05)'
                      : notification.read ? 'white' : 'rgba(0, 99, 177, 0.02)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => handleMarkAsRead(notification._id)}
                >
                  <div style={{
                    backgroundColor: notification.read ? '#f0f0f0' : '#e6f0fa',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontWeight: notification.read ? 400 : 600,
                      color: notification.read ? '#555' : '#333',
                      fontSize: '14px',
                      marginBottom: '5px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}>
                      {notification.title || t('notifications.defaultTitle')}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: '8px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.4'
                    }}>
                      {notification.message || t('notifications.defaultMessage')}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#999',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>{formatTime(notification.createdAt || new Date())}</span>
                    </div>
                  </div>
                  {!notification.read && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#0063b1',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: '20px',
                      right: '15px'
                    }}></div>
                  )}
                </div>
              ))
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#999',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#f8f8f8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '15px'
                }}>
                  <BsBell size={24} color="#ccc" />
                </div>
                <p>{t('notifications.noNotifications')}</p>
              </div>
            )}
          </div>
          
          <div style={{
            padding: '12px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <Link 
              href="/database-notifications"
                      style={{
                display: 'inline-block',
                color: '#0063b1',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                        transition: 'all 0.2s ease',
                padding: '6px 12px',
                borderRadius: '15px'
              }}
              onClick={() => setIsOpen(false)}
                      onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 99, 177, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {t('notifications.viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
});

export default NotificationBell; 