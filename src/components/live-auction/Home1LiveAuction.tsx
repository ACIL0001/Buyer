// Home1LiveAuction.tsx
"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { AuctionsAPI } from "@/app/api/auctions";
import app from '@/config';
import { ApiResponse } from '@/types/ApiResponse';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { normalizeImageUrl } from '@/utils/url';
import "../auction-details/st.css";
import "../auction-details/modern-details.css";
import { useRouter } from "next/navigation";

// Default image constants
const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

interface Auction {
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
  // --- Added properties to match usage in JSX ---
  quantity?: string | number;
  location?: string;
  wilaya?: string;
  description?: string;
  biddersCount?: number;
  bidType?: 'PRODUCT' | 'SERVICE';
  // --- Image properties for enhanced image loading ---
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



// Helper function to get the correct image URL
const getAuctionImageUrl = (auction: Auction) => {
  // Check all possible image sources in order of preference
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
  ].filter(Boolean); // Remove null/undefined values
  
  if (possibleImageSources.length > 0) {
    const imageUrl = possibleImageSources[0] as string;
    
    if (!imageUrl) {
      return DEFAULT_AUCTION_IMAGE;
    }
    
    // Use the centralized normalization utility which handles localhost:3000 replacement
    return normalizeImageUrl(imageUrl);
  } else {
    return DEFAULT_AUCTION_IMAGE;
  }
};

const Home1LiveAuction = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLogged, auth } = useAuth();
  const [liveAuctions, setLiveAuctions] = useState<Auction[]>([]);
  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timers, setTimers] = useState<{ [key: string]: Timer }>({});
  const [animatedCards, setAnimatedCards] = useState<number[]>([]);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [workingImageUrls, setWorkingImageUrls] = useState<{ [key: string]: string }>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finished'>('all');

  // Test image URL accessibility
  const testImageUrl = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const isAccessible = response.ok;

      return isAccessible;
    } catch (error) {
      // console.log(`❌ Auction image URL test failed for ${url}:`, error);
      return false;
    }
  };

  // Test multiple URLs and return the first working one
  const findWorkingImageUrl = async (urls: string[]) => {
    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          // console.log(`✅ Found working auction image URL: ${url}`);
          return url;
        }
      } catch (error) {
        // console.log(`❌ Auction URL failed: ${url}`);
        continue;
      }
    }
    // console.log('❌ No working auction image URLs found');
    return null;
  };

  // Generate all possible backend image URLs for a given image path
  const generateBackendImageUrls = (imagePath: string) => {
    if (!imagePath) return [];
    
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const baseURL = app.baseURL;
    
    return [
      // Direct path with baseURL
      `${baseURL}${cleanPath}`,
      
      // Common backend image paths
      `${baseURL}uploads/${cleanPath}`,
      `${baseURL}static/${cleanPath}`,
      `${baseURL}public/${cleanPath}`,
      `${baseURL}images/${cleanPath}`,
      `${baseURL}assets/${cleanPath}`,
      `${baseURL}media/${cleanPath}`,
      `${baseURL}files/${cleanPath}`,
      
      // With original leading slash
      `${baseURL}${imagePath}`,
      
      // Using route configuration if different from baseURL
      app.route ? `${app.route}${cleanPath}` : null,
      app.route ? `${app.route}${imagePath}` : null,
    ].filter(Boolean); // Remove null values
  };

  // Handle image load errors
  const handleImageError = async (auctionId: string, auction: Auction) => {
    // console.log('❌ Auction image load error for:', auctionId, auction);
    
    // Get all possible image URLs for this auction
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
    
    // Generate all possible backend URLs for each image source
    const allPossibleUrls = possibleImageSources.flatMap(imagePath => 
      generateBackendImageUrls(imagePath as string)
    ).filter(Boolean) as string[];
    
    // console.log('🔍 All possible auction backend URLs to try:', allPossibleUrls);
    
    // Find the first working URL
    const workingUrl = await findWorkingImageUrl(allPossibleUrls);
    
    if (workingUrl) {
      console.log('🎉 Found working URL for auction:', auctionId, workingUrl);
      // Cache the working URL
      setWorkingImageUrls(prev => ({
        ...prev,
        [auctionId]: workingUrl
      }));
      // Clear the error state
      setImageErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[auctionId];
        return newErrors;
      });
    } else {
      console.log('❌ No working URL found for auction:', auctionId);
      setImageErrors(prev => ({
        ...prev,
        [auctionId]: true
      }));
    }
  };

  // Fetch auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await AuctionsAPI.getAuctions();

        // Process data based on response structure
        let auctionsData: Auction[] = [];
        
        if (data) {
          if (Array.isArray(data)) {
            auctionsData = data;
          } else if (data.data && Array.isArray(data.data)) {
            auctionsData = data.data;
          } else if (data.success && data.data && Array.isArray(data.data)) {
            auctionsData = data.data;
          } else {
            auctionsData = [];
          }
        } else {
          auctionsData = [];
        }
        
        // Transform data to ensure id field is properly mapped
        const transformedAuctions = auctionsData.map((auction: any) => ({
          ...auction,
          id: auction.id || auction._id, // Use id if available, fallback to _id
        }));
        
        // Exclude professional auctions
        const nonProAuctions = transformedAuctions.filter((auction: Auction) => {
          return auction.isPro !== true;
        });

        // Filter by verifiedOnly: if verifiedOnly is true, only show to verified users
        const isUserVerified = auth.user?.isVerified === true || auth.user?.isVerified === 1;
        const visibleAuctions = nonProAuctions.filter((auction: Auction) => {
          // If auction is verifiedOnly and user is not verified, hide it
          if (auction.verifiedOnly === true && !isUserVerified) {
            return false;
          }
          return true;
        });

        // Store all auctions
        setAllAuctions(visibleAuctions);
        
        // Apply initial filter (all by default)
        let filteredAuctions = visibleAuctions;
        if (statusFilter === 'active') {
          filteredAuctions = nonProAuctions.filter((auction: Auction) => {
            if (!auction.endingAt) return false;
            const endTime = new Date(auction.endingAt);
            return endTime > new Date();
          });
        } else if (statusFilter === 'finished') {
          filteredAuctions = nonProAuctions.filter((auction: Auction) => {
            if (!auction.endingAt) return true;
            const endTime = new Date(auction.endingAt);
            return endTime <= new Date();
          });
        }

        // Limit to 8 for display
        const limitedAuctions = filteredAuctions.slice(0, 8);
        setLiveAuctions(limitedAuctions);
        setError(null);
      } catch (err) {
        console.error("Error fetching auctions:", err);
        setError("Failed to load auctions");
        setLiveAuctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  // Filter auctions based on status
  useEffect(() => {
    if (allAuctions.length === 0) return;

    // Filter by verifiedOnly: if verifiedOnly is true, only show to verified users
    const isUserVerified = auth.user?.isVerified === true || auth.user?.isVerified === 1;
    let filtered = allAuctions.filter((auction: Auction) => {
      // If auction is verifiedOnly and user is not verified, hide it
      if (auction.verifiedOnly === true && !isUserVerified) {
        return false;
      }
      return true;
    });
    
    if (statusFilter === 'active') {
      filtered = allAuctions.filter((auction: Auction) => {
        if (!auction.endingAt) return false;
        const endTime = new Date(auction.endingAt);
        return endTime > new Date();
      });
    } else if (statusFilter === 'finished') {
      filtered = allAuctions.filter((auction: Auction) => {
        if (!auction.endingAt) return true;
        const endTime = new Date(auction.endingAt);
        return endTime <= new Date();
      });
    }

    // Limit to 8 for display
    const limitedAuctions = filtered.slice(0, 8);
    setLiveAuctions(limitedAuctions);
  }, [allAuctions, statusFilter]);

  // Update timers
  useEffect(() => {
    if (liveAuctions.length === 0) return;

    const updateTimers = () => {
      const newTimers: { [key: string]: Timer } = {};
      liveAuctions.forEach(auction => {
        if (auction.id && auction.endingAt) {
          newTimers[auction.id] = calculateTimeRemaining(auction.endingAt);
        }
      });
      setTimers(newTimers);
    };

    // Initial update
    updateTimers();

    // Update every second
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [liveAuctions]);

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

    const auctionCards = document.querySelectorAll('.auction-card-animate');
    auctionCards.forEach((card, index) => {
      card.setAttribute('data-index', index.toString());
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [liveAuctions]);

  // Format price function
  const formatPrice = useCallback((price: number) => {
    return `${Number(price).toLocaleString()} DA`;
  }, []);

  // Helper function to get seller display name
  const getSellerDisplayName = useCallback((auction: Auction) => {
    if (auction.hidden === true) {
      return t('common.anonymous');
    }

    // Prioritize company name over personal name
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

  // Helper function to check if current user is the owner of an auction
  const isAuctionOwner = useCallback((auction: Auction) => {
    if (!isLogged || !auth.user?._id) return false;
    return auction.owner?._id === auth.user._id;
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
      nextEl: ".auction-slider-next",
      prevEl: ".auction-slider-prev",
    },
    pagination: false,
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
      <div className="modern-auctions-section" style={{ padding: '10px 0 0 0' }}>
        <div className="container-responsive">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 'clamp(30px, 6vw, 50px)' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #0063b1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
            <p style={{ marginTop: '15px', color: '#666' }}>{t('liveAuction.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-auctions-section" style={{ padding: '10px 0 0 0' }}>
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
              <h3>❌ {t('liveAuction.loadingError')}</h3>
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
          .modern-auctions-section {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            padding: 5px 16px 0 16px !important;
            transform: none !important;
            transition: none !important;
            position: relative !important;
            z-index: 10 !important;
            min-height: 200px !important;
          }
          
          .auction-slider {
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
          
          .auction-carousel-container {
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

          /* Force all auction content to be visible */
          .auction-card, .swiper-slide, .auction-item {
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

        .auction-card-animate {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
          transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .auction-card-animate.animated {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .auction-card-hover {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .auction-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 99, 177, 0.15);
        }

        .timer-digit {
          animation: pulse 1s infinite;
        }

        .timer-digit.urgent {
          animation: pulse 0.5s infinite;
          color: #ff4444;
        }
      `}</style>

      <div className="modern-auctions-section" style={{ padding: '10px 0 0 0', background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
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
              color: '#0063b1',
              marginBottom: 'clamp(8px, 1.5vw, 12px)',
            }}>
              {t('liveAuction.title')}
            </h2>
            <p style={{
              fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto clamp(12px, 2vw, 16px)',
              lineHeight: '1.5',
            }}>
              {t('liveAuction.description')}
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
                  borderColor: statusFilter === 'all' ? '#0063b1' : '#e2e8f0',
                  background: statusFilter === 'all' ? 'linear-gradient(135deg, #0063b1, #00a3e0)' : 'white',
                  color: statusFilter === 'all' ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: 'clamp(11px, 1.8vw, 13px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: statusFilter === 'all' ? '0 4px 12px rgba(0, 99, 177, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'all') {
                    e.currentTarget.style.borderColor = '#0063b1';
                    e.currentTarget.style.color = '#0063b1';
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

          {/* Auctions Content - Always show on mobile, even with no data */}
          {liveAuctions.length > 0 ? (
            <div className="auction-carousel-container" style={{ position: 'relative' }}>
                    <Swiper
                      modules={[Navigation, Autoplay]}
                      {...settings}
                      className="swiper auction-slider"
                      style={{
                        padding: 'clamp(10px, 2vw, 16px) 0 0',
                        overflow: 'visible',
                      }}
                    >
                {liveAuctions.map((auction, idx) => {
                  const timer = timers[auction.id] || { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false };
                  const isEnded = !!timer.hasEnded;
                  const isAnimated = animatedCards.includes(idx);
                  const isUrgent = parseInt(timer.hours) < 1 && parseInt(timer.minutes) < 30;

                  // Determine the display name for the auction owner
                  const ownerName = auction.owner?.firstName && auction.owner?.lastName
                    ? `${auction.owner.firstName} ${auction.owner.lastName}`.trim()
                    : auction.owner?.name;
                  const sellerName = auction.seller?.name;
                  const displayName = ownerName || sellerName || t('common.seller');

                  return (
                    <SwiperSlide key={auction.id} style={{ height: 'auto', display: 'flex', justifyContent: 'center' }}>
                      <div
                        className={`auction-card-animate auction-card-hover ${isAnimated ? 'animated' : ''}`}
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
                        {/* Auction Image */}
                        <div style={{
                          position: 'relative',
                          height: 'clamp(120px, 20vw, 160px)',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {auction.thumbs && auction.thumbs.length > 0 && auction.thumbs[0].url ? (
                          <img
                            src={(() => {
                              // Check if we have a working cached URL first
                              if (workingImageUrls[auction.id]) {
                                console.log(`🎯 Using cached working URL for auction ${auction.title}:`, workingImageUrls[auction.id]);
                                return workingImageUrls[auction.id];
                              }
                              
                              const imageUrl = imageErrors[auction.id] ? DEFAULT_AUCTION_IMAGE : getAuctionImageUrl(auction);
                              console.log(`🎯 Final auction image src for ${auction.title}:`, imageUrl);
                              console.log(`🎯 Is this a backend image?`, imageUrl.includes(app.baseURL));
                              return imageUrl;
                            })()}
                              alt={auction.title || 'Auction'}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              transition: 'transform 0.4s ease',
                            }}
                              onLoad={(e) => {
                                const imageUrl = getAuctionImageUrl(auction);
                                console.log('✅ ===== AUCTION IMAGE LOAD SUCCESS =====');
                                console.log('🎉 Successfully loaded auction image:', imageUrl);
                                console.log('🎉 Image element src:', (e.target as HTMLImageElement).src);
                                console.log('🎉 Image dimensions:', (e.target as HTMLImageElement).naturalWidth, 'x', (e.target as HTMLImageElement).naturalHeight);
                                console.log('📋 Auction Info:', {
                                  id: auction.id,
                                  title: auction.title
                                });
                                console.log('🎯 Is this a backend image?', imageUrl.includes(app.baseURL));
                                console.log('✅ ===== END AUCTION IMAGE LOAD SUCCESS =====');
                            }}
                            onError={(e) => {
                                console.log('❌ ===== AUCTION IMAGE LOAD ERROR =====');
                                console.log('❌ Auction image failed to load:', auction.title);
                              console.log('❌ Failed URL:', (e.target as HTMLImageElement).src);
                              console.log('❌ Auction ID:', auction.id);
                              
                              if ((e.target as HTMLImageElement).src !== DEFAULT_AUCTION_IMAGE) {
                                console.log('🔄 Switching to fallback image...');
                                (e.target as HTMLImageElement).src = DEFAULT_AUCTION_IMAGE;
                              } else {
                                console.log('❌ Fallback image also failed');
                                handleImageError(auction.id, auction);
                              }
                                console.log('❌ ===== END AUCTION IMAGE LOAD ERROR =====');
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div style={{
                              color: 'white',
                              fontSize: '48px',
                              textAlign: 'center',
                            }}>
                              🏷️
                            </div>
                          )}

                          {/* Timer Overlay */}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: isEnded
                              ? 'rgba(0,0,0,0.55)'
                              : (isUrgent ? 'linear-gradient(45deg, #ff4444, #ff6666)' : 'linear-gradient(45deg, #0063b1, #00a3e0)'),
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
                              <span>:</span>
                              <span className={`timer-digit ${isUrgent ? 'urgent' : ''}`}>{timer.minutes}</span>
                              <span>:</span>
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
                            {t('common.auction')}
                          </div>

                          {/* Owner Badge */}
                          {isAuctionOwner(auction) && (
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
                              {t('liveAuction.yourAuction')}
                            </div>
                          )}
                        </div>

                        {/* Auction Details */}
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
                            {auction.title || 'Auction Title'}
                          </h3>

                          {/* Location and Quantity Info */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: auction?.bidType === 'SERVICE' ? '1fr' : '1fr 1fr',
                            gap: '6px',
                            marginBottom: '8px',
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                              borderRadius: '8px',
                              padding: '4px 8px',
                              border: '1px solid #e9ecef',
                              borderLeft: '3px solid #0063b1',
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
                                  const place = (auction as any).place || '';
                                  const address = (auction as any).address || '';
                                  const location = auction.location || '';
                                  const wilaya = auction.wilaya || '';
                                  // For auctions, 'place' contains the full address
                                  // Combine: place (full address), address, location, wilaya
                                  const parts = [place, address, location, wilaya].filter(Boolean);
                                  // Remove duplicates and join
                                  const uniqueParts = [...new Set(parts)];
                                  return uniqueParts.length > 0 ? uniqueParts.join(', ') : t('common.notSpecified');
                                })()}
                              </p>
                            </div>

                            {auction?.bidType !== 'SERVICE' && auction.quantity && String(auction.quantity) !== t('common.notSpecified') && !isNaN(Number(auction.quantity)) && String(auction.quantity) !== "" && (
                            <div style={{
                              background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                              borderRadius: '8px',
                              padding: '4px 8px',
                              border: '1px solid #e9ecef',
                              borderLeft: '3px solid #0063b1',
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
                                {auction.quantity}
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
                                background: '#0063b1',
                                animation: 'pulse 2s infinite',
                              }}></div>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: '#0063b1',
                              }}>
                                {((auction as any).participantsCount || 0)} {t('liveAuction.participants')}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                color: '#666',
                              }}>
                                {t('liveAuction.haveBid')}
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
                              src={normalizeImageUrl(auction.owner?.photoURL) || DEFAULT_PROFILE_IMAGE}
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

                         {/* Submit Bid Button */}
                          <Link
                            href={`/auction-details/${auction.id}`}
                            scroll={false}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateWithScroll(`/auction-details/${auction.id}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 'clamp(6px, 1.5vw, 8px)',
                              width: '100%',
                              padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
                              background: isEnded ? '#c7c7c7' : 'linear-gradient(90deg, #0063b1, #00a3e0)',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '25px',
                              fontWeight: '600',
                              fontSize: 'clamp(12px, 2vw, 14px)',
                              transition: 'all 0.3s ease',
                              boxShadow: isEnded ? 'none' : '0 4px 12px rgba(0, 99, 177, 0.3)',
                              pointerEvents: isEnded ? 'none' : 'auto'
                            }}
                            onMouseEnter={(e) => {
                              if (!isEnded) {
                              e.currentTarget.style.background = 'linear-gradient(90deg, #00a3e0, #0063b1)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 99, 177, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isEnded) {
                              e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.3)';
                              }
                            }}
                          >
                            {isEnded ? t('common.finished') : t('liveAuction.bid')}
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
                  className="auction-slider-prev"
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
                    e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
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
                  className="auction-slider-next"
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
                    e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
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
              }}>🏷️</div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '12px',
              }}>
                🏷️ {t('liveAuction.noActiveAuctions')}
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '30px',
              }}>
                {t('liveAuction.comeBackLater')}
              </p>
            </div>
          )}
 
          {/* View All Button - Always visible on mobile */}
          <div 
            className="view-all-button-container"
            style={{
              textAlign: 'center',
              marginTop: 'clamp(20px, 3vw, 30px)',
              marginBottom: 'clamp(20px, 3vw, 30px)',
              opacity: 0,
              transform: 'translateY(30px)',
              animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
            }}>
            <Link
              href="/auction-sidebar"
              scroll={false}
              onClick={(e) => {
                e.preventDefault();
                navigateWithScroll("/auction-sidebar");
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'clamp(8px, 1.5vw, 10px)',
                padding: 'clamp(12px, 2.5vw, 14px) clamp(24px, 4vw, 28px)',
                background: 'linear-gradient(90deg, #0063b1, #00a3e0)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: '600',
                fontSize: 'clamp(13px, 2.2vw, 15px)',
                boxShadow: '0 8px 25px rgba(0, 99, 177, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #00a3e0, #0063b1)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 99, 177, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 99, 177, 0.3)';
              }}
            >
              {t('liveAuction.viewAll')}
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

export default Home1LiveAuction;