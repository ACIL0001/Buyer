import { useState, useEffect, useRef } from 'react';
import { BiBell, BiPhone, BiMessageDetail } from 'react-icons/bi';
import useNotification from '@/hooks/useNotification';
import useTotalNotifications from '@/hooks/useTotalNotifications';
import { useRouter } from 'next/navigation';
import { normalizeImageUrl } from '@/utils/url';
import ConfirmedOrderModal from '@/components/notifications/ConfirmedOrderModal';
import FeedbackModal from '@/components/notifications/FeedbackModal';

interface BellNotificationsProps {
  variant?: 'header' | 'sidebar';
  onOpenChange?: (isOpen: boolean) => void;
}

export default function BellNotifications({ variant = 'header', onOpenChange }: BellNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const { notifications, loading, refresh, markAsRead } = useNotification();
  const { totalUnreadCount: unreadCount, refreshAll } = useTotalNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // State for Feedback Modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackModalData, setFeedbackModalData] = useState<{
    auctionId: string;
    auctionTitle: string;
  }>({ auctionId: '', auctionTitle: '' });

  console.log('BellNotifications: notifications count:', notifications.length);
  console.log('BellNotifications: unreadCount:', unreadCount);
  console.log('BellNotifications: loading:', loading);

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpenChange) {
      onOpenChange(true);
      refreshAll();
    }
  };

  // Track window width for responsive positioning
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    try {
      console.log('🔔 Notification clicked:', notification._id);
      
      const data = notification.data as any;
      let redirectPath: string | null = null;
      const titleLower = notification.title?.toLowerCase() || '';
      const messageLower = notification.message?.toLowerCase() || '';

      // 1. PUBLIC CREATION NOTIFICATIONS
      if (notification.type === 'TENDER_CREATED') {
          const id = data?._id || data?.id || data?.tenderId;
          if (id) redirectPath = `/tender-details/${id}`;
      }
      else if (notification.type === 'AUCTION_CREATED' || 
              (notification.type === 'BID_CREATED' && (titleLower.includes('créée') || titleLower.includes('created')))) {
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
      // 3. ORDER CONFIRMED / PLACED
      else if (notification.type === 'ORDER' && 
               (titleLower.includes('confirmée') || titleLower.includes('confirmed') ||
                titleLower.includes('effectuée') || titleLower.includes('placed'))) {
          const contactNumber = data?.directSale?.contactNumber || data?.contactNumber || data?.order?.contactNumber;
          const cid = data?.chatId || data?.chat?._id || data?.order?.chatId;
          
          // Debug: log full data to identify seller fields
          console.log('📦 ORDER notification full data:', JSON.stringify(data, null, 2));

          // Comprehensive Title Extraction
          const saleTitle = data?.directSale?.title || 
                            data?.directSale?.name || 
                            data?.order?.directSale?.title ||
                            data?.title || 
                            data?.name || 
                            "Article MazadClick";

          // Comprehensive Quantity Extraction
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
      else if (notification.type === 'FEEDBACK_REMINDER' || titleLower.includes('avis sur votre achat') || titleLower.includes('rate experience')) {
          console.log('📝 Opening Feedback Modal for notification:', notification._id);
          // Open Feedback Modal
          setFeedbackModalData({
              auctionId: data?.auctionId || data?._id || (data?.entityType === 'BID' ? data?.entityId : ''),
              auctionTitle: data?.title || data?.auctionTitle || "Enchère"
          });
          setFeedbackModalOpen(true);
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
      // 5. CHAT REDIRECTION (Fallback)
      else if (data?.chatId) {
          redirectPath = `/dashboard/chat?conversationId=${data.chatId}`;
      }
      // 6. OTHER
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

      // Mark as read (non-blocking)
      markAsRead(notification._id).catch(err => console.error('Failed to mark read:', err));
      setIsOpen(false);

      if (redirectPath) {
        console.log('🎯 Redirecting to:', redirectPath);
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('❌ Error handling notification click:', error);
      setIsOpen(false);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BID_WON':
      case 'AUCTION_WON':
        return '🏆';
      case 'CHAT_CREATED':
      case 'MESSAGE_RECEIVED':
        return '💬';
      case 'BID_CREATED':
      case 'TENDER_CREATED':
      case 'DIRECT_SALE_CREATED':
        return '🆕';
      case 'NEW_OFFER':
      case 'ORDER_RECEIVED':
        return '💰';
      case 'BID_ENDED':
      case 'AUCTION_LOST':
        return '⏰';
      case 'OFFER_ACCEPTED':
      case 'ORDER':
        return '✅';
      case 'OFFER_DECLINED':
        return '❌';
      default:
        return '📢';
    }
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
      >
        <BiBell size={variant === 'header' ? 20 : 24} color={isOpen ? '#0063b1' : '#666'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#FF3366',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 5,
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 0 0 2px #fff'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          {windowWidth <= 768 && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 999,
                animation: 'fadeIn 0.2s ease-out'
              }}
              onClick={() => setIsOpen(false)}
            />
          )}
          
          <div style={{
            position: windowWidth <= 768 ? 'fixed' : 'absolute',
            top: windowWidth <= 768 ? '50%' : 'calc(100% + 10px)',
            left: windowWidth <= 768 ? '50%' : 'auto',
            right: windowWidth <= 768 ? 'auto' : 0,
            transform: windowWidth <= 768 ? 'translate(-50%, -50%)' : 'none',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            width: windowWidth <= 768 ? 'calc(100vw - 32px)' : '360px',
            maxWidth: windowWidth <= 768 ? '400px' : '360px',
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
              <BiBell size={18} color="#0063b1" />
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  background: '#ff3366',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                // Mark all as read
                notifications.forEach(notification => {
                  if (!notification.read) {
                    markAsRead(notification._id);
                  }
                });
              }}
              style={{ 
                color: '#0063b1',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '15px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 99, 177, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Tout marquer comme lu
            </button>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#adb5bd'
              }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #0063b1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 15px'
                }}></div>
                <p style={{ fontSize: '14px', margin: '5px 0' }}>Chargement des notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#adb5bd'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: '#f8f9fa',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px'
                }}>
                  <BiBell size={24} color="#d1d5db" />
                </div>
                <p style={{ margin: '5px 0', fontSize: '15px', fontWeight: 500 }}>Aucune notification</p>
                <span style={{ fontSize: '13px', display: 'block', maxWidth: '200px', margin: '0 auto' }}>
                  Vos notifications apparaîtront ici
                </span>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '12px 15px',
                    borderBottom: '1px solid #f8f9fa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: notification.read ? 'white' : '#f0f8ff',
                    borderLeft: notification.read ? '3px solid transparent' : '3px solid #0063b1'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = notification.read ? '#fafafa' : '#e6f3ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = notification.read ? 'white' : '#f0f8ff';
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      fontSize: '20px',
                      lineHeight: 1,
                      marginTop: '2px'
                    }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: notification.read ? 400 : 600,
                        color: '#333',
                        fontSize: '14px',
                        marginBottom: '4px',
                        lineHeight: 1.3
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: 1.4,
                        marginBottom: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#999',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{(notification as { formattedDate?: string }).formattedDate || new Date(notification.createdAt).toLocaleDateString()}</span>
                        {!notification.read && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            background: '#0063b1',
                            borderRadius: '50%'
                          }}></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div style={{
              padding: '10px 15px',
              textAlign: 'center',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa'
            }}>
              <span style={{
                color: '#666',
                fontSize: '13px'
              }}>
                Affichage de 10 sur {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
        </>
      )}

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

      <FeedbackModal 
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        auctionId={feedbackModalData.auctionId}
        auctionTitle={feedbackModalData.auctionTitle}
      />
    </div>
  );
} 