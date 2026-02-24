"use client";
import { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BsBell, BsHammer, BsTrophy, BsExclamationCircle, BsChat } from 'react-icons/bs';
import { normalizeImageUrl } from '@/utils/url';
import useNotification from '@/hooks/useNotification';
import useTotalNotifications from '@/hooks/useTotalNotifications';
import { useTranslation } from 'react-i18next';
import ConfirmedOrderModal from '@/components/notifications/ConfirmedOrderModal';
import AuctionWonModal from '@/components/notifications/AuctionWonModal';
import FeedbackModal from '@/components/notifications/FeedbackModal';
import TenderWonModal from '@/components/notifications/TenderWonModal';


// Fallback icon component
const FallbackIcon = () => <BsBell size={16} color="#666" />;

interface NotificationBellProps {
  variant?: 'header' | 'sidebar';
  onOpenChange?: (isOpen: boolean) => void;
}

const NotificationBell = memo(function NotificationBell({ variant = 'header', onOpenChange }: NotificationBellProps) {
  // Always call hooks in the same order - useState first, then other hooks
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [clickedNotificationId, setClickedNotificationId] = useState<string | null>(null);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    sellerId?: string;
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

  // State for Feedback Modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    auctionId: string;
    auctionTitle: string;
  }>({ auctionId: '', auctionTitle: '' });

  // State for Tender Won Modal
  const [tenderModalOpen, setTenderModalOpen] = useState(false);
  const [tenderModalData, setTenderModalData] = useState<{
    tenderTitle: string;
    ownerName: string;
    quantity?: number | string;
    totalPrice?: number;
    contactNumber?: string;
    chatId?: string;
    sellerId?: string;
    isMieuxDisant?: boolean;
  }>({ tenderTitle: '', ownerName: '', contactNumber: '', sellerId: undefined });
  
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

  const toggleDropdown = (e?: React.MouseEvent) => {
     if (e) {
       e.preventDefault();
       e.stopPropagation();
     }

    if (!isOpen) {
        updateDropdownPosition();
    }

    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpenChange) {
      onOpenChange(true);
    }
  };

  // Track window width for responsive positioning
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (isOpen) {
        updateDropdownPosition();
      }
    };
    
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen]);

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
    if (!dateString) return t('notifications.justNow');
    
    const date = new Date(dateString);
    // Check for invalid date
    if (isNaN(date.getTime())) return t('notifications.justNow');

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    // Handle future dates or very small diffs
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

            // Comprehensive Seller Name Extraction
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
              seller?.companyName || seller?.entreprise ||
              owner?.companyName || owner?.entreprise ||
              data?.companyName ||
              sellerFirstLast ||
              seller?.name || seller?.username ||
              owner?.name || owner?.username ||
              data?.sellerName || data?.ownerName || data?.vendorName ||
              data?.seller_name || data?.owner_name ||
              data?.directSale?.sellerName ||
              data?.senderName ||
              "Vendeur";

            const price = data?.directSale?.price || data?.order?.price || data?.price;
            const rawImage = data?.directSale?.thumbs?.[0]?.url || 
                             data?.directSale?.thumbs?.[0] || 
                             data?.directSale?.images?.[0] || 
                             data?.directSale?.image ||
                             data?.directSale?.thumbnail ||
                             data?.image || data?.thumbnail;
            const image = normalizeImageUrl(rawImage);

            if (contactNumber) {
                setModalData({
                    contactNumber,
                    chatId: cid,
                    saleTitle,
                    image,
                    quantity: Number(quantity),
            price: price ? Number(price) : undefined,
            sellerName: sellerName || undefined,
            sellerId: seller?.id || seller?._id || owner?._id || data?.senderId || undefined
        });
        setModalOpen(true);
            } else if (cid) {
                redirectPath = `/dashboard/chat?conversationId=${cid}`;
            } else {
                redirectPath = '/dashboard/direct-sales/orders?tab=my';
            }
        }
        // 4. AUCTION WON
        else if (notification.type === 'AUCTION_WON') {
             let auctionTitle = data?.productTitle || data?.auction?.title;

             if (!auctionTitle && notification.message) {
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

             const rawImage = data?.auction?.thumbs?.[0] || data?.image || data?.thumbnail;
             const image = normalizeImageUrl(rawImage);
             
             const quantity = Number(data?.quantity || data?.orderedQuantity || 1);

             setAuctionWonData({ auctionTitle, sellerName, price, chatId, image, sellerId, quantity });
             setAuctionWonModalOpen(true);
        }
        // 5. FEEDBACK REMINDER
        else if (notification.type === 'FEEDBACK_REMINDER' || titleLower.includes('avis sur votre achat') || titleLower.includes('rate experience')) {
             const auctionId = data?.auctionId || data?._id || data?.auction?._id || (data?.entityType === 'BID' ? data?.entityId : '');
             const auctionTitle = data?.title || data?.auctionTitle || data?.productTitle || data?.auction?.title || "Article";
             
             if (auctionId) {
                 setFeedbackData({ auctionId, auctionTitle });
                 setFeedbackModalOpen(true);
             }
        }
        // 6. CHAT REDIRECTION (Fallback)
        else if (data?.chatId && notification.type !== 'OFFER_ACCEPTED' && notification.type !== 'BID_WON' && !titleLower.includes('acceptée')) {
            redirectPath = `/dashboard/chat?conversationId=${data.chatId}`;
        }
        // 7. SELLER / OTHER NOTIFICATIONS
        else {
            const isSellerReceivingTenderBid = !titleLower.includes('créée') && notification.type !== 'OFFER_ACCEPTED' && 
                                              (notification.type === 'NEW_OFFER' || notification.type === 'BID_PLACED' || (titleLower.includes('offre') && !titleLower.includes('acceptée') && !titleLower.includes('refusée'))) && 
                                              (data?.tender || data?.tenderId || messageLower.includes('soumission') || messageLower.includes('appel d\'offres'));
            
            const isSellerReceivingAuctionBid = !titleLower.includes('créée') && notification.type !== 'OFFER_ACCEPTED' && 
                                                (notification.type === 'BID_CREATED' || 
                                                 notification.type === 'NEW_OFFER' || 
                                                 notification.type === 'BID_PLACED' ||
                                                 messageLower.includes('enchère') ||
                                                 (titleLower.includes('offre') && !titleLower.includes('acceptée') && !titleLower.includes('refusée')) ||
                                                 titleLower.includes('nouvelle offre')) && 
                                                (data?.auction || data?.auctionId || data?.entityType === 'BID' || (messageLower.includes('enchère') && !messageLower.includes('soumission')));

            const isSellerReceivingDirectSaleOrder = (
                (titleLower.includes('nouvelle') && titleLower.includes('commande') && !titleLower.includes('créée')) ||
                (notification.type === 'ORDER' && !titleLower.includes('confirmée')) ||
                (notification.type === 'NEW_OFFER' && (titleLower.includes('commande') || messageLower.includes('commande')))
            );

            if (isSellerReceivingAuctionBid) {
                const aId = data?.auctionId || data?.auction?._id || (typeof data?.auction === 'string' ? data.auction : null) || data?.bid?.auction || data?.offer?.auction || (data?.entityType === 'BID' ? data?.entityId : null);
                const bId = data?.bidId || data?.offerId || data?.bid?._id || data?.offer?._id || data?.id || data?._id || data?.entityId;
                
                if (aId && bId) redirectPath = `/dashboard/auctions/${String(aId)}/offers/${String(bId)}`;
                else redirectPath = '/dashboard/offers?tab=received';
            }
            else if (isSellerReceivingTenderBid) redirectPath = '/dashboard/tender-bids?tab=received';
            else if (isSellerReceivingDirectSaleOrder) redirectPath = '/dashboard/direct-sales/orders?tab=received';
            else if (titleLower.includes('soumise') || titleLower.includes('submitted')) {
                if (data?.tender || data?.tenderId) redirectPath = '/dashboard/tender-bids?tab=my';
            }
            else if (notification.type === 'OFFER_ACCEPTED' || titleLower.includes('acceptée')) {
                const tenderId = data?.tender?._id || data?.tenderId || data?.tender;
                const auctionId = data?.auction?._id || data?.auctionId || data?.auction;
                const dsId = data?.directSale?._id || data?.directSaleId;
                
                if (tenderId && (data?.tenderBid || data?.bidAmount)) {
                  const tenderTitle = data?.tenderTitle || data?.tender?.title || "Appel d'offres";
                  const ownerName = data?.ownerName || (data?.tender?.owner ? `${data.tender.owner.firstName || ''} ${data.tender.owner.lastName || ''}`.trim() : 'Acheteur');
                  const quantity = data?.quantity || data?.tender?.quantity;
                  const totalPrice = data?.bidAmount || data?.tenderBid?.bidAmount;
                  const contactNumber = data?.contactNumber || data?.tender?.contactNumber;
                  const chatId = data?.chatId;
      
                  setTenderModalData({
                    tenderTitle,
                    ownerName,
                    quantity,
                    totalPrice,
                    contactNumber,
            chatId,
            sellerId: data?.ownerId || data?.senderId || data?.tender?.owner?._id || undefined,
            isMieuxDisant: true
          });
                  setTenderModalOpen(true);
                }
                else if (tenderId && typeof tenderId === 'string') redirectPath = `/tender-details/${tenderId}`;
                else if (auctionId && typeof auctionId === 'string') redirectPath = `/auction-details/${auctionId}`;
                else if (dsId && typeof dsId === 'string') redirectPath = `/direct-sale/${dsId}`;
            }
            else if (notification.type === 'BID_WON' && (data?.tenderId || data?.tender)) {
                const tenderTitle = data?.tenderTitle || data?.tender?.title || "Appel d'offres";
                const ownerName = data?.ownerName || 'Acheteur';
                const quantity = data?.quantity;
                const totalPrice = data?.finalPrice || data?.bidAmount;
                const contactNumber = data?.contactNumber;
                const chatId = data?.chatId;
      
                setTenderModalData({
                  tenderTitle,
                  ownerName,
                  quantity,
          totalPrice,
          contactNumber,
          chatId,
          sellerId: data?.ownerId || data?.senderId || data?.tender?.owner?._id || undefined,
          isMieuxDisant: false
        });
                setTenderModalOpen(true);
            }
        }

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

  const isMobile = windowWidth <= 768;

  const renderDropdown = () => {
    if (!isOpen) return null;

    return createPortal(
      <>
        {/* Overlay */}
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isMobile ? 'rgba(0,0,0,0.5)' : 'transparent',
                zIndex: 99999,
                transition: 'background-color 0.2s ease'
            }}
            onClick={() => setIsOpen(false)}
        />

        {/* Dropdown */}
        <div 
            ref={dropdownRef}
            style={{
                position: 'fixed',
                ...(isMobile ? {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '320px',
                    maxWidth: '90vw',
                    maxHeight: '60vh'
                } : {
                    top: dropdownPos.top,
                    right: dropdownPos.right,
                    width: '360px',
                    transform: 'none'
                }),
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: isMobile ? '0 10px 25px rgba(0,0,0,0.2)' : '0 10px 25px rgba(0,0,0,0.15)',
                zIndex: 100000,
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(0,0,0,0.05)'
            }}
            onClick={(e) => e.stopPropagation()}
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
          
          {/* Content */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: isMobile ? 'calc(80vh - 100px)' : '400px' }}>
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
          
          {/* Footer - Removed as per user request */}
          {/* <div style={{
            padding: '12px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
            background: 'linear-gradient(to right, #f8f9fa, #ffffff)',
            flexShrink: 0
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
          </div> */}
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
        type="button"
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
        sellerId={modalData.sellerId}
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

      <FeedbackModal 
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        auctionId={feedbackData.auctionId}
        auctionTitle={feedbackData.auctionTitle}
      />

      <TenderWonModal 
        isOpen={tenderModalOpen}
        onClose={() => setTenderModalOpen(false)}
        tenderTitle={tenderModalData.tenderTitle}
        ownerName={tenderModalData.ownerName}
        quantity={tenderModalData.quantity}
        totalPrice={tenderModalData.totalPrice}
        contactNumber={tenderModalData.contactNumber || ''}
        chatId={tenderModalData.chatId}
        sellerId={tenderModalData.sellerId}
        isMieuxDisant={tenderModalData.isMieuxDisant}
      />
    </>
  );
});

export default NotificationBell; 