import { Auction } from '@/types/auction';
import { normalizeImageUrl } from '@/utils/url';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import app from '@/config';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import ShareButton from '@/components/common/ShareButton';

// Default image constants
const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

interface AuctionCardProps {
  auction: Auction;
}

const AuctionCard = ({ auction }: AuctionCardProps) => {
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
      return normalizeImageUrl(imageUrl) || DEFAULT_AUCTION_IMAGE;
    } else {
      return DEFAULT_AUCTION_IMAGE;
    }
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
    if (auction.endingAt || auction.endDate) {
      const updateTimer = () => {
        setTimer(calculateTimeRemaining(auction.endingAt || auction.endDate!));
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [auction.endingAt, auction.endDate]);

  const isAuctionOwner = (auction: Auction) => {
    if (!isLogged || !auth.user?._id) return false;
    const ownerId = typeof auction.owner === 'string' ? auction.owner : auction.owner?._id;
    return ownerId === auth.user._id || auction.seller?._id === auth.user._id;
  };

  const navigateWithScroll = (url: string) => {
    router.push(url, { scroll: false });
  };

  const isEnded = timer.hasEnded;
  const hasAuctionEnded = isEnded; // Alias for compatibility with copied JSX
  const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30 && parseInt(timer.days) === 0;

  // Determine the display name for the auction owner
  let displayName;
  const ownerObject = typeof auction.owner === 'object' ? auction.owner : null;

  if (auction.hidden) {
      displayName = t('common.anonymous') || 'Anonyme';
  } else {
      const ownerName = ownerObject?.firstName && ownerObject?.lastName
        ? `${ownerObject.firstName} ${ownerObject.lastName}`.trim()
        : ownerObject?.name;
      const sellerName = auction.seller?.name;
      displayName = ownerName || sellerName || t('liveAuction.seller');
  }

  const handleCardClick = () => {
    if (!hasAuctionEnded) {
        navigateWithScroll(`/auction-details/${(auction as any)._id || auction.id}`);
    }
  };

  return (
    <div
        className="modern-auction-card auction-card"
        style={{
            background: hasAuctionEnded ? '#f0f0f0' : 'white', // Grey background when ended
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: hasAuctionEnded ? 'none' : '0 8px 25px rgba(0, 0, 0, 0.08)', // No shadow when ended
            height: '100%',
            width: '100%',
            maxWidth: '350px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
            border: hasAuctionEnded ? '1px solid #d0d0d0' : '1px solid rgba(0, 0, 0, 0.05)', // Grey border when ended
            cursor: hasAuctionEnded ? 'not-allowed' : 'pointer', // Change cursor
            opacity: hasAuctionEnded ? 0.6 : 1, // Grey out the card
            pointerEvents: hasAuctionEnded ? 'none' : 'auto', // Disable clicks
            margin: '0 auto',
        }}
        onClick={handleCardClick}
        onMouseEnter={(e) => {
            if (!hasAuctionEnded) { // Only apply hover effects if not ended
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 99, 177, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(0, 99, 177, 0.2)';
            }
        }}
        onMouseLeave={(e) => {
            if (!hasAuctionEnded) { // Only apply hover effects if not ended
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
            }
        }}
    >
        {/* Auction Image */}
        <div
            className="auction-image"
            style={{
                height: 'clamp(140px, 30vw, 240px)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
        <Link
            href={hasAuctionEnded ? "#" : `/auction-details/${(auction as any)._id || auction.id}`}
            scroll={false}
            style={{ display: 'block', height: '100%', cursor: hasAuctionEnded ? 'not-allowed' : 'pointer' }}
            onClick={(e) => {
                e.stopPropagation();
                if (hasAuctionEnded) {
                    e.preventDefault();
                    return;
                }
            }}
        >
                <img
                    src={getAuctionImageUrl(auction)}
                    alt={auction.title || "Auction Item"}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transition: 'transform 0.5s ease',
                        filter: hasAuctionEnded ? 'grayscale(100%)' : 'none', // Grey out image
                    }}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = DEFAULT_AUCTION_IMAGE;
                    }}
                    crossOrigin="use-credentials"
                />
            </Link>

            {/* Share Button - Positioned in bottom-right of image */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                zIndex: 10,
            }}
            onClick={(e) => e.stopPropagation()}
            >
                <ShareButton
                    type="auction"
                    id={(auction as any)._id || auction.id}
                    title={auction.title}
                    description={auction.description}
                    imageUrl={getAuctionImageUrl(auction)}
                />
            </div>

            {/* Auction Type Badge */}
                <div
                    style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        color: '#333',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '700',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        zIndex: 2,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
            >
                {auction.bidType === 'PRODUCT' ? t('common.product') : t('common.service')}
                </div>

            {/* Countdown Timer */}
            <div
                className="countdown-overlay"
                style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        color: '#d32f2f', // Red for urgency
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: '700',
                    }}
            >
                    <span>{timer.days || "00"}j</span>:
                    <span>{timer.hours || "00"}h</span>:
                    <span>{timer.minutes || "00"}m</span>:
                    <span>{timer.seconds || "00"}s</span>
                </div>
        </div>

        {/* Auction Content */}
        <div style={{
            padding: 'clamp(10px, 2vw, 25px)',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Title */}
            <h3 style={{
                fontSize: 'clamp(13px, 3vw, 18px)',
                fontWeight: '600',
                color: hasAuctionEnded ? '#666' : '#333', // Grey text for title
                marginBottom: '8px',
                lineHeight: '1.3',
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                height: '2.6em', // Enforce 2 lines visually
            }}>
                <Link
                    href={hasAuctionEnded ? "#" : `/auction-details/${(auction as any)._id || auction.id}`} // Prevent navigation if ended
                    scroll={false}
                    style={{ color: 'inherit', textDecoration: 'none', cursor: hasAuctionEnded ? 'not-allowed' : 'pointer' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasAuctionEnded) {
                            e.preventDefault();
                            return;
                        }
                    }}
                >
                    {auction.title || t('common.noTitle')}
                </Link>
            </h3>

            {/* Quantity and Location Info */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: auction?.bidType === 'SERVICE' ? '1fr' : '1fr 1fr',
                gap: '4px',
                marginBottom: '6px',
            }}>
                {auction?.bidType !== 'SERVICE' && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        border: '1px solid #e9ecef',
                        borderLeft: '3px solid #0063b1',
                    }}>
                        <p style={{
                            fontSize: '9px',
                            color: hasAuctionEnded ? '#888' : '#666',
                            margin: '0 0 2px 0',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            📦 {t('common.quantity')}
                        </p>
                        <p style={{
                            fontSize: '11px',
                            color: hasAuctionEnded ? '#888' : '#333',
                            margin: 0,
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {auction.quantity || t('common.notSpecified')}
                        </p>
                    </div>
                )}

                <div style={{
                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                    borderRadius: '6px',
                    padding: '4px 6px',
                    border: '1px solid #e9ecef',
                    borderLeft: '3px solid #0063b1',
                }}>
                    <p style={{
                        fontSize: '9px',
                        color: hasAuctionEnded ? '#888' : '#666',
                        margin: '0 0 2px 0',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        📍 {t('common.location')}
                    </p>
                    <p style={{
                        fontSize: '11px',
                        color: hasAuctionEnded ? '#888' : '#333',
                        margin: 0,
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {(() => {
                          const place = (auction as any).place || '';
                          const address = (auction as any).address || '';
                          const location = (auction as any).location || '';
                          const wilaya = (auction as any).wilaya || '';
                          const parts = [place, address, location, wilaya].filter(Boolean);
                          const uniqueParts = [...new Set(parts)];
                          return uniqueParts.length > 0 ? uniqueParts.join(', ') : t('common.notSpecified');
                        })()}
                    </p>
                </div>
            </div>

            {/* Price Info */}
            {((auction.currentPrice && !isNaN(auction.currentPrice) && auction.currentPrice > 0) || 
              (auction.startingPrice && !isNaN(auction.startingPrice) && auction.startingPrice > 0)) && (
            <div style={{
                background: hasAuctionEnded ? '#f0f0f0' : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                borderRadius: '8px',
                padding: '4px 8px',
                marginBottom: '8px',
                border: hasAuctionEnded ? '1px solid #e0e0e0' : '1px solid #e9ecef',
                borderLeft: hasAuctionEnded ? '3px solid #ccc' : '3px solid #0063b1',
            }}>
                <p style={{
                    fontSize: '10px',
                    color: hasAuctionEnded ? '#888' : '#666',
                    margin: '0 0 2px 0',
                        fontWeight: '600',
                }}>
                    💰 {t('auction.currentPrice')}
                </p>
                        <p style={{
                    fontSize: '12px',
                        color: hasAuctionEnded ? '#888' : '#0063b1',
                    margin: 0,
                    fontWeight: '600',
                        }}>
                            {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} DA
                        </p>
                </div>
            )}

            {/* Bidders Count */}
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
                        background: hasAuctionEnded ? '#ccc' : '#0063b1',
                        animation: hasAuctionEnded ? 'none' : 'pulse 2s infinite',
                    }}></div>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: hasAuctionEnded ? '#888' : '#0063b1',
                    }}>
                        {t('auction.biddersWithCount', { count: auction.biddersCount || 0 })}
                    </span>
                    <span style={{
                        fontSize: '10px',
                        color: hasAuctionEnded ? '#888' : '#666',
                    }}>
                        {t('auction.bidsPlaced')}
                    </span>
                </div>
            </div>


            {/* Owner Info */}
            <div style={{
                        display: 'flex',
                        alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
                    }}>
                        <img
                    src={(() => {
                        if (auction.hidden) {
                            return DEFAULT_PROFILE_IMAGE;
                        }
                        const owner = typeof auction.owner === 'object' ? auction.owner : null;
                        if ((owner as any)?.avatar?.url) {
                            return normalizeImageUrl((owner as any).avatar.url);
                        } else if (owner?.photoURL) {
                             return normalizeImageUrl(owner.photoURL);
                        }
                        return DEFAULT_PROFILE_IMAGE;
                    })()}
                    alt={displayName}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'contain',
                        filter: hasAuctionEnded ? 'grayscale(100%)' : 'none',
                    }}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_PROFILE_IMAGE;
                    }}
                />
                
                    <Link
                        href={`/profile/${typeof auction.owner === 'object' ? (auction.owner as any)._id : auction.owner}`}
                        scroll={false}
                        style={{
                            fontSize: '14px',
                            color: hasAuctionEnded ? '#888' : '#0063b1',
                            fontWeight: '600',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.3s ease',
                            cursor: hasAuctionEnded ? 'not-allowed' : 'pointer',
                            pointerEvents: hasAuctionEnded ? 'none' : 'auto',
                        }}
                        onMouseEnter={(e) => {
                            if (!hasAuctionEnded) {
                                e.currentTarget.style.textDecoration = 'underline';
                                e.currentTarget.style.color = '#004c8c';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!hasAuctionEnded) {
                                e.currentTarget.style.textDecoration = 'none';
                                e.currentTarget.style.color = '#0063b1';
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasAuctionEnded || auction.hidden || !auction.owner) {
                                e.preventDefault();
                                return;
                            }
                        }}
                    >
                        {displayName}
                        {!hasAuctionEnded && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                                <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                            </svg>
                        )}
                    </Link>
            </div>

            {/* View Details Button */}
            <Link
                href={hasAuctionEnded ? "#" : `/auction-details/${(auction as any)._id || auction.id}`}
                scroll={false}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 20px',
                    background: hasAuctionEnded ? '#cccccc' : 'linear-gradient(135deg, #0063b1, #00a3e0)', // Blue gradient
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '25px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                    boxShadow: hasAuctionEnded ? 'none' : '0 4px 15px rgba(0, 99, 177, 0.3)',
                    marginTop: 'auto', // Push to bottom
                    cursor: hasAuctionEnded ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                    if (!hasAuctionEnded) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 99, 177, 0.4)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!hasAuctionEnded) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 99, 177, 0.3)';
                    }
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (hasAuctionEnded) {
                        e.preventDefault();
                        return;
                    }
                }}
            >
                {t('common.viewDetails') || 'Voir les détails'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </Link>
        </div>
    </div>
  );
};

export default AuctionCard;
