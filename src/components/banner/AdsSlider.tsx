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

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchAds = async (showLoading = false) => {
      try {
        if (showLoading && isMounted) setLoading(true);
        const response = await AdsAPI.getAds(controller.signal);
        if (isMounted && response.success && response.data) {
          setAds(response.data);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') return;
        if (isMounted) console.error('Error fetching ads:', error);
      } finally {
        if (isMounted && showLoading) setLoading(false);
      }
    };

    fetchAds(true);

    const intervalId = setInterval(() => {
      fetchAds(false);
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      controller.abort();
    };
  }, []);

  const adsContainerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '1218px',
    aspectRatio: '1218 / 315',
    maxHeight: '315px',
    margin: '68px auto 0',
    position: 'relative',
    overflow: 'hidden',
  };

  const getAdImageUrl = (ad: Ad): string => {
    let imageUrl = '';
    if (typeof ad.image === 'string') {
      imageUrl = ad.image;
    } else if (ad.image && typeof ad.image === 'object' && 'url' in ad.image) {
      imageUrl = ad.image.url;
    }
    if (!imageUrl) return '/assets/images/cat.avif';
    return normalizeImageUrl(imageUrl);
  };

  const handleAdClick = (ad: Ad) => {
    if (!ad.url) return;
    if (ad.url.startsWith('/')) {
      router.push(ad.url);
    } else {
      window.open(ad.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div style={{
        ...adsContainerStyle,
        background: 'linear-gradient(135deg, #0f1c2e 0%, #1a3050 40%, #1e3a5f 70%, #2b5496 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Shimmer overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
          animation: 'shimmerAds 1.5s infinite',
        }} />
        <div style={{
          padding: '20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          zIndex: 2,
        }}>
          <div style={{
            width: '200px', height: '12px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.15)', marginBottom: '12px',
          }} />
          <div style={{
            width: '140px', height: '8px', borderRadius: '4px',
            background: 'rgba(255,255,255,0.1)',
          }} />
        </div>
        <style jsx>{`
          @keyframes shimmerAds {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  /* ── Fallback banner when no ads from API ── */
  if (ads.length === 0) {
    return (
      <div style={{
        ...adsContainerStyle,
        cursor: 'default',
      }}>
        {/* Background image */}
        <img
          src="/assets/images/ads-bg.jpg"
          alt="Advertising space"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'brightness(0.65)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(110deg, rgba(5,15,30,0.55) 0%, rgba(10,25,50,0.35) 45%, rgba(10,25,50,0.15) 70%, transparent 100%)',
        }} />
      </div>
    );
  }

  /* ── Swiper when ads exist ── */
  return (
    <>
      <style jsx>{`
        .ads-slider-container {
          width: 100%;
          max-width: 1218px;
          aspect-ratio: 1218 / 315;
          max-height: 315px;
          position: relative;
          overflow: hidden;
          margin: 68px auto 0;
          opacity: 1;
          border-radius: 0px;
        }
        @media (max-width: 768px) {
          .ads-slider-container {
            margin: 70px 0 0;
          }
        }

        .ads-swiper {
          width: 100%;
          height: 100%;
        }

        .ad-slide {
          width: 100%;
          height: 100%;
          position: relative;
          cursor: pointer;
          overflow: hidden;
        }

        .ad-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          opacity: 1;
          transform: rotate(0deg);
          transition: transform 0.6s ease;
        }

        .ad-slide:hover .ad-image {
          transform: scale(1.04);
        }

        /* Dark gradient overlay always present */
        .ad-dark-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(110deg, rgba(5,15,30,0.5) 0%, rgba(10,25,50,0.25) 50%, transparent 80%);
          pointer-events: none;
        }

        /* Text overlay */
        .ad-text-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(20px, 4vw, 40px) clamp(24px, 5vw, 60px);
          z-index: 2;
          pointer-events: none;
        }

        .ad-title-text {
          color: white;
          font-size: clamp(20px, 4vw, 46px);
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          text-align: center;
          text-shadow: 0 2px 20px rgba(0,0,0,0.6);
          margin: 0;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        /* Swiper nav buttons */
        .ads-swiper :global(.swiper-button-next),
        .ads-swiper :global(.swiper-button-prev) {
          width: 44px !important;
          height: 44px !important;
          background: rgba(255,255,255,0.18) !important;
          backdrop-filter: blur(8px) !important;
          border-radius: 50% !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.3) !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important;
          transition: all 0.3s ease !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          margin-top: 0 !important;
        }

        .ads-swiper :global(.swiper-button-next:hover),
        .ads-swiper :global(.swiper-button-prev:hover) {
          background: rgba(255,255,255,0.32) !important;
          transform: translateY(-50%) scale(1.08) !important;
        }

        .ads-swiper :global(.swiper-button-next::after),
        .ads-swiper :global(.swiper-button-prev::after) {
          font-size: 15px !important;
          font-weight: 700 !important;
          font-family: 'DM Sans', sans-serif !important;
        }

        /* Pagination */
        .ads-swiper :global(.swiper-pagination) {
          bottom: 18px !important;
        }

        .ads-swiper :global(.swiper-pagination-bullet) {
          width: 8px !important;
          height: 8px !important;
          background: rgba(255,255,255,0.5) !important;
          opacity: 1 !important;
          transition: all 0.3s ease !important;
        }

        .ads-swiper :global(.swiper-pagination-bullet-active) {
          background: white !important;
          width: 28px !important;
          border-radius: 4px !important;
        }

        @media (max-width: 768px) {
          .ads-swiper :global(.swiper-button-next),
          .ads-swiper :global(.swiper-button-prev) {
            display: none !important;
          }
        }
      `}</style>

      <div className="ads-slider-container">
        <Swiper
          modules={[Navigation, Pagination, Keyboard]}
          navigation={ads.length > 1}
          pagination={{ clickable: true, dynamicBullets: true }}
          loop={ads.length > 1}
          speed={700}
          keyboard={{ enabled: true, onlyInViewport: true }}
          className="ads-swiper"
          style={{ width: '100%', height: '100%', opacity: 1 }}
        >
          {ads.map((ad) => (
            <SwiperSlide key={ad._id} onClick={() => handleAdClick(ad)}>
              <div className="ad-slide">
                <img
                  src={getAdImageUrl(ad)}
                  alt={ad.title || 'Advertisement'}
                  className="ad-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/images/cat.avif';
                  }}
                />
                <div className="ad-dark-overlay" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export default AdsSlider;
