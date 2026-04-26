"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "@/components/auction-details/st.css";
import "@/components/auction-details/modern-details.css";
import "@/components/auction-details/multipurpose-redesign.css";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
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
import commentsApi from "@/app/api/comments";
import { useTranslation } from 'react-i18next';
import ShareButton from "@/components/common/ShareButton";
import CommentItem from "@/components/common/CommentItem";

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
  const handleBidClick = (e) => { e.preventDefault(); setShowBidConfirmation(true); };
  const handleCancelBidSubmit = () => setShowBidConfirmation(false);
  const handleConfirmedBidSubmit = async () => { setShowBidConfirmation(false); await submitBid(); };

  const submitBid = async () => {
    try {
      if (!isLogged) { toast.error("Connectez-vous"); router.push('/auth/login'); return; }
      const isMieuxDisant = tenderData?.evaluationType === 'MIEUX_DISANT';
      const bidInput = document.querySelector(".quantity__input");
      const bidAmountRaw = bidInput?.value || "0";
      const cleanBidAmount = parseFloat(bidAmountRaw.replace(/[^0-9.]/g, '')) || 0;

      if (!isMieuxDisant && cleanBidAmount >= currentLowestBidPrice) {
        toast.error(`Votre offre doit être inférieure à ${currentLowestBidPrice.toLocaleString()} DA`);
        return;
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
              {/* Removed Produit and Status badges */}
              <h1 className="product-title">{safeTitle}</h1>
              <div className="countdown-info">{formatRemainingTime(safeEndingAt)}</div>
              
              {safeMaxBudget > 0 && (
                <div className="budget-display-redesign my-2" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span className="budget-amount" style={{ 
                    fontFamily: "'Inter', sans-serif", 
                    fontSize: '24px', 
                    fontWeight: '400', 
                    lineHeight: '24px', 
                    letterSpacing: '0.03em', 
                    color: '#000000' 
                  }}>
                    {formatPrice(safeMaxBudget).trim()}
                  </span>
                  <span style={{ 
                    fontFamily: "'Inter', sans-serif", 
                    fontSize: '24px', 
                    fontWeight: '400', 
                    lineHeight: '24px', 
                    color: '#000000' 
                  }}>
                    DA
                  </span>
                </div>
              )}
              


              <div className="info-grid-mini mt-3">
                <div className="info-item-mini">
                  <span className="info-label-mini">VENDEUR:</span>
                  <Link href={`/profile/${safeOwner?._id || safeOwner}`} className="info-text-mini hover-link">
                    {safeOwner?.entreprise || safeOwner?.name || 'Vendeur'}
                  </Link>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">LOCALISATION:</span>
                  <span className="info-text-mini">{safeWilaya}, {safeLocation}</span>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">QUANTITÉ:</span>
                  <span className="info-text-mini">{safeQuantity || 'N/A'}</span>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">TYPE:</span>
                  <span className="info-text-mini">{safeTenderType === 'SERVICE' ? '🛠️ Service' : '📦 Produit'}</span>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">STATUT:</span>
                  <span className="info-text-mini" style={{ color: safeStatus === 'OPEN' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {safeStatus === 'OPEN' ? 'Ouvert' : safeStatus}
                  </span>
                </div>
                <div className="info-item-mini">
                  <span className="info-label-mini">CATÉGORIE:</span>
                  <span className="info-text-mini">{tenderData?.category?.name || tenderData?.categoryName || tenderData?.productSubCategory?.name || tenderData?.productCategory?.name || 'Non spécifiée'}</span>
                </div>
              </div>



              <div className="divider" style={{ opacity: 0.5, margin: '20px 0' }}></div>
              
              <div className="bid-input-section" style={{ background: 'rgba(0, 40, 150, 0.02)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(0, 40, 150, 0.05)' }}>
                {isOwner && <div className="alert alert-warning py-2 mb-3" style={{fontSize: '13px', borderRadius: '12px'}}>C'est votre propre appel d'offres.</div>}
                
                {tenderData?.evaluationType === 'MIEUX_DISANT' ? (
                  <div className="mieux-disant-input-area">
                    <label style={{ fontSize: '15px', fontWeight: '800', color: '#002896', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa fa-edit" style={{ fontSize: '18px' }}></i> Votre proposition :
                    </label>
                    <textarea 
                      className="proposal-textarea" 
                      ref={proposalTextareaRef} 
                      placeholder="Décrivez votre offre, votre expertise et vos délais de réalisation..."
                      style={{
                        width: '100%',
                        minHeight: '140px',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '2px solid #e2e8f0',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        resize: 'vertical',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        background: '#ffffff',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#002896';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 40, 150, 0.08)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
                      }}
                    ></textarea>
                    
                    <div className="file-upload-modern mt-3" style={{ position: 'relative' }}>
                      <label style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '20px', 
                        border: '2px dashed #002896', 
                        borderRadius: '16px', 
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
                        <i className={`fa ${proposalFile ? 'fa-file-pdf' : 'fa-cloud-upload'}`} style={{ fontSize: '24px', color: '#002896', marginBottom: '8px' }}></i>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#002896', textAlign: 'center' }}>
                          {proposalFile ? proposalFile.name : "Joindre votre dossier technique (PDF, DOCX)"}
                        </span>
                        {!proposalFile && <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Taille max : 10Mo</span>}
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="moins-disant-input-area">
                    <label style={{ fontSize: '15px', fontWeight: '800', color: '#002896', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa fa-coins" style={{ fontSize: '18px' }}></i> Votre offre financière (DA) :
                    </label>
                    <div className="quantity-stepper">
                      <HandleQuantity initialValue={currentLowestBidPrice - 100} startingPrice={currentLowestBidPrice} maxValue={currentLowestBidPrice - 1} />
                    </div>
                  </div>
                )}
                
                <button 
                  className="enchirir-btn mt-4" 
                  onClick={handleBidClick} 
                  disabled={isOwner || safeStatus !== 'OPEN'}
                  style={{
                    width: '100%',
                    height: '56px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '800',
                    letterSpacing: '0.5px',
                    boxShadow: '0 10px 25px rgba(0, 40, 150, 0.2)'
                  }}
                >
                  {tenderData?.evaluationType === 'MIEUX_DISANT' ? 'SOUMETTRE MA PROPOSITION' : 'ENVOYER MON OFFRE'}
                </button>
              </div>
            </div>
          </div>

          <div className="product-description-container mt-5">
            <h2 className="description-title">Description du produit</h2>
            <div className="description-body">
              <div style={{ whiteSpace: 'pre-wrap' }}>{safeDescription}</div>
              {safeRequirements.length > 0 && (
                <div className="requirements-section mt-4">
                  <h3>Exigences</h3>
                  <ul className="requirements-list">{safeRequirements.map((req, i) => <li key={i}>{req}</li>)}</ul>
                </div>
              )}
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
              <div className="tab-content-area p-4">
                {activeTab === 'comments' && (
                  <div className="comments-section-v2">
                    {isLogged ? (
                      <div className="comment-form-v2 mb-4">
                        <textarea 
                          value={newComment} 
                          onChange={(e) => setNewComment(e.target.value)} 
                          placeholder="Posez une question au vendeur..."
                          rows={4}
                        ></textarea>
                        <div className="d-flex justify-content-end mt-2">
                          <button 
                            className="btn-envoyer"
                            onClick={async () => {
                              if (!newComment.trim()) return;
                              setSubmitting(true);
                              try { 
                                await commentsApi.createCommentForTender(tenderId, newComment, auth?.user?._id || ''); 
                                setNewComment(""); 
                                const data = await TendersAPI.getTenderById(tenderId);
                                setTenderData(data);
                                toast.success("Question envoyée"); 
                              } catch (err) {
                                toast.error("Erreur lors de l'envoi");
                              } finally { setSubmitting(false); }
                            }} 
                            disabled={submitting}
                          >
                            {submitting ? '...' : 'Envoyer'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-info">Veuillez vous connecter pour poser une question.</div>
                    )}
                    <div className="comment-list-v2">
                      {tenderData?.comments?.map(c => (
                        <CommentItem 
                          key={c._id} 
                          comment={c} 
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
                )}
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
              <div className="seller-header"><span className="seller-name">{safeOwner?.entreprise || safeOwner?.name || "Vendeur"}</span></div>
              <div className="seller-bio">{safeOwner?.description || "Pas de bio."}</div>
            </div>
            <div className="seller-actions">
              <Link href={getSellerUrl(safeOwner?._id || safeOwner)} className="seller-btn btn-all-products">Boutique</Link>
              <button className="seller-btn btn-contact" onClick={() => { setActiveTab('comments'); window.scrollBy({ top: 500, behavior: 'smooth' }); }}>Contacter</button>
            </div>
          </div>

          <div className="similar-auctions-redesign mt-5">
            <h2 className="redesign-title mb-4">Similaires</h2>
            <Swiper modules={[Navigation, Autoplay]} navigation spaceBetween={20} slidesPerView={1} breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}>
              {allTenders?.filter(t => t._id !== tenderId).slice(0, 8).map(t => (
                <SwiperSlide key={t._id}>
                  <div className="similar-card-redesign" onClick={() => window.location.assign(`/tender-details/${t._id}`)}>
                    <div className="card-image-wrapper"><img src={t.attachments?.[0]?.url || DEFAULT_TENDER_IMAGE} alt="" /></div>
                    <div className="card-info-mini"><h4>{t.title}</h4><div className="price-tag-mini">{formatPrice(t.maxBudget)} DA</div></div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

      {showBidConfirmation && (
        <div className="modal-overlay-custom">
          <div className="modal-card-custom animate-zoom">
            <button className="modal-close-btn" onClick={handleCancelBidSubmit}>✕</button>
            <div className="modal-body-custom text-center">
              <h3>Confirmer l'offre</h3>
              <p>Souhaitez-vous envoyer cette offre ?</p>
              <div className="modal-actions-custom mt-4">
                <button className="btn-modal-cancel" onClick={handleCancelBidSubmit}>Annuler</button>
                <button className="btn-modal-confirm" onClick={handleConfirmedBidSubmit}>Confirmer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .redesign-v2-container { max-width: 1440px; margin: 0 auto; padding: 236px 20px 100px; }
        .product-hero-section { 
          display: grid; 
          grid-template-columns: 96px 632px 400px; 
          gap: 19px; 
          margin-bottom: 50px; 
          justify-content: center; 
          align-items: start;
        }
        .thumbnails-vertical { 
          display: flex; 
          flex-direction: column; 
          gap: 15px; 
          max-height: 600px; 
          width: 95.766px;
        }
        .thumb-item { 
          width: 95.766px; 
          height: 77.74px; 
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
        .main-image-area { 
          background: #f8fafc; 
          border-radius: 4px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          position: relative; 
          width: 632px; 
          height: 600px; 
          overflow: hidden; 
          border: 1px solid #e2e8f0; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.05); 
        }
        .main-image-area img { 
          width: 100%;
          height: 100%;
          object-fit: fill; 
        }
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
        .enchirir-btn { width: 336px; height: 44px; padding: 10px 48px; border-radius: 4px; background: #002d9c; color: white; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .product-description-container { margin-top: 69px; padding-left: 27px; }
        .description-title { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 25px; color: #000; }
        .description-body { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; letter-spacing: 0.03em; color: #444; max-width: 1158px; white-space: pre-wrap; margin-bottom: 20px; }
        .seller-section-card { background: white; border-radius: 24px; padding: 30px; display: flex; align-items: center; gap: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
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
