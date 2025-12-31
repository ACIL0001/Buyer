import { DirectSale } from '@/types/direct-sale';
import { normalizeImageUrl } from '@/utils/url';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import app from '@/config';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';

// Default image constants
const DEFAULT_DIRECT_SALE_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

interface DirectSaleCardProps {
  sale: DirectSale;
}

const DirectSaleCard = ({ sale }: DirectSaleCardProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLogged, auth } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const availableQuantity = sale.quantity === 0 
    ? 999 
    : sale.quantity - (sale.soldQuantity || 0);
  
  const isSoldOut = sale.status === 'SOLD_OUT' || 
    sale.status === 'SOLD' ||
    (sale.quantity > 0 && availableQuantity <= 0);

  const getDirectSaleImageUrl = (directSale: DirectSale) => {
    if (directSale.thumbs && directSale.thumbs.length > 0 && directSale.thumbs[0].url) {
      return normalizeImageUrl(directSale.thumbs[0].url) || DEFAULT_DIRECT_SALE_IMAGE;
    }
    return DEFAULT_DIRECT_SALE_IMAGE;
  };

  const formatPrice = useCallback((price: number) => {
    return `${Number(price).toLocaleString()} DA`;
  }, []);

  const getSellerDisplayName = useCallback((directSale: DirectSale) => {
    if (directSale.hidden === true) {
      return t('common.anonymous') || 'Anonyme';
    }

    const owner = typeof directSale.owner === 'object' ? directSale.owner : null;
    if (!owner) return t('directSale.seller') || 'Vendeur';

    const companyName = owner.entreprise || owner.companyName;
    if (companyName) {
      return companyName;
    }

    const ownerName = owner.firstName && owner.lastName
      ? `${owner.firstName} ${owner.lastName}`
      : owner.username;

    return ownerName || t('directSale.seller') || 'Vendeur';
  }, [t]);

  const isDirectSaleOwner = useCallback((directSale: DirectSale) => {
    if (!isLogged || !auth.user?._id) return false;
    const ownerId = typeof directSale.owner === 'string' ? directSale.owner : directSale.owner?._id;
    return ownerId === auth.user._id;
  }, [isLogged, auth.user?._id]);

  const navigateWithScroll = useCallback((url: string) => {
    if (isSoldOut && !isDirectSaleOwner(sale)) return;
    
    router.push(url, { scroll: false });
  }, [router, isSoldOut, isDirectSaleOwner, sale]);

  const displayName = getSellerDisplayName(sale);

  return (
    <div 
      className={!isSoldOut ? "direct-sale-card-hover" : ""}
      onMouseEnter={() => !isSoldOut && setIsHovered(true)}
      onMouseLeave={() => !isSoldOut && setIsHovered(false)}
      style={{
        background: 'white',
        borderRadius: 'clamp(12px, 2.5vw, 16px)',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(247, 239, 138, 0.08)',
        border: '1px solid rgba(247, 239, 138, 0.1)',
        width: '100%',
        position: 'relative',
        minHeight: 'clamp(320px, 45vw, 360px)',
        opacity: isSoldOut ? 0.6 : 1,
        filter: isSoldOut ? 'grayscale(60%)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
      }}
    >
        <style jsx>{`
        .direct-sale-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .direct-sale-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(247, 239, 138, 0.15);
        }
      `}</style>
      
      {/* Image Container */}
      <div style={{
        position: 'relative',
        height: 'clamp(120px, 20vw, 160px)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f7ef8a, #8a7e1f)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
          <img
            src={getDirectSaleImageUrl(sale)}
            alt={sale.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: 'transform 0.4s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_DIRECT_SALE_IMAGE) {
                target.src = DEFAULT_DIRECT_SALE_IMAGE;
              }
            }}
            loading="lazy"
          />

          {/* Type Badge */}
          {sale.saleType && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#8a7e1f',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '12px',
              fontWeight: '600',
              zIndex: 2
            }}>
              {sale.saleType === 'PRODUCT' ? t('common.product') : t('common.service')}
            </div>
          )}

          {/* Sold Out Badge */}
          {isSoldOut && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              zIndex: 2
            }}>
              {t('liveDirectSales.soldOut')}
            </div>
          )}

          {/* Owner Badge */}
          {isDirectSaleOwner(sale) && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(247, 239, 138, 0.9)',
              color: '#3d370e',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              zIndex: 2
            }}>
              {t('liveDirectSales.yourSale')}
            </div>
          )}
      </div>

      {/* Direct Sale Details */}
      <div style={{ padding: 'clamp(12px, 2.5vw, 16px)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: 'clamp(14px, 2.2vw, 16px)',
          fontWeight: '600',
          color: '#3d370e',
          marginBottom: 'clamp(8px, 1.5vw, 10px)',
          lineHeight: '1.3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          height: '42px'
        }}>
          {sale.title || t('liveDirectSales.directSaleTitle')}
        </h3>

        {/* Location and Quantity Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          marginBottom: '8px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
            borderRadius: '8px',
            padding: '4px 8px',
            border: '1px solid #fef9c3',
            borderLeft: '3px solid #f7ef8a',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <p style={{
              fontSize: '10px',
              color: '#8a7e1f',
              margin: '0 0 2px 0',
              fontWeight: '600',
            }}>
              📍 {t('common.location')}
            </p>
            <p style={{
              fontSize: '12px',
              color: '#3d370e',
              margin: 0,
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {(() => {
                const location = sale.location || sale.place || '';
                const wilaya = sale.wilaya || '';
                const parts = [location, wilaya].filter(Boolean);
                return parts.length > 0 ? parts.join(', ') : t('common.notSpecified');
              })()}
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
            borderRadius: '8px',
            padding: '4px 8px',
            border: '1px solid #fef9c3',
            borderLeft: '3px solid #f7ef8a',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <p style={{
              fontSize: '10px',
              color: '#8a7e1f',
              margin: '0 0 2px 0',
              fontWeight: '600',
            }}>
              📦 {t('liveDirectSales.available')}
            </p>
            <p style={{
              fontSize: '12px',
              color: '#3d370e',
              margin: 0,
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {sale.quantity === 0 
                ? t('liveDirectSales.unlimited') 
                : `${availableQuantity} / ${sale.quantity}`}
            </p>
          </div>
        </div>

        {/* Price Info */}
        <div style={{
          background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
          borderRadius: '8px',
          padding: '4px 8px',
          marginBottom: '8px',
          border: '1px solid #fef9c3',
          borderLeft: '3px solid #f7ef8a',
        }}>
          <p style={{
            fontSize: '10px',
            color: '#8a7e1f',
            margin: '0 0 2px 0',
            fontWeight: '600',
          }}>
            💰 {t('liveDirectSales.fixedPrice')}
          </p>
          <p style={{
            fontSize: '12px',
            color: '#8a7e1f',
            margin: 0,
            fontWeight: '600',
          }}>
            {formatPrice(sale.price || 0)}
          </p>
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
            src={normalizeImageUrl((typeof sale.owner === 'object' ? (sale.owner?.avatar?.url || sale.owner?.photoURL) : undefined)) || DEFAULT_PROFILE_IMAGE}
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
            color: '#8a7e1f',
            fontWeight: '500',
          }}>
            {displayName}
          </span>
        </div>

        {/* View Details Button */}
        <Link
          href={`/direct-sale/${sale._id}`}
          scroll={false}
          onClick={(e) => {
            e.preventDefault();
            navigateWithScroll(`/direct-sale/${sale._id}`);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(6px, 1.5vw, 8px)',
            width: '100%',
            padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
            background: isSoldOut ? '#c7c7c7' : 'linear-gradient(90deg, #f7ef8a, #8a7e1f)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '25px',
            fontWeight: '600',
            fontSize: 'clamp(12px, 2vw, 14px)',
            transition: 'all 0.3s ease',
            boxShadow: isSoldOut ? 'none' : '0 4px 12px rgba(247, 239, 138, 0.3)',
            pointerEvents: isSoldOut ? 'none' : 'auto'
          }}
          onMouseEnter={(e) => {
            if (!isSoldOut) {
              e.currentTarget.style.background = 'linear-gradient(90deg, #8a7e1f, #f7ef8a)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(247, 239, 138, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSoldOut) {
              e.currentTarget.style.background = 'linear-gradient(90deg, #f7ef8a, #8a7e1f)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(247, 239, 138, 0.3)';
            }
          }}
        >
          {isSoldOut ? t('liveDirectSales.soldOut') : t('liveDirectSales.viewDetails')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default DirectSaleCard;
