// Home1LiveDirectSales.tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { DirectSaleAPI } from "@/app/api/direct-sale";
import app from '@/config';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import "../auction-details/st.css";
import "../auction-details/modern-details.css";
import { useRouter } from "next/navigation";

// Default image constants
const DEFAULT_DIRECT_SALE_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

interface DirectSale {
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
}

// Helper function to get the correct image URL
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

const Home1LiveDirectSales = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLogged, auth } = useAuth();
  const [directSales, setDirectSales] = useState<DirectSale[]>([]);
  const [allDirectSales, setAllDirectSales] = useState<DirectSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finished'>('all');

  // Fetch direct sales
  useEffect(() => {
    const fetchDirectSales = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await DirectSaleAPI.getDirectSales() as any;
        
        // Process data based on response structure
        let directSalesData: DirectSale[] = [];
        
        if (data) {
          if (Array.isArray(data)) {
            directSalesData = data;
          } else if (data.data && Array.isArray(data.data)) {
            directSalesData = data.data;
          } else if (data.success && data.data && Array.isArray(data.data)) {
            directSalesData = data.data;
          } else {
            directSalesData = [];
          }
        } else {
          directSalesData = [];
        }
        
        // IMPORTANT: Display ALL direct sales including sold-out ones
        // Sold-out items will be shown but visually deactivated (grayed out, non-clickable)
        // DO NOT filter out SOLD_OUT, SOLD, or items with exhausted quantity
        // Only filter out items that are explicitly ARCHIVED or INACTIVE
        // This ensures sold-out items remain visible as deactivated cards
        const visibleDirectSales = directSalesData.filter((sale: DirectSale) => {
          // Include all items except ARCHIVED and INACTIVE
          // This includes: ACTIVE, SOLD_OUT, SOLD, PAUSED, and items with exhausted quantity
          return sale.status !== 'ARCHIVED' && sale.status !== 'INACTIVE';
        });

        // Store all direct sales
        setAllDirectSales(visibleDirectSales);
        
        // Apply initial filter (all by default)
        let filteredDirectSales = visibleDirectSales;
        if (statusFilter === 'active') {
          filteredDirectSales = visibleDirectSales.filter((sale: DirectSale) => {
            return sale.status === 'ACTIVE' || sale.status === 'PAUSED';
          });
        } else if (statusFilter === 'finished') {
          filteredDirectSales = visibleDirectSales.filter((sale: DirectSale) => {
            return sale.status === 'SOLD_OUT' || sale.status === 'SOLD';
          });
        }

        // Limit to 8 for display
        const limitedDirectSales = filteredDirectSales.slice(0, 8);
        setDirectSales(limitedDirectSales);
        setError(null);
      } catch (err) {
        console.error("Error fetching direct sales:", err);
        setError("Failed to load direct sales");
        setDirectSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectSales();
  }, []);

  // Filter direct sales based on status
  useEffect(() => {
    if (allDirectSales.length === 0) return;

    let filtered = [...allDirectSales];
    
    if (statusFilter === 'active') {
      filtered = allDirectSales.filter((sale: DirectSale) => {
        return sale.status === 'ACTIVE' || sale.status === 'PAUSED';
      });
    } else if (statusFilter === 'finished') {
      filtered = allDirectSales.filter((sale: DirectSale) => {
        return sale.status === 'SOLD_OUT' || sale.status === 'SOLD';
      });
    }

    // Limit to 8 for display
    const limitedDirectSales = filtered.slice(0, 8);
    setDirectSales(limitedDirectSales);
  }, [allDirectSales, statusFilter]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setAnimatedCards(prev => [...prev, index]);
          }
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -50px 0px' }
    );

    const directSaleCards = document.querySelectorAll('.direct-sale-card-animate');
    directSaleCards.forEach((card, index) => {
      card.setAttribute('data-index', index.toString());
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [directSales]);

  // Helper function to get seller display name
  const getSellerDisplayName = useCallback((directSale: DirectSale) => {
    if (directSale.hidden === true) {
      return t('common.anonymous') || 'Anonyme';
    }

    const ownerName = directSale.owner?.firstName && directSale.owner?.lastName
      ? `${directSale.owner.firstName} ${directSale.owner.lastName}`
      : directSale.owner?.username;

    return ownerName || t('directSale.seller') || 'Vendeur';
  }, [t]);

  // Helper function to check if current user is the owner
  const isDirectSaleOwner = useCallback((directSale: DirectSale) => {
    if (!isLogged || !auth.user?._id) return false;
    return directSale.owner?._id === auth.user._id;
  }, [isLogged, auth.user?._id]);

  // Swiper settings
  const settings = useMemo(() => ({
    slidesPerView: "auto" as const,
    speed: 800,
    spaceBetween: 25,
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    navigation: {
      nextEl: ".direct-sale-slider-next",
      prevEl: ".direct-sale-slider-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      280: {
        slidesPerView: 1,
        spaceBetween: 15,
      },
      576: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      768: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      992: {
        slidesPerView: 3,
        spaceBetween: 25,
      },
      1200: {
        slidesPerView: 4,
        spaceBetween: 25,
      },
      1400: {
        slidesPerView: 5,
        spaceBetween: 25,
      },
      1600: {
        slidesPerView: 5,
        spaceBetween: 30,
      },
    },
  }), []);

  const navigateWithScroll = useCallback((url: string) => {
    router.push(url, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [router]);

  if (loading) {
    return (
      <div className="modern-direct-sales-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
        <div className="container-responsive">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 'clamp(30px, 6vw, 50px)' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #f7ef8a',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
            <p style={{ marginTop: '15px', color: '#666' }}>{t('liveDirectSales.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-direct-sales-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0' }}>
        <div className="container-responsive">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 'clamp(30px, 6vw, 50px)' }}>
            <div className="alert alert-warning" style={{
              background: 'rgba(247, 239, 138, 0.1)',
              border: '1px solid rgba(247, 239, 138, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              color: '#8a7e1f',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              <h3>❌ {t('liveDirectSales.loadingError')}</h3>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Mobile responsiveness fixes */
        @media (max-width: 768px) {
          .modern-direct-sales-section {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            padding: 40px 16px !important;
            transform: none !important;
            transition: none !important;
            position: relative !important;
            zIndex: 10 !important;
            min-height: 200px !important;
          }
          
          .section-header {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
          
          .direct-sale-carousel-container {
            padding: 0 16px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .swiper {
            padding: 0 16px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          /* Force all direct sale content to be visible */
          .direct-sale-card, .swiper-slide, .direct-sale-item {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          /* Ensure empty state is visible on mobile */
          .empty-state-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            margin: 20px 0 !important;
          }
          
          /* Ensure view all button is visible on mobile */
          .view-all-button-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            margin: 30px 0 !important;
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .direct-sale-card-animate {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
          transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .direct-sale-card-animate.animated {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .direct-sale-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .direct-sale-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(247, 239, 138, 0.15);
        }
      `}</style>

      <div className="modern-direct-sales-section" style={{ padding: 'clamp(40px, 8vw, 80px) 0', background: 'white' }}>
        <div className="container-responsive">
          {/* Section Header */}
          <div className="section-header" style={{
            textAlign: 'center',
            marginBottom: 'clamp(30px, 6vw, 50px)',
            opacity: 0,
            transform: 'translateY(30px)',
            animation: 'fadeInUp 0.8s ease-out forwards',
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '800',
              color: '#8a7e1f',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #8a7e1f, #f7ef8a)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {t('liveDirectSales.title')}
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#8a7e1f',
              maxWidth: '600px',
              margin: '0 auto 24px',
              lineHeight: '1.6',
            }}>
              {t('liveDirectSales.description')}
            </p>
            
            {/* Status Filter Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '20px',
            }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '25px',
                  border: '2px solid',
                  borderColor: statusFilter === 'all' ? '#f7ef8a' : '#e2e8f0',
                  background: statusFilter === 'all' ? 'linear-gradient(135deg, #f7ef8a, #8a7e1f)' : 'white',
                  color: statusFilter === 'all' ? '#3d370e' : '#666',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: statusFilter === 'all' ? '0 4px 12px rgba(247, 239, 138, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'all') {
                    e.currentTarget.style.borderColor = '#f7ef8a';
                    e.currentTarget.style.color = '#8a7e1f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== 'all') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#666';
                  }
                }}
              >
                {t('common.all')}
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '25px',
                  border: '2px solid',
                  borderColor: statusFilter === 'active' ? '#10b981' : '#e2e8f0',
                  background: statusFilter === 'active' ? 'linear-gradient(135deg, #10b981, #059669)' : 'white',
                  color: statusFilter === 'active' ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: statusFilter === 'active' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'active') {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.color = '#10b981';
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== 'active') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#666';
                  }
                }}
              >
                {t('common.active')}
              </button>
              <button
                onClick={() => setStatusFilter('finished')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '25px',
                  border: '2px solid',
                  borderColor: statusFilter === 'finished' ? '#ef4444' : '#e2e8f0',
                  background: statusFilter === 'finished' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'white',
                  color: statusFilter === 'finished' ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: statusFilter === 'finished' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'finished') {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ef4444';
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== 'finished') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#666';
                  }
                }}
              >
                {t('common.finished')}
              </button>
            </div>
          </div>

          {/* Direct Sales Content */}
          {directSales.length > 0 ? (
            <div className="direct-sale-carousel-container" style={{ position: 'relative' }}>
              <Swiper
                modules={[Navigation, Autoplay, Pagination]}
                {...settings}
                className="swiper direct-sale-slider"
                style={{
                  padding: '20px 0 50px',
                  overflow: 'visible',
                }}
              >
                {directSales.map((directSale, idx) => {
                  const isAnimated = animatedCards.includes(idx);
                  const availableQuantity = directSale.quantity === 0 
                    ? 999 
                    : directSale.quantity - (directSale.soldQuantity || 0);
                  const isSoldOut = directSale.status === 'SOLD_OUT' || 
                    directSale.status === 'SOLD' ||
                    (directSale.quantity > 0 && availableQuantity <= 0);
                  const displayName = getSellerDisplayName(directSale);

                  return (
                    <SwiperSlide key={directSale._id} style={{ height: 'auto', display: 'flex', justifyContent: 'center' }}>
                      <div
                        className={`direct-sale-card-animate direct-sale-card-hover ${isAnimated ? 'animated' : ''}`}
                        style={{
                          background: 'white',
                          borderRadius: 'clamp(16px, 3vw, 20px)',
                          overflow: 'hidden',
                          boxShadow: '0 8px 25px rgba(247, 239, 138, 0.08)',
                          border: '1px solid rgba(247, 239, 138, 0.1)',
                          width: '100%',
                          maxWidth: '320px',
                          position: 'relative',
                          minHeight: '380px',
                          opacity: isSoldOut ? 0.6 : 1,
                          filter: isSoldOut ? 'grayscale(60%)' : 'none',
                          cursor: isSoldOut ? 'not-allowed' : 'default'
                        }}
                      >
                        {/* Direct Sale Image */}
                        <div style={{
                          position: 'relative',
                          height: 'clamp(160px, 25vw, 200px)',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #f7ef8a, #8a7e1f)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {directSale.thumbs && directSale.thumbs.length > 0 && directSale.thumbs[0].url ? (
                            <img
                              src={getDirectSaleImageUrl(directSale)}
                              alt={directSale.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.4s ease',
                              }}
                              onError={(e) => {
                                if ((e.target as HTMLImageElement).src !== DEFAULT_DIRECT_SALE_IMAGE) {
                                  (e.target as HTMLImageElement).src = DEFAULT_DIRECT_SALE_IMAGE;
                                }
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div style={{
                              color: 'white',
                              fontSize: '48px',
                              textAlign: 'center',
                            }}>
                              🛒
                            </div>
                          )}

                          {/* Type Badge */}
                          {directSale.saleType && (
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
                            }}>
                              {directSale.saleType === 'PRODUCT' ? t('common.product') : t('common.service')}
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
                            }}>
                              {t('liveDirectSales.soldOut')}
                            </div>
                          )}

                          {/* Owner Badge */}
                          {isDirectSaleOwner(directSale) && (
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
                            }}>
                              {t('liveDirectSales.yourSale')}
                            </div>
                          )}
                        </div>

                        {/* Direct Sale Details */}
                        <div style={{ padding: 'clamp(16px, 3vw, 20px)' }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#3d370e',
                            marginBottom: '12px',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {directSale.title || 'Direct Sale Title'}
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
                                  const location = directSale.location || directSale.place || '';
                                  const wilaya = directSale.wilaya || '';
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
                              }}>
                                {directSale.quantity === 0 
                                  ? t('liveDirectSales.unlimited') 
                                  : `${availableQuantity} / ${directSale.quantity}`}
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
                              {Number(directSale.price || 0).toLocaleString()} DA
                            </p>
                          </div>

                          {/* Owner Info */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '16px',
                          }}>
                            <img
                              src={directSale.owner?.avatar?.url || directSale.owner?.photoURL || DEFAULT_PROFILE_IMAGE}
                              alt={displayName}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_PROFILE_IMAGE;
                              }}
                            />
                            {directSale.owner && !directSale.hidden ? (
                              <Link
                                href={`/users/${directSale.owner._id}`}
                                style={{
                                  fontSize: '14px',
                                  color: '#8a7e1f',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.3s ease',
                                  cursor: isSoldOut ? 'not-allowed' : 'pointer',
                                  pointerEvents: isSoldOut ? 'none' : 'auto',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSoldOut) {
                                    e.currentTarget.style.textDecoration = 'underline';
                                    e.currentTarget.style.color = '#6b5a1a';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSoldOut) {
                                    e.currentTarget.style.textDecoration = 'none';
                                    e.currentTarget.style.color = '#8a7e1f';
                                  }
                                }}
                                onClick={(e) => {
                                  if (isSoldOut) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                {directSale.owner.entreprise || displayName}
                                {!isSoldOut && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                                    <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                                  </svg>
                                )}
                              </Link>
                            ) : (
                              <span style={{
                                fontSize: '14px',
                                color: '#8a7e1f',
                                fontWeight: '500',
                              }}>
                                {displayName}
                              </span>
                            )}
                          </div>

                          {/* View Details Button */}
                          <Link
                            href={`/direct-sale/${directSale._id}`}
                            scroll={false}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateWithScroll(`/direct-sale/${directSale._id}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              width: '100%',
                              padding: '12px 20px',
                              background: isSoldOut ? '#c7c7c7' : 'linear-gradient(90deg, #f7ef8a, #8a7e1f)',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '25px',
                              fontWeight: '600',
                              fontSize: '14px',
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
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* Navigation Buttons */}
              <div className="slider-navigation" style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none',
                zIndex: 10,
              }}>
                <button
                  className="direct-sale-slider-prev"
                  style={{
                    background: 'white',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(247, 239, 138, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'auto',
                    marginLeft: '-25px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #f7ef8a, #8a7e1f)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#8a7e1f';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12Z"/>
                  </svg>
                </button>

                <button
                  className="direct-sale-slider-next"
                  style={{
                    background: 'white',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(247, 239, 138, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'auto',
                    marginRight: '-25px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #f7ef8a, #8a7e1f)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#8a7e1f';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                  </svg>
                </button>
              </div>

              {/* Pagination */}
              <div className="swiper-pagination" style={{
                position: 'relative',
                marginTop: '30px',
              }}></div>
            </div>
          ) : (
            <div 
              className="empty-state-container"
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 8px 25px rgba(247, 239, 138, 0.08)',
                opacity: 0,
                transform: 'translateY(30px)',
                animation: 'fadeInUp 0.8s ease-out forwards',
                margin: '20px 0',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px',
              }}>🛒</div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#8a7e1f',
                marginBottom: '12px',
              }}>
                {t('liveDirectSales.noActiveSales')}
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#8a7e1f',
                marginBottom: '30px',
              }}>
                {t('liveDirectSales.comeBackLater')}
              </p>
            </div>
          )}

          {/* View All Button */}
          <div 
            className="view-all-button-container"
            style={{
              textAlign: 'center',
              marginTop: '50px',
              opacity: 0,
              transform: 'translateY(30px)',
              animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
            }}>
            <Link
              href="/direct-sale"
              scroll={false}
              onClick={(e) => {
                e.preventDefault();
                navigateWithScroll("/direct-sale");
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 32px',
                background: 'linear-gradient(90deg, #f7ef8a, #8a7e1f)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: '16px',
                boxShadow: '0 8px 25px rgba(247, 239, 138, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #8a7e1f, #f7ef8a)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(247, 239, 138, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #f7ef8a, #8a7e1f)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(247, 239, 138, 0.3)';
              }}
            >
              {t('liveDirectSales.viewAll')}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home1LiveDirectSales;