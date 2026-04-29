"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { AuctionsAPI } from "@/app/api/auctions";
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

const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";

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

const getAuctionImageUrl = (auction: any, index: number = 0) => {
  const images = auction.thumbs || auction.images || [];
  if (images.length > 0 && images[index]) {
    const imgObj = images[index];
    const url = typeof imgObj === 'string' ? imgObj : (imgObj.url || imgObj.fullUrl || imgObj);
    return normalizeImageUrl(url);
  }
  return DEFAULT_AUCTION_IMAGE;
};

const Home1LiveAuction = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { auth } = useAuth();
  const { data: allAuctionsResponse, isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions', 'all'],
    queryFn: () => AuctionsAPI.getAuctions(),
  });

  const allAuctions = useMemo(() => {
    const data = (allAuctionsResponse as any)?.data || (Array.isArray(allAuctionsResponse) ? allAuctionsResponse : []);
    const transformed = (Array.isArray(data) ? data : []).map((auction: any) => ({ ...auction, id: auction.id || auction._id }));
    const nonProAuctions = transformed.filter((a: any) => a.isPro !== true);
    const isUserVerified = auth.user?.isVerified === true || auth.user?.isVerified === 1;
    return nonProAuctions.filter((a: any) => a.verifiedOnly === true ? isUserVerified : true);
  }, [allAuctionsResponse, auth.user]);

  const queryClient = useQueryClient();
  const socketContext = useCreateSocket();
  const socket = socketContext?.socket;

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => { if (data?.type === 'auction') queryClient.invalidateQueries({ queryKey: ['auctions'] }); };
    socket.on('newListingCreated', handler);
    return () => { socket.off('newListingCreated', handler); };
  }, [socket, queryClient]);

  const liveAuctions = useMemo(() => {
    return allAuctions
      .filter((a: any) => a.endingAt && new Date(a.endingAt) > new Date())
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 8);
  }, [allAuctions]);

  const [timers, setTimers] = useState<{ [key: string]: any }>({});
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [cardImageIndexes, setCardImageIndexes] = useState<{ [key: string]: number }>({});
  
  useEffect(() => {
    if (liveAuctions.length === 0) return;
    const updateTimers = () => {
      const newTimers: { [key: string]: any } = {};
      liveAuctions.forEach((auction: any) => {
        if (auction.id && auction.endingAt) newTimers[auction.id] = calculateTimeRemaining(auction.endingAt);
      });
      setTimers(newTimers);
    };
    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, [liveAuctions]);

  const settings = useMemo(() => ({
    slidesPerView: 4, 
    speed: 800, 
    spaceBetween: 20,
    loop: true,
    navigation: {
      nextEl: '.auction-next',
      prevEl: '.auction-prev',
    },
    breakpoints: {
      1200: { slidesPerView: 4 },
      992: { slidesPerView: 3 },
      768: { slidesPerView: 2 },
      0: { slidesPerView: 1 }
    },
  }), []);

  if (auctionsLoading) return <div style={{ background: '#fff', padding: '20px' }}><CardSkeleton /></div>;

  return (
    <div style={{ background: 'transparent', width: '100%', paddingBottom: '0px' }}>
    <div className="auctions-section-wrapper" style={{ width: '100%', position: 'relative', overflow: 'visible' }}>
      {/* SECTION HEADER - REMOVED OVERFLOW HIDDEN */}
      <div style={{ 
        width: '100%', 
        maxWidth: '1240px', 
        margin: '0 auto',
        position: 'relative', 
        padding: '60px 20px 40px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{ 
              color: '#002896', 
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '48px', 
              fontWeight: '700', 
              margin: 0, 
              letterSpacing: '0px', 
              lineHeight: '100%',
              textAlign: 'center'
            }}
          >
            Enchères à la une
          </motion.h2>
          <motion.div initial={{ width: 0 }} whileInView={{ width: '100px' }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 1 }} style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #002896, transparent)', marginTop: '15px', borderRadius: '10px' }} />
        </div>

        <div style={{ position: 'absolute', right: '35px', top: '75px' }}>
          <Link href="/auction-sidebar" style={{ 
            display: 'inline-flex', 
            width: '93px', 
            height: '28px', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#002896', 
            textDecoration: 'none', 
            fontSize: '20px', 
            fontWeight: '700', 
            fontFamily: 'Roboto, sans-serif', 
            lineHeight: '100%', 
            whiteSpace: 'nowrap', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease' 
          }}>
            Voir tout
          </Link>
        </div>
      </div>

      <div className="container-responsive" style={{ background: 'transparent', maxWidth: '1240px', margin: '0 auto', padding: '0 20px', overflow: 'visible' }}>
        {liveAuctions.length > 0 ? (
          <div className="auction-carousel-container" style={{ position: 'relative', overflow: 'visible' }}>
            <div style={{ position: 'relative' }}>
              <Swiper modules={[Navigation, Autoplay]} {...settings} className="swiper auction-slider" style={{ padding: '30px 10px', margin: '-30px -10px', overflow: 'hidden' }}>
                {liveAuctions.map((auction: any) => {
                  const timer = timers[auction.id] || { days: "0", hours: "0", minutes: "0", formattedEnd: "", hasEnded: false };
                  const companyName = auction.owner?.entreprise || auction.owner?.firstName || 'Nom Entreprise';
                  
                  return (
                    <SwiperSlide key={auction.id} style={{ overflow: 'visible', perspective: '1000px' }}>
                      <motion.div 
                        key={auction.id}
                        initial={false}
                        animate={{ rotateY: flippedId === auction.id ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ 
                          width: '284px',
                          minWidth: '284px',
                          maxWidth: '284px',
                          height: '464px',
                          minHeight: '464px',
                          maxHeight: '464px',
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
                          onClick={() => router.push(`/auction-details/${auction.id}`)}
                        >
                        <div style={{ width: '284px', height: '295px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                            <ShareButton 
                              type="auction" 
                              id={auction.id} 
                              title={auction.title} 
                              description={auction.description} 
                              imageUrl={getAuctionImageUrl(auction, cardImageIndexes[auction.id] || 0)} 
                            />
                          </div>
                          <img 
                            src={getAuctionImageUrl(auction, cardImageIndexes[auction.id] || 0)} 
                            alt={auction.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
                            onError={(e) => (e.currentTarget.src = DEFAULT_AUCTION_IMAGE)} 
                          />

                          {/* Image Navigation Arrows */}
                          {(auction.thumbs?.length > 1 || auction.images?.length > 1) && (
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
                                  const total = (auction.thumbs?.length || auction.images?.length || 1);
                                  const current = cardImageIndexes[auction.id] || 0;
                                  setCardImageIndexes({ ...cardImageIndexes, [auction.id]: (current - 1 + total) % total });
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
                                  const total = (auction.thumbs?.length || auction.images?.length || 1);
                                  const currentIdx = cardImageIndexes[auction.id] || 0;
                                  setCardImageIndexes({ ...cardImageIndexes, [auction.id]: (currentIdx + 1) % total });
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
                                {(auction.thumbs || auction.images).map((_: any, i: number) => (
                                  <div key={i} style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: (cardImageIndexes[auction.id] || 0) === i ? '#002896' : 'rgba(255,255,255,0.6)',
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
                              setFlippedId(flippedId === auction.id ? null : auction.id);
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
                          padding: '8px 10px', 
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <h4 style={{ 
                            width: '280px',
                            height: '23px',
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: '700', 
                            fontSize: '20px', 
                            lineHeight: '100%',
                            letterSpacing: '0px',
                            verticalAlign: 'middle',
                            color: '#002896', 
                            margin: '0 0 8px 0', 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            opacity: 1
                          }}>
                            {auction.title || 'Nom Produit'}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                              <span style={{ 
                                width: 'auto',
                                height: '29px',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: '700', 
                                fontSize: Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString().length > 10 ? '16px' : 
                                          Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString().length > 8 ? '20px' : '24px', 
                                lineHeight: '100%',
                                color: '#062C90',
                                verticalAlign: 'middle',
                                transition: 'font-size 0.2s ease'
                              }}>
                               {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()}
                              </span>
                              <span style={{ 
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px', 
                                fontWeight: '700', 
                                color: '#062C90',
                                marginLeft: '1px'
                              }}>DA</span>
                            </div>
                            <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '10px' }}>
                              <span style={{ 
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: '14px', 
                                fontWeight: '400', 
                                lineHeight: '100%',
                                color: '#002896', 
                                whiteSpace: 'nowrap',
                                width: '69px',
                                height: '16px'
                              }}>
                                {auction.participantsCount || 0} enchères
                              </span>
                              <span style={{ 
                                width: '101px',
                                height: '16px',
                                fontFamily: 'Roboto, sans-serif',
                                fontSize: '14px', 
                                fontWeight: '400', 
                                lineHeight: '100%',
                                color: '#062C90', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                textAlign: 'right' 
                              }}>
                                {companyName}
                              </span>
                            </div>
                          </div>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <span style={{ 
                              fontFamily: 'Roboto, sans-serif',
                              fontSize: '14px', 
                              fontWeight: '400', 
                              lineHeight: '100%',
                              letterSpacing: '0px',
                              verticalAlign: 'middle',
                              color: '#002896',
                              width: '100%',
                              whiteSpace: 'nowrap',
                              height: '16px'
                            }}>
                              {timer.hasEnded ? 'Terminé' : `Temps restant ${timer.days}j${timer.hours}h (${timer.formattedEnd})`}
                            </span>
                          </div>

                          <button 
                            disabled={timer.hasEnded}
                            style={{
                              width: '264px',
                              height: '39px',
                              backgroundColor: '#EB4545',
                              borderRadius: '10px',
                              padding: '10px',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: timer.hasEnded ? 'default' : 'pointer',
                              gap: '10px',
                              opacity: timer.hasEnded ? 0.6 : 1,
                              transition: 'all 0.3s ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!timer.hasEnded) router.push(`/auction-details/${auction.id}`);
                            }}
                            onMouseOver={(e) => {
                              if (!timer.hasEnded) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.filter = 'brightness(1.1)';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!timer.hasEnded) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.filter = 'brightness(1)';
                              }
                            }}
                          >
                            <span style={{
                              width: '116px',
                              height: '19px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: '500',
                              fontSize: '16px',
                              lineHeight: '100%',
                              color: '#FFFFFF',
                              textAlign: 'center'
                            }}>
                              Enchère rapide
                            </span>
                          </button>
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
                              { label: 'Désignation', value: auction.title },
                              { label: 'Mise à prix', value: `${Number(auction.startingPrice || 0).toLocaleString()} DA` },
                              { label: 'Participation', value: `${auction.participantsCount || 0} inscrits` },
                              { label: 'Type', value: (auction.bidType === 'SERVICE' || auction.type === 'SERVICE') ? '🛠️ Service' : '📦 Produit' },
                              { label: 'Catégorie', value: auction.category?.name || auction.productSubCategory?.name || auction.productCategory?.name || auction.categoryName || 'Général' },
                              { label: 'Localisation', value: `${auction.wilaya || ''}${auction.place ? ', ' + auction.place : ''}` || 'Algérie' },
                              { label: 'Annonceur', value: companyName },
                              { label: 'Terminaison', value: timer.hasEnded ? 'Terminé' : `${timer.days}j ${timer.hours}h` },
                            ].map((row, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '1px', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '10px', fontWeight: '600', color: '#888', flexShrink: 0 }}>{row.label}</span>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#333', textAlign: 'right', marginLeft: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{row.value}</span>
                              </div>
                            ))}

                            <div style={{ marginTop: '3px' }}>
                              <p style={{ fontSize: '11px', fontWeight: '600', color: '#888', margin: '0 0 2px 0' }}>Description</p>
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
                                {auction.description || 'Aucune description disponible.'}
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
                            onClick={() => router.push(`/auction-details/${auction.id}`)}
                          >
                            Consulter l'annonce
                          </button>
                        </div>
                      </motion.div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              
              {/* Custom Navigation Buttons - Oval Style */}
              <div className="auction-prev" style={{
                position: 'absolute',
                top: '232px',
                left: '10px',
                transform: 'translateY(-50%)',
                width: '60px',
                height: '40px',
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
              <div className="auction-next" style={{
                position: 'absolute',
                top: '232px',
                right: '10px',
                transform: 'translateY(-50%)',
                width: '60px',
                height: '40px',
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
          <div style={{ color: '#002896', textAlign: 'center', padding: '40px', fontWeight: 'bold' }}>Aucune enchère en cours</div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Home1LiveAuction;