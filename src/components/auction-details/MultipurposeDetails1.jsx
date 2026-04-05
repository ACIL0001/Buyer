"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import "./st.css";
import "./modern-details.css";
import "./multipurpose-redesign.css";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useCountdownTimer } from "@/customHooks/useCountdownTimer";
import HandleQuantity from "../common/HandleQuantity";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authStore } from "@/contexts/authStore";
import { AuctionsAPI } from "@/app/api/auctions";
import { OfferAPI } from "@/app/api/offer";
import { AutoBidAPI } from "@/app/api/auto-bid";
import useAuth from "@/hooks/useAuth";
import app, { getSellerUrl } from "@/config"; // Import the app config
import { calculateTimeRemaining } from "../live-auction/Home1LiveAuction";
import { ReviewAPI } from "@/app/api/review"; // Import Review API
import commentsApi from "@/app/api/comments";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import ShareButton from "@/components/common/ShareButton";
import CommentItem from "@/components/common/CommentItem";
import { normalizeImageUrl } from "@/utils/url";

const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-dark.png";
const DEFAULT_USER_AVATAR = "/assets/images/avatar.jpg";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";



// Helper function to calculate time remaining and format with leading zeros
function getTimeRemaining(endDate) {
  if (!endDate) {
    return {
      total: 0,
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }
  
  const total = Date.parse(endDate) - Date.now();
  const seconds = Math.max(Math.floor((total / 1000) % 60), 0);
  const minutes = Math.max(Math.floor((total / 1000 / 60) % 60), 0);
  const hours = Math.max(Math.floor((total / (1000 * 60 * 60)) % 24), 0);
  const days = Math.max(Math.floor(total / (1000 * 60 * 60 * 24)), 0);

  const formatNumber = (num) => String(num).padStart(2, "0");

  return {
    total,
    days: formatNumber(days),
    hours: formatNumber(hours),
    minutes: formatNumber(minutes),
    seconds: formatNumber(seconds),
  };
}

const MultipurposeDetails1 = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [auctionData, setAuctionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null); // For debugging
  const { isLogged, auth } = useAuth();
  const [time, setTime] = useState({
    day: "00",
    hour: "00",
    mun: "00",
    sec: "00",
  });
  const [allAuctions, setAllAuctions] = useState([]);
  const [similarAuctionTimers, setSimilarAuctionTimers] = useState([]);
  const [activeTab, setActiveTab] = useState("comments"); // State for active tab
  const [reviewText, setReviewText] = useState(""); // State for review text
  const [reviewRating, setReviewRating] = useState(0); // State for review rating
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // State for selected image index
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0); // State for selected video index
  const [showVideo, setShowVideo] = useState(false); // State for showing video instead of image
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false); // State for showing all comments
  const [offers, setOffers] = useState([]); // State for offers
  const [professionalAmount, setProfessionalAmount] = useState(""); // State for professional amount
  const [savingAutoBid, setSavingAutoBid] = useState(false); // State for saving auto bid
  const [loadingAutoBid, setLoadingAutoBid] = useState(false); // State for loading auto bid
  const [hasExistingAutoBid, setHasExistingAutoBid] = useState(false); // State to track if user has existing auto-bid
  const [deletingAutoBid, setDeletingAutoBid] = useState(false); // State for deleting auto bid
  const [showBidConfirmation, setShowBidConfirmation] = useState(false); // State for bid confirmation modal

  // Get auction ID from URL params or search params
  const routeId = params?.id;
  const queryId = searchParams.get("id");
  const auctionId = routeId || queryId;

  // Add error boundary with better error information
  if (error && !loading) {
    return (
      <div className="auction-details-section mb-110" style={{ marginTop: 0, paddingTop: 0 }}>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 text-center">
              <div className="alert alert-danger">
                <h3>{t('details.errorOccurred') || 'Une erreur s\'est produite'}</h3>
                <p>{error}</p>
                {errorDetails && (
                  <details style={{ marginTop: '10px', textAlign: 'left' }}>
                    <summary style={{ cursor: 'pointer', color: '#721c24' }}>
                      {t('details.technicalDetails') || 'Détails techniques (pour le débogage)'}
                    </summary>
                    <pre style={{ 
                      background: '#f8f9fa', 
                      padding: '10px', 
                      borderRadius: '5px', 
                      fontSize: '12px',
                      marginTop: '10px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {JSON.stringify(errorDetails, null, 2)}
                    </pre>
                  </details>
                )}
                <div style={{ marginTop: '20px' }}>
                  <button 
                    className="btn btn-primary me-2"
                    onClick={() => window.location.reload()}
                  >
                    {t('details.retry') || 'Réessayer'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => router.push('/auction-sidebar')}
                  >
                    {t('auctionDetails.backToAuctions') || 'Retour aux enchères'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
        document.documentElement?.scrollTo?.({ top: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: "auto" });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 50);
      });
    }
  }, []);

  useEffect(() => {
    if (!auctionData) return;
    let inter = setInterval(() => {
      try {
        // Use the local getTimeRemaining for consistent formatting
        const dataTimer = getTimeRemaining(auctionData.endingAt);
        setTime({
          day: dataTimer.days,
          hour: dataTimer.hours,
          mun: dataTimer.minutes,
          sec: dataTimer.seconds,
        });
      } catch (err) {
        console.error("Error updating timer:", err);
        // Set default values if timer fails
        setTime({
          day: "00",
          hour: "00",
          mun: "00",
          sec: "00",
        });
      }
    }, 1000);
    return () => clearInterval(inter);
  }, [auctionData]);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      try {
        if (!auctionId) {
          console.error("No auction ID found in URL parameters");
          setError("ID d'enchère introuvable. Veuillez vérifier l'URL.");
          setErrorDetails({
            type: "MISSING_AUCTION_ID",
            routeId,
            queryId,
            params: params,
            searchParams: searchParams ? Object.fromEntries(searchParams.entries()) : null
          });
          setLoading(false);
          return;
        }

        console.log("Fetching auction details for ID:", auctionId);
        console.log("API Base URL:", app.baseURL);
        setLoading(true);
        
        // Test server connectivity first
        try {
          const testResponse = await fetch(`${app.baseURL}health`, { 
            method: 'GET',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log("Server health check response:", testResponse.status);
        } catch (healthError) {
          console.warn("Server health check failed:", healthError);
        }

        const response = await AuctionsAPI.getAuctionById(auctionId);
        console.log("Auction response received:", response);
        
        let data = response?.data || (response?.success ? response.data : response);
        
        if (!data) {
          throw new Error("Aucune donnée reçue du serveur");
        }
        
        setAuctionData(data);
        // Assuming offers are populated within auctionData
        if (data?.offers) {
          setOffers(data.offers);
        }

        // Handle Comment Redirection
        const commentId = searchParams.get('commentId');
        if (commentId) {
             console.log("💬 Detected commentId in URL:", commentId);
             setActiveTab('reviews');
             setShowAllComments(true); // Ensure all comments are loaded so scrolling works
             // Use setTimeout to allow tab switch and rendering to complete
             setTimeout(() => {
                 const element = document.getElementById(`comment-${commentId}`);
                 if (element) {
                     console.log("📍 Scrolling to comment:", commentId);
                     element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     element.classList.add('highlight-comment'); // Optional: Add CSS class for visual highlight
                 } else {
                     console.warn("❌ Comment element not found in DOM:", commentId);
                 }
             }, 800); // 800ms delay to ensure tab content is rendered
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching auction details:", err);
        
        // Enhanced error handling
        let errorMessage = "Impossible de charger les détails de l'enchère. Veuillez réessayer plus tard.";
        let errorType = "UNKNOWN_ERROR";
        
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion internet.";
          errorType = "NETWORK_ERROR";
        } else if (err.response) {
          // Server responded with error status
          const status = err.response.status;
          if (status === 404) {
            errorMessage = t("auctionDetails.notFound") || "Enchère introuvable. Elle a peut-être été supprimée.";
            errorType = "NOT_FOUND";
          } else if (status === 401) {
            errorMessage = t("auctionDetails.unauthorized") || "Accès non autorisé. Veuillez vous reconnecter.";
            errorType = "UNAUTHORIZED";
          } else if (status >= 500) {
            errorMessage = t("auctionDetails.serverError") || "Erreur serveur. Veuillez réessayer plus tard.";
            errorType = "SERVER_ERROR";
          }
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
          errorMessage = t("auctionDetails.serverUnreachable") || "Serveur inaccessible. Vérifiez que le serveur est en cours d'exécution.";
          errorType = "SERVER_UNREACHABLE";
        }
        
        setError(errorMessage);
        setErrorDetails({
          type: errorType,
          message: err.message,
          stack: err.stack,
          auctionId,
          apiUrl: `${app.baseURL}bid/${auctionId}`,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
        });
        setLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [auctionId, params, searchParams]);

  // Extract fetchAutoBidData as a reusable function
  const fetchAutoBidData = async () => {
    if (!isLogged || !auth.tokens || !auctionId || !auctionData) {
      return;
    }

    // Only fetch for PROFESSIONAL users
    if (auth.user?.type !== 'PROFESSIONAL') {
      return;
    }

    // Compute starting price to avoid dependency issues
    const startingPrice = auctionData?.startingPrice || 0;

    try {
      setLoadingAutoBid(true);
      console.log("Fetching auto-bid data for auction:", auctionId);
      
      const autoBidResponse = await AutoBidAPI.getAutoBidByAuctionAndUser(auctionId);
      console.log("Auto-bid response:", autoBidResponse);

      if (autoBidResponse.success && autoBidResponse.data) {
        // User has an auto-bid for this auction, use that price
        console.log("Found existing auto-bid:", autoBidResponse.data);
        setProfessionalAmount(autoBidResponse.data.price.toString());
        setHasExistingAutoBid(true);
      } else {
        // No auto-bid found, use starting price
        console.log("No auto-bid found, using starting price");
        setProfessionalAmount(startingPrice.toString());
        setHasExistingAutoBid(false);
      }
    } catch (err) {
      console.error("Error fetching auto-bid data:", err);
      // If error, use starting price as fallback and assume no existing auto-bid
      setProfessionalAmount(startingPrice.toString());
      setHasExistingAutoBid(false);
    } finally {
      setLoadingAutoBid(false);
    }
  };

  // Fetch auto-bid data for professional users on component mount and data changes
  useEffect(() => {
    fetchAutoBidData();
  }, [isLogged, auth.tokens, auctionId, auctionData, auth.user?.type]);

  useEffect(() => {
    // Fetch all auctions for 'Enchères Similaires'
    const fetchAllAuctions = async () => {
      try {
        const data = await AuctionsAPI.getAuctions();
        setAllAuctions(data);
      } catch (err) {
        // Optionally handle error
        setAllAuctions([]);
      }
    };
    fetchAllAuctions();
  }, []);

  // Update timers for similar auctions
  useEffect(() => {
    if (!allAuctions || allAuctions.length === 0) return;
    const filtered = allAuctions
      .filter((auction) => auction._id !== auctionId)
      .slice(0, 4);
    function updateTimers() {
      setSimilarAuctionTimers(
        filtered.map((auction) => {
          const endDate =
            auction.endDate || auction.endingAt || "2024-09-23 11:42:00";
          return getTimeRemaining(endDate); // getTimeRemaining now formats with leading zeros
        })
      );
    }
    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [allAuctions, auctionId]);

  // Using the real end date if available, otherwise fallback to static date
  const endDate = auctionData?.endDate || auctionData?.endingAt || "2024-09-23 11:42:00";
  const { days, hours, minutes, seconds } = useCountdownTimer(endDate);

  // Add null checks for critical data
  const safeAuctionData = auctionData || {};
  const safeThumbs = safeAuctionData.thumbs || [];
  const safeVideos = safeAuctionData.videos || [];
  const safeTitle = safeAuctionData.title || safeAuctionData.name || t('details.product');
  const safeDescription = safeAuctionData.description || t('auctionDetails.noDescription') || "Aucune description disponible.";
  const safeStartingPrice = safeAuctionData.startingPrice || 0;
  const safeCurrentPrice = safeAuctionData.currentPrice || 0;
  const safeOwner = safeAuctionData.owner || null;

  // Rest of the component remains the same
  const settings = useMemo(() => {
    return {
      slidesPerView: "auto",
      speed: 1500,
      spaceBetween: 15,
      grabCursor: true,
      autoplay: {
        delay: 2500, // Autoplay duration in milliseconds
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".category-slider-next",
        prevEl: ".category-slider-prev",
      },

      breakpoints: {
        280: {
          slidesPerView: 2,
        },
        350: {
          slidesPerView: 3,
          spaceBetween: 10,
        },
        576: {
          slidesPerView: 3,
          spaceBetween: 15,
        },
        768: {
          slidesPerView: 4,
        },
        992: {
          slidesPerView: 5,
          spaceBetween: 15,
        },
        1200: {
          slidesPerView: 5,
        },
        1400: {
          slidesPerView: 5,
        },
      },
    };
  }, []);
  const settingsForUpcomingAuction = useMemo(() => {
    return {
      slidesPerView: "auto",
      speed: 1500,
      spaceBetween: 25,
      autoplay: {
        delay: 2500, // Autoplay duration in milliseconds
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".auction-slider-next",
        prevEl: ".auction-slider-prev",
      },

      breakpoints: {
        280: {
          slidesPerView: 1,
        },
        386: {
          slidesPerView: 1,
        },
        576: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 2,
        },
        992: {
          slidesPerView: 3,
        },
        1200: {
          slidesPerView: 4,
        },
        1400: {
          slidesPerView: 4,
        },
      },
    };
  }, []);

  // Function to handle thumbnail click
  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
    setShowVideo(false); // Switch back to image view
  };

  // Function to handle video thumbnail click
  const handleVideoThumbnailClick = (index) => {
    setSelectedVideoIndex(index);
    setShowVideo(true); // Switch to video view
  };

  // Function to switch between image and video view
  const toggleMediaView = () => {
    setShowVideo(!showVideo);
  };

  // Determine if the current user is the owner of the auction
  const isOwner =
    isLogged &&
    safeOwner &&
    auth.user._id === (safeOwner._id || safeOwner);

  // Function to show bid confirmation modal
  const handleBidClick = (e) => {
    e.preventDefault();
    setShowBidConfirmation(true);
  };

  // Function to handle confirmed bid submission
  const handleConfirmedBidSubmit = async () => {
    setShowBidConfirmation(false);
    await submitBid();
  };

  // Function to cancel bid submission
  const handleCancelBidSubmit = () => {
    setShowBidConfirmation(false);
  };

  // Actual bid submission logic (extracted from handleBidSubmit)
  const submitBid = async () => {
    console.log(
      "[MultipurposeDetails1] submitBid - isLogged:",
      isLogged,
    "auth.tokens:",
    auth.tokens,
    "auth.user:",
    auth.user
  );

  try {
    // Check if user is logged in
    if (!isLogged || !auth.tokens) {
      toast.error(t('details.pleaseLoginToBuy'));
      router.push('/auth/login');
      return;
    }

    // Get bid amount from the quantity input
    const bidInput = document.querySelector(".quantity__input");
    if (!bidInput || !bidInput.value) {
      toast.error(t('auction.bidError'));
      return;
    }

    const bidAmountRaw = bidInput.value;
    console.log("[MultipurposeDetails1] Raw bid amount:", bidAmountRaw);

    // Clean the bid amount - remove formatting
    let cleanBidAmount = bidAmountRaw;
    
    // Remove ",00 " suffix if present
    cleanBidAmount = cleanBidAmount.replace(/,00\s*$/, "");
    
    // Remove all commas (thousands separators)
    cleanBidAmount = cleanBidAmount.replace(/,/g, "");
    
    // Remove any currency symbols or extra spaces
    cleanBidAmount = cleanBidAmount.replace(/[^\d.]/g, "");

    console.log("[MultipurposeDetails1] Cleaned bid amount:", cleanBidAmount);

    // Parse to number and validate
    const numericBidAmount = parseFloat(cleanBidAmount);
    
    if (isNaN(numericBidAmount) || numericBidAmount <= 0) {
      toast.error(t('auction.bidError'));
      return;
    }
    
    // Check minimum bid amount
    if (numericBidAmount < 1) {
      toast.error(t('auction.bidError'));
      return;
    }

    // Ensure the bid is higher than current price
    const currentPrice = auctionData?.currentPrice || auctionData?.startingPrice || 0;
    if (numericBidAmount <= currentPrice) {
      toast.error(`${t('auction.bidMustBeHigher')} ${formatPrice(currentPrice)}`);
      return;
    }

    // Round to avoid floating point issues
    const finalBidAmount = Math.round(numericBidAmount);

    console.log("[MultipurposeDetails1] Final bid amount:", finalBidAmount);
    console.log("[MultipurposeDetails1] Current price:", currentPrice);

    // Prepare the payload
    const payload = {
      price: finalBidAmount,
      user: auth.user._id,
      owner: safeOwner._id || safeOwner, // This should be the AUCTION OWNER'S ID, not the bidder's ID
    };

    console.log("[MultipurposeDetails1] Sending offer payload:", payload);

    // Validate required fields
    if (!payload.user) {
      toast.error("Utilisateur non valide. Veuillez vous reconnecter.");
      return;
    }

    if (!payload.owner) {
      console.error("[MultipurposeDetails1] Missing owner ID:", safeOwner);
      toast.error("Données de l'enchère incomplètes. Veuillez actualiser la page.");
      return;
    }

    try {
      // Send the offer
      const offerResponse = await OfferAPI.sendOffer(auctionId, payload);
      
      console.log("[MultipurposeDetails1] Offer submission response:", offerResponse);
      
      // Always show success message if we got here (no exception thrown)
      toast.success(t('auction.bidSuccess'));
      
      // Clear the input
      if (bidInput) {
        bidInput.value = formatPrice(finalBidAmount);
      }
      
      // Refresh the auction data after placing a bid
      try {
        const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
        setAuctionData(refreshedData);
        if (refreshedData?.offers) {
          setOffers(refreshedData.offers);
        }
      } catch (refreshErr) {
        console.warn("Failed to refresh auction data after successful bid:", refreshErr);
        // Don't show error for this as the bid was successful
      }
    } catch (submitError) {
      // If there was an error during submission, check if it has a status code
      // Status codes in the 2xx range indicate success despite the error
      const statusCode = submitError?.response?.status;
      const hasSuccessStatus = statusCode && statusCode >= 200 && statusCode < 300;
      
      console.log("[MultipurposeDetails1] Offer submission error:", submitError, "Status code:", statusCode);
      
      // If we have a success status code, treat it as success
      if (hasSuccessStatus) {
        toast.success(t('auction.bidSuccess'));
        
        // Clear the input
        if (bidInput) {
          bidInput.value = formatPrice(finalBidAmount);
        }
        
        // Try to refresh the auction data
        try {
          const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
          setAuctionData(refreshedData);
          if (refreshedData?.offers) {
            setOffers(refreshedData.offers);
          }
        } catch (refreshErr) {
          console.warn("Failed to refresh auction data after successful bid:", refreshErr);
        }
      } else {
        // Re-throw the error to be caught by the outer catch block
        throw submitError;
      }
    }

  } catch (err) {
    console.error("Error placing bid:", err);
    
    // Check if the error response contains a success flag that's true
    // This handles cases where the offer was saved but error was thrown anyway
    if (err?.response?.data?.success === true) {
      console.log("[MultipurposeDetails1] Detected successful operation despite error:", err);
      toast.success(t('auction.bidSuccess'));
      
      // Refresh the auction data
      try {
        const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
        setAuctionData(refreshedData);
        if (refreshedData?.offers) {
          setOffers(refreshedData.offers);
        }
      } catch (refreshErr) {
        console.warn("Failed to refresh auction data:", refreshErr);
      }
      return;
    }
    
    // Extract user-friendly error message
    let errorMessage = t('auction.bidError');
    
    if (err?.response?.data?.message) {
      const serverMessage = err.response.data.message;
      
      // Handle specific error messages from server
      switch (serverMessage) {
        case 'OFFER.INVALID_PRICE':
          errorMessage = t('auction.invalidPrice');
          break;
        case 'OFFER.AUCTION_ENDED':
          errorMessage = t('auction.auctionEnded');
          break;
        case 'OFFER.INSUFFICIENT_AMOUNT':
          errorMessage = t('auction.insufficientAmount');
          break;
        case 'OFFER.OWNER_CANNOT_BID':
          errorMessage = t('auctionDetails.cannotBidOwn');
          break;
        default:
          errorMessage = serverMessage;
      }
    } else if (err?.message) {
      errorMessage = err.message;
    }
    
    // Check if we have data despite the error
    if (err?.response?.data) {
      console.log("[MultipurposeDetails1] Error response contains data:", err.response.data);
      
      // If the data contains a valid offer object, consider it a success
      if (err.response.data.price || err.response.data._id) {
        console.log("[MultipurposeDetails1] Found offer data in error response, treating as success");
        toast.success(t('auction.bidSuccess'));
        
        // Try to refresh auction data
        try {
          const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
          setAuctionData(refreshedData);
          if (refreshedData?.offers) {
            setOffers(refreshedData.offers);
          }
        } catch (refreshErr) {
          console.warn("Failed to refresh auction data:", refreshErr);
        }
        return;
      }
    }
    
    toast.error(errorMessage);
  }
};

  // Handle bid submission for similar auctions
  const handleSimilarAuctionBid = async (similarAuction) => {
    try {
      // Check if user is logged in
      if (!isLogged || !auth.tokens) {
        toast.error(t('details.pleaseLoginToBuy'));
      router.push('/auth/login');
        return;
      }

      // Check if auction has ended
      const auctionEndDate = similarAuction.endDate || similarAuction.endingAt;
      if (auctionEndDate && new Date(auctionEndDate) <= new Date()) {
        toast.error(t('auction.auctionEnded'));
        return;
      }

      // Check if user is the owner of the auction
      const isOwner = isLogged && auth.user._id === (similarAuction.owner?._id || similarAuction.owner);
      if (isOwner) {
        toast.error(t('auctionDetails.cannotBidOwn'));
        return;
      }

      // Calculate suggested bid amount (current price + 5% of starting price)
      const currentPrice = similarAuction.currentPrice || similarAuction.startingPrice || 0;
      const startingPrice = similarAuction.startingPrice || 0;
      // Using Math.floor to ensure whole number
      const suggestedBid = Math.floor(currentPrice + Math.max(1, Math.floor(startingPrice * 0.05)));

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Voulez-vous placer une enchère de ${formatPrice(suggestedBid)} sur "${similarAuction.title || similarAuction.name}" ?`
      );

      if (!confirmed) {
        return;
      }

      const bidPayload = {
        price: Math.floor(suggestedBid),
        user: auth.user._id,
        owner: similarAuction.owner?._id || similarAuction.owner,
      };
      
      console.log("[MultipurposeDetails1] Sending similar auction bid:", bidPayload);

      try {
        // Send the offer - using Math.floor to ensure whole number
        const offerResponse = await OfferAPI.sendOffer(similarAuction._id, bidPayload);
        
        console.log("[MultipurposeDetails1] Similar auction bid response:", offerResponse);
        
        // Always show success message if we got here (no exception thrown)
        toast.success(t('auction.bidSuccess'));
        
        // Refresh the similar auctions data
        try {
          const refreshedData = await AuctionsAPI.getAuctions();
          setAllAuctions(refreshedData);
        } catch (refreshErr) {
          console.warn("Failed to refresh auction data after successful bid:", refreshErr);
        }
      } catch (submitError) {
        // If there was an error during submission, check if it has a status code
        // Status codes in the 2xx range indicate success despite the error
        const statusCode = submitError?.response?.status;
        const hasSuccessStatus = statusCode && statusCode >= 200 && statusCode < 300;
        
        console.log("[MultipurposeDetails1] Similar auction bid error:", submitError, "Status code:", statusCode);
        
        // If we have a success status code, treat it as success
        if (hasSuccessStatus) {
          toast.success(t('auction.bidSuccess'));
          
          // Try to refresh the auction data
          try {
            const refreshedData = await AuctionsAPI.getAuctions();
            setAllAuctions(refreshedData);
          } catch (refreshErr) {
            console.warn("Failed to refresh similar auctions data:", refreshErr);
          }
        } else {
          // Re-throw the error to be caught by the outer catch block
          throw submitError;
        }
      }

    } catch (err) {
      console.error("Error placing bid on similar auction:", err);
      
      // Check if the error response contains a success flag that's true
      // This handles cases where the offer was saved but error was thrown anyway
      if (err?.response?.data?.success === true) {
        console.log("[MultipurposeDetails1] Detected successful operation despite error:", err);
        toast.success("Votre enchère a été placée avec succès !");
        
        // Refresh the auction data
        try {
          const refreshedData = await AuctionsAPI.getAuctions();
          setAllAuctions(refreshedData);
        } catch (refreshErr) {
          console.warn("Failed to refresh similar auctions data:", refreshErr);
        }
        return;
      }
      
      // Check if we have data despite the error
      if (err?.response?.data) {
        console.log("[MultipurposeDetails1] Error response contains data:", err.response.data);
        
        // If the data contains a valid offer object, consider it a success
        if (err.response.data.price || err.response.data._id) {
          console.log("[MultipurposeDetails1] Found offer data in error response, treating as success");
          toast.success("Votre enchère a été placée avec succès !");
          
          // Refresh the auction data
          try {
            const refreshedData = await AuctionsAPI.getAuctions();
            setAllAuctions(refreshedData);
          } catch (refreshErr) {
            console.warn("Failed to refresh similar auctions data:", refreshErr);
          }
          return;
        }
      }
      
      let errorMessage = "Échec de l'enchère. Veuillez réessayer.";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    }
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!isLogged || !auth.tokens) {
      toast.error("Veuillez vous connecter pour soumettre un avis");
      router.push("/auth/login");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Veuillez entrer votre comment.");
      return;
    }

    if (reviewRating === 0) {
      toast.error("Veuillez donner une note.");
      return;
    }

    try {
      const reviewData = {
        rating: reviewRating,
        comment: reviewText,
        user: auth.user._id, // Assuming auth.user._id is available
        auction: auctionId, // Pass the auction ID
      };

      await ReviewAPI.submitReview(auctionId, reviewData);
      toast.success("Votre avis a été soumis avec succès !");
      setReviewText("");
      setReviewRating(0);
      // Optionally refresh auction data to show new review
      const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
      setAuctionData(refreshedData);
    } catch (err) {
      console.error("Error submitting review:", err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Échec de la soumission de l'avis. Veuillez réessayer.");
      }
    }
  };

  // Function to format price with currency symbol - using Math.floor to ensure whole numbers
  const formatPrice = (price) => {
    return `${Math.floor(Number(price)).toLocaleString()} `;
  };

  const formatRemainingTime = (endDate) => {
    if (!endDate) return "";
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return "Vente terminée";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    
    // Add day of week and time like in the image
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const dayName = dayNames[end.getDay()];
    const timeStr = end.getHours().toString().padStart(2, '0') + "H" + end.getMinutes().toString().padStart(2, '0');

    return `Temps restant ${days}j ${hours}h (${dayName}, ${timeStr})`;
  };

  // Handle auto-bid for professional users
  const handleAutoBidSave = async () => {
    if (!isLogged || !auth.tokens) {
      toast.error("Veuillez vous connecter pour sauvegarder l'auto-enchère");
      return;
    }

    if (!professionalAmount || parseFloat(professionalAmount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    const amount = parseFloat(professionalAmount);
    if (amount < safeStartingPrice) {
      toast.error(`Le montant doit être au moins ${formatPrice(safeStartingPrice)}`);
      return;
    }

    // Check if user has placed a manual bid first (only for new auto-bids)
    if (!hasExistingAutoBid) {
        let currentOffers = offers;
        try {
            // Fetch fresh offers directly from OfferAPI
            const freshOffersResponse = await OfferAPI.getOffersByBidId(auctionId);
            
            // Handle different response structures
            if (freshOffersResponse && Array.isArray(freshOffersResponse)) {
                currentOffers = freshOffersResponse;
            } else if (freshOffersResponse && freshOffersResponse.data && Array.isArray(freshOffersResponse.data)) {
                currentOffers = freshOffersResponse.data;
            } else if (freshOffersResponse && freshOffersResponse.success && Array.isArray(freshOffersResponse.data)) {
                 currentOffers = freshOffersResponse.data;
            }
        } catch (err) {
            console.error("Failed to fetch fresh offers for check:", err);
        }

        console.log("Checking for manual bid. User ID:", auth.user._id);
        console.log("Current offers (fresh - processed):", currentOffers);
        
        const hasPlacedBid = currentOffers && currentOffers.some(offer => {
            if (!offer.user) return false;
            
            // Log for debugging
            // console.log("Checking offer:", offer._id, "User:", offer.user);
            
            const offerUserId = (offer.user._id || offer.user).toString();
            const currentUserId = auth.user._id.toString();
            return offerUserId === currentUserId;
        });

        if (!hasPlacedBid) {
            console.warn("User has not placed a manual bid yet.");
            console.warn("User ID:", auth.user._id);
            if (currentOffers && currentOffers.length > 0) {
                 console.warn("First offer user:", currentOffers[0].user);
            }
            toast.warn("Vous devez d'abord faire une offre manuelle pour pouvoir faire une enchère automatique");
            return;
        }
    }

    try {
      setSavingAutoBid(true);
      
      // Call the auto-bid API using AutoBidAPI
      try {
        console.log("Calling createOrUpdateAutoBid with:", {
          auctionId,
          price: amount,
          user: auth.user._id,
          bid: auctionId
        });
        
        const result = await AutoBidAPI.createOrUpdateAutoBid(auctionId, {
          price: amount,
          user: auth.user._id,
          bid: auctionId
        });
        
        console.log("Auto-bid creation result:", result);
        
        // Immediately update UI state without waiting for a refresh
        setHasExistingAutoBid(true);
        setProfessionalAmount(amount.toString());
        
        toast.success("Auto-enchère sauvegardée avec succès !");
        
        // Also refresh the auction data to get any updates in the background
        try {
          const refreshedData = await AuctionsAPI.getAuctionById(auctionId);
          setAuctionData(refreshedData);
          if (refreshedData?.offers) {
            setOffers(refreshedData.offers);
          }
        } catch (refreshErr) {
          console.warn("Could not refresh auction data:", refreshErr);
          // Don't show error to user as auto-bid was saved successfully
        }
      } catch (autoBidError) {
        console.error("Error in createOrUpdateAutoBid:", autoBidError);
        
        // Check if the error response contains a success flag that's true
        const errorResponse = autoBidError?.response?.data;
        if (errorResponse && (errorResponse.success === true || errorResponse.data)) {
          console.log("Auto-bid created successfully despite error:", errorResponse);
          
          // Immediately update UI state
          setHasExistingAutoBid(true);
          setProfessionalAmount(amount.toString());
          
          toast.success("Auto-enchère sauvegardée avec succès !");
        } else {
          // Show error message
          let errorMessage = "Échec de la sauvegarde. Veuillez réessayer.";
          if (autoBidError?.response?.data?.message) {
            errorMessage = autoBidError.response.data.message;
          } else if (autoBidError?.message) {
            errorMessage = autoBidError.message;
          }
          toast.error(errorMessage);
        }
      }
      
    } finally {
      setSavingAutoBid(false);
      setLoadingAutoBid(false); // Make sure to reset loading state
    }
  };

  // Handle auto-bid deletion for professional users
  const handleAutoBidDelete = async () => {
    if (!isLogged || !auth.tokens) {
      toast.error("Veuillez vous connecter pour supprimer l'auto-enchère");
      return;
    }

    if (!hasExistingAutoBid) {
      toast.error("Aucune auto-enchère à supprimer");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer votre auto-enchère pour cette vente aux enchères ?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAutoBid(true);
      
      // Call the delete API
      try {
        console.log("Calling deleteAutoBid with:", {
          auctionId,
          userId: auth.user._id
        });
        
        await AutoBidAPI.deleteAutoBid(auctionId, auth.user._id);
        console.log("Auto-bid deletion successful");
        
        // Immediately update UI state without waiting for a refresh
        setHasExistingAutoBid(false);
        setProfessionalAmount(safeStartingPrice.toString());
        
        toast.success("Auto-enchère supprimée avec succès !");
      } catch (deleteBidError) {
        console.error("Error in deleteAutoBid:", deleteBidError);
        
        // Check if the error response contains a success flag
        const errorResponse = deleteBidError?.response?.data;
        if (errorResponse && errorResponse.success === true) {
          console.log("Auto-bid deleted successfully despite error:", errorResponse);
          
          // Immediately update UI state
          setHasExistingAutoBid(false);
          setProfessionalAmount(safeStartingPrice.toString());
          
          toast.success("Auto-enchère supprimée avec succès !");
        } else {
          // Show error message
          let errorMessage = "Échec de la suppression. Veuillez réessayer.";
          if (deleteBidError?.response?.data?.message) {
            errorMessage = deleteBidError.response.data.message;
          } else if (deleteBidError?.message) {
            errorMessage = deleteBidError.message;
          }
          toast.error(errorMessage);
          return; // Exit early if there was an error
        }
      }
      
    } finally {
      setDeletingAutoBid(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {loading ? (
        <div className="redesign-v2-container text-center py-100">
           <div className="spinner-border text-primary" role="status">
             <span className="visually-hidden">Loading...</span>
           </div>
           <h3 className="mt-4">Chargement des détails de l'enchère...</h3>
        </div>
      ) : error ? (
        <div className="redesign-v2-container text-center py-100">
           <div className="alert alert-danger">
             <h3>{error}</h3>
             <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>Réessayer</button>
           </div>
        </div>
      ) : (
        <div className="redesign-v2-container">
          {/* Top Product Hero (Image 1 inspired) */}
          <div className="product-hero-section mt-3">
            <div className="thumbnails-vertical">
              {safeThumbs.length > 0 ? safeThumbs.map((thumb, index) => (
                <div 
                  key={`thumb-img-${index}`}
                  className={`thumb-item ${!showVideo && index === selectedImageIndex ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img src={normalizeImageUrl(thumb.url)} alt="" />
                </div>
              )) : (
                <div className="thumb-item active">
                  <img src={DEFAULT_AUCTION_IMAGE} alt="Default" />
                </div>
              )}
              {safeVideos.length > 0 && safeVideos.map((video, index) => (
                <div 
                  key={`thumb-vid-${index}`}
                  className={`thumb-item ${showVideo && index === selectedVideoIndex ? 'active' : ''}`}
                  onClick={() => handleVideoThumbnailClick(index)}
                >
                  <video src={normalizeImageUrl(video.url)} muted />
                </div>
              ))}
            </div>

            <div className="main-image-area">
              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 5 }}>
                <ShareButton
                  type="auction"
                  id={safeAuctionData._id || auctionId}
                  title={safeTitle}
                  description={safeDescription}
                  imageUrl={safeThumbs.length > 0 ? normalizeImageUrl(safeThumbs[0].url) : DEFAULT_AUCTION_IMAGE}
                />
              </div>
              {showVideo && safeVideos.length > 0 ? (
                <video 
                  src={normalizeImageUrl(safeVideos[selectedVideoIndex]?.url)} 
                  controls 
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              ) : (
                <img 
                  src={safeThumbs.length > 0 ? normalizeImageUrl(safeThumbs[selectedImageIndex]?.url) : DEFAULT_AUCTION_IMAGE} 
                  alt={safeTitle} 
                />
              )}
            </div>

            <div className="product-info-area">
              <h1 className="product-title">{safeTitle}</h1>
              <div className="countdown-info">{formatRemainingTime(safeAuctionData.endingAt)}</div>
              <div className="price-section mt-1 mb-3">
                <span 
                  className="current-price" 
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '24px',
                    lineHeight: '24px',
                    letterSpacing: '0.03em',
                    color: '#000000',
                    display: 'inline-block',
                    width: 'auto',
                    height: '24px'
                  }}
                >
                  {formatPrice(safeCurrentPrice || safeStartingPrice).replace('DA', '').trim()} DA
                </span>
                <span className="bid-count ms-2" style={{ fontSize: '16px', color: '#666' }}>({offers?.length || 0} bids)</span>
              </div>

              <div className="info-grid-mini mt-3">
                <div className="info-item-mini">
                  <span className="info-label-mini">VENDEUR:</span>
                  <Link href={`/profile/${safeOwner?._id}`} className="info-text-mini hover-link">
                    {safeOwner?.entreprise || safeOwner?.name || 'Vendeur'}
                  </Link>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">LOCALISATION:</span>
                  <span className="info-text-mini">{auctionData?.wilaya || 'Algérie'}</span>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">QUANTITÉ:</span>
                  <span className="info-text-mini">{auctionData?.quantity || '1'}</span>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">TYPE:</span>
                  <span className="info-text-mini">
                    {auctionData?.bidType === 'SERVICE' ? '🛠️ Service' : '📦 Produit'}
                  </span>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">MODE:</span>
                  <span className="info-text-mini">
                    {auctionData?.auctionType?.toLowerCase() === 'express' ? '⚡ Express' : '🤝 Classique'}
                  </span>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">STATUT:</span>
                  <span className="info-text-mini" style={{ color: auctionData?.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {auctionData?.status === 'ACTIVE' ? 'Actif' : (auctionData?.status || 'Terminé')}
                  </span>
                </div>
                <div className="info-item-mini" style={{ gridColumn: 'span 2' }}>
                  <span className="info-label-mini">CATÉGORIE:</span>
                  <span className="info-text-mini">{auctionData?.category?.name || auctionData?.categoryName || auctionData?.productSubCategory?.name || auctionData?.productCategory?.name || 'Non spécifiée'}</span>
                </div>
              </div>

              <div className="divider"></div>
              
              <div className="bid-input-section">
                {isOwner && (
                  <div className="alert alert-warning py-2 mb-3" style={{fontSize: '13px'}}>
                    Vous ne pouvez pas enchérir sur votre propre enchère.
                  </div>
                )}
                <div className="quantity-stepper">
                  <HandleQuantity
                    initialValue={safeCurrentPrice || safeStartingPrice || 0}
                    startingPrice={safeCurrentPrice || safeStartingPrice}
                  />
                </div>
                <button 
                  className="enchirir-btn" 
                  onClick={handleBidClick} 
                  disabled={isOwner}
                  style={{ opacity: isOwner ? 0.6 : 1 }}
                >
                  Placer une Enchère (Enchérir)
                </button>
              </div>
            </div>
          </div>


          {/* Product Description Section (Updated per User Request) */}
          <div className="product-description-container">
            <h2 className="description-title">Description du produit</h2>
            <div className="description-body">
              {safeDescription}
            </div>
            
            <div className="tabs-redesign mt-4">
              <div className="tab-headers">
                <button 
                  className={`tab-item ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Questions & Réponses
                </button>
              </div>
              
              <div className="tab-content-area">
                {activeTab === 'comments' && (
                  <div className="comments-section-v2">
                    {isLogged ? (
                      <div className="comment-form-v2">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Posez une question au vendeur..."
                          rows={3}
                        />
                        <button 
                          onClick={async (e) => {
                            e.preventDefault();
                            if (!newComment.trim()) return;
                            setSubmitting(true);
                            try {
                              await commentsApi.createCommentForBid(auctionId, newComment, auth.user._id);
                              setNewComment("");
                              const data = await AuctionsAPI.getAuctionById(auctionId);
                              setAuctionData(data);
                              toast.success("Question envoyée");
                            } catch (err) {
                              toast.error("Erreur lors de l'envoi de la question.");
                            }
                            setSubmitting(false);
                          }}
                          disabled={submitting}
                        >
                          {submitting ? '...' : 'Envoyer'}
                        </button>
                      </div>
                    ) : (
                      <div className="login-prompt">Veuillez vous connecter pour poser une question.</div>
                    )}
                    
                    <div className="comment-list-v2">
                      {auctionData?.comments?.map((comment) => (
                        <CommentItem 
                          key={comment._id} 
                          comment={comment} 
                          isLogged={isLogged} 
                          authUser={auth.user} 
                          announcementOwnerId={safeOwner?._id || safeOwner}
                          onReplySuccess={async () => {
                            const response = await AuctionsAPI.getAuctionById(auctionId);
                            let data = response?.data || (response?.success ? response.data : response);
                            if (data) setAuctionData(data);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                

              </div>
            </div>
          </div>

          {/* Professional User Access Box */}
          {auctionData?.isPro && (
            <div className="professional-access-box mt-5">
              <div className="pro-header">
                <div className="pro-badge-main">👑 PRO ACCESS</div>
                <h3>Options Professionnelles</h3>
              </div>
              <div className="pro-content">
                <div className="pro-feature">
                  <h4>Auto-Enchère (Auto-bid)</h4>
                  <p>Configurez un montant maximum pour que le système enchérisse automatiquement pour vous.</p>
                  
                  {loadingAutoBid ? (
                    <div className="pro-loading">Chargement...</div>
                  ) : (
                    <div className="autobid-controls">
                      {hasExistingAutoBid ? (
                        <div className="active-autobid-status">
                          <span className="current-max-badge">Maximum configuré: <strong>{Number(professionalAmount).toLocaleString()} DA</strong></span>
                          <button 
                            className="btn-delete-autobid"
                            onClick={handleAutoBidDelete}
                            disabled={deletingAutoBid}
                          >
                            Désactiver l'auto-enchère
                          </button>
                        </div>
                      ) : (
                        <div className="setup-autobid">
                          <input 
                            type="number" 
                            className="pro-input"
                            placeholder="Montant Max DA"
                            onChange={(e) => setProfessionalAmount(e.target.value)}
                            value={professionalAmount}
                          />
                          <button 
                            className="btn-save-autobid"
                            onClick={handleAutoBidSave}
                            disabled={savingAutoBid}
                          >
                            {savingAutoBid ? 'Enregistrement...' : 'Activer'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* Seller Section (Moved here) */}
          <div className="seller-section-card mt-5">
            <div className="seller-avatar">
              <img 
                src={safeOwner?.photoURL ? normalizeImageUrl(safeOwner.photoURL) : DEFAULT_PROFILE_IMAGE} 
                alt="Seller" 
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PROFILE_IMAGE; }}
              />
            </div>
            <div className="seller-info-content">
              <div className="seller-header">
                <span className="seller-name">
                  {safeOwner?.entreprise || (safeOwner?.firstName && safeOwner?.lastName ? `${safeOwner.firstName} ${safeOwner.lastName}` : safeOwner?.name || safeOwner?.username || t('common.seller'))}
                </span>
                <div className="seller-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < 4 ? 'filled' : ''}`}>★</span>
                  ))}
                  <span className="seller-review-count">(150 avis)</span>
                </div>
              </div>
              <div className="seller-bio">
                {safeOwner?.description || "Description de l'entreprise ou du vendeur non disponible."}
              </div>
            </div>
            <div className="seller-actions">
              <Link href={getSellerUrl(safeOwner._id || safeOwner)} className="seller-btn btn-all-products">Tout les produits</Link>
              <button 
                className="seller-btn btn-contact"
                onClick={() => {
                   setActiveTab('reviews');
                   window.scrollBy({ top: 500, behavior: 'smooth' });
                }}
              >
                Contacter / Question
              </button>
            </div>
          </div>

          {/* Similar Auctions (Carousel) */}

          <div className="similar-auctions-redesign mt-5">
            <div className="section-header-redesign d-flex justify-content-between align-items-center mb-4">
              <h2 className="redesign-title">Enchères similaires</h2>
              <Link href="/auction-sidebar" className="btn-view-all">Tout voir →</Link>
            </div>
            
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1200: { slidesPerView: 4 }
              }}
              className="similar-swiper-custom"
            >
              {allAuctions?.filter(a => a._id !== auctionId).slice(0, 8).map((auction) => (
                <SwiperSlide key={auction._id}>
                  <SimilarAuctionCard 
                    auction={auction} 
                    app={app} 
                    formatPrice={formatPrice} 
                    defaultImage={DEFAULT_AUCTION_IMAGE}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>



        {/* Improved Bid Confirmation Modal */}
        {showBidConfirmation && (
          <div className="modal-overlay-custom">
            <div className="modal-card-custom animate-zoom">
              <button className="modal-close-btn" onClick={handleCancelBidSubmit}>×</button>
              <div className="modal-body-custom">
                <div className="success-icon-wrapper">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3>Confirmation d'enchère</h3>
                <p>Souhaitez-vous confirmer cette offre ?</p>
                <div className="bid-summary-card">
                  <span className="summary-label">Montant de votre offre</span>
                  <span className="summary-value">
                    {(() => {
                      const input = document.querySelector('.quantity__input');
                      return input ? Number(input.value).toLocaleString() : '0';
                    })()} DA
                  </span>
                </div>
                <div className="modal-actions-custom">
                  <button className="btn-modal-cancel" onClick={handleCancelBidSubmit}>Annuler</button>
                  <button className="btn-modal-confirm" onClick={handleConfirmedBidSubmit}>Confirmer</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    </>
  );
};

/* Internal Helper Component for Similar Auctions */
const SimilarAuctionCard = ({ auction, app, formatPrice, defaultImage }) => {
  const timer = useCountdownTimer(auction.endTime);
  const isEnded = timer.isExpired || timer.total <= 0;
  
  return (
    <div className={`similar-card-redesign ${isEnded ? 'ended' : ''}`} onClick={() => !isEnded && window.location.assign(`/auction-details/${auction._id}`)}>
      <div className="card-image-wrapper">
        <img 
          src={auction?.thumbs?.[0]?.url ? normalizeImageUrl(auction.thumbs[0].url) : defaultImage} 
          alt={auction.title} 
        />
        {!isEnded && (
          <div className="urgent-badge-mini">
            {timer.days > 0 ? `${timer.days}j` : `${timer.hours}h:${timer.minutes}m`}
          </div>
        )}
      </div>
      <div className="card-info-mini">
        <h4>{auction.title}</h4>
        <div className="price-tag-mini">{formatPrice(auction.currentPrice || auction.startingPrice)} DA</div>
      </div>
    </div>
  );
};

export default MultipurposeDetails1;


