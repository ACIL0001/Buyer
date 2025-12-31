"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useReducer, useState, useEffect, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import { authStore } from "@/contexts/authStore";
import ChatNotifications from '@/components/chat/ChatNotifications';
import NotificationBellStable from '@/components/NotificationBellStable';
import BellNotifications from '@/components/header/BellNotifications';
import { useChatNotificationsWithGeneral } from '@/hooks/useChatNotificationsWithGeneral';
import { useCreateSocket } from '@/contexts/socket';
import { BsChatDots } from 'react-icons/bs';
import ButtonSwitchApp from "../ButtonSwitchApp/ButtonSwitchApp";
import ReviewModal from '@/components/ReviewModal';
import { ReviewAPI } from '@/app/api/review';
import { NotificationAPI } from '@/app/api/notification';
import { useTranslation } from 'react-i18next';
import { getSellerUrl, getFrontendUrl } from '@/config';
import app from '@/config';
import { normalizeImageUrl } from '@/utils/url';

const initialState = {
  activeMenu: "",
  activeSubMenu: "",
  isSidebarOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_MENU":
      return {
        ...state,
        activeMenu: state.activeMenu === action.menu ? "" : action.menu,
        activeSubMenu:
          state.activeMenu === action.menu ? state.activeSubMenu : "",
      };
    case "TOGGLE_SUB_MENU":
      return {
        ...state,
        activeSubMenu:
          state.activeSubMenu === action.subMenu ? "" : action.subMenu,
      };
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      };
    default:
      return state;
  }
}

export const Header = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const pathName = usePathname();
  const { isLogged, isReady, initializeAuth, auth } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [switchAccount , setSwitchAccount] = useState(false)
  
  // Add windowWidth state
  const [windowWidth, setWindowWidth] = useState(1024);
  
  // Enhanced responsive state
  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024;
  const isIPhone = windowWidth >= 375 && windowWidth <= 428;
  const isSamsung = windowWidth >= 360 && windowWidth <= 412;
  const isSmallMobile = windowWidth <= 375;
  const socketContext = useCreateSocket();
  const badgeRef = useRef(null);
  const [windowVal , setWindowVal] = useState('')
  const windowRef = useRef(null)
  const headerRef = useRef(null);

  // Chat notifications are handled by the ChatNotifications component directly

  // Add a badge style for reuse
  const badgeStyle = {
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
    boxShadow: '0 0 0 2px #fff',
    transition: 'transform 0.2s',
    transform: 'scale(1)',
  };

  const [bidWonNotifications, setBidWonNotifications] = useState([]);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentBidWonNotification, setCurrentBidWonNotification] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Handle window resize only
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Set initial size
    setWindowWidth(window.innerWidth);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Add toggleMenu function
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Note: Unread count is now handled by useChatNotificationsWithGeneral hook


  useEffect(()=>{
    if(window.localStorage.getItem('switch')){
      if( window.localStorage.getItem('switch') == '1'){
        setSwitchAccount(true)
      }
     }
  },[])


  
  // Real-time update for new messages
  // (Removed badgeAnimate effect and related code for best practice)

  // Note: Chat notifications are handled by the ChatNotifications component directly

  const handleLogout = () => {
    authStore.getState().clear();
    router.push('/auth/login');
  };

  // Helper to get avatar URL
  const getAvatarUrl = () => {
    if (!auth?.user) return '';

    // Priority 1: photoURL
    const photoURL = auth.user?.photoURL;
    if (photoURL && photoURL.trim() !== '') {
      return normalizeImageUrl(photoURL);
    }

    // Priority 2: avatar string (from registration)
    const avatar = auth.user?.avatar;
    if (typeof avatar === 'string' && avatar.trim() !== '') {
      return normalizeImageUrl(avatar);
    }

    // Priority 3: avatar object
    if (avatar) {
      // Try fullUrl first
      if (avatar.fullUrl) {
        return normalizeImageUrl(avatar.fullUrl);
      }
      
      // Try url
      if (avatar.url) {
        return normalizeImageUrl(avatar.url);
      }
      
      // Try filename
      if (avatar.filename) {
        return normalizeImageUrl(`/static/${avatar.filename}`);
      }
    }
    return '';
  };

  // Navigation Items
  const navItems = [
    { name: t('navigation.home'), path: "/", matchPaths: ["/"] },
    { name: "Dashboard", path: "/dashboard", matchPaths: ["/dashboard"] },
    { name: t('navigation.auctions'), path: "/auction-sidebar", matchPaths: ["/auction-sidebar", "/auction-details"] },
    { name: t('navigation.tenders'), path: "/tenders", matchPaths: ["/tenders", "/tender-details"] },
    { name: t('navigation.directSales'), path: "/direct-sale", matchPaths: ["/direct-sale"] },
    { name: t('navigation.categories'), path: "/category", matchPaths: ["/category"] },
    { name: t('navigation.howToBid'), path: "/how-to-bid", matchPaths: ["/how-to-bid"] },
    { name: t('navigation.members'), path: "/users", matchPaths: ["/users"] },
  ];

  // Helper function to check if a nav item is active
  const isNavItemActive = (item) => {
    return item.matchPaths.some(matchPath => pathName === matchPath || pathName.startsWith(matchPath + '/'));
  };


  async function swithAcc() {
    if(switchAccount){
      setSwitchAccount(false)
      console.log(windowRef);
      if (windowRef.current) {
        windowRef.current.close();
      }
      window.localStorage.removeItem('switch')
    }else{
      try {
        setSwitchAccount(true)
        window.localStorage.setItem('switch', "1")
        
        console.log('🔄 Switching to seller mode from buyer app...');
        
        // Call the mark-as-seller API (we need to create this endpoint)
        const response = await fetch(`${app.baseURL.replace(/\/$/, '')}/auth/mark-as-seller`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.tokens.accessToken}`,
            'x-access-key': app.apiKey,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });

        const data = await response.json();
        console.log('✅ Mark as seller response:', data);

        if (data.success) {
          // Use the seller URL from config and add /dashboard/app path
          const sellerBaseUrl = getSellerUrl();
          const sellerAppUrl = new URL('/dashboard/app', sellerBaseUrl);
          sellerAppUrl.searchParams.append('token', auth.tokens.accessToken);
          sellerAppUrl.searchParams.append('refreshToken', auth.tokens.refreshToken);
          sellerAppUrl.searchParams.append('from', 'buyer');
          
          console.log('🔄 Redirecting to seller dashboard:', sellerAppUrl.toString());
          
          // Clear buyer session before redirecting
          authStore.getState().clear();
          
          // Redirect to seller app dashboard
          window.location.href = sellerAppUrl.toString();
        } else {
          throw new Error(data.message || 'Failed to mark user as seller');
        }
      } catch (error) {
        console.error('❌ Error switching to seller mode:', error);
        setSwitchAccount(false);
        window.localStorage.removeItem('switch');
        
        // Show error message to user
        alert('Failed to switch to seller mode. Please try again.');
      }
    }
  }
  useEffect(()=>{
    const vlInt = setInterval(()=>{
      if(windowRef.current && windowRef.current.closed){
         setSwitchAccount(false)
         window.localStorage.removeItem('switch')
      }
    },2000)
    return () => clearInterval(vlInt);
  },[])

  useEffect(() => {
    if (!socketContext?.socket) return;
    const handler = (notification) => {
      console.log('[Header] Received bid won notification:', notification);
      if (notification && notification.type === 'BID_WON') {
        setBidWonNotifications((prev) => {
          // Check for duplicates
          const exists = prev.some(n => n._id === notification._id);
          if (exists) return prev;
          return [notification, ...prev];
        });
        // Optionally, show a toast or alert here
        // e.g., toast.success(notification.title + ': ' + notification.message);
      }
    };
    socketContext.socket.on('bidWonNotification', handler);
    return () => {
      socketContext.socket.off('bidWonNotification', handler);
    };
  }, [socketContext?.socket]);




  // Check for BID_WON notifications on component mount and auth change
  useEffect(() => {
    const checkBidWonNotifications = async () => {
      if (!isLogged || !isReady) return;
      
      try {
        const response = await NotificationAPI.getAllNotifications();
        
        // Handle the new response structure: { notifications: [...] }
        const notifications = response.notifications || response || [];
        
        // Get locally ignored notifications
        const ignoredIds = JSON.parse(localStorage.getItem('reviewed_notifications') || '[]');
        
        // Find unread BID_WON notifications that haven't been ignored locally
        const bidWonNotification = notifications.find(notif => 
          notif.type === 'BID_WON' && !notif.isRead && !ignoredIds.includes(notif._id)
        );
        
        if (bidWonNotification) {
          setCurrentBidWonNotification(bidWonNotification);
          setIsReviewModalOpen(true);
        }
      } catch (error) {
        console.error('Error checking BID_WON notifications:', error);
      }
    };

    checkBidWonNotifications();
  }, [isLogged, isReady]);

  // Helper to ignore notification locally
  const ignoreNotificationLocally = (id) => {
    try {
      const ignoredIds = JSON.parse(localStorage.getItem('reviewed_notifications') || '[]');
      if (!ignoredIds.includes(id)) {
        ignoredIds.push(id);
        localStorage.setItem('reviewed_notifications', JSON.stringify(ignoredIds));
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };

  // Handle review submission
  const handleReviewSubmit = async (type, comment) => {
    if (!currentBidWonNotification) return;

    setIsSubmittingReview(true);
    
    try {
      // Get the seller/target user ID from the notification
      let targetUserId = null;
      
      // Check senderId (could be string or populated object)
      if (currentBidWonNotification.senderId) {
        targetUserId = typeof currentBidWonNotification.senderId === 'object' 
          ? currentBidWonNotification.senderId._id 
          : currentBidWonNotification.senderId;
      }
      
      // Fallback to targetUserId or sellerId in data
      if (!targetUserId) {
        targetUserId = currentBidWonNotification.targetUserId || 
                       currentBidWonNotification.data?.sellerId;
      }
      
      if (!targetUserId) {
        // Log the notification for debugging
        console.error('Invalid notification structure:', currentBidWonNotification);
        throw new Error('Target user ID not found in notification');
      }

      console.log('Using targetUserId for review:', targetUserId);

      // Submit the review
      if (type === 'like') {
        await ReviewAPI.likeUser(targetUserId, comment);
      } else {
        await ReviewAPI.dislikeUser(targetUserId, comment);
      }

      // Mark the notification as read
      await NotificationAPI.markAsRead(currentBidWonNotification._id);
      
      // Ignore locally to be safe
      ignoreNotificationLocally(currentBidWonNotification._id);

      // Close modal and reset state
      setIsReviewModalOpen(false);
      setCurrentBidWonNotification(null);
      
      console.log(`Successfully submitted ${type} review for user ${targetUserId}`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // Handle 400 Bad Request (Already reviewed/Self review) quietly
        console.warn('Review skipped: User likely already reviewed this transaction.');
        try {
          ignoreNotificationLocally(currentBidWonNotification._id); // Ignore locally
          await NotificationAPI.markAsRead(currentBidWonNotification._id);
          setIsReviewModalOpen(false);
          setCurrentBidWonNotification(null);
        } catch (markError) {
          console.warn('Could not mark notification as read:', markError);
          // If markAsRead fails, we still have the local ignore
        }
      } else {
        // Only log actual unexpected errors
        console.error('Error submitting review:', error);
      }
      // You can show a toast here if needed
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle modal close
  const handleReviewModalClose = () => {
    setIsReviewModalOpen(false);
    setCurrentBidWonNotification(null);
  };

  return (
    <header 
      ref={headerRef}
      style={{
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transition: 'all 0.3s ease',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        backgroundColor: 'white',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        willChange: 'transform',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        paddingRight: '0',
        boxSizing: 'border-box',
        /* Ensure header doesn't cover scrollbar - scrollbar will appear over it */
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        background: 'white',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        padding: isMobile ? '8px 0' : '16px 0',
        transition: 'all 0.3s ease'
      }}>
        <div className="container-responsive" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isSmallMobile ? '56px' : isMobile ? '60px' : isTablet ? '70px' : '80px',
          transition: 'height 0.3s ease',
          paddingLeft: isSmallMobile ? '12px' : isMobile ? '16px' : '20px',
          paddingRight: isSmallMobile ? '12px' : isMobile ? '16px' : '20px',
          maxWidth: '100vw'
        }}>
          {/* Logo */}
          <div style={{ 
            flexShrink: 0, 
            padding: 0, 
            margin: 5,
            display: 'flex',
            alignItems: 'center'
          }}>
            <Link href={getFrontendUrl()} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="/assets/img/logo.png"
                  alt="MazadClick"
                  className="header-logo"
                  style={{ 

                    height: isMobile ? '50px' : isTablet ? '65px' : '65px',
                    width: isMobile ? '120px' : isTablet ? '155px' : '165px',

                    transition: 'all 0.3s ease',
                    objectFit: 'contain',
                    objectPosition: 'center center',
                    borderRadius: isMobile ? '12px' : '16px',
                    display: 'block',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                    maxWidth: '100%'
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          {isClient && windowWidth > 992 && (
            <nav style={{
              flex: 1,
              marginLeft: '40px'
            }}>
              <ul style={{
                display: 'flex',
                gap: '30px',
                listStyle: 'none',
                margin: 0,
                padding: 0
              }}>
                {navItems.map((item, index) => {
                  const isActive = isNavItemActive(item);
                  return (
                    <li key={index}>
                      <Link 
                        href={item.path} 
                        style={{
                          color: isActive ? '#0063b1' : '#333',
                          fontWeight: isActive ? '600' : '500',
                          textDecoration: 'none',
                          fontSize: '16px',
                          position: 'relative',
                          padding: '8px 0',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {item.name}
                        {isActive && (
                          <span style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100%',
                            height: '2px',
                            background: '#0063b1',
                            borderRadius: '2px'
                          }}></span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* Right section - Search, Language Switcher, Account, Menu Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Language Switcher moved to floating button at bottom-right */}
            

          

            {/* Notification Bell - Testing stable version */}
            {isClient && isReady && isLogged && (
              <div style={{ position: 'relative' }}>
                <NotificationBellStable key="notification-bell-header" variant="header" />
              </div>
            )}

            {/* Chat Icon - Messages Notifications */}
            {isClient && isReady && isLogged && (
              <div style={{ position: 'relative' }}>
                <ChatNotifications variant="header" />
              </div>
            )}

            {/* Account Section */}
            {isClient && isReady && (
              <div style={{ position: 'relative' }}>
                {isLogged ? (
                  <button
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: isAccountDropdownOpen ? '#0063b1' : 'linear-gradient(45deg, #0063b1, #0078d7)',
                      border: 'none',
                      borderRadius: '30px',
                      padding: isMobile ? '8px 12px' : isTablet ? '9px 16px' : '10px 20px',
                      color: 'white',
                      fontSize: isMobile ? '13px' : isTablet ? '14px' : '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isAccountDropdownOpen 
                        ? '0 4px 15px rgba(0, 99, 177, 0.5)' 
                        : '0 3px 10px rgba(0, 99, 177, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      if (!isAccountDropdownOpen) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 99, 177, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isAccountDropdownOpen) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 99, 177, 0.3)';
                      }
                    }}
                  >
                    {(() => {
                      // Helper to get avatar URL - uses shared normalizeImageUrl utility
                      const getAvatarUrl = () => {
                        if (!auth?.user) return '';

                        // Priority 1: photoURL
                        const photoURL = auth.user?.photoURL;
                        if (photoURL && photoURL.trim() !== '') {
                          return normalizeImageUrl(photoURL);
                        }

                        // Priority 2: avatar string (from registration)
                        const avatar = auth.user?.avatar;
                        if (typeof avatar === 'string' && avatar.trim() !== '') {
                          return normalizeImageUrl(avatar);
                        }

                        // Priority 3: avatar object
                        if (avatar) {
                          if (avatar.fullUrl) return normalizeImageUrl(avatar.fullUrl);
                          if (avatar.url) return normalizeImageUrl(avatar.url);
                          if (avatar.filename) return normalizeImageUrl(`/static/${avatar.filename}`);
                        }

                        return '';
                      };

                      const avatarUrl = getAvatarUrl();
                      
                      return (
                        <div style={{
                          width: isMobile ? '20px' : '24px',
                          height: isMobile ? '20px' : '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative',
                          background: 'white' // Ensure icon has white background, not blue
                        }}>
                          {/* SVG fallback - rendered only if no avatar */}
                          {!avatarUrl && (
                            <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', zIndex: 0 }}>
                              <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="#0063b1" />
                              <path d="M8 9C5.79086 9 4 10.7909 4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13C12 10.7909 10.2091 9 8 9Z" fill="#0063b1" />
                            </svg>
                          )}
                          {/* Profile picture - rendered on top if available */}
                          {avatarUrl && (
                            <img
                              src={avatarUrl}
                              alt={auth?.user?.firstName || 'User'}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid transparent',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 1
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      );
                    })()}
                    {!isMobile ? (
                      auth?.user?.socialReason ||
                      auth?.user?.entreprise || 
                      auth?.user?.companyName || 
                      'User'
                    ) : ""}
                    <svg 
                      width={12} 
                      height={12} 
                      viewBox="0 0 12 12" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        transform: isAccountDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease',
                        opacity: 0.8
                      }}
                    >
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/auth/login')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'linear-gradient(45deg, #0063b1, #0078d7)',
                      border: 'none',
                      borderRadius: '30px',
                      padding: isMobile ? '8px 12px' : isTablet ? '9px 16px' : '10px 20px',
                      color: 'white',
                      fontSize: isMobile ? '13px' : isTablet ? '14px' : '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 3px 10px rgba(0, 99, 177, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 15px rgba(0, 99, 177, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 99, 177, 0.3)';
                    }}
                  >
                    <div style={{
                      width: isMobile ? '20px' : '24px',
                      height: isMobile ? '20px' : '24px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="white" />
                        <path d="M8 9C5.79086 9 4 10.7909 4 13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13C12 10.7909 10.2091 9 8 9Z" fill="white" />
                      </svg>
                    </div>
                    {!isMobile ? t('common.login') : ""}
                  </button>
                )}

                {/* Account Dropdown */}
                {isAccountDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    width: '220px',
                    zIndex: 9999,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    {/* User Info Header - Compact */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      background: '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: '1px solid #e0e0e0'
                      }}>
                        {/* Initials as fallback background */}
                        <span style={{ 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            color: '#666',
                            position: 'absolute',
                            zIndex: 0
                        }}>
                            {((auth?.user?.entreprise || auth?.user?.firstName || 'U')).charAt(0).toUpperCase()}
                        </span>

                        {getAvatarUrl() && (
                           <img 
                             src={getAvatarUrl()} 
                             alt={auth?.user?.firstName || 'User'}
                             style={{
                               width: '100%',
                               height: '100%',
                               objectFit: 'cover',
                               position: 'relative',
                               zIndex: 1
                             }}
                             onError={(e) => {
                               e.currentTarget.style.display = 'none';
                             }} 
                           />
                        )}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {auth?.user?.entreprise || auth?.user?.companyName || `${auth?.user?.firstName || 'User'} ${auth?.user?.lastName || ''}`.trim()}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#666',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {auth?.user?.email || 'user@example.com'}
                          </div>
                      </div>
                    </div>

                    {/* Menu Items - Compact */}
                    <div style={{ padding: '4px 0' }}>
                      {/* Dashboard Link */}
                      <Link href="/dashboard" onClick={() => setIsAccountDropdownOpen(false)}>
                        <div style={{
                          padding: '10px 16px',
                          color: '#333',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '14px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        >
                          <svg width={18} height={18} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                            <rect x="1" y="1" width="6" height="6" rx="1" stroke="#0063b1" strokeWidth="1.5" fill="none"/>
                            <rect x="9" y="1" width="6" height="6" rx="1" stroke="#0063b1" strokeWidth="1.5" fill="none"/>
                            <rect x="1" y="9" width="6" height="6" rx="1" stroke="#0063b1" strokeWidth="1.5" fill="none"/>
                            <rect x="9" y="9" width="6" height="6" rx="1" stroke="#0063b1" strokeWidth="1.5" fill="none"/>
                          </svg>
                          <span>Dashboard</span>
                        </div>
                      </Link>
                      
                      {/* Profile Link */}
                      <Link href="/profile" onClick={() => setIsAccountDropdownOpen(false)}>
                        <div style={{
                          padding: '10px 16px',
                          color: '#333',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '14px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        >
                          <svg width={18} height={18} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                            <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="#0063b1"/>
                            <path d="M8 10C3.58172 10 0 12.6863 0 16H16C16 12.6863 12.4183 10 8 10Z" fill="#0063b1"/>
                          </svg>
                          <span>{t('account.myProfile')}</span>
                        </div>
                      </Link>
                      

                      {/* Settings Link */}
                      <Link href="/settings" onClick={() => setIsAccountDropdownOpen(false)}>
                        <div style={{
                          padding: '10px 16px',
                          color: '#333',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '14px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        >
                          <svg width={18} height={18} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" fill="#0063b1"/>
                          </svg>
                          <span>{t("settings.title") || "Settings"}</span>
                        </div>
                      </Link>
                    </div>

                    <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />

                    {/* Logout Button - Compact */}
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#dc3545',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff5f5';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg width={18} height={18} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                        <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.6667 11.3333L14 8L10.6667 4.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{t('account.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {isClient && windowWidth <= 992 && (
              <button
                className="mobile-menu-toggle"
                onClick={toggleMenu}
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  zIndex: 9999
                }}
              >
                <span style={{
                  display: 'block',
                  width: '24px',
                  height: '2px',
                  background: '#333',
                  transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
                  transition: 'transform 0.3s ease'
                }}></span>
                <span style={{
                  display: 'block',
                  width: '24px',
                  height: '2px',
                  background: '#333',
                  opacity: isMenuOpen ? 0 : 1,
                  transition: 'opacity 0.3s ease'
                }}></span>
                <span style={{
                  display: 'block',
                  width: '24px',
                  height: '2px',
                  background: '#333',
                  transform: isMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
                  transition: 'transform 0.3s ease'
                }}></span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {isClient && isMenuOpen && windowWidth <= 992 && (
        <div 
          className="safe-top safe-bottom"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: 'white',
            zIndex: 9999,
            paddingTop: isSmallMobile ? '65px' : isMobile ? '70px' : '90px',
            paddingBottom: isIPhone ? 'env(safe-area-inset-bottom)' : '0',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'absolute',
              top: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
              right: isSmallMobile ? '15px' : isMobile ? '20px' : '25px',
              background: 'transparent',
              border: 'none',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: '50%',
              transition: 'background-color 0.3s ease',
              zIndex: 10000
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
            aria-label="Close menu"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="#333" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="container-responsive" style={{ 
            padding: isSmallMobile ? '12px' : isMobile ? '16px' : '20px',
            minHeight: isSmallMobile ? 'calc(100vh - 65px)' : isMobile ? 'calc(100vh - 70px)' : 'calc(100vh - 90px)',
            maxWidth: '100vw'
          }}>

            {/* Mobile Navigation */}
            <nav>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {navItems.map((item, index) => {
                  const isActive = isNavItemActive(item);
                  return (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <Link
                        href={item.path}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: isMobile ? '16px 20px' : '15px',
                          background: isActive ? '#f8f9fa' : 'transparent',
                          borderRadius: '12px',
                          color: isActive ? '#0063b1' : '#333',
                          fontWeight: isActive ? '600' : '500',
                          fontSize: isMobile ? '16px' : '16px',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          borderLeft: isActive ? '4px solid #0063b1' : '4px solid transparent',
                          minHeight: '44px' // Better touch target
                        }}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <style jsx global>{`
        .header-logo {
          max-height: 75px;
          max-width: 180px;
        }
        @media (max-width: 992px) {
          .header-logo {
            max-height: 65px;
            max-width: 155px;
          }
          .header-container {
            padding: 0 8px;
          }
        }
        @media (max-width: 768px) {
          .header-logo {
            max-height: 50px;
            max-width: 120px;
          }
          .header-container {
            padding: 0 4px;
          }
          .mobile-menu-toggle {
            width: 36px !important;
            height: 36px !important;
          }
        }
        @media (max-width: 576px) {
          .header-logo {
            max-height: 50px;
            max-width: 120px;
          }
          .header-container {
            padding: 0 2px;
          }
          .mobile-menu-toggle {
            width: 32px !important;
            height: 32px !important;
          }
          .header-container ul li a {
            font-size: 14px !important;
          }
        }
        .header-container ul li a {
          font-size: 16px;
        }
      `}</style>

      {/* Review Modal for BID_WON notifications */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleReviewModalClose}
        onSubmitReview={handleReviewSubmit}
        targetUserId={currentBidWonNotification?.senderId || currentBidWonNotification?.targetUserId || ''}
        auctionTitle={currentBidWonNotification?.message || currentBidWonNotification?.title}
        isLoading={isSubmittingReview}
      />
    </header>
  );
};

export default Header;