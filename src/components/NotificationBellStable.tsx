"use client";
import { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { BsBell, BsHammer, BsTrophy, BsExclamationCircle, BsChat } from 'react-icons/bs';
import useTotalNotifications from '@/hooks/useTotalNotifications';
import useNotification from '@/hooks/useNotification';
import { useAdminMessageNotifications } from '@/hooks/useAdminMessageNotifications';
import { useTranslation } from 'react-i18next';
import { getSellerUrl } from '@/config';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ChatAPI } from '@/app/api/chat';

interface NotificationBellStableProps {
  variant?: 'header' | 'sidebar';
  onOpenChange?: (isOpen: boolean) => void;
}

const NotificationBellStable = memo(function NotificationBellStable({ variant = 'header', onOpenChange }: NotificationBellStableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown content
  const { t } = useTranslation();
  const { auth } = useAuth();
  const router = useRouter();
  
  // Get notification data
  const { totalUnreadCount, refreshAll } = useTotalNotifications();
  const { notifications: generalNotifications, markAsRead: markGeneralAsRead, markAllAsRead: markAllGeneralAsRead, loading: generalLoading } = useNotification();

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;
      
      if (!isMobile) {
        setDropdownPos({
          top: rect.bottom + 10,
          right: window.innerWidth - rect.right
        });
      }
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpenChange) {
      onOpenChange(true);
      refreshAll();
    }
  };

  // Track window width and update position
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (isOpen) {
        updateDropdownPosition();
      }
    };
    
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateDropdownPosition, true); // Update on scroll too
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen]);

  // Combined notifications
  const allNotifications = [
    ...generalNotifications.map(n => ({ ...n, source: 'general' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Debug logging
  useEffect(() => {
    if (isOpen) {
        console.log('🔔 NotificationBellStable - Notification counts:', {
            generalNotifications: generalNotifications.length,
            totalUnreadCount,
            allNotifications: allNotifications.length
        });
    }
  }, [isOpen, generalNotifications.length, totalUnreadCount]);

  const handleMarkAsRead = async (notification: any) => {
    try {
      console.log('🔖 Marking notification as read:', notification._id);
      
      let redirectPath: string | null = null;
      
      const titleLower = notification.title?.toLowerCase() || '';
      const messageLower = notification.message?.toLowerCase() || '';

      // 0. NEW ITEMS CREATED (Public Notifications)
      if (notification.type === 'TENDER_CREATED') {
          const id = notification.data?._id || notification.data?.id || notification.data?.tenderId;
          if (id) redirectPath = `/tender-details/${id}`;
      }
      else if (notification.type === 'AUCTION_CREATED' || 
              (notification.type === 'BID_CREATED' && (titleLower.includes('créée') || titleLower.includes('created')))) {
          const id = notification.data?._id || notification.data?.id || notification.data?.auctionId;
          if (id) redirectPath = `/auction-details/${id}`;
      }
      else if (notification.type === 'DIRECT_SALE_CREATED') {
          const id = notification.data?._id || notification.data?.id || notification.data?.directSaleId;
          if (id) redirectPath = `/direct-sale/${id}`;
      }
      else {
        // Seller / General Logic
        const isSellerReceivingTenderBid = !titleLower.includes('créée') &&
                                          notification.type === 'NEW_OFFER' && 
                                          (notification.data?.tender || notification.data?.tenderId || 
                                           messageLower.includes('soumission') ||
                                           messageLower.includes('appel d\'offres'));
        
        const isSellerReceivingAuctionBid = !titleLower.includes('créée') &&
                                            (notification.type === 'BID_CREATED' ||
                                            (notification.type === 'NEW_OFFER' && 
                                             (notification.data?.auction || notification.data?.auctionId ||
                                              messageLower.includes('enchère'))));
        
        const isSellerReceivingDirectSaleOrder = (
            (titleLower.includes('nouvelle') && titleLower.includes('commande') && !titleLower.includes('créée')) ||
            (notification.type === 'ORDER' && !titleLower.includes('confirmée') && !titleLower.includes('confirmed')) ||
            (notification.type === 'NEW_OFFER' && (titleLower.includes('commande') || messageLower.includes('commande')))
        );

        const isBidderSubmission = titleLower.includes('soumise') || titleLower.includes('submitted') || 
                                   titleLower.includes('enregistrée') || titleLower.includes('registered');

        if (isBidderSubmission && (notification.data?.tender || notification.data?.tenderId || messageLower.includes('appel d\'offres') || messageLower.includes('tender'))) {
             redirectPath = '/dashboard/tender-bids?tab=my';
        }
        else if (isSellerReceivingTenderBid) {
          redirectPath = '/dashboard/tender-bids?tab=received';
        }
        else if (isSellerReceivingAuctionBid) {
          redirectPath = '/dashboard/offers?tab=received';
        }
        else if (isSellerReceivingDirectSaleOrder) {
          redirectPath = '/dashboard/direct-sales/orders?tab=received';
        }
        else if (notification.type === 'OFFER_ACCEPTED') {
            const tenderId = notification.data?.tender?._id || notification.data?.tenderId || notification.data?.tender;
            if (tenderId && typeof tenderId === 'string') {
               redirectPath = `/tender-details/${tenderId}`;
            }
            else {
              const dsId = notification.data?.directSale?._id || notification.data?.directSaleId;
              if (dsId && typeof dsId === 'string') {
                  redirectPath = `/direct-sale/${dsId}`;
              }
              else {
                // Fallback attempt for auction
                 const auctionId = notification.data?.auction?._id || notification.data?.auctionId || notification.data?.auction;
                 if (auctionId && typeof auctionId === 'string') {
                    redirectPath = `/auction-details/${auctionId}`;
                 } else {
                    redirectPath = '/dashboard/direct-sales/orders';
                 }
              }
            }
        }
        else if (notification.type === 'ORDER' && 
                  (titleLower.includes('confirmée') || titleLower.includes('confirmed') ||
                   titleLower.includes('effectuée') || titleLower.includes('placed'))) {
          redirectPath = '/dashboard/direct-sales/orders?tab=my';
        }
        else if (notification.type === 'MESSAGE_RECEIVED' || notification.type === 'MESSAGE_ADMIN' || notification.type === 'CHAT_CREATED') {
             const chatId = notification.data?.chatId || notification.chatId;
             if (chatId) {
                 redirectPath = `/dashboard/chat?chatId=${chatId}`;
             } else {
                 redirectPath = '/dashboard/chat';
             }
        }
      }

      if (redirectPath) {
        console.log('🎯 Executing redirect to:', redirectPath);
        router.push(redirectPath);
      }

      if (notification.source === 'general') {
        await markGeneralAsRead(notification._id);
      }
      setIsOpen(false);

    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllGeneralAsRead();
      await refreshAll();
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BID_CREATED': return <BsHammer size={16} color="#0063b1" />;
      case 'BID_ENDED': return <BsExclamationCircle size={16} color="#ffc107" />;
      case 'BID_WON': return <BsTrophy size={16} color="#ffd700" />;
      case 'MESSAGE_ADMIN':
      case 'MESSAGE_RECEIVED': return <BsChat size={16} color="#28a745" />;
      default: return <BsBell size={16} color="#666" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const isMobile = windowWidth <= 768;

  // Render Portal Content
  const renderDropdown = () => {
    if (!isOpen) return null;

    return createPortal(
      <>
        {/* Overlay - Transparent on Desktop, Dimmed on Mobile */}
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isMobile ? 'rgba(0,0,0,0.5)' : 'transparent',
                zIndex: 99999, // High z-index to be on top of everything
                transition: 'background-color 0.2s ease'
            }}
            onClick={() => setIsOpen(false)}
        />
        
        {/* Dropdown Content */}
        <div 
            ref={dropdownRef}
            style={{
                position: 'fixed',
                ...(isMobile ? {
                    // Mobile Styles
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'calc(100vw - 32px)',
                    maxWidth: '400px',
                    maxHeight: '80vh'
                } : {
                    // Desktop Styles
                    top: dropdownPos.top,
                    right: dropdownPos.right,
                    width: '360px',
                    transform: 'none'
                }),
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: isMobile ? '0 10px 25px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.15)',
                zIndex: 100000, // Higher than overlay
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
            {/* Header */}
            <div style={{
                padding: '15px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(to right, #fafafa, #ffffff)',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#333' }}>
                    <BsBell size={18} color="#0063b1" />
                    <span>{t('notifications.title') || 'Notifications'}</span>
                    {totalUnreadCount > 0 && (
                        <span style={{
                            background: '#ff3366', color: 'white', borderRadius: '10px',
                            padding: '1px 8px', fontSize: '12px', fontWeight: 'bold'
                        }}>
                            {totalUnreadCount}
                        </span>
                    )}
                </div>
                {totalUnreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} style={{ 
                        color: '#0063b1', background: 'none', border: 'none', 
                        fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: '4px 8px' 
                    }}>
                        {t('notifications.markAllAsRead')}
                    </button>
                )}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1, maxHeight: isMobile ? 'calc(80vh - 100px)' : '400px' }}>
                {generalLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        <div style={{ width: '24px', height: '24px', border: '3px solid #eee', borderTop: '3px solid #0063b1', borderRadius: '50%', margin: '0 auto 10px', animation: 'spin 1s linear infinite' }} />
                        {t('notifications.loading')}
                    </div>
                ) : allNotifications.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        <BsBell size={32} color="#eee" style={{ margin: '0 auto 10px', display: 'block' }} />
                        <p>{t('notifications.noNotifications')}</p>
                    </div>
                ) : (
                    allNotifications.slice(0, 10).map((notification) => {
                        const priceMatch = notification.title?.match(/([\d,]+\.?\d*)\s*DA/i);
                        const priceAmount = priceMatch ? priceMatch[1] : null;
                        const title = priceAmount ? notification.title.replace(/\s*-\s*[\d,]+\.?\d*\s*DA/i, '').trim() : notification.title;
                        const senderName = (notification as any).senderName || (notification as any).data?.senderName || (notification as any).data?.winnerName || (notification as any).data?.buyerName;

                        return (
                            <div key={notification._id} onClick={() => handleMarkAsRead(notification)}
                                style={{
                                    padding: '12px 15px',
                                    borderBottom: '1px solid #f8f9fa',
                                    cursor: 'pointer',
                                    background: notification.read ? 'white' : '#f0f8ff',
                                    borderLeft: notification.read ? '3px solid transparent' : '3px solid #0063b1',
                                    transition: 'background 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ marginTop: '2px' }}>{getNotificationIcon(notification.type)}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <span style={{ fontWeight: notification.read ? 400 : 600, fontSize: '14px', color: '#333' }}>{title}</span>
                                            {priceAmount && <span style={{ background: '#0063b1', color: 'white', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', height: 'fit-content' }}>{priceAmount} DA</span>}
                                        </div>
                                        <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#666', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {notification.message}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#999' }}>
                                            {senderName && <span style={{ color: '#0063b1', display: 'flex', alignItems: 'center', gap: '4px' }}>👤 {senderName}</span>}
                                            <span>{formatTime(notification.createdAt)}</span>
                                        </div>
                                    </div>
                                    {!notification.read && <div style={{ width: '8px', height: '8px', background: '#0063b1', borderRadius: '50%', position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }} />}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            {allNotifications.length > 10 && (
                <div style={{ padding: '10px', textAlign: 'center', background: '#fafafa', borderTop: '1px solid #eee', fontSize: '13px', color: '#666' }}>
                    {t('notifications.showingCount', { shown: 10, total: allNotifications.length })}
                </div>
            )}
        </div>

        <style jsx>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
      </>,
      document.body
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isOpen ? '#f1f1f1' : '#f8f9fa',
          border: 'none', borderRadius: '50%',
          width: variant === 'header' ? '40px' : '48px', height: variant === 'header' ? '40px' : '48px',
          cursor: 'pointer', transition: 'all 0.3s ease',
          boxShadow: isOpen ? '0 4px 15px rgba(0,0,0,0.08)' : '0 2px 10px rgba(0,0,0,0.05)'
        }}
        title="Notifications"
      >
        <BsBell size={variant === 'header' ? 20 : 24} color={isOpen ? '#0063b1' : '#666'} />
        {totalUnreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-8px', right: '-8px',
            background: '#ff3366', color: 'white', borderRadius: '50%',
            padding: '2px 6px', fontSize: '12px', fontWeight: 'bold',
            minWidth: '20px', height: '20px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #fff'
          }}>
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>
      {renderDropdown()}
    </>
  );
});

export default NotificationBellStable;
