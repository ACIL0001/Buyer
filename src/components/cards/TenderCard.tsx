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
const DEFAULT_TENDER_IMAGE = "/assets/images/logo-white.png";

export interface Tender {
  _id: string;
  title: string;
  reference?: string;
  description?: string;
  attachments?: Array<{ url: string; filename?: string; }>;
  endingAt?: string;
  status?: string;
  verifiedOnly?: boolean;
  wilaya?: string;
  sectors?: string[]; // Assuming sectors is an array of strings or objects, adjusting based on usage
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    entreprise?: string;
    companyName?: string;
    avatar?: { url: string; };
    photoURL?: string;
  } | string; // Owner can be populated object or ID string
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

function calculateTimeRemaining(endDate: string): Timer {
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

const getTenderImageUrl = (tender: Tender) => {
  if (tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url) {
    const imageUrl = tender.attachments[0].url;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/')) {
        return `${app.baseURL}${imageUrl.substring(1)}`;
    } else {
      return `${app.baseURL}${imageUrl}`;
    }
  }
  return DEFAULT_TENDER_IMAGE;
};

interface TenderCardProps {
  tender: Tender;
}

const TenderCard = ({ tender }: TenderCardProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLogged, auth } = useAuth();
  const [timer, setTimer] = useState<Timer>({ days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false });
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (tender.endingAt) {
      const updateTimer = () => {
        setTimer(calculateTimeRemaining(tender.endingAt!));
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [tender.endingAt]);

  const navigateWithScroll = useCallback((url: string) => {
    router.push(url, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [router]);

    // Format owner name safely
    const getOwnerName = () => {
        if (!tender.owner || typeof tender.owner === 'string') return t('common.anonymous');
        const owner = tender.owner;
        return owner.entreprise || owner.companyName || 
               (owner.firstName && owner.lastName ? `${owner.firstName} ${owner.lastName}` : owner.name) || 
               t('common.anonymous');
    };

  return (
    <>
      <style jsx>{`
        .tender-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .tender-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 212, 170, 0.15);
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
        className="tender-card-hover"
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Verification Shield */}
        {tender.verifiedOnly && (
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
             border: '2px solid #27F5CC'
           }} title={t('common.verifiedOnly')}>
             <span style={{ fontSize: '16px' }}>🛡️</span>
           </div>
        )}

        {/* Image Container */}
        <div style={{
          position: 'relative',
          height: '180px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #e0fbf6 0%, #ffffff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
           <img
             src={imageError ? DEFAULT_TENDER_IMAGE : getTenderImageUrl(tender)}
             alt={tender.title}
             style={{
               width: '100%',
               height: '100%',
               objectFit: 'contain',
               padding: '20px',
               transition: 'transform 0.6s ease',
               transform: isHovered ? 'scale(1.05)' : 'scale(1)'
             }}
             onError={() => setImageError(true)}
           />
           
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
             color: timer.hasEnded ? '#dc3545' : '#10b981'
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
             {tender.title}
           </h3>

           {/* Info Grid */}
           <div style={{
             display: 'grid',
             gridTemplateColumns: '1fr 1fr',
             gap: '8px',
             marginBottom: '16px'
           }}>
             {/* Ref */}
             {tender.reference && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  🏷️ {tender.reference}
                </div>
             )}
              {/* Location */}
              {tender.wilaya && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  📍 {tender.wilaya}
                </div>
             )}
           </div>

           {/* Action Button */}
           <button
             onClick={() => navigateWithScroll(`/tender-details/${tender._id}`)}
             className="modern-button"
             style={{
               width: '100%',
               padding: '12px',
               borderRadius: '12px',
               border: 'none',
               background: 'linear-gradient(135deg, #27F5CC 0%, #10b981 100%)',
               color: 'white',
               fontWeight: '600',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '8px',
               marginTop: 'auto',
               transition: 'all 0.3s ease',
               boxShadow: '0 4px 12px rgba(39, 245, 204, 0.3)'
             }}
           >
             <span>{t('liveTenders.viewDetails')}</span>
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

export default TenderCard;
