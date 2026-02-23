import { Tender } from '@/types/tender';
import { normalizeImageUrl } from '@/utils/url';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import app from '@/config';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import ShareButton from '@/components/common/ShareButton';

// Default image constants
const DEFAULT_TENDER_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

interface TenderCardProps {
  tender: Tender;
}

const TenderCard = ({ tender }: TenderCardProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { auth, isLogged } = useAuth();
  const [imgError, setImgError] = useState(false);
  
  // Timer state
  const [timer, setTimer] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
    hasEnded: false
  });

  const getTenderImageUrl = (tender: Tender) => {
    if (tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url) {
      return normalizeImageUrl(tender.attachments[0].url) || DEFAULT_TENDER_IMAGE;
    }
    return DEFAULT_TENDER_IMAGE;
  };

  const calculateTimeRemaining = (endDate: string) => {
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
  };

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

  const isTenderOwner = (tender: Tender) => {
    if (!isLogged || !auth.user?._id) return false;
    const ownerId = typeof tender.owner === 'string' ? tender.owner : tender.owner?._id;
    return ownerId === auth.user._id;
  };

  const navigateWithScroll = (url: string) => {
    router.push(url, { scroll: false });
  };

  const isEnded = timer.hasEnded;
  const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30 && parseInt(timer.days) === 0;

  // Determine the display name for the tender owner
  let displayName;
  if(tender.hidden) {
    displayName = t('common.anonymous') || 'Anonyme';
  } else {
    const companyName = tender.owner?.entreprise || tender.owner?.companyName;
    const ownerName = tender.owner?.firstName && tender.owner?.lastName
      ? `${tender.owner.firstName} ${tender.owner.lastName}`.trim()
      : tender.owner?.name;
    displayName = companyName || ownerName || t('common.buyer');
  }

  return (
    <div
      className="tender-card-hover"
      style={{
        background: 'white',
        borderRadius: 'clamp(12px, 2.5vw, 16px)',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        width: '100%',
        position: 'relative',
        minHeight: 'clamp(320px, 45vw, 360px)',
        opacity: isEnded ? 0.6 : 1,
        filter: isEnded ? 'grayscale(60%)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 99, 177, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
      }}
    >
      <style jsx>{`
        .timer-digit.urgent {
           animation: pulse 0.5s infinite;
           color: white;
        }
         @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
      {/* Tender Image */}
      <div style={{
        position: 'relative',
        height: 'clamp(120px, 20vw, 160px)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #27F5CC, #00D4AA)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img
          src={imgError ? DEFAULT_TENDER_IMAGE : getTenderImageUrl(tender)}
          alt={tender.title || 'Tender'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transition: 'transform 0.4s ease',
          }}
          onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_TENDER_IMAGE) {
                  target.src = DEFAULT_TENDER_IMAGE;
              } else {
                  setImgError(true);
              }
          }}
          loading="lazy"
        />

        {/* Timer Overlay */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: isEnded
            ? 'rgba(0,0,0,0.55)'
            : (isUrgent ? 'linear-gradient(45deg, #ff4444, #ff6666)' : 'linear-gradient(45deg, #27F5CC, #00D4AA)'),
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 2
        }}>
          {isEnded ? (
            <span style={{ fontWeight: 800 }}>{t('common.finished')}</span>
          ) : (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.days}</span>
              <span style={{ color: 'white' }}>:</span>
              <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.hours}</span>
              <span style={{ color: 'white' }}>:</span>
              <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.minutes}</span>
              <span style={{ color: 'white' }}>:</span>
              <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.seconds}</span>
            </div>
          )}
        </div>

        {/* Type Badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#333',
          padding: '6px 12px',
          borderRadius: '15px',
          fontSize: '12px',
          fontWeight: '600',
          zIndex: 2
        }}>
          {tender.tenderType === 'PRODUCT' ? t('common.product') : t('common.service')}
        </div>

        {/* Owner Badge */}
        {isTenderOwner(tender) && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 193, 7, 0.9)',
            color: '#212529',
            padding: '4px 10px',
            borderRadius: '15px',
            fontSize: '11px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            zIndex: 2
          }}>
            {t('liveTenders.yourTender')}
          </div>
        )}

        {/* Share Button - Bottom Right */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 5
        }}
        onClick={(e) => e.stopPropagation()} // Prevent card click
        >
          <ShareButton 
            type="tender" 
            id={tender._id} 
            title={tender.title} 
            imageUrl={getTenderImageUrl(tender)}
            description={tender.description}
          />
        </div>
      </div>

      {/* Tender Details */}
      <div style={{ padding: 'clamp(12px, 2.5vw, 16px)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: 'clamp(14px, 2.2vw, 16px)',
          fontWeight: '600',
          color: '#222',
          marginBottom: 'clamp(8px, 1.5vw, 10px)',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          height: '42px'
        }}>
          {tender.title || 'Tender Title'}
        </h3>

        {/* Location and Quantity Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: tender?.tenderType === 'SERVICE' ? '1fr' : '1fr 1fr',
          gap: '6px',
          marginBottom: '8px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            borderRadius: '8px',
            padding: '4px 8px',
            border: '1px solid #e9ecef',
            borderLeft: '3px solid #27F5CC',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <p style={{
              fontSize: '10px',
              color: '#666',
              margin: '0 0 2px 0',
              fontWeight: '600',
            }}>
              📍 {t('common.location')}
            </p>
            <p style={{
              fontSize: '11px',
              color: '#333',
              margin: 0,
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {(() => {
                const address = (tender as any).address || '';
                const location = tender.location || '';
                const wilaya = tender.wilaya || '';
                const parts = [address, location, wilaya].filter(Boolean);
                return parts.length > 0 ? parts.join(', ') : t('common.notSpecified');
              })()}
            </p>
          </div>

          {tender?.tenderType !== 'SERVICE' && tender.quantity && String(tender.quantity) !== t('common.notSpecified') && !isNaN(Number(tender.quantity)) && String(tender.quantity) !== "" && (
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
            borderRadius: '8px',
            padding: '4px 8px',
            border: '1px solid #e9ecef',
            borderLeft: '3px solid #27F5CC',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <p style={{
              fontSize: '10px',
              color: '#666',
              margin: '0 0 2px 0',
              fontWeight: '600',
            }}>
              📦 {t('common.quantity')}
            </p>
            <p style={{
              fontSize: '11px',
              color: '#333',
              margin: 0,
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {tender.quantity}
            </p>
          </div>
          )}
        </div>

        {/* Participants Count */}
        <div style={{
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
          borderRadius: '8px',
          padding: '6px 8px',
          marginBottom: '8px',
          border: '1px solid #e9ecef',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#27F5CC',
              animation: 'pulse 2s infinite',
            }}></div>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#27F5CC',
            }}>
              {((tender as any).participantsCount || 0)} {t('liveTenders.participants')}
            </span>
            <span style={{
              fontSize: '10px',
              color: '#666',
            }}>
              {t('liveTenders.haveSubmitted')}
            </span>
          </div>
        </div>

        {/* Owner Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 10px)',
          marginBottom: 'clamp(10px, 2vw, 14px)',
          marginTop: 'auto'
        }}>
          <img
            src={tender.hidden ? DEFAULT_PROFILE_IMAGE : (normalizeImageUrl(tender.owner?.photoURL) || DEFAULT_PROFILE_IMAGE)}
            alt={displayName}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'contain',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
          <span style={{
            fontSize: '12px',
            color: '#666',
            fontWeight: '500',
          }}>
            {displayName}
          </span>
        </div>

        {/* Submit Offer Button */}
        <Link
          href={`/tender-details/${tender._id}`}
          scroll={false}
          onClick={(e) => {
            e.preventDefault();
            navigateWithScroll(`/tender-details/${tender._id}`);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(6px, 1.5vw, 8px)',
            width: '100%',
            padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
            background: isEnded ? '#c7c7c7' : 'linear-gradient(90deg, #27F5CC, #00D4AA)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '25px',
            fontWeight: '600',
            fontSize: 'clamp(12px, 2vw, 14px)',
            transition: 'all 0.3s ease',
            boxShadow: isEnded ? 'none' : '0 4px 12px rgba(39, 245, 204, 0.3)',
            pointerEvents: isEnded ? 'none' : 'auto'
          }}
          onMouseEnter={(e) => {
            if (!isEnded) {
              e.currentTarget.style.background = 'linear-gradient(90deg, #00D4AA, #27F5CC)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(39, 245, 204, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isEnded) {
              e.currentTarget.style.background = 'linear-gradient(90deg, #27F5CC, #00D4AA)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 245, 204, 0.3)';
            }
          }}
        >
          {isEnded ? t('common.finished') : t('liveTenders.submitOffer')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default TenderCard;
