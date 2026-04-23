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

const getTenderImageUrl = (tender: any) => {
  if (tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url) {
    return normalizeImageUrl(tender.attachments[0].url);
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
    slidesPerView: "auto" as const, 
    speed: 800, 
    spaceBetween: 20,
    loop: true,
    navigation: {
      nextEl: '.tender-next',
      prevEl: '.tender-prev',
    },
    breakpoints: {
      0: { slidesPerView: "auto" as const }
    },
  }), []);

  if (tendersLoading) return <div style={{ background: '#fff', padding: '20px' }}><CardSkeleton /></div>;

  return (
    <div style={{ background: 'transparent', width: '100%', paddingBottom: '0px' }}>
    <div className="tenders-section-wrapper" style={{ width: '100%', position: 'relative', overflow: 'visible' }}>
      {/* SECTION HEADER */}
      <div style={{ 
        width: '100%', 
        maxWidth: '1400px', 
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
            initial={{ opacity: 0, scale: 1.1 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
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
            Consultez les projets et soumissionnez
          </motion.h2>
          <motion.div initial={{ width: 0 }} whileInView={{ width: '100px' }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 1 }} style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #002896, transparent)', marginTop: '15px', borderRadius: '10px' }} />
        </div>

        <div style={{ position: 'absolute', right: '35px', top: '75px' }}>
          <Link href="/tenders" style={{ 
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

      <div className="container-responsive" style={{ background: 'transparent', maxWidth: '1400px', margin: '0 auto', padding: '0 20px', overflow: 'visible' }}>
        {liveTenders.length > 0 ? (
          <div className="tender-carousel-container" style={{ position: 'relative', overflow: 'visible' }}>
            <div style={{ position: 'relative' }}>
              <Swiper modules={[Navigation, Autoplay]} {...settings} className="swiper tender-slider" style={{ padding: '30px 10px', margin: '-30px -10px', overflow: 'visible' }}>
                {liveTenders.map((tender: any) => {
                  const timer = timers[tender.id] || { days: "0", hours: "0", minutes: "0", formattedEnd: "", hasEnded: false };
                  const companyName = tender.hidden ? 'Anonyme' : (tender.owner?.entreprise || tender.owner?.companyName || tender.owner?.firstName || 'Nom annonceur');
                  
                  return (
                    <SwiperSlide key={tender.id} style={{ overflow: 'visible', width: '288px', minWidth: '288px', maxWidth: '288px' }}>
                      <div 
                        key={tender.id}
                        style={{ 
                          width: '288px',
                          minWidth: '288px',
                          maxWidth: '288px',
                          height: '383px',
                          minHeight: '383px',
                          maxHeight: '383px',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 1,
                          borderRadius: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}
                        onClick={() => router.push(`/tender-details/${tender.id}`)}
                      >
                        <div style={{ width: '288px', height: '280px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                            <ShareButton 
                              type="tender" 
                              id={tender.id} 
                              title={tender.title} 
                              description={tender.description} 
                              imageUrl={getTenderImageUrl(tender)} 
                            />
                          </div>
                          <img 
                            src={getTenderImageUrl(tender)} 
                            alt={tender.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
                            onError={(e) => (e.currentTarget.src = DEFAULT_TENDER_IMAGE)} 
                          />
                        </div>
                        <div style={{ 
                          padding: '10px 10px', 
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative'
                        }}>
                          <h4 style={{ 
                            width: '281px',
                            height: '23px',
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: '700', 
                            fontSize: '20px', 
                            lineHeight: '100%',
                            letterSpacing: '0px',
                            verticalAlign: 'middle',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ 
                                width: 'auto',
                                height: '29px',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: '700', 
                                fontSize: '24px', 
                                lineHeight: '29px',
                                color: '#002896',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                {(tender.budget || tender.maxBudget || tender.price) ? `${Number(tender.budget || tender.maxBudget || tender.price).toLocaleString()}` : "Offre"}
                              </span>
                              {(tender.budget || tender.maxBudget || tender.price) && (
                                <span style={{ 
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '14px', 
                                  fontWeight: '700', 
                                  color: '#002896',
                                  marginLeft: '2px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>DA</span>
                              )}
                            </div>
                            <span style={{ 
                              width: '101px',
                              height: '16px',
                              fontFamily: 'Roboto, sans-serif',
                              fontSize: '14px', 
                              fontWeight: '400', 
                              lineHeight: '16px',
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
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
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
                    </SwiperSlide>
                  );
                })}
              </Swiper>
  
              {/* Custom Navigation Buttons - Oval Style */}
              <div className="tender-prev" style={{
                position: 'absolute',
                top: '180px',
                left: '-40px',
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
              <div className="tender-next" style={{
                position: 'absolute',
                top: '180px',
                right: '-40px',
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
          <div style={{ color: '#002896', textAlign: 'center', padding: '40px', fontWeight: 'bold' }}>Aucune offre en cours</div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Home1LiveTenders;