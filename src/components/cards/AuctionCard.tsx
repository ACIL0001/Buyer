"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import app from '@/config';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { useRouter } from "next/navigation";
import "../auction-details/st.css";
import "../auction-details/modern-details.css";

// Default image constants
const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";

export interface Auction {
  id: string;
  title: string;
  name?: string;
  thumbs?: Array<{ _id: string; url: string; filename?: string; fullUrl?: string }>;
  endingAt?: string;
  currentPrice?: number;
  startingPrice?: number;
  isPro?: boolean;
  hidden?: boolean;
  seller?: {
    _id: string;
    name?: string;
    profileImage?: { url: string; };
    photoURL?: string;
  };
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    entreprise?: string;
    companyName?: string;
    profileImage?: { url: string; };
    photoURL?: string;
  };
  status?: string;
  verifiedOnly?: boolean;
  quantity?: string | number;
  location?: string;
  wilaya?: string;
  description?: string;
  biddersCount?: number;
  bidType?: 'PRODUCT' | 'SERVICE';
  images?: string[];
  image?: string;
  thumbnail?: string;
  photo?: string;
  picture?: string;
  icon?: string;
  logo?: string;
  coverImage?: string;
  mainImage?: string;
}

interface Timer {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  hasEnded: boolean;
}

export function calculateTimeRemaining(endDate: string): Timer {
  const total = Date.parse(endDate) - Date.now();
  const hasEnded = total <= 0;

  if (hasEnded) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
      hasEnded: true
    };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days: days.toString().padStart(2, '0'),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    hasEnded: false
  };
}

const getAuctionImageUrl = (auction: Auction) => {
  const possibleImageSources = [
    auction.thumbs?.[0]?.url,
    auction.thumbs?.[0]?.fullUrl,
    auction.images?.[0],
    auction.image,
    auction.thumbnail,
    auction.photo,
    auction.picture,
    auction.icon,
    auction.logo,
    auction.coverImage,
    auction.mainImage
  ].filter(Boolean);

  if (possibleImageSources.length > 0) {
    const imageUrl = possibleImageSources[0] as string;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/')) {
        return `${app.baseURL}${imageUrl.substring(1)}`;
    } else {
      return `${app.baseURL}${imageUrl}`;
    }
  } else {
    return DEFAULT_AUCTION_IMAGE;
  }
};

interface AuctionCardProps {
  auction: Auction;
}

const AuctionCard = ({ auction }: AuctionCardProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLogged, auth } = useAuth();
  const [timer, setTimer] = useState<Timer>({ days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false });
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (auction.endingAt) {
      const updateTimer = () => {
        setTimer(calculateTimeRemaining(auction.endingAt!));
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [auction.endingAt]);

  const formatPrice = useCallback((price: number) => {
    return `${Number(price).toLocaleString()} DA`;
  }, []);

  const getSellerDisplayName = useCallback((auction: Auction) => {
    if (auction.hidden === true) {
      return t('common.anonymous');
    }

    const companyName = auction.owner?.entreprise || auction.owner?.companyName;
    if (companyName) {
      return companyName;
    }

    const ownerName = auction.owner?.firstName && auction.owner?.lastName
      ? `${auction.owner.firstName} ${auction.owner.lastName}`
      : auction.owner?.name;
    const sellerName = auction.seller?.name;

    return ownerName || sellerName || t('liveAuction.seller');
  }, [t]);

  const isAuctionOwner = useCallback((auction: Auction) => {
    if (!isLogged || !auth.user?._id) return false;
    return auction.owner?._id === auth.user._id;
  }, [isLogged, auth.user?._id]);

  const navigateWithScroll = useCallback((url: string) => {
    router.push(url, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [router]);

  return (
    <>
      <style jsx>{`
        .auction-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .auction-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 99, 177, 0.15);
        }
        .timer-digit.urgent {
           animation: pulse 0.5s infinite;
           color: #ff4444;
        }
         @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
      <div 
        className="auction-card-hover"
        data-id={auction.id}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Verification Shield */}
        {auction.verifiedOnly && (
           <div style={{
             position: 'absolute',
             top: '12px',
             right: '12px',
             zIndex: 10,
             background: 'rgba(255, 255, 255, 0.95)',
             borderRadius: '50%',
             width: '32px',
             height: '32px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
             border: '2px solid #0063b1'
           }} title={t('common.verifiedOnly')}>
             <span style={{ fontSize: '16px' }}>🛡️</span>
           </div>
        )}

        {/* Image Container */}
        <div style={{
          position: 'relative',
          height: '200px',
          overflow: 'hidden',
          background: '#f8f9fa'
        }}>
           <img
             src={imageError ? DEFAULT_AUCTION_IMAGE : getAuctionImageUrl(auction)}
             alt={auction.title || auction.name}
             style={{
               width: '100%',
               height: '100%',
               objectFit: 'contain',
               transition: 'transform 0.6s ease',
               transform: isHovered ? 'scale(1.05)' : 'scale(1)'
             }}
             onError={() => setImageError(true)}
           />
           
           {/* Overlay Gradient */}
           <div style={{
             position: 'absolute',
             bottom: 0,
             left: 0,
             right: 0,
             height: '50%',
             background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
             zIndex: 1
           }} />

           {/* Timer Badge */}
           <div style={{
             position: 'absolute',
             bottom: '12px',
             left: '12px',
             background: 'rgba(255, 255, 255, 0.95)',
             padding: '6px 12px',
             borderRadius: '20px',
             display: 'flex',
             alignItems: 'center',
             gap: '6px',
             zIndex: 2,
             boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
             fontWeight: '600',
             fontSize: '13px',
             color: timer.hasEnded ? '#dc3545' : '#0063b1'
           }}>
             <span>{timer.hasEnded ? '🏁' : '⏱️'}</span>
             <span>
               {timer.hasEnded ? t('common.finished') : 
                 `${timer.days}j ${timer.hours}h ${timer.minutes}m`
               }
             </span>
           </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
           <h3 style={{
             fontSize: '16px',
             fontWeight: '700',
             color: '#2d3436',
             marginBottom: '12px',
             lineHeight: '1.4',
             overflow: 'hidden',
             textOverflow: 'ellipsis',
             display: '-webkit-box',
             WebkitLineClamp: 2,
             WebkitBoxOrient: 'vertical',
             height: '44px'
           }}>
             {auction.title || auction.name}
           </h3>

           {/* Price */}
           <div style={{
             marginBottom: '16px',
             background: '#f8f9fa',
             padding: '8px 12px',
             borderRadius: '8px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'space-between'
           }}>
             <span style={{ color: '#636e72', fontSize: '13px', fontWeight: '500' }}>
               {t('liveAuction.currentPrice')}
             </span>
             <span style={{ 
               color: '#0063b1', 
               fontWeight: '800', 
               fontSize: '16px' 
             }}>
               {formatPrice(auction.currentPrice || auction.startingPrice || 0)}
             </span>
           </div>

           {/* Seller Info */}
           <div style={{
             display: 'flex',
             alignItems: 'center',
             gap: '10px',
             marginBottom: '20px',
             marginTop: 'auto'
           }}>
             <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#666',
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
             }}>
                {auction.owner?.photoURL || auction.seller?.photoURL ? (
                  <img 
                    src={auction.owner?.photoURL || auction.seller?.photoURL} 
                    alt="Seller" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (getSellerDisplayName(auction) || 'U').charAt(0).toUpperCase()
                )}
             </div>
             <div style={{ flex: 1, overflow: 'hidden' }}>
               <p style={{
                 fontSize: '13px',
                 fontWeight: '600',
                 color: '#2d3436',
                 margin: 0,
                 whiteSpace: 'nowrap',
                 overflow: 'hidden',
                 textOverflow: 'ellipsis'
               }}>
                 {getSellerDisplayName(auction)}
               </p>
               {auction.wilaya && (
                 <p style={{
                   fontSize: '11px',
                   color: '#b2bec3',
                   margin: '2px 0 0',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '3px'
                 }}>
                   📍 {auction.wilaya}
                 </p>
               )}
             </div>
           </div>

           {/* Action Button */}
           <button
             onClick={() => navigateWithScroll(`/auction-details/${auction.id}`)}
             className="modern-button"
             style={{
               width: '100%',
               padding: '12px',
               borderRadius: '12px',
               border: 'none',
               background: 'linear-gradient(135deg, #0063b1 0%, #00a3e0 100%)',
               color: 'white',
               fontWeight: '600',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '8px',
               transition: 'all 0.3s ease',
               boxShadow: '0 4px 12px rgba(0, 99, 177, 0.2)'
             }}
           >
             <span>{t('liveAuction.submitBid')}</span>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <line x1="5" y1="12" x2="19" y2="12"></line>
               <polyline points="12 5 19 12 12 19"></polyline>
             </svg>
           </button>
        </div>
      </div>
    </>
  );
};

export default AuctionCard;
