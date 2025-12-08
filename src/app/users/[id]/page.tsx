"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import useAuth from '@/hooks/useAuth';
import { UserAPI, USER_TYPE } from "@/app/api/users";
import { requests } from '@/app/api/utils';
import app, { DEV_SERVER_URL } from "@/config";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DEV_SERVER_REGEX = new RegExp(escapeRegExp(DEV_SERVER_URL), "g");
const DEV_SERVER_SECURE_REGEX = new RegExp(escapeRegExp(DEV_SERVER_URL.replace('http://', 'https://')), "g");
const DEV_SERVER_WITH_SLASH = DEV_SERVER_URL.endsWith('/') ? DEV_SERVER_URL : `${DEV_SERVER_URL}/`;
const DEV_SERVER_WITH_SLASH_SECURE = DEV_SERVER_WITH_SLASH.replace('http://', 'https://');

interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  entreprise?: string;
  avatar?: string;
  photoURL?: string;
  type: USER_TYPE;
  role?: string;
  rating: number;
  joinDate: string;
  totalBids: number;
  winningBids: number;
  totalAuctions?: number;
  completedAuctions?: number;
  phone?: string;
  location?: string;
  description?: string;
  verificationStatus?: string;
  isVerified?: boolean;
  isCertified?: boolean;
  isRecommended?: boolean;
  secteur?: string | { _id: string; name: string };
  history: {
    date: string;
    action: string;
    itemName: string;
    amount: number;
    status: string;
  }[];
}

interface ApiError {
  response?: {
    data?: unknown;
    status?: number;
  };
}

export default function UserDetailsPage() {
  const { initializeAuth } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"activities" | "info" | "rating">("activities");
  const [userActivities, setUserActivities] = useState<{
    auctions: any[];
    tenders: any[];
    directSales: any[];
  }>({
    auctions: [],
    tenders: [],
    directSales: []
  });
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const userId = params?.id as string;

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching user details for ID:', userId);
      
      // Get user details and recommended users
      const [userResponse, recommendedProfessionals, recommendedResellers] = await Promise.all([
        UserAPI.getUserById(userId),
        UserAPI.getRecommendedProfessionals().catch(() => []),
        UserAPI.getRecommendedResellers().catch(() => [])
      ]);
      
      console.log('User details API response:', userResponse);
      console.log('Recommended professionals:', recommendedProfessionals);
      console.log('Recommended resellers:', recommendedResellers);
      
      // Handle both direct response and nested data response
      const userData = userResponse?.data || userResponse;
      
      if (userData) {
        // Check if this user is in the recommended lists
        const recProfIds = Array.isArray(recommendedProfessionals) ? 
          recommendedProfessionals.map((u: any) => u._id) : 
          ((recommendedProfessionals as any)?.data || []).map((u: any) => u._id);
        
        const recResellerIds = Array.isArray(recommendedResellers) ? 
          recommendedResellers.map((u: any) => u._id) : 
          ((recommendedResellers as any)?.data || []).map((u: any) => u._id);

        // Prioritize isRecommended from API response, fallback to recommended list comparison
        const hasRecommendedFromAPI = Boolean((userData as any).isRecommended);
        const isInRecommendedList = recProfIds.includes((userData as any)._id) || recResellerIds.includes((userData as any)._id);
        const isRecommended = hasRecommendedFromAPI || isInRecommendedList;

        const transformedUser: User = {
          _id: (userData as any)._id,
          firstName: (userData as any).firstName || 'Unknown',
          lastName: (userData as any).lastName || '',
          email: (userData as any).email || 'No email',
          entreprise: (userData as any).entreprise || (userData as any).companyName || undefined,
          avatar: (userData as any).photoURL || (userData as any).avatar?.url || (userData as any).avatar,
          photoURL: (userData as any).photoURL,
          type: (userData as any).type || (userData as any).accountType || USER_TYPE.CLIENT,
          role: (userData as any).role,
          rating: typeof (userData as any).rate === 'number' ? (userData as any).rate : ((userData as any).rating || 0),
          joinDate: (userData as any).createdAt || new Date().toISOString(),
          totalBids: (userData as any).totalBids || 0,
          winningBids: (userData as any).winningBids || 0,
          totalAuctions: (userData as any).totalAuctions || 0,
          completedAuctions: (userData as any).completedAuctions || 0,
          phone: (userData as any).phone,
          location: (userData as any).location,
          description: (userData as any).description,
          verificationStatus: (userData as any).verificationStatus || ((userData as any).isVerified ? 'verified' : 'unverified'),
          isVerified: Boolean((userData as any).isVerified),
          isCertified: Boolean((userData as any).isCertified),
          isRecommended: Boolean(isRecommended),
          secteur: (userData as any).secteur,
          history: (userData as any).history || []
        };
        console.log('🔍 User data debug:', {
          rawUserData: userData,
          rate: (userData as any).rate,
          rating: transformedUser.rating,
          isRecommended: isRecommended,
          isCertified: (userData as any).isCertified,
          isVerified: (userData as any).isVerified,
          transformedUser
        });
        setUser(transformedUser);
      } else {
        console.error('No user data received');
        setUser(null);
      }
    } catch (error: unknown) {
      console.error("Error fetching user details:", error);
      console.error("Error response:", (error as ApiError)?.response);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    initializeAuth();
    if (userId) {
      fetchUserDetails();
      fetchUserActivities();
    }
  }, [userId, initializeAuth, fetchUserDetails]);

  const fetchUserActivities = useCallback(async () => {
    if (!userId) return;
    
    try {
      setActivitiesLoading(true);

      // Use the requests utility which handles authentication automatically
      const [auctionsRes, tendersRes, directSalesRes] = await Promise.allSettled([
        requests.get('bid').catch((err) => {
          console.error('Error fetching auctions:', err);
          return { data: [] };
        }),
        requests.get('tender').catch((err) => {
          console.error('Error fetching tenders:', err);
          return { data: [] };
        }),
        requests.get('direct-sale').catch((err) => {
          console.error('Error fetching direct sales:', err);
          return { data: [] };
        })
      ]);

      // Extract data from responses - handle different response formats
      let allAuctions: any[] = [];
      let allTenders: any[] = [];
      let allDirectSales: any[] = [];

      if (auctionsRes.status === 'fulfilled') {
        const value = auctionsRes.value;
        if (Array.isArray(value)) {
          allAuctions = value;
        } else if (value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)) {
          allAuctions = value.data;
        } else if (value && typeof value === 'object' && 'success' in value && 'data' in value && Array.isArray(value.data)) {
          allAuctions = value.data;
        }
      }

      if (tendersRes.status === 'fulfilled') {
        const value = tendersRes.value;
        if (Array.isArray(value)) {
          allTenders = value;
        } else if (value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)) {
          allTenders = value.data;
        } else if (value && typeof value === 'object' && 'success' in value && 'data' in value && Array.isArray(value.data)) {
          allTenders = value.data;
        }
      }

      if (directSalesRes.status === 'fulfilled') {
        const value = directSalesRes.value;
        if (Array.isArray(value)) {
          allDirectSales = value;
        } else if (value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)) {
          allDirectSales = value.data;
        } else if (value && typeof value === 'object' && 'success' in value && 'data' in value && Array.isArray(value.data)) {
          allDirectSales = value.data;
        }
      }

      console.log('Raw API responses:', {
        auctionsRaw: auctionsRes.status === 'fulfilled' ? auctionsRes.value : 'rejected',
        tendersRaw: tendersRes.status === 'fulfilled' ? tendersRes.value : 'rejected',
        directSalesRaw: directSalesRes.status === 'fulfilled' ? directSalesRes.value : 'rejected',
        allAuctionsCount: allAuctions.length,
        allTendersCount: allTenders.length,
        allDirectSalesCount: allDirectSales.length
      });

      // Filter by owner ID - check multiple possible owner field formats
      const auctions = allAuctions.filter((auction: any) => {
        const ownerId = auction.owner?._id?.toString() || 
                       auction.owner?._id || 
                       auction.owner?.toString() || 
                       auction.owner || 
                       auction.ownerId?.toString() || 
                       auction.ownerId;
        const match = ownerId === userId.toString();
        if (match) {
          console.log('Found matching auction:', { auctionId: auction._id, title: auction.title, ownerId, userId });
        }
        return match;
      });
      
      const tenders = allTenders.filter((tender: any) => {
        const ownerId = tender.owner?._id?.toString() || 
                       tender.owner?._id || 
                       tender.owner?.toString() || 
                       tender.owner || 
                       tender.ownerId?.toString() || 
                       tender.ownerId;
        const match = ownerId === userId.toString();
        if (match) {
          console.log('Found matching tender:', { tenderId: tender._id, title: tender.title, ownerId, userId });
        }
        return match;
      });
      
      const directSales = allDirectSales.filter((sale: any) => {
        const ownerId = sale.owner?._id?.toString() || 
                       sale.owner?._id || 
                       sale.owner?.toString() || 
                       sale.owner || 
                       sale.ownerId?.toString() || 
                       sale.ownerId;
        const match = ownerId === userId.toString();
        if (match) {
          console.log('Found matching direct sale:', { saleId: sale._id, title: sale.title, ownerId, userId });
        }
        return match;
      });

      console.log('User activities filtered:', {
        totalAuctions: allAuctions.length,
        filteredAuctions: auctions.length,
        totalTenders: allTenders.length,
        filteredTenders: tenders.length,
        totalDirectSales: allDirectSales.length,
        filteredDirectSales: directSales.length,
        userId
      });

      setUserActivities({ auctions, tenders, directSales });
    } catch (error) {
      console.error('Error fetching user activities:', error);
      setUserActivities({ auctions: [], tenders: [], directSales: [] });
    } finally {
      setActivitiesLoading(false);
    }
  }, [userId]);

  const getUserFullName = (user: User): string => {
    // Display entreprise name if available, otherwise use first and last name
    if (user.entreprise && user.entreprise.trim() !== '') {
      return user.entreprise;
    }
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Render filled stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i 
          key={`full-${i}`} 
          className="bi bi-star-fill animated-star" 
          style={{ 
            color: "#FFD700",
            animationDelay: `${i * 0.2}s`,
            display: 'inline-block',
            fontSize: '16px'
          }}
        ></i>
      );
    }
    
    // Render half star if needed
    if (hasHalfStar) {
      stars.push(
        <i 
          key="half" 
          className="bi bi-star-half animated-star" 
          style={{ 
            color: "#FFD700",
            animationDelay: `${fullStars * 0.2}s`,
            display: 'inline-block',
            fontSize: '16px'
          }}
        ></i>
      );
    }
    
    // Render empty stars to make total of 10
    const emptyStars = 10 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i 
          key={`empty-${i}`} 
          className="bi bi-star animated-star" 
          style={{ 
            color: "#E5E7EB",
            animationDelay: `${(fullStars + (hasHalfStar ? 1 : 0) + i) * 0.2}s`,
            display: 'inline-block',
            fontSize: '16px'
          }}
        ></i>
      );
    }
    
    return stars;
  };

  const getUserTypeBadge = (userType: USER_TYPE) => {
    switch (userType) {
      case USER_TYPE.PROFESSIONAL:
        return (
          <span className="badge d-flex align-items-center animated-badge" style={{ 
            padding: '8px 12px', 
            fontSize: '12px', 
            fontWeight: '600',
            background: 'linear-gradient(90deg, #FFD700, #FFA500)', 
            border: 'none',
            color: 'white',
            borderRadius: '20px',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'visible',
            transformOrigin: '50% 50%'
          }}>
            <i className="bi bi-patch-check-fill me-1" style={{ fontSize: '10px' }}></i>
            PRO
          </span>
        );
      case USER_TYPE.RESELLER:
        return (
          <span className="badge d-flex align-items-center animated-badge" style={{ 
            padding: '8px 12px', 
            fontSize: '12px', 
            fontWeight: '600',
            background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
            border: 'none',
            color: 'white',
            borderRadius: '20px'
          }}>
            <i className="bi bi-shop me-1" style={{ fontSize: '10px' }}></i>
            RESELLER
          </span>
        );
      case USER_TYPE.CLIENT:
        return (
          <span className="badge d-flex align-items-center animated-badge" style={{ 
            padding: '8px 12px', 
            fontSize: '12px', 
            fontWeight: '600',
            background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)',
            border: 'none',
            color: 'white',
            borderRadius: '20px'
          }}>
            <i className="bi bi-person me-1" style={{ fontSize: '10px' }}></i>
            CLIENT
          </span>
        );
      default:
        return null;
    }
  };

  const getVerificationBadge = (status: string, isCertified?: boolean) => {
    return (
      <>
        {status === 'verified' && (
          <span className="badge d-flex align-items-center animated-badge me-2" style={{ 
            padding: '8px 12px', 
            fontSize: '12px', 
            fontWeight: '600',
            background: 'linear-gradient(90deg, #10B981, #059669)',
            border: 'none',
            color: 'white',
            borderRadius: '20px'
          }}>
            <i className="bi bi-check-circle me-1" style={{ fontSize: '10px' }}></i>
            VERIFIED
          </span>
        )}
      </>
    );
  };

  // Render recommended badge - Creative design with animation
  const renderRecommendedBadge = () => {
    if (!user?.isRecommended) return null;

    return (
      <div className="position-absolute recommended-badge-large" style={{ 
        top: '15px', 
        right: '15px', 
        zIndex: 10 
      }}>
        <div className="recommended-badge-container" style={{
          position: 'relative',
          width: '105px',
          height: '40px'
        }}>
          {/* Glowing background effect */}
          <div className="recommended-glow" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
            borderRadius: '20px',
            animation: 'recommendedGlow 2s ease-in-out infinite',
            filter: 'blur(2px)',
            transform: 'scale(1.1)'
          }}></div>
          
          {/* Main badge */}
          <div className="recommended-main-badge" style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            animation: 'recommendedPulse 1.5s ease-in-out infinite',
            minWidth: '105px',
            maxWidth: '105px',
            height: '40px'
          }}>
            <i className="bi bi-star-fill me-1" style={{ 
              fontSize: '10px', 
              color: '#FFD700',
              animation: 'recommendedStar 2s ease-in-out infinite',
              flexShrink: 0
            }}></i>
            <span style={{ 
              fontSize: '9px', 
              fontWeight: '700', 
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
              lineHeight: '1.2'
            }}>
              Recommended
            </span>
          </div>
          
          {/* Sparkle effects */}
          <div className="sparkle sparkle-1" style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '10px',
            height: '10px',
            background: '#FFD700',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite'
          }}></div>
          
          <div className="sparkle sparkle-2" style={{
            position: 'absolute',
            bottom: '-4px',
            left: '-4px',
            width: '8px',
            height: '8px',
            background: '#FF6B6B',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 0.5s'
          }}></div>
          
          <div className="sparkle sparkle-3" style={{
            position: 'absolute',
            top: '50%',
            right: '-10px',
            width: '6px',
            height: '6px',
            background: '#4ECDC4',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 1s'
          }}></div>

          {/* Additional sparkles for larger badge */}
          <div className="sparkle sparkle-4" style={{
            position: 'absolute',
            top: '-4px',
            left: '15%',
            width: '5px',
            height: '5px',
            background: '#96CEB4',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 0.3s'
          }}></div>
          
          <div className="sparkle sparkle-5" style={{
            position: 'absolute',
            bottom: '-6px',
            right: '25%',
            width: '6px',
            height: '6px',
            background: '#45B7D1',
            borderRadius: '50%',
            animation: 'sparkle 1.5s ease-in-out infinite 0.8s'
          }}></div>
        </div>
      </div>
    );
  };

  const getRecommendedBadgeForBadges = () => {
    if (!user?.isRecommended) return null;

    return (
      <span className="badge d-flex align-items-center animated-badge ms-2" style={{ 
        padding: '6px 12px', 
        fontSize: '9px', 
        fontWeight: '600',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        color: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        whiteSpace: 'nowrap',
        maxWidth: '110px',
        minWidth: '105px',
        height: '28px',
        lineHeight: '1.2'
      }}>
        <i className="bi bi-star-fill me-1" style={{ fontSize: '8px', color: '#FFD700', flexShrink: 0 }}></i>
        <span>RECOMMENDED</span>
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <AxiosInterceptor>
          <Header />
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
          <Footer />
        </AxiosInterceptor>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AxiosInterceptor>
          <Header />
          <div className="container text-center py-5">
            <h2>User not found</h2>
            <button className="btn btn-primary mt-3" onClick={() => router.back()}>
              Go Back
            </button>
          </div>
          <Footer />
        </AxiosInterceptor>
      </>
    );
  }

  // Get avatar URL with proper normalization
  const getAvatarUrl = () => {
    // Get API base URL from config - ensure it has proper format
    let apiBaseUrl = app.baseURL || DEV_SERVER_URL;
    // Remove trailing slash and ensure port is included
    apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    // If baseURL is just 'http://localhost' without port, add :3000
    if (apiBaseUrl === 'http://localhost' || apiBaseUrl === 'https://localhost') {
      apiBaseUrl = apiBaseUrl.replace(/localhost/, 'localhost:3000');
    }
    
    // Helper to normalize URL - converts to full URL
    const normalizeUrl = (url: string): string => {
      if (!url || url.trim() === "") return "";
      let normalized = url.trim();
      
      // If it's already a full URL (http/https), fix it if needed
      if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        // Fix localhost URLs without port (http://localhost/... or https://localhost/...)
        // Match http://localhost or https://localhost followed by / but not :port
        // normalized = normalized.replace(/^http:\/\/localhost\//, DEV_SERVER_WITH_SLASH);
        // normalized = normalized.replace(/^https:\/\/localhost\//, DEV_SERVER_WITH_SLASH_SECURE);
        
        // Replace localhost:3000 with production API URL if needed (for production builds)
        if (process.env.NODE_ENV === 'production') {
          const productionBase = app.baseURL.replace(/\/$/, '');
          // normalized = normalized.replace(/http:\/\/localhost:3000/g, 'https://api.mazad.click');
          // normalized = normalized.replace(/https:\/\/localhost:3000/g, 'https://api.mazad.click');
          normalized = normalized
            .replace(DEV_SERVER_REGEX, productionBase)
            .replace(DEV_SERVER_SECURE_REGEX, productionBase);
        }
        return normalized;
      }
      
      // If it starts with /static/, prepend API base URL
      if (normalized.startsWith('/static/')) {
        return `${apiBaseUrl}${normalized}`;
      }
      
      // If it starts with / (but not /static/), prepend API base URL
      if (normalized.startsWith('/')) {
        return `${apiBaseUrl}${normalized}`;
      }
      
      // Otherwise, construct full URL with /static/ prefix
      return `${apiBaseUrl}/static/${normalized}`;
    };
    
    // Try photoURL first (highest priority - server sets this)
    if (user.photoURL && user.photoURL.trim() !== "") {
      const url = normalizeUrl(user.photoURL);
      if (url) return url;
    }
    
    // Try avatar.fullUrl (server sets this)
    if (user.avatar && typeof user.avatar === 'object' && !Array.isArray(user.avatar)) {
      const avatarObj = user.avatar as any;
      if (avatarObj.fullUrl && avatarObj.fullUrl.trim() !== "") {
        const url = normalizeUrl(avatarObj.fullUrl);
        if (url) return url;
      }
    }
    
    // Try avatar.url
    if (user.avatar && typeof user.avatar === 'object' && !Array.isArray(user.avatar)) {
      const avatarObj = user.avatar as any;
      if (avatarObj.url && avatarObj.url.trim() !== "") {
        const url = normalizeUrl(avatarObj.url);
        if (url) return url;
      }
    }
    
    // Try avatar as string
    if (user.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== "") {
      const url = normalizeUrl(user.avatar);
      if (url) return url;
    }
    
    // Try avatar.filename (construct URL)
    if (user.avatar && typeof user.avatar === 'object' && !Array.isArray(user.avatar)) {
      const avatarObj = user.avatar as any;
      if (avatarObj.filename && avatarObj.filename.trim() !== "") {
        return normalizeUrl(`/static/${avatarObj.filename}`);
      }
    }
    
    // Fallback to default avatar (relative path - Next.js will handle)
    return "/assets/images/avatar.jpg";
  };
  
  const avatarSrc = getAvatarUrl();
  
  // Debug logging
  console.log('🖼️ User Details - Avatar Debug:', {
    photoURL: user.photoURL,
    avatar: user.avatar,
    avatarSrc,
    userAvatarType: typeof user.avatar,
    isAvatarObject: user.avatar && typeof user.avatar === 'object' && !Array.isArray(user.avatar),
    apiBaseUrl: app.baseURL
  });

  return (
    <>
      <AxiosInterceptor>
        <Header />
        <main className="user-details-page" style={{ 
          minHeight: '100vh', 
          padding: '40px 0',
          position: 'relative',
          zIndex: 1,
        }}>
          <div className="container">
            {/* Add CSS for animated stars, badges, cards, and recommended effects */}
            <style>{`
              @keyframes starPulse {
                0% {
                  transform: scale(1) rotate(0deg);
                  opacity: 1;
                }
                25% {
                  transform: scale(1.2) rotate(10deg);
                  opacity: 0.8;
                }
                50% {
                  transform: scale(1.4) rotate(0deg);
                  opacity: 0.6;
                }
                75% {
                  transform: scale(1.2) rotate(-10deg);
                  opacity: 0.8;
                }
                100% {
                  transform: scale(1) rotate(0deg);
                  opacity: 1;
                }
              }

              @keyframes starTwinkle {
                0%, 100% {
                  opacity: 1;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.6;
                  transform: scale(0.95);
                }
              }

              .animated-star {
                animation: starPulse 2s ease-in-out infinite !important;
                display: inline-block !important;
                margin: 0 2px !important;
                transition: all 0.3s ease !important;
                font-size: 16px !important;
                transform-origin: center !important;
              }

              .animated-star:hover {
                animation: starTwinkle 0.6s ease-in-out infinite !important;
                transform: scale(1.4) !important;
                filter: drop-shadow(0 0 15px rgba(255, 215, 0, 1)) !important;
              }

              /* Badge Pop-in Animation */
              @keyframes badgePop {
                0% { transform: scale(0.8); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }

              /* Badge Subtle Wiggle Animation (for continuous movement) */
              @keyframes badgeSubtleWiggle {
                0%, 100% { transform: rotateZ(0deg); }
                25% { transform: rotateZ(1deg); }
                75% { transform: rotateZ(-1deg); }
              }

              /* Badge Rotation Animation */
              @keyframes badgeRotateOnCardHover {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
              }

              /* General animated-badge styles */
              .animated-badge {
                animation: badgePop 0.5s ease-out forwards, badgeSubtleWiggle 4s ease-in-out infinite;
                transform-origin: center;
                transition: transform 0.3s ease-in-out, filter 0.3s ease-in-out;
                transform-style: preserve-3d;
              }

              /* Avatar Badges - apply similar animation properties */
              .badge-overlay {
                transform-style: preserve-3d;
                transition: transform 0.3s ease-in-out, filter 0.3s ease-in-out;
              }

              /* New rule: Apply rotation when .user-header-card is hovered */
              .user-header-card:hover .animated-badge,
              .user-header-card:hover .badge-overlay > div {
                animation: badgeRotateOnCardHover 0.6s ease-in-out forwards;
                filter: brightness(1.2);
              }

              /* Recommended Badge Animations */
              @keyframes recommendedGlow {
                0%, 100% {
                  background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4);
                  opacity: 0.8;
                  transform: scale(1.1);
                }
                50% {
                  background: linear-gradient(45deg, #96CEB4, #FF6B6B, #4ECDC4, #45B7D1);
                  opacity: 1;
                  transform: scale(1.2);
                }
              }

              @keyframes recommendedPulse {
                0%, 100% {
                  transform: scale(1);
                  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }
                50% {
                  transform: scale(1.05);
                  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
                }
              }

              @keyframes recommendedStar {
                0%, 100% {
                  transform: rotate(0deg) scale(1);
                  color: #FFD700;
                }
                25% {
                  transform: rotate(90deg) scale(1.2);
                  color: #FFA500;
                }
                50% {
                  transform: rotate(180deg) scale(1.1);
                  color: #FF6347;
                }
                75% {
                  transform: rotate(270deg) scale(1.2);
                  color: #FF69B4;
                }
              }

              @keyframes sparkle {
                0%, 100% {
                  opacity: 0;
                  transform: scale(0.5);
                }
                50% {
                  opacity: 1;
                  transform: scale(1.2);
                }
              }

              /* Card Initial Load Animation */
              @keyframes cardFadeInUp {
                0% {
                  opacity: 0;
                  transform: translateY(20px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              .user-card.initial-animation {
                animation: cardFadeInUp 0.6s ease-out forwards;
              }

              /* Card Hover Animation for main card - removed rotation from card itself */
              .user-header-card {
                transition: all 0.4s ease;
                position: relative;
                overflow: visible;
              }
              .user-header-card:hover {
                transform: translateY(-15px) scale(1.02) !important;
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3) !important;
                background-color: white !important;
              }
              
              /* Ensure card hover works for badge rotation - higher specificity */
              .card.user-header-card:hover .badge-name-hover,
              .user-header-card.card:hover .badge-name-hover {
                animation: badge-rotate 1s linear infinite, badge-pulse 2s ease-in-out infinite !important;
                transform-origin: 50% 50% !important;
                transform-style: preserve-3d !important;
                backface-visibility: visible !important;
              }

              /* Stat Card Hover Animation */
              .stat-card-hover:hover {
                transform: translateY(-5px) scale(1.02);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
              }

              /* Gold Rate Badge Pulse Animation */
              @keyframes pulse-subtle {
                0%, 100% {
                  transform: scale(1);
                  opacity: 1;
                }
                50% {
                  transform: scale(1.05);
                  opacity: 0.95;
                }
              }

              /* Badge Pulse and Hover Animation */
              @keyframes badge-pulse {
                0%, 100% {
                  transform: scale(1);
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
                }
                50% {
                  transform: scale(1.08);
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
                }
              }

              /* Badge Flip Animation for name badges */
              @keyframes badge-rotate {
                0% {
                  transform: rotateY(0deg);
                }
                100% {
                  transform: rotateY(360deg);
                }
              }

              .badge-name-hover {
                animation: badge-pulse 2s ease-in-out infinite;
                transition: transform 0.3s ease, box-shadow 0.3s ease, animation 0.3s ease;
                cursor: pointer;
                transform-origin: 50% 50%;
                transform-style: preserve-3d;
                backface-visibility: visible;
                perspective: 1000px;
                will-change: transform;
              }

              /* Rotate badges beside name when card is hovered - MUST come before individual hover */
              .card.user-header-card:hover .badge-name-hover,
              .user-header-card.card:hover .badge-name-hover,
              .user-header-card:hover .badge-name-hover {
                animation: badge-rotate 1s linear infinite, badge-pulse 2s ease-in-out infinite !important;
                transform-origin: 50% 50% !important;
                transform-style: preserve-3d !important;
                backface-visibility: visible !important;
              }
              
              /* Also rotate nested elements (like PRO badge span inside badge-name-hover) when card is hovered */
              .card.user-header-card:hover .badge-name-hover > .badge,
              .card.user-header-card:hover .badge-name-hover > .animated-badge,
              .card.user-header-card:hover .badge-name-hover > span,
              .card.user-header-card:hover .badge-name-hover > i,
              .card.user-header-card:hover .badge-name-hover > *,
              .user-header-card:hover .badge-name-hover > .badge,
              .user-header-card:hover .badge-name-hover > .animated-badge,
              .user-header-card:hover .badge-name-hover > span,
              .user-header-card:hover .badge-name-hover > i,
              .user-header-card:hover .badge-name-hover > * {
                animation: badge-rotate 1s linear infinite, badge-pulse 2s ease-in-out infinite !important;
                transform-origin: 50% 50% !important;
                transform-style: preserve-3d !important;
                backface-visibility: visible !important;
              }
              
              /* Force rotation on PRO badge specifically */
              .card.user-header-card:hover .badge-name-hover .animated-badge,
              .user-header-card:hover .badge-name-hover .animated-badge {
                animation: badge-rotate 1s linear infinite, badge-pulse 2s ease-in-out infinite !important;
                transform-style: preserve-3d !important;
                backface-visibility: visible !important;
                transform-origin: 50% 50% !important;
              }

              .badge-name-hover:hover {
                animation: badge-rotate 1s linear infinite, badge-pulse 2s ease-in-out infinite !important;
                transform: scale(1.15);
                transform-origin: 50% 50% !important;
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
              }
              
              /* Ensure all badges inside badge-name-hover have 3d transform support */
              .badge-name-hover > span,
              .badge-name-hover > * {
                transform-style: preserve-3d;
                backface-visibility: visible;
                transform-origin: 50% 50%;
              }

              /* Avatar Badge Pulse Animation */
              @keyframes avatar-badge-pulse {
                0%, 100% {
                  transform: scale(1);
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                50% {
                  transform: scale(1.1);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
              }

              /* Avatar Badge Flip Animation on Card Hover */
              @keyframes avatar-badge-rotate {
                0% {
                  transform: rotateY(0deg);
                }
                100% {
                  transform: rotateY(360deg);
                }
              }

              .avatar-badge {
                animation: avatar-badge-pulse 2s ease-in-out infinite;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                transform-origin: 50% 50%;
                transform-style: preserve-3d;
                backface-visibility: visible;
              }

              .user-header-card:hover .avatar-badge {
                animation: avatar-badge-rotate 1s linear infinite !important;
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                transform-origin: 50% 50%;
              }
            `}</style>
            
            {/* Back Button */}
            <div className="mb-4">
              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={() => router.back()}
                style={{ borderRadius: '25px', padding: '8px 20px' }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Users
              </button>
            </div>

            {/* User Header Card */}
            <div
              className="card mb-4 user-header-card"
              style={{
                borderRadius: '20px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.4s ease',
                position: 'relative',
                overflow: 'visible'
              }}
            >
              {/* Recommended Badge - Removed text badge, only showing circular icon badge on avatar */}

              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-3 text-center mb-3 mb-md-0">
                    <div className="position-relative d-inline-block" style={{ overflow: 'visible', perspective: '1000px' }}>
                      <div className="user-avatar" style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: user.isRecommended ? '4px solid #667eea' : '4px solid #fff',
                        boxShadow: user.isRecommended ? '0 4px 15px rgba(102, 126, 234, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)',
                        position: 'relative',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={avatarSrc}
                          alt={getUserFullName(user)}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            objectPosition: 'center center',
                            display: 'block',
                            borderRadius: '50%'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/assets/images/avatar.jpg";
                          }}
                        />
                      </div>
                      
                      {/* Rate Badge - Top Right - Always visible */}
                      <div className="avatar-badge rate-badge" style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid white',
                        boxShadow: '0 3px 10px rgba(255, 215, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        zIndex: 1000
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '800',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                          lineHeight: 1
                        }}>
                          +{user.rating || 0}
                        </span>
                      </div>

                      {/* Recommended Badge - Top Left */}
                      {user.isRecommended && (
                        <div className="avatar-badge recommended-badge" style={{
                          position: 'absolute',
                          top: '-2px',
                          left: '-2px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '3px solid white',
                          boxShadow: '0 3px 10px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                          zIndex: 1000
                        }}>
                          <i className="bi bi-star-fill text-white" style={{ fontSize: '15px', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}></i>
                        </div>
                      )}

                      {/* Certified Badge - Bottom Left */}
                      {user.isCertified && (
                        <div className="avatar-badge certified-badge" style={{
                          position: 'absolute',
                          bottom: '-2px',
                          left: '-2px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '3px solid white',
                          boxShadow: '0 3px 10px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                          zIndex: 1000
                        }}>
                          <i className="bi bi-award-fill text-white" style={{ fontSize: '15px', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-9">
                    <div className="d-flex flex-wrap align-items-center mb-2">
                      <h2 className="mb-0 me-3" style={{ fontWeight: '700', color: '#333', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        {getUserFullName(user)}
                        {/* PRO Badge (User Type) - First */}
                        <span className="badge-name-hover">
                          {getUserTypeBadge(user.type)}
                        </span>
                        {/* Verification Badge - Second */}
                        {user.isVerified && (
                          <span 
                            className="badge-name-hover"
                            style={{
                              display: 'inline-flex',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid white',
                              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                              flexShrink: 0,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'visible',
                              transformOrigin: '50% 50%'
                            }} 
                            title="Verified"
                          >
                            <i className="bi bi-check-circle-fill text-white" style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
                          </span>
                        )}
                        {/* Certified Badge - Third */}
                        {user.isCertified && (
                          <span 
                            className="badge-name-hover"
                            style={{
                              display: 'inline-flex',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid white',
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                              flexShrink: 0,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'visible',
                              transformOrigin: '50% 50%'
                            }} 
                            title="Certified"
                          >
                            <i className="bi bi-award-fill text-white" style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
                          </span>
                        )}
                        {/* Recommended Badge - Fourth */}
                        {user.isRecommended && (
                          <span 
                            className="badge-name-hover"
                            style={{
                              display: 'inline-flex',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid white',
                              boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
                              flexShrink: 0,
                              transformStyle: 'preserve-3d',
                              backfaceVisibility: 'visible',
                              transformOrigin: '50% 50%'
                            }} 
                            title="Recommended"
                          >
                            <i className="bi bi-star-fill text-white" style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
                          </span>
                        )}
                      </h2>
                    </div>

                    {/* Recommended alert message removed - badge icon only */}


                    {user.location && (
                      <p className="text-muted mb-3" style={{ fontSize: '16px' }}>
                        <i className="bi bi-geo-alt me-2"></i>
                        {user.location}
                      </p>
                    )}

                    <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
                      <i className="bi bi-calendar-check me-2"></i>
                      Member since {new Date(user.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    {user.description && (
                      <p className="text-muted" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                        &quot;{user.description}&quot;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Three Section Buttons */}
            <div className="row mb-4">
              <div className="col-md-4 mb-3">
                <button
                  onClick={() => setActiveSection('activities')}
                  className="w-100"
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: 'none',
                    background: activeSection === 'activities' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    color: activeSection === 'activities' ? 'white' : '#333',
                    fontWeight: '600',
                    fontSize: '18px',
                    transition: 'all 0.3s ease',
                    boxShadow: activeSection === 'activities' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transform: activeSection === 'activities' ? 'translateY(-5px)' : 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== 'activities') {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== 'activities') {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <i className="bi bi-activity me-2" style={{ fontSize: '24px' }}></i>
                  Activités
                </button>
              </div>
              <div className="col-md-4 mb-3">
                <button
                  onClick={() => setActiveSection('info')}
                  className="w-100"
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: 'none',
                    background: activeSection === 'info' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    color: activeSection === 'info' ? 'white' : '#333',
                    fontWeight: '600',
                    fontSize: '18px',
                    transition: 'all 0.3s ease',
                    boxShadow: activeSection === 'info' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transform: activeSection === 'info' ? 'translateY(-5px)' : 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== 'info') {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== 'info') {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <i className="bi bi-person-circle me-2" style={{ fontSize: '24px' }}></i>
                  Informations
                </button>
              </div>
              <div className="col-md-4 mb-3">
                <button
                  onClick={() => setActiveSection('rating')}
                  className="w-100"
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: 'none',
                    background: activeSection === 'rating' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    color: activeSection === 'rating' ? 'white' : '#333',
                    fontWeight: '600',
                    fontSize: '18px',
                    transition: 'all 0.3s ease',
                    boxShadow: activeSection === 'rating' 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transform: activeSection === 'rating' ? 'translateY(-5px)' : 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== 'rating') {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== 'rating') {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                >
                  <i className="bi bi-star-fill me-2" style={{ fontSize: '24px' }}></i>
                  Note
                </button>
              </div>
            </div>

            {/* Section Content */}
            <div className="card" style={{ 
              borderRadius: '20px', 
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              minHeight: '400px'
            }}>
              <div className="card-body" style={{ padding: '40px' }}>
                {/* Activities Section */}
                {activeSection === 'activities' && (
                  <div className="activities-section">
                    <h4 className="mb-4" style={{ fontWeight: '700', color: '#333' }}>
                      <i className="bi bi-activity me-2" style={{ color: '#667eea' }}></i>
                      Activités de l'utilisateur
                    </h4>
                    {activitiesLoading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Auctions */}
                        <div className="mb-5">
                          <h5 className="mb-4" style={{ color: '#0063b1', fontWeight: '700' }}>
                            <i className="bi bi-hammer me-2"></i>
                            Enchères ({userActivities.auctions.length})
                          </h5>
                          {userActivities.auctions.length === 0 ? (
                            <p className="text-muted text-center py-4">Aucune enchère créée</p>
                          ) : (
                            <div className="row">
                              {userActivities.auctions.map((auction: any) => {
                                const getAuctionImageUrl = () => {
                                  if (auction.thumbs && auction.thumbs.length > 0 && auction.thumbs[0].url) {
                                    const imageUrl = auction.thumbs[0].url;
                                    if (imageUrl.startsWith('http')) return imageUrl;
                                    if (imageUrl.startsWith('/')) return `${app.baseURL}${imageUrl.substring(1)}`;
                                    return `${app.baseURL}${imageUrl}`;
                                  }
                                  return "/assets/images/logo-white.png";
                                };

                                return (
                                  <div key={auction._id || auction.id} className="col-lg-4 col-md-6 mb-4">
                                    <div 
                                      className="card h-100"
                                      style={{ 
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s ease',
                                        border: '1px solid rgba(0, 99, 177, 0.1)',
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
                                      }}
                                      onClick={() => router.push(`/auction-details/${auction._id || auction.id}`)}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-10px)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 99, 177, 0.2)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                                      }}
                                    >
                                      <div style={{
                                        position: 'relative',
                                        height: '200px',
                                        overflow: 'hidden',
                                        background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        <img
                                          src={getAuctionImageUrl()}
                                          alt={auction.title || 'Auction'}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            padding: '10px'
                                          }}
                                          onError={(e) => {
                                            e.currentTarget.src = "/assets/images/logo-white.png";
                                          }}
                                        />
                                      </div>
                                      <div className="card-body" style={{ padding: '20px' }}>
                                        <h6 className="card-title mb-2" style={{ 
                                          fontWeight: '600', 
                                          color: '#333',
                                          fontSize: '16px',
                                          minHeight: '48px',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden'
                                        }}>
                                          {auction.title || 'Sans titre'}
                                        </h6>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#0063b1' }}>
                                            {auction.currentPrice || auction.startingPrice || 0} DA
                                          </span>
                                          <span className="badge" style={{
                                            background: auction.status === 'ACTIVE' ? '#28a745' : '#6c757d',
                                            color: 'white',
                                            padding: '5px 12px',
                                            borderRadius: '20px'
                                          }}>
                                            {auction.status || 'ACTIVE'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Tenders */}
                        <div className="mb-5">
                          <h5 className="mb-4" style={{ color: '#28a745', fontWeight: '700' }}>
                            <i className="bi bi-file-earmark-text me-2"></i>
                            Appels d'offres ({userActivities.tenders.length})
                          </h5>
                          {userActivities.tenders.length === 0 ? (
                            <p className="text-muted text-center py-4">Aucun appel d'offres créé</p>
                          ) : (
                            <div className="row">
                              {userActivities.tenders.map((tender: any) => {
                                const getTenderImageUrl = () => {
                                  if (tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url) {
                                    const imageUrl = tender.attachments[0].url;
                                    if (imageUrl.startsWith('http')) return imageUrl;
                                    if (imageUrl.startsWith('/')) return `${app.baseURL}${imageUrl.substring(1)}`;
                                    return `${app.baseURL}${imageUrl}`;
                                  }
                                  return "/assets/images/logo-white.png";
                                };

                                return (
                                  <div key={tender._id} className="col-lg-4 col-md-6 mb-4">
                                    <div 
                                      className="card h-100"
                                      style={{ 
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s ease',
                                        border: '1px solid rgba(40, 167, 69, 0.1)',
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
                                      }}
                                      onClick={() => router.push(`/tender/${tender._id}`)}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-10px)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(40, 167, 69, 0.2)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                                      }}
                                    >
                                      <div style={{
                                        position: 'relative',
                                        height: '200px',
                                        overflow: 'hidden',
                                        background: 'linear-gradient(135deg, #27F5CC, #00D4AA)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        <img
                                          src={getTenderImageUrl()}
                                          alt={tender.title || 'Tender'}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            padding: '10px'
                                          }}
                                          onError={(e) => {
                                            e.currentTarget.src = "/assets/images/logo-white.png";
                                          }}
                                        />
                                      </div>
                                      <div className="card-body" style={{ padding: '20px' }}>
                                        <h6 className="card-title mb-2" style={{ 
                                          fontWeight: '600', 
                                          color: '#333',
                                          fontSize: '16px',
                                          minHeight: '48px',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden'
                                        }}>
                                          {tender.title || 'Sans titre'}
                                        </h6>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#28a745' }}>
                                            {tender.budget || 0} DA
                                          </span>
                                          <span className="badge" style={{
                                            background: tender.status === 'ACTIVE' ? '#28a745' : '#6c757d',
                                            color: 'white',
                                            padding: '5px 12px',
                                            borderRadius: '20px'
                                          }}>
                                            {tender.status || 'ACTIVE'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Direct Sales */}
                        <div>
                          <h5 className="mb-4" style={{ color: '#ffc107', fontWeight: '700' }}>
                            <i className="bi bi-cart me-2"></i>
                            Ventes directes ({userActivities.directSales.length})
                          </h5>
                          {userActivities.directSales.length === 0 ? (
                            <p className="text-muted text-center py-4">Aucune vente directe créée</p>
                          ) : (
                            <div className="row">
                              {userActivities.directSales.map((sale: any) => {
                                const getDirectSaleImageUrl = () => {
                                  if (sale.thumbs && sale.thumbs.length > 0 && sale.thumbs[0].url) {
                                    const imageUrl = sale.thumbs[0].url;
                                    if (imageUrl.startsWith('http')) return imageUrl;
                                    if (imageUrl.startsWith('/')) return `${app.baseURL}${imageUrl.substring(1)}`;
                                    return `${app.baseURL}${imageUrl}`;
                                  }
                                  return "/assets/images/logo-white.png";
                                };

                                const isSoldOut = sale.quantity > 0 && sale.soldQuantity >= sale.quantity;

                                return (
                                  <div key={sale._id} className="col-lg-4 col-md-6 mb-4">
                                    <div 
                                      className="card h-100"
                                      style={{ 
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        cursor: isSoldOut ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.4s ease',
                                        border: '1px solid rgba(255, 193, 7, 0.1)',
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                                        opacity: isSoldOut ? 0.6 : 1,
                                        filter: isSoldOut ? 'grayscale(60%)' : 'none'
                                      }}
                                      onClick={() => !isSoldOut && router.push(`/direct-sale/${sale._id}`)}
                                      onMouseEnter={(e) => {
                                        if (!isSoldOut) {
                                          e.currentTarget.style.transform = 'translateY(-10px)';
                                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 193, 7, 0.2)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSoldOut) {
                                          e.currentTarget.style.transform = 'none';
                                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                                        }
                                      }}
                                    >
                                      <div style={{
                                        position: 'relative',
                                        height: '200px',
                                        overflow: 'hidden',
                                        background: 'linear-gradient(135deg, #f7ef8a, #ffc107)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        {isSoldOut && (
                                          <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            background: '#dc3545',
                                            color: 'white',
                                            padding: '5px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            zIndex: 10
                                          }}>
                                            ÉPUISÉ
                                          </div>
                                        )}
                                        <img
                                          src={getDirectSaleImageUrl()}
                                          alt={sale.title || 'Direct Sale'}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            padding: '10px'
                                          }}
                                          onError={(e) => {
                                            e.currentTarget.src = "/assets/images/logo-white.png";
                                          }}
                                        />
                                      </div>
                                      <div className="card-body" style={{ padding: '20px' }}>
                                        <h6 className="card-title mb-2" style={{ 
                                          fontWeight: '600', 
                                          color: '#333',
                                          fontSize: '16px',
                                          minHeight: '48px',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden'
                                        }}>
                                          {sale.title || 'Sans titre'}
                                        </h6>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#ffc107' }}>
                                            {sale.price || 0} DA
                                          </span>
                                          <span className="badge" style={{
                                            background: sale.status === 'ACTIVE' ? '#ffc107' : '#6c757d',
                                            color: sale.status === 'ACTIVE' ? '#000' : 'white',
                                            padding: '5px 12px',
                                            borderRadius: '20px'
                                          }}>
                                            {sale.status || 'ACTIVE'}
                                          </span>
                                        </div>
                                        {sale.quantity > 0 && (
                                          <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
                                            Disponible: {sale.quantity - (sale.soldQuantity || 0)} / {sale.quantity}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Info Section */}
                {activeSection === 'info' && (
                  <div className="info-section">
                    <h4 className="mb-4" style={{ fontWeight: '700', color: '#333' }}>
                      <i className="bi bi-person-circle me-2" style={{ color: '#667eea' }}></i>
                      Informations de l'utilisateur
                    </h4>
                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <div className="info-item" style={{
                          padding: '20px',
                          borderRadius: '15px',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          marginBottom: '15px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Nom complet</div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                            {getUserFullName(user)}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="info-item" style={{
                          padding: '20px',
                          borderRadius: '15px',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          marginBottom: '15px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Email</div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="info-item" style={{
                          padding: '20px',
                          borderRadius: '15px',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          marginBottom: '15px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Téléphone</div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                            {user.phone || 'Non renseigné'}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="info-item" style={{
                          padding: '20px',
                          borderRadius: '15px',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          marginBottom: '15px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Entreprise</div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                            {user.entreprise || 'Non renseigné'}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="info-item" style={{
                          padding: '20px',
                          borderRadius: '15px',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          marginBottom: '15px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Secteur</div>
                          <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                            {typeof user.secteur === 'object' && user.secteur?.name 
                              ? user.secteur.name 
                              : (typeof user.secteur === 'string' ? user.secteur : 'Non renseigné')}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="info-item" style={{
                          padding: '20px',
                          borderRadius: '15px',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          marginBottom: '15px'
                        }}>
                          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Type d'utilisateur</div>
                          <div style={{ marginTop: '5px' }}>
                            {getUserTypeBadge(user.type)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating Section */}
                {activeSection === 'rating' && (
                  <div className="rating-section text-center">
                    <h4 className="mb-4" style={{ fontWeight: '700', color: '#333' }}>
                      <i className="bi bi-star-fill me-2" style={{ color: '#FFD700' }}></i>
                      Note de l'utilisateur
                    </h4>
                    <div style={{
                      display: 'inline-block',
                      padding: '40px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      boxShadow: '0 10px 30px rgba(255, 215, 0, 0.3)',
                      marginBottom: '30px'
                    }}>
                      <div style={{ fontSize: '72px', fontWeight: '800', color: 'white', lineHeight: '1' }}>
                        {user.rating || 0}
                      </div>
                      <div style={{ fontSize: '24px', color: 'white', marginTop: '10px', fontWeight: '600' }}>
                        / 10
                      </div>
                    </div>
                    <div className="mt-4">
                      {renderStars(user.rating || 0)}
                    </div>
                    <p className="text-muted mt-3" style={{ fontSize: '16px' }}>
                      Note basée sur les performances et les interactions de l'utilisateur
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </AxiosInterceptor>
    </>
  );
}