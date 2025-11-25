"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { DirectSaleAPI } from "@/app/api/direct-sale";
import useAuth from "@/hooks/useAuth";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RequestProvider from "@/contexts/RequestContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import app from "@/config";
import Link from "next/link";

// Import styles from the reference component
import "@/components/auction-details/st.css";
import "@/components/auction-details/modern-details.css";

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
    avatar?: { url: string };
    photoURL?: string;
  };
  productCategory?: {
    _id: string;
    name: string;
  };
  productSubCategory?: {
    _id: string;
    name: string;
  };
  wilaya: string;
  place: string;
  attributes?: string[];
  createdAt?: string;
}

const DEFAULT_DIRECT_SALE_IMAGE = "/assets/images/logo-dark.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

function DirectSaleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { isLogged, auth } = useAuth();
  const [directSale, setDirectSale] = useState<DirectSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [allDirectSales, setAllDirectSales] = useState<DirectSale[]>([]);
  const [activeTab, setActiveTab] = useState("description");

  const directSaleId = params?.id as string;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (directSaleId) {
      fetchDirectSale();
      fetchAllDirectSales();
    }
  }, [directSaleId]);

  // Filter similar direct sales (same category, exclude current)
  const similarDirectSales = useMemo(() => {
    if (!directSale || !allDirectSales.length) return [];
    return allDirectSales
      .filter((sale) => {
        // Exclude current sale
        if (sale._id === directSale._id) return false;
        // Filter by same category if available
        if (directSale.productCategory?._id) {
          return sale.productCategory?._id === directSale.productCategory._id;
        }
        // If no category, return all active sales
        return sale.status === 'ACTIVE';
      })
      .slice(0, 4);
  }, [directSale, allDirectSales]);

  const swiperSettings = useMemo(() => {
    return {
      slidesPerView: "auto" as const,
      speed: 1500,
      spaceBetween: 15,
      grabCursor: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".category-slider-next",
        prevEl: ".category-slider-prev",
      },
      breakpoints: {
        280: { slidesPerView: 2 },
        350: { slidesPerView: 3, spaceBetween: 10 },
        576: { slidesPerView: 3, spaceBetween: 15 },
        768: { slidesPerView: 4 },
        992: { slidesPerView: 5, spaceBetween: 15 },
        1200: { slidesPerView: 5 },
      },
    };
  }, []);

  const settingsForSimilar = useMemo(() => {
    return {
      slidesPerView: "auto" as const,
      speed: 1500,
      spaceBetween: 25,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".auction-slider-next",
        prevEl: ".auction-slider-prev",
      },
      breakpoints: {
        280: { slidesPerView: 1 },
        576: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        992: { slidesPerView: 3 },
        1200: { slidesPerView: 4 },
      },
    };
  }, []);

  const fetchAllDirectSales = async () => {
    try {
      const data = await DirectSaleAPI.getDirectSales();
      setAllDirectSales(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching all direct sales:", err);
    }
  };

  const fetchDirectSale = async () => {
    try {
      setLoading(true);
      const data = await DirectSaleAPI.getDirectSaleById(directSaleId);
      setDirectSale(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching direct sale:", err);
      setError("Impossible de charger les détails de la vente directe");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isLogged) {
      toast.warning("Veuillez vous connecter pour acheter");
      router.push('/auth/login');
      return;
    }

    if (!directSale) return;

    const availableQuantity = directSale.quantity === 0 
      ? Infinity 
      : directSale.quantity - directSale.soldQuantity;

    if (directSale.quantity > 0 && quantity > availableQuantity) {
      toast.error(`Seulement ${availableQuantity} article(s) disponible(s)`);
      return;
    }

    if (directSale.owner?._id === auth?.user?._id) {
      toast.error("Vous ne pouvez pas acheter votre propre produit");
      return;
    }

    try {
      setPurchasing(true);
      await DirectSaleAPI.purchase({
        directSaleId: directSale._id,
        quantity: quantity
      });
      toast.success("Commande effectuée avec succès!");

    } catch (err: any) {
      console.error("Error purchasing:", err);
      toast.error(err.response?.data?.message || "Erreur lors de la commande");
    } finally {
      setPurchasing(false);
    }
  };

  const getAvailableQuantity = (): number => {
    if (!directSale) return 0;
    if (directSale.quantity === 0) return 999; // Unlimited
    return directSale.quantity - directSale.soldQuantity;
  };

  const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return DEFAULT_DIRECT_SALE_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return `${app.route}${imagePath}`;
    return `${app.route}/${imagePath}`;
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} DA`;
  };

  if (loading) {
    return (
      <div className="auction-details-section mb-110" style={{ 
        marginTop: 0, 
        paddingTop: 'clamp(120px, 15vw, 140px)',
        minHeight: 'calc(100vh - 120px)'
      }}>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h3 className="mt-3">Chargement...</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !directSale) {
    return (
      <div className="auction-details-section mb-110" style={{ 
        marginTop: 0, 
        paddingTop: 'clamp(120px, 15vw, 140px)',
        minHeight: 'calc(100vh - 120px)'
      }}>
        <div className="container">
          <div className="alert alert-danger text-center">
            <h3>{error || "Vente directe introuvable"}</h3>
            <button className="btn btn-primary mt-3" onClick={() => router.push('/direct-sale')}>
              Retour aux ventes directes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableQuantity = getAvailableQuantity();
  const isSoldOut = directSale.status === 'SOLD_OUT' || (directSale.quantity > 0 && availableQuantity <= 0);
  const isOwner = isLogged && directSale.owner?._id === auth?.user?._id;

  const safeThumbs = directSale.thumbs || [];
  const safeVideos = directSale.videos || [];

  return (
    <>
      <style jsx>{`
        :global(.auction-details-section) {
          padding-top: clamp(120px, 15vw, 140px) !important;
        }
        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8f9fa;
          padding: 5px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .qty-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #333;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .qty-btn:hover:not(:disabled) {
          background: #0063b1;
          color: white;
        }
        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .qty-input {
          width: 50px;
          text-align: center;
          border: none;
          background: transparent;
          font-weight: 600;
          font-size: 16px;
        }
      `}</style>

      <div className="auction-details-section auction-details-modern mb-110" style={{ 
        marginTop: 0, 
        paddingTop: 'clamp(120px, 15vw, 140px)',
        minHeight: 'calc(100vh - 120px)'
      }}>
        <div className="container">
          <div className="row gy-5">
            {/* Left Column - Image Section */}
            <div className="col-xl-7 image-column-top-spacing" style={{ paddingTop: '0' }}>
              <div className="main-image-container" style={{ position: 'relative', marginTop: '0' }}>
                {showVideo && safeVideos.length > 0 ? (
                  <video
                    src={getImageUrl(safeVideos[selectedVideoIndex]?.url)}
                    controls
                    className="main-video"
                    style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                ) : (
                  <img
                    src={getImageUrl(safeThumbs[selectedImageIndex]?.url)}
                    alt={directSale.title}
                    className="main-image"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_DIRECT_SALE_IMAGE; }}
                  />
                )}

                {/* Media Toggle Buttons */}
                {(safeThumbs.length > 0 || safeVideos.length > 0) && (
                  <div className="media-toggle-buttons" style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10 }}>
                    {safeThumbs.length > 0 && (
                      <button
                        onClick={() => setShowVideo(false)}
                        className={`media-toggle-btn ${!showVideo ? 'active' : ''}`}
                        style={{ padding: '8px 12px', border: 'none', borderRadius: '4px', backgroundColor: !showVideo ? '#0063b1' : 'rgba(255,255,255,0.8)', color: !showVideo ? 'white' : '#333', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                      >
                        📷 Images ({safeThumbs.length})
                      </button>
                    )}
                    {safeVideos.length > 0 && (
                      <button
                        onClick={() => setShowVideo(true)}
                        className={`media-toggle-btn ${showVideo ? 'active' : ''}`}
                        style={{ padding: '8px 12px', border: 'none', borderRadius: '4px', backgroundColor: showVideo ? '#0063b1' : 'rgba(255,255,255,0.8)', color: showVideo ? 'white' : '#333', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                      >
                        🎥 Videos ({safeVideos.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="thumbnail-gallery-container">
                <Swiper {...swiperSettings} className="swiper thumbnail-gallery">
                  {safeThumbs.map((thumb, index) => (
                    <SwiperSlide className="swiper-slide" key={`img-${index}`}>
                      <div className={`thumbnail ${!showVideo && index === selectedImageIndex ? "active" : ""}`} onClick={() => { setSelectedImageIndex(index); setShowVideo(false); }}>
                        <img src={getImageUrl(thumb.url)} alt={`Thumb ${index}`} onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_DIRECT_SALE_IMAGE; }} />
                      </div>
                    </SwiperSlide>
                  ))}
                  {safeVideos.map((video, index) => (
                    <SwiperSlide className="swiper-slide" key={`vid-${index}`}>
                      <div className={`thumbnail ${showVideo && index === selectedVideoIndex ? "active" : ""}`} onClick={() => { setSelectedVideoIndex(index); setShowVideo(true); }}>
                        <video src={getImageUrl(video.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="play-overlay" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>▶</div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="col-xl-5">
              <div className="auction-details-content" style={{ paddingTop: 'clamp(120px, 15vw, 140px)' }}>
                {/* Title Display - Prominently at the top */}
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <h1 className="auction-title" style={{
                    fontSize: 'clamp(20px, 4vw, 28px)',
                    fontWeight: '700',
                    color: '#333',
                    margin: '0 0 15px 0',
                    lineHeight: '1.3',
                    wordBreak: 'break-word',
                    display: 'block',
                    width: '100%',
                    visibility: 'visible',
                    opacity: 1
                  }}>
                    {directSale.title}
                  </h1>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: directSale.saleType === 'PRODUCT' ? '#e3f2fd' : '#fff3e0',
                      color: directSale.saleType === 'PRODUCT' ? '#1976d2' : '#f57c00',
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: '600' 
                    }}>
                      {directSale.saleType === 'PRODUCT' ? 'Produit' : 'Service'}
                    </span>
                    {directSale.productCategory && (
                      <span style={{ 
                        background: '#f5f5f5', 
                        color: '#666', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px' 
                      }}>
                        {directSale.productCategory.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="auction-details-table mb-4">
                  <table className="table">
                    <tbody>
                      <tr>
                        <td className="fw-bold">Prix Unitaire</td>
                        <td><span style={{ color: '#0063b1', fontWeight: '700', fontSize: '20px' }}>{formatPrice(directSale.price)}</span></td>
                      </tr>
                      {directSale.saleType === 'PRODUCT' && (
                        <tr>
                          <td className="fw-bold">Disponibilité</td>
                          <td>
                            {isSoldOut ? (
                              <span className="text-danger fw-bold">Épuisé</span>
                            ) : (
                              <span className="text-success fw-bold">
                                {directSale.quantity === 0 ? "Illimitée" : `${availableQuantity} en stock`}
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="fw-bold">Vendeur</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={getImageUrl(directSale.owner?.avatar?.url || directSale.owner?.photoURL)} 
                              alt="Seller" 
                              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE; }}
                            />
                            <span>{directSale.owner?.firstName} {directSale.owner?.lastName || directSale.owner?.username}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Localisation</td>
                        <td>{directSale.wilaya}, {directSale.place}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {!isSoldOut && (
                  <div className="bid-section">
                    {isOwner && (
                       <div className="alert alert-warning">
                         Vous ne pouvez pas acheter votre propre produit.
                       </div>
                    )}
                    
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <span style={{ fontWeight: '600', color: '#333' }}>Quantité à commander:</span>
                        <div className="quantity-selector">
                          <button 
                            className="qty-btn" 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={quantity <= 1}
                          >-</button>
                          <input 
                            type="number" 
                            className="qty-input" 
                            value={quantity} 
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              const max = directSale.quantity === 0 ? 999 : availableQuantity;
                              setQuantity(Math.max(1, Math.min(val, max)));
                            }}
                          />
                          <button 
                            className="qty-btn"
                            onClick={() => setQuantity(Math.min(directSale.quantity === 0 ? 999 : availableQuantity, quantity + 1))}
                            disabled={quantity >= (directSale.quantity === 0 ? 999 : availableQuantity)}
                          >+</button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <span style={{ color: '#666' }}>Total à payer:</span>
                        <span style={{ color: '#0063b1', fontWeight: '700', fontSize: '18px' }}>
                          {formatPrice(directSale.price * quantity)}
                        </span>
                      </div>

                      <button
                        className="bid-btn-modern"
                        onClick={handlePurchase}
                        disabled={purchasing || isOwner}
                        style={{ width: '100%', opacity: (purchasing || isOwner) ? 0.7 : 1, cursor: (purchasing || isOwner) ? 'not-allowed' : 'pointer' }}
                      >
                        <div className="btn-content" style={{ justifyContent: 'center' }}>
                          <span>{purchasing ? 'Traitement...' : 'Acheter Maintenant'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="auction-details-description-area">
                <div className="tab-container">
                  <button
                    className={`tab-button ${activeTab === "description" ? "active" : ""}`}
                    onClick={() => setActiveTab("description")}
                  >
                    Description
                  </button>
                  {directSale.attributes && directSale.attributes.length > 0 && (
                    <button
                      className={`tab-button ${activeTab === "attributes" ? "active" : ""}`}
                      onClick={() => setActiveTab("attributes")}
                    >
                      Caractéristiques
                    </button>
                  )}
                </div>

                <div className="tab-content">
                  {activeTab === "description" && (
                    <div className="description-content fade show active">
                      <h3>Description du produit</h3>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{directSale.description}</p>
                    </div>
                  )}
                  {activeTab === "attributes" && (
                    <div className="description-content fade show active">
                      <h3>Caractéristiques</h3>
                      <ul className="features-list">
                        {directSale.attributes?.map((attr, index) => (
                          <li key={index}>
                            <i className="bi bi-check-circle-fill text-primary me-2"></i>
                            {attr}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Similar Direct Sales Section */}
          {similarDirectSales.length > 0 && (
            <div className="related-auction-section mb-110" style={{ paddingTop: 'clamp(120px, 15vw, 140px)' }}>
              <div className="row mb-50">
                <div className="col-lg-12 d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="section-title">
                    <h2 className="related-auction-title">Ventes <span>Similaires</span></h2>
                  </div>
                  <div className="slider-btn-grp">
                    <div className="slider-btn auction-slider-prev"><i className="bi bi-arrow-left"></i></div>
                    <div className="slider-btn auction-slider-next"><i className="bi bi-arrow-right"></i></div>
                  </div>
                </div>
              </div>
              <div className="auction-slider-area">
                <Swiper {...settingsForSimilar} className="swiper auction-slider">
                  {similarDirectSales.map((sale) => (
                    <SwiperSlide className="swiper-slide" key={sale._id}>
                      <div className="auction-card-hover" style={{ 
                        background: "white", 
                        borderRadius: "20px", 
                        overflow: "hidden", 
                        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                        border: "1px solid rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        transition: "all 0.3s"
                      }}
                      onClick={() => router.push(`/direct-sale/${sale._id}`)}
                      >
                        <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                          <img 
                            src={getImageUrl(sale.thumbs?.[0]?.url)} 
                            alt={sale.title} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_DIRECT_SALE_IMAGE; }}
                          />
                        </div>
                        <div style={{ padding: "clamp(16px, 3vw, 20px)" }}>
                          <h3 style={{ 
                            fontSize: "18px", 
                            fontWeight: "600", 
                            marginBottom: "12px", 
                            lineHeight: "1.3",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}>
                            {sale.title}
                          </h3>

                          {/* Location and Quantity Info */}
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: sale.saleType === 'SERVICE' ? '1fr' : '1fr 1fr',
                            gap: "6px",
                            marginBottom: "8px",
                          }}>
                            {sale.saleType !== 'SERVICE' && (
                              <div style={{
                                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                borderLeft: '3px solid #f7ef8a',
                              }}>
                                <p style={{
                                  fontSize: "10px",
                                  color: "#666",
                                  margin: "0 0 2px 0",
                                  fontWeight: "600",
                                }}>
                                  📦 Quantité
                                </p>
                                <p style={{
                                  fontSize: "12px",
                                  color: "#333",
                                  margin: 0,
                                  fontWeight: "500",
                                }}>
                                  {sale.quantity || "Non spécifiée"}
                                </p>
                              </div>
                            )}
                            <div style={{
                              background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                              borderRadius: '8px',
                              padding: '4px 8px',
                              borderLeft: '3px solid #f7ef8a',
                            }}>
                              <p style={{
                                fontSize: "10px",
                                color: "#666",
                                margin: "0 0 2px 0",
                                fontWeight: "600",
                              }}>
                                📍 Localisation
                              </p>
                              <p style={{
                                fontSize: "12px",
                                color: "#333",
                                margin: 0,
                                fontWeight: "500",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                                {sale.wilaya || sale.place || "Non spécifiée"}
                              </p>
                            </div>
                          </div>

                          {/* Price Info */}
                          <div style={{
                            background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                            borderRadius: "8px",
                            padding: "4px 8px",
                            marginBottom: "12px",
                            border: "1px solid #e9ecef",
                            borderLeft: '3px solid #f7ef8a',
                          }}>
                            <p style={{
                              fontSize: "10px",
                              color: "#666",
                              margin: "0 0 2px 0",
                              fontWeight: "600",
                            }}>
                              💰 Prix
                            </p>
                            <p style={{
                              fontSize: "12px",
                              color: "#0063b1",
                              margin: 0,
                              fontWeight: "600",
                            }}>
                              {formatPrice(sale.price)}
                            </p>
                          </div>

                          <button className="btn btn-primary w-100" style={{ borderRadius: "20px" }}>Voir les détails</button>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function DirectSaleDetailPage() {
  const { initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <AxiosInterceptor>
        <RequestProvider>
          <ToastContainer position="top-right" autoClose={5000} />
          <Header />
          <DirectSaleDetailContent />
          <Footer />
        </RequestProvider>
      </AxiosInterceptor>
    </>
  );
}
