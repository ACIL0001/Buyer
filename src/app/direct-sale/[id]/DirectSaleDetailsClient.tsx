"use client";
import ShareButton from "@/components/common/ShareButton";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { normalizeImageUrl } from '@/utils/url';
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { DirectSaleAPI } from "@/app/api/direct-sale";
import commentsApi from "@/app/api/comments";
import useAuth from "@/hooks/useAuth";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SnackbarProvider, useSnackbar } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import app, { getSellerUrl } from "@/config";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import CommentItem from "@/components/common/CommentItem";

// Import styles from the reference components
import "@/components/auction-details/st.css";
import "@/components/auction-details/modern-details.css";
import "@/components/auction-details/multipurpose-redesign.css";

export interface CommentUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  photoURL?: string;
}

export interface Comment {
  _id: string;
  comment: string;
  user: CommentUser;
  createdAt: string;
  replies?: Comment[];
}

interface DirectSale {
  _id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  soldQuantity: number;
  saleType: 'PRODUCT' | 'SERVICE';
  status: string;
  thumbs?: Array<{ url: string; _id: string }>;
  videos?: Array<{ url: string; _id: string }>;
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    name?: string;
    avatar?: { url: string };
    photoURL?: string;
    entreprise?: string;
    companyName?: string;
    description?: string;
    hidden?: boolean;
  };
  hidden?: boolean;
  productCategory?: { _id: string; name: string };
  productSubCategory?: { _id: string; name: string };
  category?: { _id: string; name: string };
  categoryName?: string;
  wilaya: string;
  place: string;
  attributes?: string[];
  comments?: Comment[];
  createdAt?: string;
  isPro?: boolean;
  views?: number;
}

const DEFAULT_DIRECT_SALE_IMAGE = "/assets/images/logo-dark.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";
const DEFAULT_USER_AVATAR = "/assets/images/avatar.jpg";

function DirectSaleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { isLogged, auth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [directSale, setDirectSale] = useState<DirectSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [allDirectSales, setAllDirectSales] = useState<DirectSale[]>([]);
  const [activeTab, setActiveTab] = useState("comments");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [flippedSimilarId, setFlippedSimilarId] = useState<string | null>(null);
  const [similarCardImageIndexes, setSimilarCardImageIndexes] = useState<{ [key: string]: number }>({});

  const directSaleId = params?.id as string;

  useEffect(() => {
    const fetchDirectSale = async () => {
      try {
        setLoading(true);
        const data = await DirectSaleAPI.getDirectSaleById(directSaleId);
        setDirectSale(data);
        
        const commentId = searchParams?.get('commentId');
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
        setError(null);
      } catch (err: any) {
        setError(t('details.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    const fetchAllDirectSales = async () => {
      try {
        const data = await DirectSaleAPI.getDirectSales();
        setAllDirectSales(Array.isArray(data) ? data : []);
      } catch (_) {}
    };

    if (directSaleId) {
      fetchDirectSale();
      fetchAllDirectSales();
    }
  }, [directSaleId, refreshKey, t, searchParams]);

  const similarDirectSales = useMemo(() => {
    if (!directSale || !allDirectSales.length) return [];
    const catId = directSale.category?._id || directSale.productCategory?._id || directSale.productSubCategory?._id;
    const catName = directSale.categoryName;
    return allDirectSales
      .filter((sale) => sale._id !== directSale._id && sale.status === 'ACTIVE')
      .filter((sale) => {
        const sCatId = sale.category?._id || sale.productCategory?._id || sale.productSubCategory?._id;
        const sCatName = sale.categoryName;
        return (catId && sCatId && sCatId === catId) || (catName && sCatName && sCatName === catName);
      })
      .slice(0, 8);
  }, [directSale, allDirectSales]);

  const handlePurchase = async () => {
    if (!isLogged) {
      toast.warning(t('details.pleaseLoginToBuy'));
      router.push('/auth/login');
      return;
    }
    if (!directSale) return;

    if (directSale.owner?._id === auth?.user?._id) {
      toast.error(t('details.cannotBuyOwnProduct'));
      return;
    }

    try {
      setPurchasing(true);
      await DirectSaleAPI.purchase({ directSaleId: directSale._id, quantity });
      enqueueSnackbar(t('details.orderSuccessful'), { variant: 'success' });
      setRefreshKey(prev => prev + 1);
      setQuantity(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('details.errorOrdering'));
    } finally {
      setPurchasing(false);
    }
  };

  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return DEFAULT_DIRECT_SALE_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    const base = app.baseURL || app.route || "";
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${base}${cleanPath}`;
  };

  const formatPrice = (price: number) => {
    return `${Math.floor(price).toLocaleString()} DA`;
  };

  if (loading) {
    return (
      <div className="redesign-v2-container text-center py-5">
        <div className="spinner-border text-primary"></div>
        <h3 className="mt-4">{t('details.loading')}</h3>
      </div>
    );
  }

  if (error || !directSale) {
    return (
      <div className="redesign-v2-container text-center py-5">
        <div className="alert alert-danger">
          <h3>{error || t('details.notFound')}</h3>
          <button className="btn btn-primary" onClick={() => router.push('/direct-sale')}>Retour</button>
        </div>
      </div>
    );
  }

  const availableQuantity = directSale.quantity === 0 ? 999 : directSale.quantity - directSale.soldQuantity;
  const isSoldOut = directSale.status === 'SOLD_OUT' || (directSale.quantity > 0 && availableQuantity <= 0);
  const isOwner = isLogged && directSale.owner?._id === auth?.user?._id;
  const safeThumbs = directSale.thumbs || [];
  const safeVideos = directSale.videos || [];

  return (
    <>
      <div className="redesign-v2-container">
        {/* Product Hero Section */}
        <div className="product-hero-section mt-3">
          <div className="thumbnails-vertical">
            {safeThumbs.length > 0 ? safeThumbs.map((thumb, index) => (
              <div key={`thumb-img-${index}`} className={`thumb-item ${!showVideo && index === selectedImageIndex ? 'active' : ''}`} onClick={() => { setSelectedImageIndex(index); setShowVideo(false); }}>
                <img src={getImageUrl(thumb.url)} alt="" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_DIRECT_SALE_IMAGE; }} />
              </div>
            )) : (
              <div className="thumb-item active"><img src={DEFAULT_DIRECT_SALE_IMAGE} alt="Default" /></div>
            )}
            {safeVideos.length > 0 && safeVideos.map((video, index) => (
              <div key={`thumb-vid-${index}`} className={`thumb-item ${showVideo && index === selectedVideoIndex ? 'active' : ''}`} onClick={() => { setSelectedVideoIndex(index); setShowVideo(true); }}>
                <video src={getImageUrl(video.url)} muted />
              </div>
            ))}
          </div>

          <div className="main-image-area">
            <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 5 }}>
              <ShareButton 
                type="directSale" 
                id={directSale._id} 
                title={directSale.title} 
                description={directSale.description} 
                imageUrl={getImageUrl(safeThumbs[0]?.url)} 
              />
            </div>
            {showVideo && safeVideos.length > 0 ? (
              <video src={getImageUrl(safeVideos[selectedVideoIndex]?.url)} controls style={{ maxHeight: '100%', maxWidth: '100%' }} />
            ) : (
              <img 
                src={getImageUrl(safeThumbs[selectedImageIndex]?.url)} 
                alt={directSale.title} 
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_DIRECT_SALE_IMAGE; }}
              />
            )}
          </div>

          <div className="product-info-area">
            <h1 className="product-title">{directSale.title}</h1>
            
            <div className="price-section mt-4 mb-3">
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
                {formatPrice(directSale.price).replace('DA', '').trim()} DA
              </span>
            </div>

            <div className="info-grid-mini mt-3">
              <div className="info-item-mini">
                <span className="info-label-mini">VENDEUR:</span>
                <Link href={`/profile/${directSale.owner?._id}`} className="info-text-mini hover-link">
                  {directSale.owner?.entreprise || directSale.owner?.name || 'Vendeur'}
                </Link>
              </div>
              <div className="info-item-mini">
                <span className="info-label-mini">LOCALISATION:</span>
                <span className="info-text-mini">{directSale.wilaya}, {directSale.place}</span>
              </div>
              <div className="info-item-mini">
                <span className="info-label-mini">QUANTITÉ:</span>
                <span className="info-text-mini">{directSale.quantity === 0 ? 'En stock (Illimité)' : `${availableQuantity} disponible(s)`}</span>
              </div>
              <div className="info-item-mini">
                <span className="info-label-mini">TYPE:</span>
                <span className="info-text-mini">{directSale.saleType === 'SERVICE' ? '🛠️ Service' : '📦 Produit'}</span>
              </div>
              <div className="info-item-mini">
                <span className="info-label-mini">STATUT:</span>
                <span className="info-text-mini" style={{ color: isSoldOut ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                  {isSoldOut ? 'Sold Out' : 'En Stock'}
                </span>
              </div>
              <div className="info-item-mini">
                <span className="info-label-mini">CATÉGORIE:</span>
                <span className="info-text-mini">{directSale.category?.name || directSale.categoryName || directSale.productSubCategory?.name || directSale.productCategory?.name || 'Non spécifiée'}</span>
              </div>
              {(directSale.owner as any)?.phoneNumber && (
                <div className="info-item-mini">
                  <span className="info-label-mini">CONTACT:</span>
                  <span className="info-text-mini">{(directSale.owner as any).phoneNumber}</span>
                </div>
              )}
            </div>

            <div className="divider"></div>
            
            {!isSoldOut && (
              <div className="bid-input-section">
                {isOwner && <div className="alert alert-warning py-2 mb-3" style={{fontSize: '13px'}}>{t('details.cannotBuyOwnProduct')}</div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>Quantité:</span>
                  <div className="quantity-selector-custom">
                    <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</button>
                    <input type="number" className="qty-input" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, availableQuantity)))} />
                    <button className="qty-btn" onClick={() => setQuantity(Math.min(availableQuantity, quantity + 1))} disabled={quantity >= availableQuantity}>+</button>
                  </div>
                </div>

                <div className="total-to-pay mb-3 p-3" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#475569' }}>Total à payer:</span>
                  <span style={{ color: '#0063B1', fontWeight: '800', fontSize: '20px' }}>{formatPrice(directSale.price * quantity)}</span>
                </div>
                
                <button className="enchirir-btn" onClick={handlePurchase} disabled={purchasing || isOwner}>
                  {purchasing ? 'Traitement...' : 'Acheter maintenant'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details and Tabs */}
        <div className="product-description-container mt-5">
          <h2 className="description-title">Description du produit</h2>
          <div className="description-body" style={{ whiteSpace: 'pre-wrap' }}>{directSale.description}</div>
          
          <div className="tabs-redesign mt-4">
            <div className="tab-headers">
              <button className={`tab-item ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>Questions & Réponses</button>
            </div>
            <div className="tab-content-area p-4">
              <div className="comments-section-v2">
                {isLogged ? (
                  <div className="comment-form-v2 mb-4">
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Posez une question au vendeur..."></textarea>
                    <button onClick={async () => {
                        if (!newComment.trim()) return;
                        setSubmittingComment(true);
                        try { 
                          await commentsApi.createCommentForDirectSale(directSaleId, newComment, auth?.user?._id || ''); 
                          setNewComment(""); 
                          setRefreshKey(k => k + 1); 
                          toast.success("Question envoyée"); 
                        } finally { setSubmittingComment(false); }
                    }} disabled={submittingComment}>{submittingComment ? '...' : 'Envoyer'}</button>
                  </div>
                ) : <div className="alert alert-info">Veuillez vous connecter pour poser une question.</div>}
                <div className="comment-list-v2">
                  {directSale.comments?.map(c => (
                    <CommentItem 
                      key={c._id} 
                      comment={c} 
                      isLogged={isLogged} 
                      authUser={auth.user} 
                      announcementOwnerId={directSale.owner?._id || (directSale.owner as any)}
                      onReplySuccess={() => setRefreshKey(k => k + 1)} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Section */}
        <div className="seller-section-card mt-5">
          <div className="seller-avatar"><img src={directSale.owner?.photoURL || DEFAULT_PROFILE_IMAGE} alt="Seller" /></div>
          <div className="seller-info-content">
            <div className="seller-header">
              <span className="seller-name">
                {directSale.owner?.entreprise || directSale.owner?.companyName || directSale.owner?.name || "Vendeur"}
              </span>
            </div>
            <div className="seller-bio">{directSale.owner?.description || "Ce vendeur n'a pas encore ajouté de description."}</div>
            {(directSale.owner as any)?.phoneNumber && (
              <div className="seller-contact-mini mt-2" style={{ fontSize: '14px', color: '#0063B1', fontWeight: 'bold' }}>
                📞 {(directSale.owner as any).phoneNumber}
              </div>
            )}
          </div>
          <div className="seller-actions">
            <Link href={getSellerUrl()} className="seller-btn btn-all-products">Boutique</Link>
            <button className="seller-btn btn-contact" onClick={() => { setActiveTab('comments'); window.scrollBy({ top: 500, behavior: 'smooth' }); }}>Contacter</button>
          </div>
        </div>

        {/* Similar Products */}
        <div className="similar-auctions-redesign mt-5">
          <h2 className="redesign-title mb-4">Produits Similaires</h2>
          {similarDirectSales.length > 0 ? (
            <div style={{ position: 'relative', overflow: 'visible' }}>
              <Swiper
                modules={[Autoplay, Navigation]}
                spaceBetween={20}
                slidesPerView="auto"
                style={{ padding: '30px 10px', margin: '-30px -10px', overflow: 'visible' }}
              >
                {similarDirectSales.map((sale: any) => {
                  const sid = sale._id || sale.id;
                  const companyName = sale.owner?.entreprise || sale.owner?.companyName || sale.owner?.firstName || 'Nom Entreprise';
                  const availableQuantity = sale.quantity > 0 ? (sale.quantity - (sale.soldQuantity || 0)) : 'Illimité';
                  const images = sale.thumbs || sale.images || [];
                  const curImgIdx = similarCardImageIndexes[sid] || 0;
                  const getImg = (idx: number = 0) => {
                    const raw = images[idx];
                    if (!raw) return DEFAULT_DIRECT_SALE_IMAGE;
                    const url = typeof raw === 'string' ? raw : (raw.url || raw.fullUrl || raw);
                    return normalizeImageUrl(url);
                  };
                  return (
                    <SwiperSlide key={sid} style={{ overflow: 'visible', perspective: '1000px' }}>
                      <motion.div
                        key={sid}
                        initial={false}
                        animate={{ rotateY: flippedSimilarId === sid ? 180 : 0 }}
                        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                        style={{ width: '100%', maxWidth: '320px', aspectRatio: '284 / 464', margin: '0 auto', position: 'relative', zIndex: 1, transformStyle: 'preserve-3d' }}
                      >
                        {/* FRONT */}
                        <div
                          style={{ width: '100%', height: '100%', position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'transparent', cursor: 'pointer', boxShadow: 'none', border: 'none' }}
                          onClick={() => window.location.assign(`/direct-sale/${sid}`)}
                        >
                          <div style={{ width: '100%', aspectRatio: '284 / 280', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                              <ShareButton type="directSale" id={sid} title={sale.title} description={sale.description} imageUrl={getImg(curImgIdx)} />
                            </div>
                            <img src={getImg(curImgIdx)} alt={sale.title} style={{ width: '100%', height: '100%', objectFit: 'fill' }} onError={(e: any) => e.currentTarget.src = DEFAULT_DIRECT_SALE_IMAGE} />
                            {images.length > 1 && (
                              <>
                                <div className="image-nav-arrow" style={{ position: 'absolute', top: '45%', left: '8px', transform: 'translateY(-50%)', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 25, border: 'none', transition: 'all 0.2s ease' }} onClick={(e: any) => { e.stopPropagation(); setSimilarCardImageIndexes((prev: any) => ({ ...prev, [sid]: (curImgIdx - 1 + images.length) % images.length })); }}>
                                  <i className="bi bi-chevron-left" style={{ color: '#002896', fontSize: '12px' }}></i>
                                </div>
                                <div className="image-nav-arrow" style={{ position: 'absolute', top: '45%', right: '8px', transform: 'translateY(-50%)', width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 25, border: 'none', transition: 'all 0.2s ease' }} onClick={(e: any) => { e.stopPropagation(); setSimilarCardImageIndexes((prev: any) => ({ ...prev, [sid]: (curImgIdx + 1) % images.length })); }}>
                                  <i className="bi bi-chevron-right" style={{ color: '#002896', fontSize: '12px' }}></i>
                                </div>
                                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 25 }}>
                                  {images.map((_: any, i: number) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: curImgIdx === i ? '#002896' : 'rgba(255,255,255,0.6)', transition: 'all 0.3s ease' }} />)}
                                </div>
                              </>
                            )}
                            <div
                              style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 30, backgroundColor: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.3s ease', border: 'none' }}
                              onClick={(e: any) => { e.stopPropagation(); setFlippedSimilarId(flippedSimilarId === sid ? null : sid); }}
                              onMouseOver={(e: any) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                              onMouseOut={(e: any) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)'; e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#002896', fontFamily: 'Inter, sans-serif' }}>Plus de détails</span>
                              <i className="bi bi-info-circle" style={{ color: '#002896', fontSize: '12px' }}></i>
                            </div>
                          </div>
                          <div style={{ padding: '10px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                            <div>
                              <h4 style={{ width: '100%', fontFamily: 'Roboto, sans-serif', fontWeight: 700, fontSize: 'clamp(1rem, 1.6vw, 1.25rem)', lineHeight: 1.15, letterSpacing: '0px', color: '#002896', margin: '0 0 6px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 1 }}>{sale.title || 'Nom Produit'}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: Number(sale.price || 0).toLocaleString().length > 10 ? '16px' : Number(sale.price || 0).toLocaleString().length > 8 ? '20px' : '24px', lineHeight: '29px', color: '#002896', transition: 'font-size 0.2s ease' }}>{Number(sale.price || 0).toLocaleString()}</span>
                                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 700, color: '#002896', marginLeft: '1px' }}>DA</span>
                                </div>
                                <span style={{ maxWidth: '120px', fontFamily: 'Roboto, sans-serif', fontSize: 'clamp(0.75rem, 1vw, 0.875rem)', fontWeight: 400, lineHeight: 1.2, color: '#002896', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right', justifyContent: 'flex-end' }}>{companyName}</span>
                              </div>
                              <button
                                style={{ width: '100%', minHeight: '44px', backgroundColor: '#EB4545', borderRadius: '10px', padding: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '10px', marginTop: '12px', transition: 'all 0.3s ease' }}
                                onClick={(e: any) => { e.stopPropagation(); window.location.assign(`/direct-sale/${sid}`); }}
                                onMouseOver={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                onMouseOut={(e: any) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                              >
                                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '16px', lineHeight: '100%', color: '#FFFFFF', textAlign: 'center' }}>Acheter rapide</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* BACK */}
                        <div
                          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'transparent', color: '#333', transform: 'rotateY(180deg)', padding: '18px', boxSizing: 'border-box', border: 'none', boxShadow: 'none' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, fontFamily: 'Roboto, sans-serif', color: '#002896', textTransform: 'uppercase' }}>Fiche Technique</h4>
                            <button onClick={(e: any) => { e.stopPropagation(); setFlippedSimilarId(null); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                              <i className="bi bi-x-lg" style={{ fontSize: '16px' }}></i>
                            </button>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                            {[
                              { label: 'Désignation', value: sale.title },
                              { label: 'Prix Unitaire', value: `${Number(sale.price || 0).toLocaleString()} DA` },
                              { label: 'Disponible', value: availableQuantity },
                              { label: 'Type', value: (sale.bidType === 'SERVICE' || sale.saleType === 'SERVICE') ? '🛠️ Service' : '📦 Produit' },
                              { label: 'Catégorie', value: sale.category?.name || sale.productSubCategory?.name || sale.productCategory?.name || sale.categoryName || 'Général' },
                              { label: 'Localisation', value: `${sale.wilaya || ''}${sale.place ? ', ' + sale.place : ''}` || 'Algérie' },
                              { label: 'Vendeur', value: companyName },
                            ].map((row: any, idx: number) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '1px', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '10px', fontWeight: 600, color: '#888', flexShrink: 0 }}>{row.label}</span>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#333', textAlign: 'right', marginLeft: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{row.value}</span>
                              </div>
                            ))}
                            <div style={{ marginTop: '5px' }}>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: '#888', margin: '0 0 3px 0' }}>Description</p>
                              <p style={{ fontSize: '12px', color: '#555', margin: 0, lineHeight: '1.4', fontFamily: 'Inter, sans-serif', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{sale.description || 'Aucune description disponible.'}</p>
                            </div>
                          </div>
                          <button
                            style={{ width: '100%', height: '40px', backgroundColor: '#EB4545', color: '#fff', borderRadius: '8px', border: 'none', marginTop: '12px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                            onClick={() => window.location.assign(`/direct-sale/${sid}`)}
                          >
                            Consulter le produit
                          </button>
                        </div>
                      </motion.div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          ) : (
            <p style={{ color: '#888', fontStyle: 'italic' }}>Aucun produit similaire trouvé.</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .redesign-v2-container { width: 100%; max-width: 1440px; margin: 0 auto; padding: clamp(120px, 18vw, 236px) clamp(16px, 4vw, 20px) clamp(48px, 10vw, 100px); }
        .product-hero-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(12px, 2vw, 19px);
          margin-bottom: clamp(28px, 5vw, 50px);
          align-items: start;
        }
        @media (min-width: 768px) {
          .product-hero-section {
            grid-template-columns: clamp(80px, 8vw, 100px) minmax(0, 1fr);
            gap: clamp(16px, 2.5vw, 24px);
          }
        }
        @media (min-width: 1024px) {
          .product-hero-section {
            grid-template-columns: clamp(80px, 7vw, 100px) minmax(0, 1fr) minmax(280px, 400px);
            justify-content: center;
          }
        }
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
        .thumb-item.active { border-color: #0063B1; }
        .thumb-item img, .thumb-item video { width: 100%; height: 100%; object-fit: cover; }
        .main-image-area {
          background: #f8fafc;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 100%;
          max-width: 632px;
          aspect-ratio: 632 / 600;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        .main-image-area img { 
          width: 100%;
          height: 100%;
          object-fit: fill; 
        }
        .product-title { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 600; line-height: 24px; letter-spacing: 0.03em; color: #1e293b; margin: 10px 0; }
        .tender-budget-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .budget-item { background: #f1f5f9; padding: 15px; border-radius: 16px; }
        .budget-item.highlight { background: #ecfdf5; border: 1px solid #10b981; }
        .budget-label { font-size: 13px; color: #64748b; font-weight: 600; display: block; margin-bottom: 5px; }
        .budget-value { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 400; line-height: 24px; letter-spacing: 0.03em; color: #000; display: block; }
        .divider { height: 1px; background: #e2e8f0; margin: 25px 0; }
        .quantity-selector-custom { display: flex; align-items: center; gap: 10px; background: #f1f5f9; padding: 5px; border-radius: 10px; }
        .qty-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: white; font-weight: bold; cursor: pointer; }
        .qty-input { width: 50px; border: none; background: transparent; text-align: center; font-weight: bold; }
        .enchirir-btn { width: 100%; max-width: 336px; min-height: 44px; border-radius: 4px; padding: 10px clamp(20px, 4vw, 48px); background: #002d9c; color: white; font-weight: 700; border: none; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .enchirir-btn:hover { background: #001f6d; transform: translateY(-2px); }
        .product-description-container { margin-top: 69px; padding-left: 27px; }
        .description-title { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 25px; color: #000; }
        .description-body { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; letter-spacing: 0.03em; color: #444; width: 100%; max-width: 1158px; white-space: pre-wrap; margin-bottom: 20px; word-wrap: break-word; }
        .seller-section-card { background: white; border-radius: 24px; padding: clamp(20px, 3vw, 30px); display: flex; flex-wrap: wrap; align-items: center; gap: clamp(16px, 3vw, 30px); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .seller-avatar img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #0063B1; }
        .seller-actions { margin-left: auto; display: flex; gap: 10px; }
        .seller-btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 14px; }
        .btn-all-products { background: #0063B1; color: white; }
        .btn-contact { background: #f1f5f9; color: #475569; border: 1px solid #ddd; }
        .similar-card-redesign { background: white; border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: 0.3s; }
        .similar-card-redesign:hover { transform: translateY(-5px); }
        .card-image-wrapper { height: 180px; overflow: hidden; }
        .card-image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .card-info-mini { padding: 15px; }
        .price-tag-mini { color: #0063B1; font-weight: 700; font-size: 16px; }
        @media (max-width: 992px) {
          .product-hero-section { grid-template-columns: 1fr; }
          .thumbnails-vertical { flex-direction: row; order: 2; overflow-x: auto; }
          .main-image-area { order: 1; }
          .product-info-area { order: 3; }
          .seller-section-card { flex-direction: column; text-align: center; }
          .seller-actions { margin-left: 0; justify-content: center; width: 100%; }
        }
      `}</style>
    </>
  );
}

export default function DirectSaleDetailsClient() {
  const { initializeAuth } = useAuth();
  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  return (
    <AxiosInterceptor>
      <RequestProvider>
        <SnackbarProvider maxSnack={3}>
          <ToastContainer position="top-right" autoClose={3000} />
          <Header />
          <DirectSaleDetailContent />
          <Footer />
        </SnackbarProvider>
      </RequestProvider>
    </AxiosInterceptor>
  );
}
