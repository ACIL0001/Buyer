// Home1LiveTenders.tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { TendersAPI } from "@/app/api/tenders";
import app from '@/config';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import CardSkeleton from '../skeletons/CardSkeleton';
import { Tender, TENDER_STATUS } from '@/types/tender';
import useAuth from '@/hooks/useAuth';
import { normalizeImageUrl } from '@/utils/url';
import "../auction-details/st.css";
import "../auction-details/modern-details.css";
import { useRouter } from "next/navigation";
import ShareButton from '@/components/common/ShareButton';

// Default image constants
const DEFAULT_TENDER_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

// Timer interface
interface Timer {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  hasEnded: boolean;
}

// Helper function to calculate time remaining
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



// Helper function to get the correct tender image URL
const getTenderImageUrl = (tender: Tender) => {
  if (tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url) {
    const imageUrl = tender.attachments[0].url;
    
    // Use the centralized normalization utility which handles localhost:3000 replacement
    return normalizeImageUrl(imageUrl);
  } else {
    return DEFAULT_TENDER_IMAGE;
  }
};

const Home1LiveTenders = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLogged, auth } = useAuth();
  const { data: allTendersResponse, isLoading: tendersLoading, error: tendersError } = useQuery({
    queryKey: ['tenders', 'active'],
    queryFn: () => TendersAPI.getActiveTenders(),
  });

  const error = tendersError ? (tendersError as any).message || "Failed to load tenders" : null;

  const allTenders = useMemo(() => {
    const data = allTendersResponse?.data || allTendersResponse || [];
    const transformed = (Array.isArray(data) ? data : []).map((tender: any) => ({
      ...tender,
      id: tender.id || tender._id,
    }));

    // Filter by verifiedOnly
    const isUserVerified = auth.user?.isVerified === true || auth.user?.isVerified === 1;
    return transformed.filter((tender: Tender) => {
      if (tender.verifiedOnly === true && !isUserVerified) {
        return false;
      }
      return true;
    });
  }, [allTendersResponse, auth.user]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finished'>('all');
  const [timers, setTimers] = useState<{ [key: string]: Timer }>({});
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [workingImageUrls, setWorkingImageUrls] = useState<{ [key: string]: string }>({});

  const handleImageError = (tenderId: string, _tender?: any) => {
    setImageErrors(prev => ({ ...prev, [tenderId]: true }));
  };

  // Filter and limit tenders for display
  const liveTenders = useMemo(() => {
    let filtered = allTenders;
    
    if (statusFilter === 'active') {
      filtered = allTenders.filter((tender: Tender) => {
        if (!tender.endingAt) return false;
        const endTime = new Date(tender.endingAt);
        return endTime > new Date();
      });
    } else if (statusFilter === 'finished') {
      filtered = allTenders.filter((tender: Tender) => {
        if (!tender.endingAt) return true;
        const endTime = new Date(tender.endingAt);
        return endTime <= new Date();
      });
    }

    return filtered.slice(0, 8);
  }, [allTenders, statusFilter]);

  // Update timers
  useEffect(() => {
    if (liveTenders.length === 0) return;

    const updateTimers = () => {
      const newTimers: { [key: string]: Timer } = {};
      liveTenders.forEach(tender => {
        if (tender._id && tender.endingAt) {
          newTimers[tender._id] = calculateTimeRemaining(tender.endingAt);
        }
      });
      setTimers(newTimers);
    };

    // Initial update
    updateTimers();

    // Update every second
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [liveTenders]);

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

    const tenderCards = document.querySelectorAll('.tender-card-animate');
    tenderCards.forEach((card, index) => {
      card.setAttribute('data-index', index.toString());
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [liveTenders]);

  // Format price function
  const formatPrice = useCallback((price: number) => {
    return `${Number(price).toLocaleString()} DA`;
  }, []);


  // Helper function to check if current user is the owner of a tender
  const isTenderOwner = useCallback((tender: Tender) => {
    if (!isLogged || !auth.user?._id) return false;
    return tender.owner?._id === auth.user._id || tender.owner === auth.user._id;
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
      nextEl: ".tender-slider-next",
      prevEl: ".tender-slider-prev",
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

    const tenderCards = document.querySelectorAll('.tender-card-animate');
    tenderCards.forEach((card, index) => {
      card.setAttribute('data-index', index.toString());
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [liveTenders]);

  if (tendersLoading) {
    return (
      <div className="modern-tenders-section" style={{ padding: '10px 0 0 0' }}>
        <div className="container-responsive">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            padding: '20px'
          }}>
            {[...Array(5)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-tenders-section" style={{ padding: '10px 0 0 0' }}>
        <div className="container-responsive">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 'clamp(30px, 6vw, 50px)' }}>
            <div className="alert alert-warning" style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              color: '#856404',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              <h3>❌ {t('liveTenders.loadingError')}</h3>
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

        /* Mobile responsiveness fixes */
        @media (max-width: 768px) {
          .modern-tenders-section {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            padding: 15px 16px 0 16px !important;
            padding-top: 15px !important;
            transform: none !important;
            transition: none !important;
            position: relative !important;
            z-index: 10 !important;
            min-height: 200px !important;
          }
          
          .tender-slider {
            padding-bottom: 0 !important;
          }
          
          .view-all-button-container {
            margin-top: 0 !important;
          }
          
          .section-header {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
          
          .tender-carousel-container {
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

          /* Force all tender content to be visible */
          .tender-card, .swiper-slide, .tender-item {
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

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        .tender-card-animate {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
          transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .tender-card-animate.animated {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .tender-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .tender-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 99, 177, 0.15);
        }

        .timer-digit {
          animation: pulse 1s infinite;
        }

        .timer-digit.urgent {
          animation: pulse 0.5s infinite;
          color: white;
        }
      `}</style>

      <div className="modern-tenders-section" style={{ padding: '10px 0 0 0', background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
        <div className="container-responsive">
          {/* Section Header */}
          <div className="section-header" style={{
            textAlign: 'center',
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
            opacity: 0,
            transform: 'translateY(30px)',
            animation: 'fadeInUp 0.8s ease-out forwards',
          }}>
            <h2 style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
              fontWeight: '800',
              color: '#27F5CC',
              marginBottom: 'clamp(8px, 1.5vw, 12px)',
            }}>
              {t('liveTenders.title')}
            </h2>
            <p style={{
              fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto clamp(12px, 2vw, 16px)',
              lineHeight: '1.5',
            }}>
              {t('liveTenders.description')}
            </p>
            
            {/* Status Filter Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(8px, 1.5vw, 12px)',
              flexWrap: 'wrap',
              marginBottom: 'clamp(12px, 2vw, 16px)',
            }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: 'clamp(6px, 1.2vw, 8px) clamp(16px, 3vw, 20px)',
                  borderRadius: '25px',
                  border: '1.5px solid',
                  borderColor: statusFilter === 'all' ? '#27F5CC' : '#e2e8f0',
                  background: statusFilter === 'all' ? 'linear-gradient(135deg, #27F5CC, #00D4AA)' : 'white',
                  color: statusFilter === 'all' ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: 'clamp(11px, 1.8vw, 13px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: statusFilter === 'all' ? '0 4px 12px rgba(39, 245, 204, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'all') {
                    e.currentTarget.style.borderColor = '#27F5CC';
                    e.currentTarget.style.color = '#27F5CC';
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
                  padding: 'clamp(6px, 1.2vw, 8px) clamp(16px, 3vw, 20px)',
                  borderRadius: '25px',
                  border: '1.5px solid',
                  borderColor: statusFilter === 'active' ? '#10b981' : '#e2e8f0',
                  background: statusFilter === 'active' ? 'linear-gradient(135deg, #10b981, #059669)' : 'white',
                  color: statusFilter === 'active' ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: 'clamp(11px, 1.8vw, 13px)',
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
                  padding: 'clamp(6px, 1.2vw, 8px) clamp(16px, 3vw, 20px)',
                  borderRadius: '25px',
                  border: '1.5px solid',
                  borderColor: statusFilter === 'finished' ? '#ef4444' : '#e2e8f0',
                  background: statusFilter === 'finished' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'white',
                  color: statusFilter === 'finished' ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: 'clamp(11px, 1.8vw, 13px)',
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

          {/* Tenders Content - Always show on mobile, even with no data */}
          {liveTenders.length > 0 ? (
            <div className="tender-carousel-container" style={{ position: 'relative' }}>
              <Swiper
                modules={[Navigation, Autoplay, Pagination]}
                {...settings}
                className="swiper tender-slider"
                style={{
                  padding: 'clamp(10px, 2vw, 16px) 0 0',
                  overflow: 'visible',
                }}
              >
                {liveTenders.map((tender, idx) => {
                  const timer = timers[tender._id] || { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false };
                  const isEnded = !!timer.hasEnded;
                  const isAnimated = animatedCards.includes(idx);
                  const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30;

                  // Determine the display name for the tender owner
                  let displayName;
                  if (tender.hidden) {
                    displayName = t('common.anonymous') || 'Anonyme';
                  } else {
                    // Prioritize company name over personal name
                    const companyName = tender.owner?.entreprise || tender.owner?.companyName;
                    const ownerName = tender.owner?.firstName && tender.owner?.lastName
                      ? `${tender.owner.firstName} ${tender.owner.lastName}`.trim()
                      : tender.owner?.name;
                    displayName = companyName || ownerName || t('common.buyer');
                  }

                  return (
                    <SwiperSlide key={tender._id} style={{ height: 'auto', display: 'flex', justifyContent: 'center' }}>
                      <div
                        className={`tender-card-animate tender-card-hover ${isAnimated ? 'animated' : ''}`}
                        style={{
                          background: 'white',
                          borderRadius: 'clamp(12px, 2.5vw, 16px)',
                          overflow: 'hidden',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                          border: '1px solid rgba(0, 0, 0, 0.05)',
                          width: '100%',
                          maxWidth: '320px',
                          position: 'relative',
                          minHeight: 'clamp(320px, 45vw, 360px)',
                          opacity: isEnded ? 0.6 : 1,
                          filter: isEnded ? 'grayscale(60%)' : 'none',
                          cursor: isEnded ? 'not-allowed' : 'default'
                        }}
                      >
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
                          {tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url ? (
                            <img
                              src={(() => {
                                // Check if we have a working cached URL first
                                if (workingImageUrls[tender._id]) {
                                  console.log(`🎯 Using cached working URL for tender ${tender.title}:`, workingImageUrls[tender._id]);
                                  return workingImageUrls[tender._id];
                                }
                                
                                const imageUrl = imageErrors[tender._id] ? DEFAULT_TENDER_IMAGE : getTenderImageUrl(tender);
                                console.log(`🎯 Final tender image src for ${tender.title}:`, imageUrl);
                                console.log(`🎯 Is this a backend image?`, imageUrl.includes(app.baseURL));
                                return imageUrl;
                              })()}
                              alt={tender.title || 'Tender'}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                transition: 'transform 0.4s ease',
                              }}
                              onLoad={(e) => {
                                const imageUrl = getTenderImageUrl(tender);
                                console.log('✅ ===== TENDER IMAGE LOAD SUCCESS =====');
                                console.log('🎉 Successfully loaded tender image:', imageUrl);
                                console.log('🎉 Image element src:', (e.target as HTMLImageElement).src);
                                console.log('🎉 Image dimensions:', (e.target as HTMLImageElement).naturalWidth, 'x', (e.target as HTMLImageElement).naturalHeight);
                                console.log('📋 Tender Info:', {
                                  id: tender._id,
                                  title: tender.title
                                });
                                console.log('🎯 Is this a backend image?', imageUrl.includes(app.baseURL));
                                console.log('✅ ===== END TENDER IMAGE LOAD SUCCESS =====');
                              }}
                              onError={(e) => {
                                console.log('❌ ===== TENDER IMAGE LOAD ERROR =====');
                                console.log('❌ Tender image failed to load:', tender.title);
                                console.log('❌ Failed URL:', (e.target as HTMLImageElement).src);
                                console.log('❌ Tender ID:', tender._id);
                                
                                if ((e.target as HTMLImageElement).src !== DEFAULT_TENDER_IMAGE) {
                                  console.log('🔄 Switching to fallback image...');
                                  (e.target as HTMLImageElement).src = DEFAULT_TENDER_IMAGE;
                                } else {
                                  console.log('❌ Fallback image also failed');
                                  handleImageError(tender._id, tender);
                                }
                                console.log('❌ ===== END TENDER IMAGE LOAD ERROR =====');
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div style={{
                              color: 'white',
                              fontSize: '48px',
                              textAlign: 'center',
                            }}>
                              {tender.tenderType === 'PRODUCT' ? '📦' : '🔧'}
                            </div>
                          )}

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
                          }}>
                            {isEnded ? (
                              <span style={{ fontWeight: 800 }}>{t('common.finished')}</span>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
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
                          }}>
                            {tender.tenderType === 'PRODUCT' ? t('common.product') : t('common.service')}
                          </div>

                          {/* Owner Badge */}
                          {isTenderOwner(tender) && (
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'rgba(255, 193, 7, 0.9)',
                              color: '#212529',
                              padding: '6px 12px',
                              borderRadius: '15px',
                              fontSize: '12px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                            }}>
                              {t('liveTenders.yourTender')}
                            </div>
                          )}

                          {/* Share Button - Positioned in bottom-right of image */}
                          <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                            zIndex: 10,
                          }}>
                            <ShareButton
                              type="tender"
                              id={tender._id}
                              title={tender.title}
                              description={tender.description}
                              imageUrl={getTenderImageUrl(tender)}
                            />
                          </div>
                        </div>

                        {/* Tender Details */}
                        <div style={{ padding: 'clamp(12px, 2.5vw, 16px)' }}>
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
                                fontSize: '12px',
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
                                  fontSize: '12px',
                                  color: '#333',
                                  margin: 0,
                                  fontWeight: '500',
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
                          }}>
                            <img
                              src={normalizeImageUrl(tender.owner?.photoURL) || DEFAULT_PROFILE_IMAGE}
                              alt={displayName}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                objectFit: 'contain',
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = DEFAULT_PROFILE_IMAGE;
                              }}
                            />
                            <span style={{
                              fontSize: '14px',
                              color: '#666',
                              fontWeight: '500',
                            }}>
                              {displayName}
                            </span>
                          </div>

                         {/* Submit Proposal Button */}
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
                  className="tender-slider-prev"
                  style={{
                    background: 'white',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'auto',
                    marginLeft: '-25px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6, #a855f7)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#333';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12Z"/>
                  </svg>
                </button>

                <button
                  className="tender-slider-next"
                  style={{
                    background: 'white',
                    border: 'none',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'auto',
                    marginRight: '-25px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #8b5cf6, #a855f7)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#333';
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
                marginTop: 'clamp(20px, 3vw, 25px)',
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
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
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
              }}>📋</div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '12px',
              }}>
                📋 {t('liveTenders.noActiveTenders')}
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '30px',
              }}>
                {t('liveTenders.comeBackLater')}
              </p>
            </div>
          )}

          {/* View All Button - Always visible on mobile */}
          <div 
            className="view-all-button-container"
            style={{
              textAlign: 'center',
              marginTop: '0',
              marginBottom: 'clamp(20px, 3vw, 30px)',
              opacity: 0,
              transform: 'translateY(30px)',
              animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
            }}>
            <Link
              href="/tenders"
              scroll={false}
              onClick={(e) => {
                e.preventDefault();
                navigateWithScroll("/tenders");
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'clamp(8px, 1.5vw, 10px)',
                padding: 'clamp(12px, 2.5vw, 14px) clamp(24px, 4vw, 28px)',
                background: 'linear-gradient(90deg, #27F5CC, #00D4AA)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: 'clamp(13px, 2.2vw, 15px)',
                boxShadow: '0 8px 25px rgba(39, 245, 204, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #00D4AA, #27F5CC)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(39, 245, 204, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #27F5CC, #00D4AA)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(39, 245, 204, 0.3)';
              }}
            >
              {t('liveTenders.viewAll')}
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

export default Home1LiveTenders;

