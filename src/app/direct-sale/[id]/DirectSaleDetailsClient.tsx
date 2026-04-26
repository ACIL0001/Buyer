"use client";
import ShareButton from "@/components/common/ShareButton";
import { useEffect, useState, useMemo } from "react";
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
    return allDirectSales
      .filter((sale) => sale._id !== directSale._id && sale.status === 'ACTIVE')
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
          <Swiper modules={[Autoplay, Navigation]} navigation spaceBetween={20} slidesPerView={1} breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 4 } }}>
            {similarDirectSales.map(t => (
              <SwiperSlide key={t._id}>
                <div className="similar-card-redesign" onClick={() => window.location.assign(`/direct-sale/${t._id}`)}>
                  <div className="card-image-wrapper"><img src={getImageUrl(t.thumbs?.[0]?.url)} alt="" /></div>
                  <div className="card-info-mini">
                    <h4>{t.title}</h4>
                    <div className="price-tag-mini">{formatPrice(t.price)}</div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

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
        .thumb-item.active { border-color: #0063B1; }
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
        .enchirir-btn { width: 336px; height: 44px; border-radius: 4px; padding: 10px 48px; background: #002d9c; color: white; font-weight: 700; border: none; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .enchirir-btn:hover { background: #001f6d; transform: translateY(-2px); }
        .product-description-container { margin-top: 69px; padding-left: 27px; }
        .description-title { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 25px; color: #000; }
        .description-body { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; letter-spacing: 0.03em; color: #444; max-width: 1158px; white-space: pre-wrap; margin-bottom: 20px; }
        .seller-section-card { background: white; border-radius: 24px; padding: 30px; display: flex; align-items: center; gap: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
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
