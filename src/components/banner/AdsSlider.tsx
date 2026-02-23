"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, Keyboard } from "swiper/modules";
import { AdsAPI, Ad } from '@/app/api/ads';
import app from '@/config';
import { normalizeImageUrl } from '@/utils/url';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const AdsSlider: React.FC = () => {
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await AdsAPI.getAds(controller.signal);
        if (isMounted && response.success && response.data) {
          setAds(response.data);
        }
      } catch (error: unknown) {
        // Ignore AbortError - it's expected when navigating away
        if (error instanceof Error && error.name === 'AbortError') return;
        if (isMounted) console.error('Error fetching ads:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAds();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getAdImageUrl = (ad: Ad): string => {
    let imageUrl = '';
    
    // Handle image field - can be string or object
    if (typeof ad.image === 'string') {
      imageUrl = ad.image;
    } else if (ad.image && typeof ad.image === 'object' && 'url' in ad.image) {
      imageUrl = ad.image.url;
    }
    
    if (!imageUrl) {
      return '/assets/images/cat.avif'; // Fallback image
    }

    return normalizeImageUrl(imageUrl);
  };

  const handleAdClick = (ad: Ad) => {
    if (!ad.url) return;
    
    // Check if it's an internal URL (starts with /)
    if (ad.url.startsWith('/')) {
      router.push(ad.url);
    } else {
      // External URL - open in new tab
      window.open(ad.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: 'clamp(10px, 2vw, 25px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}>
        <div style={{ color: '#64748b', fontSize: 'clamp(14px, 2vw, 18px)' }}>Loading ads...</div>
      </div>
    );
  }

  if (ads.length === 0) {
    return null; // Don't render anything if no ads
  }

  return (
    <>
      <style jsx>{`
        .ads-slider-container {
          width: 100%;
          max-width: 100vw;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          border-radius: 0;
          box-shadow: none;
        }

        .ads-swiper {
          width: 100%;
          height: clamp(80px, 8vw, 120px);
          min-height: clamp(80px, 8vw, 120px);
        }

        .ad-slide {
          width: 100%;
          height: 100%;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
        }

        .ad-image {
          width: 15%;
          max-width: 100%;
          height: auto;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.5s ease;
          margin: 0 auto;
          display: block;
        }

        .ad-slide:hover .ad-image {
          transform: scale(1.05);
        }

        .ad-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30%;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 100%);
          display: flex;
          align-items: flex-end;
          padding: clamp(16px, 3vw, 24px);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .ad-slide:hover .ad-overlay {
          opacity: 1;
        }

        .ad-title {
          color: white;
          font-size: clamp(16px, 2.5vw, 24px);
          font-weight: 700;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          margin: 0;
        }

        /* Navigation buttons */
        .ads-swiper :global(.swiper-button-next),
        .ads-swiper :global(.swiper-button-prev) {
          width: clamp(28px, 4vw, 36px) !important;
          height: clamp(28px, 4vw, 36px) !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 50% !important;
          color: #1e293b !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          transition: all 0.3s ease !important;
          margin-top: 0 !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }

        .ads-swiper :global(.swiper-button-next:hover),
        .ads-swiper :global(.swiper-button-prev:hover) {
          background: white !important;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25) !important;
          transform: translateY(-50%) scale(1.1) !important;
        }

        .ads-swiper :global(.swiper-button-next::after),
        .ads-swiper :global(.swiper-button-prev::after) {
          font-size: clamp(12px, 2vw, 16px) !important;
          font-weight: 700 !important;
        }

        /* Pagination */
        .ads-swiper :global(.swiper-pagination) {
          bottom: clamp(12px, 2vw, 20px) !important;
        }

        .ads-swiper :global(.swiper-pagination-bullet) {
          width: clamp(8px, 1.5vw, 12px) !important;
          height: clamp(8px, 1.5vw, 12px) !important;
          background: rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
          transition: all 0.3s ease !important;
        }

        .ads-swiper :global(.swiper-pagination-bullet-active) {
          background: white !important;
          width: clamp(24px, 4vw, 32px) !important;
          border-radius: 4px !important;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .ads-slider-container {
            height: clamp(150px, 20vw, 220px) !important;
            min-height: clamp(150px, 20vw, 220px) !important;
          }

          .ads-swiper {
            height: clamp(150px, 20vw, 220px) !important;
            min-height: clamp(150px, 20vw, 220px) !important;
          }

          .ads-swiper :global(.swiper-wrapper) {
            height: clamp(150px, 20vw, 220px) !important;
            min-height: clamp(150px, 20vw, 220px) !important;
          }

          .ads-swiper :global(.swiper-slide) {
            height: clamp(150px, 20vw, 220px) !important;
            min-height: clamp(150px, 20vw, 220px) !important;
          }

          .ad-slide {
            height: clamp(150px, 20vw, 220px) !important;
            min-height: clamp(150px, 20vw, 220px) !important;
          }

          .ad-image {
            width: 50% !important;
            max-width: 80% !important;
            height: auto !important;
            max-height: 90% !important;
          }
          
          .ads-swiper :global(.swiper-button-next),
          .ads-swiper :global(.swiper-button-prev) {
            width: 24px !important;
            height: 24px !important;
            display: none !important; /* Hide on mobile for cleaner look */
          }

          .ad-overlay {
            opacity: 1; /* Always show on mobile */
          }

          .ad-title {
            display: none !important; /* Hide ad title/name on mobile */
          }
        }
      `}</style>
      <div className="ads-slider-container">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, Keyboard]}
          navigation={ads.length > 1}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={ads.length > 1}
          speed={600}
          keyboard={{
            enabled: true,
            onlyInViewport: true,
          }}
          className="ads-swiper"
          style={isMobile ? {
            height: 'clamp(150px, 20vw, 220px)',
            minHeight: 'clamp(150px, 20vw, 220px)'
          } : {
            height: 'clamp(80px, 8vw, 120px)',
            minHeight: 'clamp(80px, 8vw, 120px)'
          }}
        >
          {ads.map((ad) => (
            <SwiperSlide key={ad._id} className="ad-slide" onClick={() => handleAdClick(ad)}>
              <img
                src={getAdImageUrl(ad)}
                alt={ad.title || 'Advertisement'}
                className="ad-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/images/cat.avif';
                }}
              />
              <div className="ad-overlay">
                {ad.title && <h3 className="ad-title">{ad.title}</h3>}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export default AdsSlider;

