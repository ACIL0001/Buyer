"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import app from '@/config';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { useRouter } from "next/navigation";
import "../auction-details/st.css";
import "../auction-details/modern-details.css";

// Default image constants
const DEFAULT_DIRECT_SALE_IMAGE = "/assets/images/logo-white.png";

export interface DirectSale {
  _id: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  soldQuantity?: number;
  saleType?: 'PRODUCT' | 'SERVICE';
  status: 'ACTIVE' | 'SOLD_OUT' | 'INACTIVE' | 'ARCHIVED' | 'SOLD' | 'PAUSED';
  thumbs?: Array<{ _id: string; url: string; filename?: string; fullUrl?: string }>;
  videos?: Array<{ _id: string; url: string; filename?: string; fullUrl?: string }>;
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    entreprise?: string;
    companyName?: string;
    avatar?: { url: string; };
    photoURL?: string;
  };
  productCategory?: {
    name: string;
  };
  location?: string;
  place?: string;
  wilaya?: string;
  isPro?: boolean;
  hidden?: boolean;
  verifiedOnly?: boolean;
}

const getDirectSaleImageUrl = (directSale: DirectSale) => {
  if (directSale.thumbs && directSale.thumbs.length > 0 && directSale.thumbs[0].url) {
    const imageUrl = directSale.thumbs[0].url;
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('/')) {
      return `${app.baseURL}${imageUrl.substring(1)}`;
    } else {
      return `${app.baseURL}${imageUrl}`;
    }
  }
  return DEFAULT_DIRECT_SALE_IMAGE;
};

interface DirectSaleCardProps {
  sale: DirectSale;
}

const DirectSaleCard = ({ sale }: DirectSaleCardProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLogged, auth } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const availableQuantity = sale.quantity === 0 
    ? 999 
    : sale.quantity - (sale.soldQuantity || 0);
  
  const isSoldOut = sale.status === 'SOLD_OUT' || 
    sale.status === 'SOLD' ||
    (sale.quantity > 0 && availableQuantity <= 0);

  const formatPrice = useCallback((price: number) => {
    return `${Number(price).toLocaleString()} DA`;
  }, []);

  const getSellerDisplayName = useCallback((directSale: DirectSale) => {
    if (directSale.hidden === true) {
      return t('common.anonymous') || 'Anonyme';
    }

    const companyName = directSale.owner?.entreprise || directSale.owner?.companyName;
    if (companyName) {
      return companyName;
    }

    const ownerName = directSale.owner?.firstName && directSale.owner?.lastName
      ? `${directSale.owner.firstName} ${directSale.owner.lastName}`
      : directSale.owner?.username;

    return ownerName || t('directSale.seller') || 'Vendeur';
  }, [t]);

  const isDirectSaleOwner = useCallback((directSale: DirectSale) => {
    if (!isLogged || !auth.user?._id) return false;
    return directSale.owner?._id === auth.user._id;
  }, [isLogged, auth.user?._id]);

  const navigateWithScroll = useCallback((url: string) => {
    if (isSoldOut && !isDirectSaleOwner(sale)) return;
    
    router.push(url, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [router, isSoldOut, isDirectSaleOwner, sale]);

  return (
    <>
      <style jsx>{`
        .direct-sale-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .direct-sale-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(247, 239, 138, 0.15);
        }
      `}</style>
      <div 
        className={!isSoldOut ? "direct-sale-card-hover" : ""}
        onMouseEnter={() => !isSoldOut && setIsHovered(true)}
        onMouseLeave={() => !isSoldOut && setIsHovered(false)}
        style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(247, 239, 138, 0.08)',
          border: '1px solid rgba(247, 239, 138, 0.1)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          opacity: isSoldOut ? 0.6 : 1,
          filter: isSoldOut ? 'grayscale(60%)' : 'none',
          cursor: isSoldOut ? 'not-allowed' : 'default'
        }}
      >
        {/* Verification Shield */}
        {sale.verifiedOnly && (
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
             border: '2px solid #8a7e1f'
           }} title={t('common.verifiedOnly')}>
             <span style={{ fontSize: '16px' }}>🛡️</span>
           </div>
        )}

        {/* Image Container */}
        <div style={{
          position: 'relative',
          height: '180px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f7ef8a, #8a7e1f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
           <img
             src={imageError ? DEFAULT_DIRECT_SALE_IMAGE : getDirectSaleImageUrl(sale)}
             alt={sale.title}
             style={{
               width: '100%',
               height: '100%',
               objectFit: 'contain',
               transition: 'transform 0.4s ease',
               transform: isHovered ? 'scale(1.05)' : 'scale(1)'
             }}
             onError={() => setImageError(true)}
           />
           
           {/* Sold Out Overlay */}
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
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
           <h3 style={{
             fontSize: '16px',
             fontWeight: '600',
             color: '#3d370e',
             marginBottom: '10px',
             lineHeight: '1.3',
             overflow: 'hidden',
             textOverflow: 'ellipsis',
             display: '-webkit-box',
             WebkitLineClamp: 2,
             WebkitBoxOrient: 'vertical',
             height: '42px'
           }}>
             {sale.title}
           </h3>

           {/* Location */}
           <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '10px'
           }}>
             <span style={{ fontSize: '14px' }}>📍</span>
             <span style={{ 
               fontSize: '13px', 
               color: '#666',
               whiteSpace: 'nowrap',
               overflow: 'hidden',
               textOverflow: 'ellipsis'
             }}>
               {sale.place || sale.wilaya || sale.location || t('common.algeria')}
             </span>
           </div>

           {/* Price */}
           <div style={{
             marginBottom: '16px',
             background: 'linear-gradient(135deg, #fefce8, #fef9c3)',
             padding: '10px',
             borderRadius: '8px',
             border: '1px solid #fef9c3',
             borderLeft: '3px solid #f7ef8a',
           }}>
             <span style={{ 
               display: 'block',
               color: '#8a7e1f', 
               fontSize: '12px', 
               fontWeight: '600',
               marginBottom: '2px'
             }}>
               {t('common.price')}
             </span>
             <span style={{ 
               color: '#3d370e', 
               fontWeight: '700', 
               fontSize: '18px' 
             }}>
               {formatPrice(sale.price)}
             </span>
           </div>

           {/* Action Button */}
           <button
             disabled={isSoldOut}
             onClick={() => navigateWithScroll(`/direct-sale/${sale._id}`)}
             className="modern-button"
             style={{
               width: '100%',
               padding: '12px',
               borderRadius: '12px',
               border: 'none',
               background: isSoldOut ? '#e2e8f0' : 'linear-gradient(135deg, #f7ef8a, #d4c63b)',
               color: isSoldOut ? '#94a3b8' : '#3d370e',
               fontWeight: '600',
               cursor: isSoldOut ? 'not-allowed' : 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '8px',
               marginTop: 'auto',
               transition: 'all 0.3s ease',
               boxShadow: isSoldOut ? 'none' : '0 4px 12px rgba(212, 198, 59, 0.3)'
             }}
           >
             <span>{isSoldOut ? t('liveDirectSales.soldOut') : t('liveDirectSales.buyNow')}</span>
             {!isSoldOut && (
               <span style={{ fontSize: '16px' }}>🛒</span>
             )}
           </button>
        </div>
      </div>
    </>
  );
};

export default DirectSaleCard;
