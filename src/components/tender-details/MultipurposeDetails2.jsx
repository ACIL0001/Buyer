"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "@/components/auction-details/st.css";
import "@/components/auction-details/modern-details.css";
import "@/components/auction-details/multipurpose-redesign.css";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { normalizeImageUrl } from '@/utils/url';
import { useCountdownTimer } from "@/customHooks/useCountdownTimer";
import HandleQuantity from "../common/HandleQuantity";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TendersAPI } from "@/app/api/tenders";
import { OfferAPI } from "@/app/api/offer";
import { AutoBidAPI } from "@/app/api/auto-bid";
import useAuth from "@/hooks/useAuth";
import app, { getSellerUrl } from "@/config";
import { calculateTimeRemaining } from "@/components/live-tenders/Home1LiveTenders";
import commentsApi from "@/app/api/comments";
import { useTranslation } from 'react-i18next';
import ShareButton from "@/components/common/ShareButton";
import CommentItem from "@/components/common/CommentItem";
import { formatUserName } from "@/utils/user";

const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-dark.png";
const DEFAULT_TENDER_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_USER_AVATAR = "/assets/images/avatar.jpg";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

// Helper function to calculate time remaining and format with leading zeros
function getTimeRemaining(endDate) {
  if (!endDate) {
    return { total: 0, days: "00", hours: "00", minutes: "00", seconds: "00" };
  }
  const total = Date.parse(endDate) - Date.now();
  const seconds = Math.max(Math.floor((total / 1000) % 60), 0);
  const minutes = Math.max(Math.floor((total / 1000 / 60) % 60), 0);
  const hours = Math.max(Math.floor((total / (1000 * 60 * 60)) % 24), 0);
  const days = Math.max(Math.floor(total / (1000 * 60 * 60 * 24)), 0);
  const formatNumber = (num) => String(num).padStart(2, "0");
  return { total, days: formatNumber(days), hours: formatNumber(hours), minutes: formatNumber(minutes), seconds: formatNumber(seconds) };
}

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
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const dayName = dayNames[end.getDay()];
  const timeStr = end.getHours().toString().padStart(2, '0') + "H" + end.getMinutes().toString().padStart(2, '0');
  return `Temps restant ${days}j ${hours}h (${dayName}, ${timeStr})`;
};

const MultipurposeDetails2 = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [tenderData, setTenderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const { isLogged, auth } = useAuth();
  const [allTenders, setAllTenders] = useState([]);
  const [activeTab, setActiveTab] = useState("comments");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offers, setOffers] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [professionalAmount, setProfessionalAmount] = useState("");
  const [savingAutoBid, setSavingAutoBid] = useState(false);
  const [loadingAutoBid, setLoadingAutoBid] = useState(false);
  const [hasExistingAutoBid, setHasExistingAutoBid] = useState(false);
  const [deletingAutoBid, setDeletingAutoBid] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  const [showBidConfirmation, setShowBidConfirmation] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [proposalFile, setProposalFile] = useState(null);
  const proposalTextareaRef = useRef(null);
  const proposalFileInputRef = useRef(null);

  const tenderId = params?.id || searchParams.get("id");

  useEffect(() => {
    const fetchTenderDetails = async () => {
      try {
        if (!tenderId) {
          setError("ID d'appel d'offres introuvable.");
          setLoading(false);
          return;
        }
        setLoading(true);
        const response = await TendersAPI.getTenderById(tenderId);
        let data = response?.data || (response?.success ? response.data : response);
        if (!data) throw new Error("Aucune donnée reçue");
        setTenderData(data);
        if (data?.offers) setOffers(data.offers);
        
        const commentId = searchParams.get('commentId');
        if (commentId) {
             setActiveTab('comments');
             setTimeout(() => {
                 const element = document.getElementById(`comment-${commentId}`);
                 if (element) {
                     element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     element.classList.add('highlight-comment');
                 }
             }, 800);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tender details:", err);
        setError("Erreur lors du chargement des détails.");
        setLoading(false);
      }
    };
    fetchTenderDetails();
  }, [tenderId, refreshKey]);

  useEffect(() => {
    const fetchAutoBidData = async () => {
      if (!isLogged || auth.user?.type !== 'PROFESSIONAL' || !tenderId || !tenderData) return;
      try {
        setLoadingAutoBid(true);
        const response = await AutoBidAPI.getAutoBidByAuctionAndUser(tenderId);
        if (response.success && response.data) {
          setProfessionalAmount(response.data.price.toString());
          setHasExistingAutoBid(true);
        } else {
          setProfessionalAmount((tenderData?.maxBudget || 0).toString());
          setHasExistingAutoBid(false);
        }
      } catch (_) {
        setProfessionalAmount((tenderData?.maxBudget || 0).toString());
        setHasExistingAutoBid(false);
      } finally {
        setLoadingAutoBid(false);
      }
    };
    fetchAutoBidData();
  }, [isLogged, tenderId, tenderData]);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!tenderId) return;
      try {
        const bidsResponse = await TendersAPI.getTenderBids(tenderId);
        if (bidsResponse.success && bidsResponse.data) setOffers(bidsResponse.data);
      } catch (_) {}
    };
    fetchOffers();
  }, [tenderId, refreshKey]);

  useEffect(() => {
    const fetchMyBids = async () => {
      if (!isLogged || !auth.user?._id || !tenderId) return;
      try {
        const myBidsResponse = await TendersAPI.getMyTenderBids(auth.user._id);
        if (myBidsResponse.success && myBidsResponse.data) {
          const myTenderBids = myBidsResponse.data.filter(bid => (bid.tenderId === tenderId || bid.tender === tenderId));
          setMyOffers(myTenderBids);
        }
      } catch (_) {}
    };
    fetchMyBids();
  }, [isLogged, tenderId]);

  const currentLowestBidPrice = useMemo(() => {
    if (!offers || offers.length === 0) return tenderData?.maxBudget || 0;
    const bidAmounts = offers.map(bid => bid.bidAmount || bid.price).filter(a => a > 0);
    return bidAmounts.length > 0 ? Math.min(...bidAmounts) : (tenderData?.maxBudget || 0);
  }, [offers, tenderData]);

  useEffect(() => {
    if (!isLogged || !auth?.user?._id || !Array.isArray(myOffers)) return;
    const hasAccepted = myOffers.some(bid => (bid.status === 'accepted' || bid.status === 'ACCEPTED'));
    if (hasAccepted && !showAcceptedModal) {
      setShowAcceptedModal(true);
      setTimeout(() => router.push('/messages'), 1500);
    }
  }, [isLogged, myOffers, showAcceptedModal]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const response = await TendersAPI.getActiveTenders();
        setAllTenders(response?.data || response || []);
      } catch (_) {}
    };
    fetchAll();
  }, []);

  // Timer state for similar tender cards
  const [similarTimers, setSimilarTimers] = useState({});
  const [flippedSimilarId, setFlippedSimilarId] = useState(null);
  const [similarCardImageIndexes, setSimilarCardImageIndexes] = useState({});

  // Compute similar tenders by same category (strict)
  const similarTenders = useMemo(() => {
    if (!tenderData || !allTenders.length) return [];
    const catId = tenderData?.category?._id || tenderData?.productCategory?._id || tenderData?.productSubCategory?._id;
    const catName = tenderData?.categoryName;
    return allTenders
      .filter(t => (t._id || t.id) !== tenderId)
      .filter(t => {
        const tCatId = t.category?._id || t.productCategory?._id || t.productSubCategory?._id;
        const tCatName = t.categoryName;
        return (catId && tCatId && tCatId === catId) || (catName && tCatName && tCatName === catName);
      })
      .slice(0, 8);
  }, [tenderData, allTenders, tenderId]);

  // Drive countdown timers for similar cards
  useEffect(() => {
    if (!similarTenders.length) return;
    const update = () => {
      const map = {};
      similarTenders.forEach(t => {
        const id = t._id || t.id;
        if (id && t.endingAt) map[id] = calculateTimeRemaining(t.endingAt);
      });
      setSimilarTimers(map);
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [similarTenders]);

  const safeTenderData = tenderData || {};
  const safeAttachments = safeTenderData.attachments || safeTenderData.images || [];
  const safeVideos = safeTenderData.videos || [];
  const safeTitle = safeTenderData.title || "Appel d'offres";
  const safeMaxBudget = safeTenderData.maxBudget || 0;
  const safeOwner = safeTenderData.owner || null;
  const safeEndingAt = safeTenderData.endingAt || null;
  const safeDescription = safeTenderData.description || "Aucune description.";
  const safeTenderType = safeTenderData.tenderType || "SERVICE";
  const safeStatus = safeTenderData.status || "OPEN";
  const safeLocation = safeTenderData.location || "";
  const safeWilaya = safeTenderData.wilaya || "";
  const safeQuantity = safeTenderData.quantity || "";
  const safeRequirements = safeTenderData.requirements || [];
  const isOwner = isLogged && safeOwner && auth.user._id === (safeOwner._id || safeOwner);

  const handleThumbnailClick = (index) => { setSelectedImageIndex(index); setShowVideo(false); };
  const handleVideoThumbnailClick = (index) => { setSelectedVideoIndex(index); setShowVideo(true); };
  const handleBidClick = (e) => { 
    e.preventDefault(); 
    if (isOwner) {
      toast.warning("Vous ne pouvez pas soumettre d'offre sur votre propre appel d'offres.");
      return;
    }
    if (!isLogged) { 
      toast.error("Veuillez vous connecter pour soumettre une offre"); 
      router.push('/auth/login'); 
      return; 
    }
    setShowBidConfirmation(true); 
  };
  const handleCancelBidSubmit = () => setShowBidConfirmation(false);
  const handleConfirmedBidSubmit = async () => { setShowBidConfirmation(false); await submitBid(); };

  const submitBid = async () => {
    try {
      // Authentication checked in handleBidClick
      const isMieuxDisant = tenderData?.evaluationType === 'MIEUX_DISANT';
      const bidInput = document.querySelector(".quantity__input_v2");
      const bidAmountRaw = bidInput?.value || "0";
      const cleanBidAmount = parseFloat(bidAmountRaw.replace(/[^0-9.]/g, '')) || 0;

      if (!isMieuxDisant) {
        if (offers.length > 0 && cleanBidAmount >= currentLowestBidPrice) {
          toast.error(`Votre offre doit être strictement inférieure à la meilleure offre actuelle (${currentLowestBidPrice.toLocaleString()} DA)`);
          return;
        }
        if (offers.length === 0 && cleanBidAmount > currentLowestBidPrice) {
          toast.error(`Votre offre ne peut pas dépasser le budget maximum (${currentLowestBidPrice.toLocaleString()} DA)`);
          return;
        }
      }

      let payload;
      if (proposalFile) {
        const fd = new FormData();
        fd.append('bidAmount', String(isMieuxDisant ? 0 : cleanBidAmount));
        if (proposalTextareaRef.current?.value) fd.append('proposal', proposalTextareaRef.current.value);
        fd.append('proposalFile', proposalFile);
        payload = fd;
      } else {
        payload = { bidAmount: isMieuxDisant ? 0 : cleanBidAmount, proposal: proposalTextareaRef.current?.value };
      }

      await TendersAPI.submitTenderBid(tenderId, payload);
      toast.success("Offre soumise !");
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la soumission");
    }
  };

  const handleAutoBidSave = async () => {
    const amount = Number(professionalAmount);
    if (!amount || amount <= 0) { toast.error("Montant invalide"); return; }
    try {
      setSavingAutoBid(true);
      await AutoBidAPI.createOrUpdateAutoBid({ auctionId: tenderId, price: amount, userId: auth.user._id });
      setHasExistingAutoBid(true);
      toast.success("Auto-enchère activée");
    } catch (err) { toast.error("Erreur"); }
    finally { setSavingAutoBid(false); }
  };

  const handleAutoBidDelete = async () => {
    try {
      setDeletingAutoBid(true);
      await AutoBidAPI.deleteAutoBid(tenderId, auth.user._id);
      setHasExistingAutoBid(false);
      setProfessionalAmount((tenderData?.maxBudget || 0).toString());
      toast.success("Auto-enchère supprimée");
    } catch (err) { toast.error("Erreur"); }
    finally { setDeletingAutoBid(false); }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      {loading ? (
        <div className="redesign-v2-container text-center py-5">
           <div className="spinner-border text-primary"></div>
           <h3 className="mt-4">Chargement...</h3>
        </div>
      ) : error ? (
        <div className="redesign-v2-container text-center py-5">
           <div className="alert alert-danger">
             <h3>{error}</h3>
             <button className="btn btn-primary" onClick={() => window.location.reload()}>Réessayer</button>
           </div>
        </div>
      ) : (
        <div className="redesign-v2-container">
          {showCongrats && (
            <div className="winner-banner-custom animate-slide-down">
              <div className="banner-content">
                <span className="banner-icon">🎉</span>
                <div className="banner-text">
                  <strong>Félicitations ! Vous avez remporté cet appel d'offres</strong>
                  <p>Un chat avec l'acheteur est prêt.</p>
                </div>
              </div>
              <div className="banner-actions">
                <button onClick={() => router.push('/messages')} className="btn-banner-action">Ouvrir le chat</button>
                <button onClick={() => setShowCongrats(false)} className="btn-banner-close">✕</button>
              </div>
            </div>
          )}

          {showAcceptedModal && (
            <div className="modal-overlay-custom">
               <div className="modal-card-custom animate-zoom">
                  <div className="success-header">
                     <span className="header-icon">🎉</span>
                     <h3>Offre acceptée !</h3>
                  </div>
                  <div className="modal-body-content">
                    <p>Votre offre a été acceptée par l'acheteur.</p>
                    <button onClick={() => setShowAcceptedModal(false)} className="btn-modal-primary mt-4">Compris</button>
                  </div>
               </div>
            </div>
          )}

          <div className="product-hero-section mt-3">
            <div className="thumbnails-vertical">
              {safeAttachments.length > 0 ? safeAttachments.map((thumb, index) => (
                <div key={`thumb-img-${index}`} className={`thumb-item ${!showVideo && index === selectedImageIndex ? 'active' : ''}`} onClick={() => handleThumbnailClick(index)}>
                  <img src={thumb.url.startsWith('http') ? thumb.url : `${app.baseURL}${thumb.url.startsWith('/') ? thumb.url.substring(1) : thumb.url}`} alt="" />
                </div>
              )) : (
                <div className="thumb-item active"><img src={DEFAULT_TENDER_IMAGE} alt="Default" /></div>
              )}
              {safeVideos.length > 0 && safeVideos.map((video, index) => (
                <div key={`thumb-vid-${index}`} className={`thumb-item ${showVideo && index === selectedVideoIndex ? 'active' : ''}`} onClick={() => handleVideoThumbnailClick(index)}>
                  <video src={video.url.startsWith('http') ? video.url : `${app.baseURL}${video.url.startsWith('/') ? video.url.substring(1) : video.url}`} muted />
                </div>
              ))}
            </div>

            <div className="main-image-area">
              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 5 }}>
                <ShareButton type="tender" id={tenderId} title={safeTitle} description={safeDescription} imageUrl={safeAttachments[0]?.url || DEFAULT_TENDER_IMAGE} />
              </div>
              {showVideo && safeVideos.length > 0 ? (
                <video src={safeVideos[selectedVideoIndex]?.url.startsWith('http') ? safeVideos[selectedVideoIndex]?.url : `${app.baseURL}${safeVideos[selectedVideoIndex]?.url.startsWith('/') ? safeVideos[selectedVideoIndex].url.substring(1) : safeVideos[selectedVideoIndex].url}`} controls style={{ maxHeight: '100%', maxWidth: '100%' }} />
              ) : (
                <img src={safeAttachments.length > 0 ? (safeAttachments[selectedImageIndex]?.url.startsWith('http') ? safeAttachments[selectedImageIndex]?.url : `${app.baseURL}${safeAttachments[selectedImageIndex]?.url.startsWith('/') ? safeAttachments[selectedImageIndex].url.substring(1) : safeAttachments[selectedImageIndex].url}`) : DEFAULT_TENDER_IMAGE} alt={safeTitle} />
              )}
            </div>

            <div className="product-info-area">
              {/* Wrapper for Title, Countdown, Price, and Details Table to keep them close together per User request */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <h1 className="direct-sale-title" style={{ marginBottom: '4px' }}>{safeTitle}</h1>
                <div className="countdown-info" style={{ marginBottom: '8px' }}>{formatRemainingTime(safeEndingAt)}</div>
              
                {tenderData?.evaluationType !== 'MIEUX_DISANT' && safeMaxBudget > 0 && (
                  <div className="price-section mt-1" style={{ marginBottom: '8px' }}>
                    <span className="direct-sale-price">
                      {Math.floor(safeMaxBudget).toLocaleString('fr-FR')},00 DA
                    </span>
                  </div>
                )}

                {/* Custom Details Table section per User request */}
                <div 
                  className="custom-details-table" 
                  style={{ 
                    gap: tenderData?.evaluationType === 'MIEUX_DISANT' ? '10px' : '18px', 
                    paddingBottom: tenderData?.evaluationType === 'MIEUX_DISANT' ? '8px' : '18px',
                    marginTop: '10px'
                  }}
                >
                  <div className="custom-detail-row" style={{ padding: tenderData?.evaluationType === 'MIEUX_DISANT' ? '7px 0px' : '11px 0px' }}>
                    <span className="custom-detail-label">Annonceur</span>
                    <span className="custom-detail-value">
                      <Link href={`/dashboard/profile/${safeOwner?._id || safeOwner}`} className="custom-detail-link">
                        {formatUserName(safeOwner) || 'Vendeur'}
                      </Link>
                    </span>
                  </div>
                  <div className="custom-detail-separator"></div>

                  <div className="custom-detail-row" style={{ padding: tenderData?.evaluationType === 'MIEUX_DISANT' ? '7px 0px' : '11px 0px' }}>
                    <span className="custom-detail-label">Localisation</span>
                    <span className="custom-detail-value">
                      {safeWilaya || 'Algérie'}{safeLocation ? `, ${safeLocation}` : ''}
                    </span>
                  </div>
                  <div className="custom-detail-separator"></div>

                  <div className="custom-detail-row" style={{ padding: tenderData?.evaluationType === 'MIEUX_DISANT' ? '7px 0px' : '11px 0px' }}>
                    <span className="custom-detail-label">Statut</span>
                    <span className="custom-detail-value" style={{ color: safeStatus === 'OPEN' ? '#10B981' : '#ef4444' }}>
                      {safeStatus === 'OPEN' ? (Number(safeQuantity) > 1 ? 'disponibles' : 'disponible') : (safeStatus === 'CLOSED' || safeStatus === 'closed' ? 'Clôturée' : safeStatus)}
                    </span>
                  </div>
                  <div className="custom-detail-separator"></div>

                  <div className="custom-detail-row" style={{ padding: tenderData?.evaluationType === 'MIEUX_DISANT' ? '7px 0px' : '11px 0px' }}>
                    <span className="custom-detail-label">Type</span>
                    <span className="custom-detail-value">
                      {safeTenderType === 'SERVICE' ? 'Service' : 'Produit'}
                    </span>
                  </div>
                  <div className="custom-detail-separator"></div>

                  <div className="custom-detail-row" style={{ padding: tenderData?.evaluationType === 'MIEUX_DISANT' ? '7px 0px' : '11px 0px' }}>
                    <span className="custom-detail-label">Catégorie</span>
                    <span className="custom-detail-value">
                      {tenderData?.category?.name || tenderData?.categoryName || tenderData?.productSubCategory?.name || tenderData?.productCategory?.name || 'Non spécifiée'}
                    </span>
                  </div>
                  <div className="custom-detail-separator"></div>
                </div>
              </div>

            {/* Wrapper to bind action card and submit button together with minimal space per User request */}
            <div className="action-card-and-btn-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {/* Custom Action Area for Bidding / Bid submission */}
              <div className="custom-action-card" style={{ marginTop: 0, marginBottom: 0, background: 'transparent', padding: 0 }}>
                
                {tenderData?.evaluationType === 'MIEUX_DISANT' ? (
                  <div className="mieux-disant-input-area w-100">
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#757575', marginBottom: '4px', display: 'block' }}>
                      Votre proposition :
                    </label>
                    <textarea 
                      className="proposal-textarea" 
                      ref={proposalTextareaRef} 
                      placeholder="Décrivez votre offre, votre expertise et vos délais de réalisation..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        fontSize: '13px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    ></textarea>
                    
                    <div className="file-upload-modern mt-2" style={{ position: 'relative' }}>
                      <label style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '10px', 
                        border: '1px dashed #002896', 
                        borderRadius: '8px', 
                        background: proposalFile ? 'rgba(0, 40, 150, 0.05)' : 'white', 
                        cursor: 'pointer', 
                        transition: 'all 0.3s ease' 
                      }}>
                        <input 
                          type="file" 
                          ref={proposalFileInputRef} 
                          onChange={(e) => setProposalFile(e.target.files[0])} 
                          accept=".pdf,.doc,.docx" 
                          style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                        />
                        <i className={`bi ${proposalFile ? 'bi-file-earmark-pdf' : 'bi-cloud-arrow-up'}`} style={{ fontSize: '16px', color: '#002896', marginBottom: '3px' }}></i>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#002896', textAlign: 'center' }}>
                          {proposalFile ? proposalFile.name : "Joindre votre dossier technique (PDF, DOCX)"}
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="moins-disant-input-area w-100">
                    <div className="custom-action-card-row w-100" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 0 }}>
                      <span className="custom-action-card-label" style={{ margin: 0 }}>Offre financière</span>
                      <div className="custom-action-card-stepper">
                        <HandleQuantity initialValue={currentLowestBidPrice} startingPrice={currentLowestBidPrice} maxValue={currentLowestBidPrice} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {safeStatus === 'OPEN' && (
                <div className="custom-action-btn-container" style={{ marginTop: 0 }}>
                  <button 
                    className="custom-action-buy-btn" 
                    onClick={handleBidClick} 
                  >
                    {tenderData?.evaluationType === 'MIEUX_DISANT' ? 'Soumettre ma proposition' : 'Envoyer mon offre'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="product-description-container mt-5">
            <h2 className="description-title">Fiche descriptive</h2>
            <div className="description-body">
              <div style={{ whiteSpace: 'pre-wrap' }}>{safeDescription}</div>
              {safeRequirements.length > 0 && (
                <div className="requirements-section mt-4">
                  <h3>Exigences</h3>
                  <ul className="requirements-list">{safeRequirements.map((req, i) => <li key={i}>{req}</li>)}</ul>
                </div>
              )}
            </div>
        </div>
        
        <div className="qa-section-container">
          <div className="qa-header-row">
            <h2 className="qa-title">Questions et réponses</h2>
          </div>
          
          <div className="qa-content-area">
            <p className="qa-subtitle">Une question sur ce produit ? Le vendeur vous répondra dans les plus brefs délais.</p>
            
            {isLogged ? (
              <div className="qa-textarea-wrapper">
                <textarea
                  className="qa-textarea"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Posez votre question ici..."
                />
                <button 
                  className="qa-submit-btn"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!newComment.trim()) return;
                    setSubmitting(true);
                    try {
                      await commentsApi.createCommentForTender(tenderId, newComment, auth?.user?._id || '');
                      setNewComment("");
                      const data = await TendersAPI.getTenderById(tenderId);
                      setTenderData(data);
                      toast.success("Question envoyée");
                    } catch (err) {
                      toast.error("Erreur lors de l'envoi de la question.");
                    }
                    setSubmitting(false);
                  }}
                  disabled={submitting}
                >
                  <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.83 6.67L0.830002 0.420044C0.710363 0.369796 0.575001 0.379308 0.463595 0.445831C0.352189 0.512353 0.281729 0.625934 0.28 0.750044V5.25004C0.28 5.61793 0.54711 5.92982 0.908002 5.98904L9.00002 6.99904L0.908002 8.00904C0.54711 8.06827 0.28 8.38016 0.28 8.74804V13.248C0.281729 13.3722 0.352189 13.4857 0.463595 13.5523C0.575001 13.6188 0.710363 13.6283 0.830002 13.578L15.83 7.32804C15.9348 7.28383 16.0024 7.18128 16.0024 7.06804C16.0024 6.9548 15.9348 6.85226 15.83 6.80804V6.67Z" fill="#003399" />
                  </svg>
                  <span>{submitting ? '...' : 'Envoyer'}</span>
                </button>
              </div>
            ) : (
              <div className="login-prompt">Veuillez vous connecter pour poser une question.</div>
            )}
            
            <div className="comment-list-v2 w-100 mt-3">
              {tenderData?.comments?.map((comment) => (
                <CommentItem 
                  key={comment._id} 
                  comment={comment} 
                  isLogged={isLogged} 
                  authUser={auth.user} 
                  announcementOwnerId={safeOwner?._id || safeOwner}
                  onReplySuccess={async () => {
                    const data = await TendersAPI.getTenderById(tenderId);
                    setTenderData(data);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

          {tenderData?.isPro && (
            <div className="professional-access-box mt-5">
              <div className="pro-header"><h3>Options PRO</h3></div>
              <div className="pro-content">
                <h4>Auto-Offre</h4>
                <div className="pro-actions mt-3">
                  <input type="number" className="pro-input-custom" value={professionalAmount} onChange={(e) => setProfessionalAmount(e.target.value)} />
                  <button className="btn-pro-save" onClick={handleAutoBidSave} disabled={savingAutoBid}>Sauvegarder</button>
                  {hasExistingAutoBid && <button className="btn-pro-delete" onClick={handleAutoBidDelete} disabled={deletingAutoBid}>Supprimer</button>}
                </div>
              </div>
            </div>
          )}

          <div className="seller-section-card mt-5">
            <div className="seller-avatar"><img src={safeOwner?.photoURL || DEFAULT_PROFILE_IMAGE} alt="Seller" /></div>
            <div className="seller-info-content">
              <div className="seller-header">
                <Link href={`/dashboard/profile/${safeOwner?._id || safeOwner}`} className="seller-name hover-link">
                  {formatUserName(safeOwner) || "Vendeur"}
                </Link>
              </div>
              <div className="seller-bio">{safeOwner?.description || "Pas de bio."}</div>
            </div>
            <div className="seller-actions">
              <Link href={getSellerUrl(safeOwner?._id || safeOwner)} className="seller-btn btn-all-products">Boutique</Link>
              <button className="seller-btn btn-contact" onClick={() => { setActiveTab('comments'); window.scrollBy({ top: 500, behavior: 'smooth' }); }}>Contacter le vendeur</button>
            </div>
          </div>

          <div className="similar-auctions-redesign mt-5">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="redesign-title">Offres similaires</h2>
            </div>
            {similarTenders.length > 0 ? (
              <div style={{ position: 'relative', overflow: 'visible' }}>
                <Swiper
                  modules={[Navigation, Autoplay]}
                  spaceBetween={20}
                  slidesPerView="auto"
                  style={{ padding: '30px 10px', margin: '-30px -10px', overflow: 'visible' }}
                >
                  {similarTenders.map(t => {
                    const tid = t._id || t.id;
                    const timer = similarTimers[tid] || { days: '0', hours: '0', minutes: '0', formattedEnd: '', hasEnded: false };
                    const images = t.attachments || t.images || [];
                    const getImg = (idx = 0) => {
                      const raw = images[idx];
                      if (!raw) return DEFAULT_TENDER_IMAGE;
                      const url = typeof raw === 'string' ? raw : (raw.url || raw.fullUrl || raw);
                      return normalizeImageUrl ? normalizeImageUrl(url) : (url.startsWith('http') ? url : `${app.baseURL}${url.startsWith('/') ? url.substring(1) : url}`);
                    };
                    const seller = t.hidden ? 'Anonyme' : (formatUserName(t.owner) || 'Annonceur');
                    const budget = t.budget || t.maxBudget || t.price;
                    const curImgIdx = similarCardImageIndexes[tid] || 0;
                    return (
                      <SwiperSlide key={tid} style={{ overflow: 'visible', perspective: '1000px' }}>
                        <motion.div
                          key={tid}
                          initial={false}
                          animate={{ rotateY: flippedSimilarId === tid ? 180 : 0 }}
                          transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                          style={{ width: '320px', aspectRatio: '284 / 464', margin: '0', position: 'relative', zIndex: 1, transformStyle: 'preserve-3d' }}
                        >
                          {/* FRONT */}
                          <div
                            style={{ width: '100%', height: '100%', position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'transparent', cursor: 'pointer', boxShadow: 'none', border: 'none' }}
                            onClick={() => router.push(`/tender-details/${tid}`)}
                          >
                            <div style={{ width: '100%', aspectRatio: '284 / 280', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                                <ShareButton type="tender" id={tid} title={t.title} description={t.description} imageUrl={getImg(curImgIdx)} />
                              </div>
                              <img src={getImg(curImgIdx)} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'fill' }} onError={e => e.currentTarget.src = DEFAULT_TENDER_IMAGE} />
                              {images.length > 1 && (
                                <>
                                  <div className="image-nav-arrow" style={{ position: 'absolute', top: '45%', left: '8px', transform: 'translateY(-50%)', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 25, border: 'none', transition: 'all 0.2s ease' }} onClick={e => { e.stopPropagation(); setSimilarCardImageIndexes(prev => ({ ...prev, [tid]: (curImgIdx - 1 + images.length) % images.length })); }}>
                                    <i className="bi bi-chevron-left" style={{ color: '#002896', fontSize: '12px' }}></i>
                                  </div>
                                  <div className="image-nav-arrow" style={{ position: 'absolute', top: '45%', right: '8px', transform: 'translateY(-50%)', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 25, border: 'none', transition: 'all 0.2s ease' }} onClick={e => { e.stopPropagation(); setSimilarCardImageIndexes(prev => ({ ...prev, [tid]: (curImgIdx + 1) % images.length })); }}>
                                    <i className="bi bi-chevron-right" style={{ color: '#002896', fontSize: '12px' }}></i>
                                  </div>
                                  <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 25 }}>
                                    {images.map((_, i) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: curImgIdx === i ? '#002896' : 'rgba(255,255,255,0.6)', transition: 'all 0.3s ease' }} />)}
                                  </div>
                                </>
                              )}
                              <div
                                style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 30, backgroundColor: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.3s ease', border: 'none' }}
                                onClick={e => { e.stopPropagation(); setFlippedSimilarId(flippedSimilarId === tid ? null : tid); }}
                                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                <span style={{ fontSize: '11px', fontWeight: '600', color: '#002896', fontFamily: 'Inter, sans-serif' }}>Plus de détails</span>
                                <i className="bi bi-info-circle" style={{ color: '#002896', fontSize: '12px' }}></i>
                              </div>
                            </div>
                            <div style={{ padding: '10px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                              <div>
                                <h4 style={{ width: '100%', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 'clamp(1rem, 1.6vw, 1.25rem)', lineHeight: 1.15, letterSpacing: '0px', color: '#002896', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 1 }}>{t.title || "Appel d'offres"}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: budget && t.evaluationType !== 'MIEUX_DISANT' ? (Number(budget).toLocaleString().length > 10 ? '16px' : Number(budget).toLocaleString().length > 8 ? '20px' : '24px') : '20px', lineHeight: '29px', color: '#002896', transition: 'font-size 0.2s ease' }}>
                                      {budget && t.evaluationType !== 'MIEUX_DISANT' ? Number(budget).toLocaleString() : 'Offre'}
                                    </span>
                                    {budget && t.evaluationType !== 'MIEUX_DISANT' && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 700, color: '#002896', marginLeft: '1px' }}>DA</span>}
                                  </div>
                                  <span style={{ maxWidth: '120px', fontFamily: 'Roboto, sans-serif', fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 400, lineHeight: 1.2, color: '#002896', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right', justifyContent: 'flex-end' }}>{seller}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span style={{ width: '100%', height: '16px', fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: 400, lineHeight: '100%', color: '#002896', display: 'flex', alignItems: 'center', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' }}>
                                    {timer.hasEnded ? 'Terminé' : `Temps restant ${timer.days}j ${timer.hours}h (${timer.formattedEnd})`}
                                  </span>
                                </div>
                              </div>
                              <button
                                disabled={timer.hasEnded}
                                style={{ width: '100%', minHeight: '44px', backgroundColor: '#EB4545', borderRadius: '10px', padding: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: timer.hasEnded ? 'default' : 'pointer', gap: '10px', opacity: timer.hasEnded ? 0.6 : 1, transition: 'all 0.3s ease' }}
                                onClick={e => { e.stopPropagation(); if (!timer.hasEnded) router.push(`/tender-details/${tid}`); }}
                                onMouseOver={e => { if (!timer.hasEnded) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; } }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                              >
                                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '100%', color: '#FFFFFF', textAlign: 'center' }}>Soumission rapide</span>
                              </button>
                            </div>
                          </div>
                          {/* BACK */}
                          <div
                            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'transparent', color: '#333', transform: 'rotateY(180deg)', padding: '18px', boxSizing: 'border-box', border: 'none', boxShadow: 'none' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, fontFamily: 'Roboto, sans-serif', color: '#002896', textTransform: 'uppercase' }}>Fiche Technique</h4>
                              <button onClick={e => { e.stopPropagation(); setFlippedSimilarId(null); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                                <i className="bi bi-x-lg" style={{ fontSize: '16px' }}></i>
                              </button>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {[
                                { label: 'Désignation', value: t.title },
                                { label: 'Budget max', value: budget && t.evaluationType !== 'MIEUX_DISANT' ? `${Number(budget).toLocaleString()} DA` : 'Mieux Disant' },
                                { label: 'Type', value: t.tenderType === 'SERVICE' ? '🛠️ Service' : '📦 Produit' },
                                { label: 'Catégorie', value: t.category?.name || t.productSubCategory?.name || t.productCategory?.name || t.categoryName || 'Général' },
                                { label: 'Localisation', value: t.wilaya || t.location || 'Algérie' },
                                { label: 'Annonceur', value: seller },
                                { label: 'Terminaison', value: timer.hasEnded ? 'Terminé' : `${timer.days}j ${timer.hours}h` },
                              ].map((row, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '1px', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#888', flexShrink: 0 }}>{row.label}</span>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#333', textAlign: 'right', marginLeft: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{row.value}</span>
                                </div>
                              ))}
                              <div style={{ marginTop: '3px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#888', margin: '0 0 2px 0' }}>Description</p>
                                <p style={{ fontSize: '11px', color: '#555', margin: 0, lineHeight: '1.3', fontFamily: 'Inter, sans-serif', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description || 'Aucune description disponible.'}</p>
                              </div>
                            </div>
                            <button
                              style={{ width: '100%', height: '40px', backgroundColor: '#EB4545', color: '#fff', borderRadius: '8px', border: 'none', marginTop: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                              onClick={() => router.push(`/tender-details/${tid}`)}
                            >
                              Consulter l'annonce
                            </button>
                          </div>
                        </motion.div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Aucun appel d'offres similaire trouvé.</p>
            )}
          </div>
        </div>
      )}

      {showBidConfirmation && (
        <div className="modal-overlay-custom">
          <div className="modal-card-custom animate-zoom">
            <button className="modal-close-btn" onClick={handleCancelBidSubmit}>✕</button>
            <div className="modal-body-custom">
              <div className="success-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Confirmer l'offre</h3>
              <p>{tenderData?.evaluationType === 'MIEUX_DISANT' ? "Souhaitez-vous envoyer votre proposition technique ?" : "Souhaitez-vous envoyer cette offre financière ?"}</p>
              
              {tenderData?.evaluationType !== 'MIEUX_DISANT' && (
                <div className="bid-summary-card">
                  <span className="summary-label">Montant de votre offre</span>
                  <span className="summary-value">
                    {(() => {
                      const input = document.querySelector('.quantity__input_v2');
                      return input ? Number(input.value.replace(/[^0-9.]/g, '')).toLocaleString() : '0';
                    })()} DA
                  </span>
                </div>
              )}

              <div className="modal-actions-custom">
                <button className="btn-modal-cancel" onClick={handleCancelBidSubmit}>Annuler</button>
                <button className="btn-modal-confirm" onClick={handleConfirmedBidSubmit}>Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .redesign-v2-container { width: 100%; max-width: 1440px; margin: 0 auto; padding: clamp(120px, 18vw, 236px) clamp(16px, 4vw, 20px) clamp(48px, 10vw, 100px); }
        .thumbnails-vertical {
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1.5vw, 15px);
          width: 100%;
        }
        .thumb-item {
          width: 100%;
          aspect-ratio: 95.766 / 77.74;
          border-radius: 2.25px;
          overflow: hidden;
          border: 1px solid transparent;
          cursor: pointer;
          background: #fff;
          transition: all 0.2s ease;
        }
        .thumb-item.active {
          border-color: #002896;
          box-shadow: 0 4px 8px rgba(0, 40, 150, 0.1);
        }
        .thumb-item img, .thumb-item video { width: 100%; height: 100%; object-fit: cover; }
        .product-title { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 600; line-height: 1.2; color: #1e293b; margin: 10px 0; }
        .countdown-info {
          font-family: 'Roboto', sans-serif;
          font-size: 16px; 
          color: #9F3247;
          font-weight: 400; 
          line-height: 100%;
          margin-bottom: 15px;
          display: inline-block;
        }
        .tender-budget-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .budget-item { background: #f1f5f9; padding: 15px; border-radius: 16px; }
        .budget-item.highlight { background: #ecfdf5; border: 1px solid #10b981; }
        .budget-value { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 400; line-height: 24px; letter-spacing: 0.03em; color: #000; display: block; }
        .enchirir-btn { width: 100%; max-width: 336px; min-height: 44px; padding: 10px clamp(20px, 4vw, 48px); border-radius: 4px; background: #002d9c; color: white; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .seller-section-card { background: white; border-radius: 24px; padding: clamp(20px, 3vw, 30px); display: flex; flex-wrap: wrap; align-items: center; gap: clamp(16px, 3vw, 30px); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .seller-avatar img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
        .seller-actions { margin-left: auto; display: flex; gap: 10px; }
        .seller-btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 14px; }
        .btn-all-products { background: #0063B1; color: white; }
        .btn-contact { background: #f1f5f9; color: #475569; border: 1px solid #ddd; }
        .similar-card-redesign { background: white; border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .card-image-wrapper { height: 180px; overflow: hidden; }
        .card-image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .card-info-mini { padding: 15px; }
        .card-info-mini h4 { font-size: 16px; margin-bottom: 5px; }
        .price-tag-mini { color: #0063B1; font-weight: 700; }
        @media (max-width: 992px) {
          .product-hero-section { grid-template-columns: 1fr; }
          .thumbnails-vertical { flex-direction: row; order: 2; }
          .main-image-area { order: 1; }
          .product-info-area { order: 3; }
          .seller-section-card { flex-direction: column; text-align: center; }
          .seller-actions { margin-left: 0; justify-content: center; }
        }
      `}</style>
    </>
  );
};

export default MultipurposeDetails2;
