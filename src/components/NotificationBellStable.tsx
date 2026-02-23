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
import { normalizeImageUrl } from '@/utils/url';
import { ChatAPI } from '@/app/api/chat';
import ConfirmedOrderModal from '@/components/notifications/ConfirmedOrderModal';
import AuctionWonModal from '@/components/notifications/AuctionWonModal';

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
  
  // State for Confirmed Order Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    contactNumber: string;
    chatId?: string;
    saleTitle?: string;
    image?: string;
    quantity?: number;
    price?: number;
    sellerName?: string;
  }>({ contactNumber: '' });

  // State for Auction Won Modal
  const [auctionWonModalOpen, setAuctionWonModalOpen] = useState(false);
  const [auctionWonData, setAuctionWonData] = useState<{
    auctionTitle: string;
    sellerName: string;
    price: number;
    chatId?: string;
    image?: string;
    sellerId?: string;
    quantity?: number;
  }>({ auctionTitle: '', sellerName: '', price: 0 });
  
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

  // Combined notifications - Remove duplicates based on _id
  const uniqueNotifications = new Map();
  [...generalNotifications.map(n => ({ ...n, source: 'general' }))].forEach(n => {
    if (!uniqueNotifications.has(n._id)) {
      uniqueNotifications.set(n._id, n);
    }
  });
  const allNotifications = Array.from(uniqueNotifications.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
      
      const data = notification.data as any;
      let redirectPath: string | null = null;
      
      const titleLower = notification.title?.toLowerCase() || '';
      const messageLower = notification.message?.toLowerCase() || '';

      // 1. PUBLIC CREATION NOTIFICATIONS (Prioritize these - for newly created items)
      if (notification.type === 'TENDER_CREATED') {
          const id = data?._id || data?.id || data?.tenderId;
          if (id) redirectPath = `/tender-details/${id}`;
      }
      else if (notification.type === 'AUCTION_CREATED' || 
              (notification.type === 'BID_CREATED' && 
               (titleLower.includes('créée') || titleLower.includes('created')))) {
          const id = data?._id || data?.id || data?.auctionId;
          if (id) redirectPath = `/auction-details/${id}`;
      }
      else if (notification.type === 'DIRECT_SALE_CREATED') {
          const id = data?._id || data?.id || data?.directSaleId;
          if (id) redirectPath = `/direct-sale/${id}`;
      }
      // 2. COMMENT REDIRECTION
      else if (notification.type === 'COMMENT_RECEIVED' || notification.type === 'COMMENT_REPLY') {
          const auctionId = data?.auctionId || (data?.entityType === 'BID' ? data?.entityId : null);
          const tenderId = data?.tenderId || (data?.entityType === 'TENDER' ? data?.entityId : null);
          const directSaleId = data?.directSaleId || (data?.entityType === 'DIRECT_SALE' ? data?.entityId : null);
          const commentId = data?.commentId || data?._id;

          if (auctionId) redirectPath = `/auction-details/${auctionId}${commentId ? `?commentId=${commentId}` : ''}`;
          else if (tenderId) redirectPath = `/tender-details/${tenderId}${commentId ? `?commentId=${commentId}` : ''}`;
          else if (directSaleId) redirectPath = `/direct-sale/${directSaleId}${commentId ? `?commentId=${commentId}` : ''}`;
      }
      // 3. ORDER CONFIRMED / PLACED - Prioritize showing modal for buyer
      else if (notification.type === 'ORDER' && 
               (titleLower.includes('confirmée') || titleLower.includes('confirmed') ||
                titleLower.includes('effectuée') || titleLower.includes('placed'))) {
          const contactNumber = data?.directSale?.contactNumber || data?.contactNumber || data?.order?.contactNumber;
          const cid = data?.chatId || data?.chat?._id || data?.order?.chatId;

          // Debug: log full data to identify seller fields
          console.log('📦 ORDER notification full data:', JSON.stringify(data, null, 2));

          // Title Extraction
          const saleTitle = data?.directSale?.title || 
                            data?.directSale?.name || 
                            data?.order?.directSale?.title ||
                            data?.title || 
                            data?.name || 
                            "Article MazadClick";

          // Quantity Extraction
          const quantity = data?.quantity || 
                           data?.orderedQuantity || 
                           data?.qty || 
                           data?.order?.quantity ||
                           data?.directSale?.quantity ||
                           1;

          // Comprehensive Seller Name Extraction — covers every possible field path
          const owner = data?.directSale?.owner || data?.order?.directSale?.owner;
          const seller = data?.seller || data?.order?.seller;
          const sellerFirstLast = (seller?.firstName && seller?.lastName)
            ? `${seller.firstName} ${seller.lastName}`
            : (owner?.firstName && owner?.lastName)
              ? `${owner.firstName} ${owner.lastName}`
              : (data?.senderFirstName && data?.senderLastName)
                ? `${data.senderFirstName} ${data.senderLastName}`
                : null;
          const sellerName: string | null =
            // Company name takes priority (professional/reseller accounts)
            seller?.companyName || seller?.entreprise ||
            owner?.companyName || owner?.entreprise ||
            data?.companyName ||
            // Then full name paths
            sellerFirstLast ||
            seller?.name || seller?.username ||
            owner?.name || owner?.username ||
            data?.sellerName || data?.ownerName || data?.vendorName ||
            data?.seller_name || data?.owner_name ||
            data?.directSale?.sellerName ||
            data?.senderName ||
            null;

          const price = data?.directSale?.price || data?.order?.price || data?.price;

          const image = normalizeImageUrl(
            data?.directSale?.thumbs?.[0]?.url || 
            data?.directSale?.thumbs?.[0] || 
            data?.directSale?.images?.[0] || 
            data?.directSale?.image ||
            data?.image || data?.thumbnail
          );

          if (contactNumber) {
              console.log('🎉 Showing ConfirmedOrderModal', { 
                  image, 
                  quantity, 
                  sellerName, 
                  saleTitle 
              });
              setModalData({
                  contactNumber,
                  chatId: cid,
                  saleTitle,
                  image,
                  quantity: Number(quantity),
                  price: price ? Number(price) : undefined,
                  sellerName: sellerName || undefined
              });
              setModalOpen(true);
          }
 else if (cid) {
              redirectPath = `/dashboard/chat?chatId=${cid}`;
          } else {
              redirectPath = '/dashboard/direct-sales/orders?tab=my';
          }
      }
      // NEW: AUCTION WON
      else if (notification.type === 'AUCTION_WON') {
           let auctionTitle = data?.productTitle || data?.auction?.title;

           if (!auctionTitle && notification.message) {
                // Try to extract from message: `Vous avez remporté l'enchère "TITLE" avec...`
                const match = notification.message.match(/l'enchère "([^"]+)"/);
                if (match && match[1]) {
                    auctionTitle = match[1];
                }
           }
           if (!auctionTitle) auctionTitle = "Article";
           const sellerName = data?.sellerName || "Vendeur";
           const price = Number(data?.amount || data?.price || 0);
           const chatId = data?.chatId;
           const sellerId = data?.sellerId || data?.seller?._id || notification.senderId;

           // Extract image if available in data
           const rawImage = data?.auction?.thumbs?.[0] || data?.image || data?.thumbnail;
           const image = normalizeImageUrl(rawImage);
           
           // Quantity extraction
           const quantity = Number(data?.quantity || data?.orderedQuantity || 1);

           console.log('🎉 Showing AuctionWonModal', { auctionTitle, sellerName, price, chatId, sellerId });
           setAuctionWonData({ auctionTitle, sellerName, price, chatId, image, sellerId, quantity });
           setAuctionWonModalOpen(true);
      }
      // 4. AUCTION/TENDER OFFER REDIRECTION (PRIORITIZED)
      const isSellerReceivingTenderBid = !titleLower.includes('créée') && 
                                        (notification.type === 'NEW_OFFER' || notification.type === 'BID_PLACED' || titleLower.includes('offre')) && 
                                        (data?.tender || data?.tenderId || messageLower.includes('soumission') || messageLower.includes('appel d\'offres'));
      
      const isSellerReceivingAuctionBid = !titleLower.includes('créée') && 
                                          (notification.type === 'BID_CREATED' || 
                                           notification.type === 'NEW_OFFER' || 
                                           notification.type === 'BID_PLACED' ||
                                           messageLower.includes('enchère') ||
                                           titleLower.includes('offre') ||
                                           titleLower.includes('nouvelle offre')) && 
                                          (data?.auction || data?.auctionId || data?.entityType === 'BID' || (messageLower.includes('enchère') && !messageLower.includes('soumission')));

      const isSellerReceivingDirectSaleOrder = (
          (titleLower.includes('nouvelle') && titleLower.includes('commande') && !titleLower.includes('créée')) ||
          (notification.type === 'ORDER' && !titleLower.includes('confirmée')) ||
          (notification.type === 'NEW_OFFER' && (titleLower.includes('commande') || messageLower.includes('commande')))
      );

      if (isSellerReceivingAuctionBid) {
          const aId = data?.auctionId || 
                      data?.auction?._id || 
                      (typeof data?.auction === 'string' ? data.auction : null) || 
                      data?.bid?.auction || 
                      data?.offer?.auction ||
                      (data?.entityType === 'BID' ? data?.entityId : null);
          
          const bId = data?.bidId || 
                      data?.offerId || 
                      data?.bid?._id || 
                      data?.offer?._id || 
                      data?.id || 
                      data?._id || 
                      data?.entityId;

          if (aId && bId) {
              redirectPath = `/dashboard/auctions/${String(aId)}/offers/${String(bId)}`;
          } else {
              redirectPath = '/dashboard/offers?tab=received';
          }
      }
      else if (isSellerReceivingTenderBid) {
          redirectPath = '/dashboard/tender-bids?tab=received';
      }
      else if (isSellerReceivingDirectSaleOrder) {
          redirectPath = '/dashboard/direct-sales/orders?tab=received';
      }
      // 5. CHAT REDIRECTION (Generic fallback)
      else if (data?.chatId) {
          redirectPath = `/dashboard/chat?conversationId=${data.chatId}`;
      }
      // 6. OTHER REDIRECTION
      else if (notification.type === 'OFFER_ACCEPTED') {
          const tenderId = data?.tender?._id || data?.tenderId || data?.tender;
          const auctionId = data?.auction?._id || data?.auctionId || data?.auction;
          const dsId = data?.directSale?._id || data?.directSaleId;
          
          if (tenderId && typeof tenderId === 'string') redirectPath = `/tender-details/${tenderId}`;
          else if (auctionId && typeof auctionId === 'string') redirectPath = `/auction-details/${auctionId}`;
          else if (dsId && typeof dsId === 'string') redirectPath = `/direct-sale/${dsId}`;
      }
      else if (titleLower.includes('soumise') || titleLower.includes('submitted')) {
          if (data?.tender || data?.tenderId) redirectPath = '/dashboard/tender-bids?tab=my';
      }

      // Mark as read (in background)
      if (notification.source === 'general') {
        markGeneralAsRead(notification._id).catch(err => console.error('Failed to mark read:', err));
      }
      
      // Close dropdown
      setIsOpen(false);

      if (redirectPath) {
        console.log('🎯 Executing redirect to:', redirectPath);
        router.push(redirectPath);
      }

    } catch (error) {
      console.error('❌ Error in notification click handler:', error);
      setIsOpen(false);
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
                    width: '320px',
                    maxWidth: '90vw',
                    maxHeight: '60vh'
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
                    allNotifications.slice(0, 10).map((notification, index) => {
                        const priceMatch = notification.title?.match(/([\d,]+\.?\d*)\s*DA/i);
                        const priceAmount = priceMatch ? priceMatch[1] : null;
                        const title = priceAmount ? notification.title.replace(/\s*-\s*[\d,]+\.?\d*\s*DA/i, '').trim() : notification.title;
                        const sender = (notification as any).data?.sender || (notification as any).data?.bidder || (notification as any).data?.user;
                        const senderName = (notification as any).senderName || 
                                         (notification as any).data?.senderName || 
                                         (notification as any).data?.bidderName || 
                                         (sender?.firstName ? `${sender.firstName} ${sender.lastName || ''}`.trim() : null) ||
                                         sender?.companyName || sender?.enterprise ||
                                         (notification as any).data?.winnerName || 
                                         (notification as any).data?.buyerName ||
                                         'Utilisateur';

                        return (
                            <div key={notification._id || `notif-${index}`} onClick={() => handleMarkAsRead(notification)}
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
      
      <ConfirmedOrderModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        contactNumber={modalData.contactNumber}
        chatId={modalData.chatId}
        saleTitle={modalData.saleTitle}
        image={modalData.image}
        quantity={modalData.quantity}
        price={modalData.price}
        sellerName={modalData.sellerName}
      />

      <AuctionWonModal 
        isOpen={auctionWonModalOpen}
        onClose={() => setAuctionWonModalOpen(false)}
        auctionTitle={auctionWonData.auctionTitle}
        sellerName={auctionWonData.sellerName}
        price={auctionWonData.price}
        chatId={auctionWonData.chatId}
        image={auctionWonData.image}
        sellerId={auctionWonData.sellerId}
        quantity={auctionWonData.quantity}
      />
    </>
  );
});

export default NotificationBellStable;
