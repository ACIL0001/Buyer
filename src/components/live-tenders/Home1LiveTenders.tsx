"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { TendersAPI } from "@/app/api/tenders";
import { motion } from "framer-motion";
import app from '@/config';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CardSkeleton from '../skeletons/CardSkeleton';
import useAuth from '@/hooks/useAuth';
import { normalizeImageUrl } from '@/utils/url';
import { useRouter } from "next/navigation";
import { useCreateSocket } from '@/contexts/socket';
import ShareButton from "@/components/common/ShareButton";

const DEFAULT_TENDER_IMAGE = "/assets/images/logo-white.png";

export function calculateTimeRemaining(endDate: string) {
  const total = Date.parse(endDate) - Date.now();
  if (total <= 0) return { days: "0", hours: "0", minutes: "0", seconds: "0", hasEnded: true };
  const d = Math.floor(total / (1000 * 60 * 60 * 24));
  const h = Math.floor((total / (1000 * 60 * 60)) % 24);
  const m = Math.floor((total / 1000 / 60) % 60);
  
  const endObj = new Date(endDate);
  const daysArr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const formattedEnd = `${endObj.getDate()}${daysArr[endObj.getDay()]} ${endObj.getHours()}h${endObj.getMinutes().toString().padStart(2, '0')}`;

  return {
    days: d.toString(),
    hours: h.toString(),
    minutes: m.toString(),
    formattedEnd,
    hasEnded: false
  };
}

const getTenderImageUrl = (tender: any, index: number = 0) => {
  const images = tender.attachments || tender.images || [];
  if (images.length > 0 && images[index]) {
    const imgObj = images[index];
    const url = typeof imgObj === 'string' ? imgObj : (imgObj.url || imgObj.fullUrl || imgObj);
    return normalizeImageUrl(url);
  }
  return DEFAULT_TENDER_IMAGE;
};

const Home1LiveTenders = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { auth } = useAuth();
  const { data: allTendersResponse, isLoading: tendersLoading } = useQuery({
    queryKey: ['tenders', 'active'],
    queryFn: () => TendersAPI.getActiveTenders(),
  });

  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [cardImageIndexes, setCardImageIndexes] = useState<{ [key: string]: number }>({});
  const allTenders = useMemo(() => {
    const data = allTendersResponse?.data || allTendersResponse || [];
    const transformed = (Array.isArray(data) ? data : []).map((tender: any) => ({
      ...tender, id: tender.id || tender._id,
    }));
    const isUserVerified = auth.user?.isVerified === true || auth.user?.isVerified === 1;
    return transformed.filter((tender: any) => tender.verifiedOnly === true ? isUserVerified : true);
  }, [allTendersResponse, auth.user]);

  const queryClient = useQueryClient();
  const socketContext = useCreateSocket();
  const socket = socketContext?.socket;

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => { if (data?.type === 'tender') queryClient.invalidateQueries({ queryKey: ['tenders'] }); };
    socket.on('newListingCreated', handler);
    return () => { socket.off('newListingCreated', handler); };
  }, [socket, queryClient]);

  const liveTenders = useMemo(() => {
    return allTenders
      .filter((tender: any) => tender.endingAt && new Date(tender.endingAt) > new Date())
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 8);
  }, [allTenders]);

  const [timers, setTimers] = useState<{ [key: string]: any }>({});
  useEffect(() => {
    if (liveTenders.length === 0) return;
    const updateTimers = () => {
      const newTimers: { [key: string]: any } = {};
      liveTenders.forEach((tender: any) => {
        if (tender.id && tender.endingAt) newTimers[tender.id] = calculateTimeRemaining(tender.endingAt);
      });
      setTimers(newTimers);
    };
    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, [liveTenders]);

  const settings = useMemo(() => ({
    slidesPerView: 1,
    speed: 800,
    spaceBetween: 16,
    loop: true,
    navigation: {
      nextEl: '.tender-next',
      prevEl: '.tender-prev',
    },
    breakpoints: {
      0: { slidesPerView: 1, spaceBetween: 12 },
      475: { slidesPerView: 1.2, spaceBetween: 14 },
      640: { slidesPerView: 2, spaceBetween: 16 },
      768: { slidesPerView: 2, spaceBetween: 18 },
      1024: { slidesPerView: 3, spaceBetween: 20 },
      1280: { slidesPerView: 4, spaceBetween: 20 },
    },
  }), []);

  if (tendersLoading) return <div style={{ background: '#fff', padding: '20px' }}><CardSkeleton /></div>;

  return (
    <div style={{ background: 'transparent', width: '100%', paddingBottom: '0px' }}>
    <div className="tenders-section-wrapper" style={{ width: '100%', position: 'relative', overflow: 'visible' }}>
      {/* SECTION HEADER */}
      <style jsx>{`
        .live-section-header {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          position: relative;
          padding: clamp(32px, 6vw, 60px) clamp(16px, 4vw, 20px) clamp(20px, 4vw, 40px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }
        .live-section-voirtout {
          position: absolute;
          right: clamp(12px, 3vw, 35px);
          top: clamp(40px, 8vw, 75px);
        }
        @media (max-width: 640px) {
          .live-section-header {
            flex-direction: column;
            gap: 12px;
          }
          .live-section-voirtout {
            position: static;
            right: auto;
            top: auto;
          }
        }
      `}</style>
      <div className="live-section-header">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.h2
            initial={{ opacity: 0, scale: 1.1 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
            style={{
              color: '#002896',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(1.75rem, 5vw, 3rem)',
              fontWeight: '700',
              margin: 0,
              letterSpacing: '0px',
              lineHeight: 1.1,
              textAlign: 'center'
            }}
          >
            Consultez les projets et soumissionnez
          </motion.h2>
          <motion.div initial={{ width: 0 }} whileInView={{ width: '100px' }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 1 }} style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #002896, transparent)', marginTop: '15px', borderRadius: '10px' }} />
        </div>

        <div className="live-section-voirtout">
          <Link href="/tenders" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#002896',
            textDecoration: 'none',
            fontSize: 'clamp(0.875rem, 1.6vw, 1.25rem)',
            fontWeight: '700',
            fontFamily: 'Roboto, sans-serif',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            Voir tout
          </Link>
        </div>
      </div>

      <div className="container-responsive" style={{ background: 'transparent', maxWidth: '1240px', margin: '0 auto', padding: '0 clamp(12px, 3vw, 20px)', overflow: 'visible' }}>
        {liveTenders.length > 0 ? (
          <div className="tender-carousel-container" style={{ position: 'relative', overflow: 'visible' }}>
            <div style={{ position: 'relative' }}>
              <Swiper modules={[Navigation, Autoplay]} {...settings} className="swiper tender-slider" style={{ padding: '30px 0', margin: '-30px 0', overflow: 'hidden' }}>
                {liveTenders.map((tender: any) => {
                  const timer = timers[tender.id] || { days: "0", hours: "0", minutes: "0", formattedEnd: "", hasEnded: false };
                  const companyName = tender.hidden ? 'Anonyme' : (tender.owner?.entreprise || tender.owner?.companyName || tender.owner?.firstName || 'Nom annonceur');
                  
                  return (
                    <SwiperSlide key={tender.id} style={{ overflow: 'visible', perspective: '1000px' }}>
                      <motion.div 
                        key={tender.id}
                        initial={false}
                        animate={{ rotateY: flippedId === tender.id ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        style={{
                          width: '100%',
                          maxWidth: '320px',
                          aspectRatio: '284 / 464',
                          margin: '0 auto',
                          position: 'relative',
                          zIndex: 1,
                          transformStyle: 'preserve-3d'
                        }}
                      >
                        {/* FRONT SIDE */}
                        <div 
                          style={{
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            boxShadow: 'none',
                            border: 'none'
                          }}
                          onClick={() => router.push(`/tender-details/${tender.id}`)}
                        >
                        <div style={{ width: '100%', aspectRatio: '288 / 280', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                            <ShareButton 
                              type="tender" 
                              id={tender.id} 
                              title={tender.title} 
                              description={tender.description} 
                              imageUrl={getTenderImageUrl(tender, cardImageIndexes[tender.id] || 0)} 
                            />
                          </div>
                          <img 
                            src={getTenderImageUrl(tender, cardImageIndexes[tender.id] || 0)} 
                            alt={tender.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
                            onError={(e) => (e.currentTarget.src = DEFAULT_TENDER_IMAGE)} 
                          />

                          {/* Image Navigation Arrows */}
                          {(tender.attachments?.length > 1 || tender.images?.length > 1) && (
                            <>
                              <div 
                                className="image-nav-arrow"
                                style={{
                                  position: 'absolute',
                                  top: '45%',
                                  left: '8px',
                                  transform: 'translateY(-50%)',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255,255,255,0.9)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  zIndex: 25,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  border: 'none',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const total = (tender.attachments?.length || tender.images?.length || 1);
                                  const current = cardImageIndexes[tender.id] || 0;
                                  setCardImageIndexes({ ...cardImageIndexes, [tender.id]: (current - 1 + total) % total });
                                }}
                              >
                                <i className="bi bi-chevron-left" style={{ color: '#002896', fontSize: '12px' }}></i>
                              </div>
                              <div 
                                className="image-nav-arrow"
                                style={{
                                  position: 'absolute',
                                  top: '45%',
                                  right: '8px',
                                  transform: 'translateY(-50%)',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(255,255,255,0.9)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  zIndex: 25,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  border: 'none',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const total = (tender.attachments?.length || tender.images?.length || 1);
                                  const current = cardImageIndexes[tender.id] || 0;
                                  setCardImageIndexes({ ...cardImageIndexes, [tender.id]: (current + 1) % total });
                                }}
                              >
                                <i className="bi bi-chevron-right" style={{ color: '#002896', fontSize: '12px' }}></i>
                              </div>
                              
                              {/* Dots indicator */}
                              <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '4px',
                                zIndex: 25
                              }}>
                                {(tender.attachments || tender.images).map((_: any, i: number) => (
                                  <div key={i} style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: (cardImageIndexes[tender.id] || 0) === i ? '#002896' : 'rgba(255,255,255,0.6)',
                                    transition: 'all 0.3s ease'
                                  }} />
                                ))}
                              </div>
                            </>
                          )}
                          
                          <div 
                            style={{ 
                              position: 'absolute', 
                              bottom: '10px', 
                              right: '10px', 
                              zIndex: 30,
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              padding: '3px 8px',
                              borderRadius: '15px',
                              boxShadow: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.3s ease',
                              border: 'none'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFlippedId(flippedId === tender.id ? null : tender.id);
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#fff';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: '600', 
                              color: '#002896',
                              fontFamily: 'Inter, sans-serif'
                            }}>Plus de détails</span>
                            <i className="bi bi-info-circle" style={{ color: '#002896', fontSize: '12px' }}></i>
                          </div>
                        </div>
                        <div style={{ 
                          padding: '10px 10px', 
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative'
                        }}>
                          <div>
                            <h4 style={{
                              width: '100%',
                              fontFamily: 'Roboto, sans-serif',
                              fontWeight: '700',
                              fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
                              lineHeight: 1.15,
                              letterSpacing: '0px',
                              color: '#002896',
                              margin: '0 0 5px 0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              opacity: 1
                            }}>
                              {tender.title || 'Nom Produit'}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                <span style={{ 
                                  width: 'auto',
                                  height: '29px',
                                  fontFamily: 'Inter, sans-serif',
                                  fontWeight: '700', 
                                  fontSize: Number(tender.budget || tender.maxBudget || tender.price || 0).toLocaleString().length > 10 ? '16px' : 
                                            Number(tender.budget || tender.maxBudget || tender.price || 0).toLocaleString().length > 8 ? '20px' : '24px', 
                                  lineHeight: '29px',
                                  color: '#002896',
                                  transition: 'font-size 0.2s ease'
                                }}>
                                  {(tender.budget || tender.maxBudget || tender.price) ? `${Number(tender.budget || tender.maxBudget || tender.price).toLocaleString()}` : "Offre"}
                                </span>
                                {(tender.budget || tender.maxBudget || tender.price) && (
                                  <span style={{ 
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    color: '#002896',
                                    marginLeft: '1px'
                                  }}>DA</span>
                                )}
                              </div>
                              <span style={{
                                maxWidth: '120px',
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
                                fontWeight: '400',
                                lineHeight: 1.2,
                                color: '#002896',
                                display: 'flex',
                                alignItems: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                textAlign: 'right',
                                justifyContent: 'flex-end'
                              }}>
                                {companyName}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ 
                                width: '100%',
                                height: '16px',
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: '14px', 
                                fontWeight: '400', 
                                lineHeight: '100%',
                                color: '#002896',
                                display: 'flex',
                                alignItems: 'center',
                                letterSpacing: '-0.3px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                verticalAlign: 'middle',
                                opacity: 1
                              }}>
                                {timer.hasEnded ? 'Terminé' : `Temps restant ${timer.days}j ${timer.hours}h (${timer.formattedEnd})`}
                              </span>
                            </div>
                          </div>


                        </div>
                      </div>

                        {/* BACK SIDE */}
                        <div 
                          style={{
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            borderRadius: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            backgroundColor: 'transparent',
                            color: '#333',
                            transform: 'rotateY(180deg)',
                            padding: '18px',
                            boxSizing: 'border-box',
                            border: 'none',
                            boxShadow: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', fontFamily: 'Roboto, sans-serif', color: '#002896', textTransform: 'uppercase' }}>Fiche Technique</h4>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setFlippedId(null);
                              }}
                              style={{ backgroundColor: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            >
                              <i className="bi bi-x-lg" style={{ fontSize: '16px' }}></i>
                            </button>
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {/* Databook rows */}
                            {[
                              { label: 'Désignation', value: tender.title },
                              ...(tender.evaluationType !== 'MIEUX_DISANT' ? [{ label: 'Budget', value: (tender.budget || tender.maxBudget || tender.price) ? `${Number(tender.budget || tender.maxBudget || tender.price).toLocaleString()} DA` : "Offre" }] : []),
                              { label: 'Quantité', value: tender.quantity || 'N/A' },
                              { label: 'Type', value: (tender.bidType === 'SERVICE' || tender.tenderType === 'SERVICE') ? '🛠️ Service' : '📦 Produit' },
                              { label: 'Catégorie', value: tender.category?.name || tender.productSubCategory?.name || tender.productCategory?.name || tender.categoryName || 'Général' },
                              { label: 'Localisation', value: `${tender.wilaya || ''}${tender.location ? ', ' + tender.location : ''}` || 'Algérie' },
                              { label: 'Annonceur', value: companyName },
                              { label: 'Terminaison', value: timer.hasEnded ? 'Terminé' : `${timer.days}j ${timer.hours}h` },
                            ].map((row, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '1px', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '10px', fontWeight: '600', color: '#888', flexShrink: 0 }}>{row.label}</span>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#333', textAlign: 'right', marginLeft: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{row.value}</span>
                              </div>
                            ))}

                            <div style={{ marginTop: '3px' }}>
                              <p style={{ fontSize: '11px', fontWeight: '600', color: '#888', margin: '0 0 2px 0' }}>Description du projet</p>
                              <p style={{ 
                                fontSize: '11px', 
                                color: '#555', 
                                margin: 0, 
                                lineHeight: '1.3', 
                                fontFamily: 'Inter, sans-serif',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {tender.description || 'Aucune description disponible.'}
                              </p>
                            </div>
                          </div>

                          <button 
                            style={{
                              width: '100%',
                              height: '40px',
                              backgroundColor: '#EB4545',
                              color: '#fff',
                              borderRadius: '8px',
                              border: 'none',
                              marginTop: '12px',
                              fontWeight: '700',
                              fontSize: '13px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onClick={() => router.push(`/tender-details/${tender.id}`)}
                          >
                            Consulter l'offre
                          </button>
                        </div>
                      </motion.div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
  
              {/* Custom Navigation Buttons - Oval Style */}
              <div className="tender-prev" style={{
                position: 'absolute',
                top: '50%',
                left: 'clamp(4px, 1vw, 10px)',
                transform: 'translateY(-50%)',
                width: 'clamp(40px, 5vw, 60px)',
                height: 'clamp(32px, 4vw, 40px)',
                backgroundColor: 'white',
                borderRadius: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                zIndex: 100,
                color: '#002896',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease'
              }}>
                <i className="bi bi-chevron-left" style={{ fontSize: '20px' }}></i>
              </div>
              <div className="tender-next" style={{
                position: 'absolute',
                top: '50%',
                right: 'clamp(4px, 1vw, 10px)',
                transform: 'translateY(-50%)',
                width: 'clamp(40px, 5vw, 60px)',
                height: 'clamp(32px, 4vw, 40px)',
                backgroundColor: 'white',
                borderRadius: '25px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                zIndex: 100,
                color: '#002896',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease'
              }}>
                <i className="bi bi-chevron-right" style={{ fontSize: '20px' }}></i>
              </div>
            </div>
            
            <div style={{ height: '40px' }} />
          </div>
        ) : (
          <div style={{ color: '#002896', textAlign: 'center', padding: '40px', fontWeight: 'bold' }}>Aucune offre en cours</div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Home1LiveTenders;