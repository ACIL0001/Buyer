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

const getAuctionImageUrl = (auction: any) => {
  const possibleImageSources = [
    auction.thumbs?.[0]?.url, auction.thumbs?.[0]?.fullUrl, auction.images?.[0], 
    auction.image, auction.thumbnail, auction.photo, auction.picture, 
    auction.icon, auction.logo, auction.coverImage, auction.mainImage
  ].filter(Boolean);
  
  if (possibleImageSources.length > 0) return normalizeImageUrl(possibleImageSources[0]);
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

  const liveAuctions = useMemo(() => allAuctions.filter((a: any) => a.endingAt && new Date(a.endingAt) > new Date()).slice(0, 8), [allAuctions]);

  const [timers, setTimers] = useState<{ [key: string]: any }>({});
  
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
    slidesPerView: "auto" as const, speed: 800, spaceBetween: 20,
    breakpoints: {
      280: { slidesPerView: 1 }, 576: { slidesPerView: 2 }, 992: { slidesPerView: 3 }, 1200: { slidesPerView: 4 }
    },
  }), []);

  if (auctionsLoading) return <div style={{ background: '#fff', padding: '20px' }}><CardSkeleton /></div>;

  return (
    <div style={{ background: 'transparent', width: '100%', paddingBottom: '0px' }}>
      {/* SECTION HEADER - REMOVED OVERFLOW HIDDEN */}
      <div style={{ 
        width: '100%', 
        position: 'relative', 
        padding: '60px 0 40px', 
        textAlign: 'center',
        overflow: 'visible' /* Changed to visible to prevent pulse clipping */
      }}>

        <div style={{ position: 'relative', zIndex: 1, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{ 
              color: '#002896', 
              fontFamily: '"Inter", sans-serif',
              fontSize: '40px', 
              fontWeight: '800', 
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
      </div>

      <div className="container-responsive" style={{ background: 'transparent', maxWidth: '1400px', margin: '0 auto', padding: '0 20px', overflow: 'visible' }}>
        {liveAuctions.length > 0 ? (
          <div className="auction-carousel-container" style={{ position: 'relative', overflow: 'visible' }}>
            <Swiper modules={[Navigation, Autoplay]} {...settings} className="swiper auction-slider" style={{ padding: '30px 10px', margin: '-30px -10px', overflow: 'visible' }}>
              {liveAuctions.map((auction: any) => {
                const timer = timers[auction.id] || { days: "0", hours: "0", minutes: "0", formattedEnd: "", hasEnded: false };
                const companyName = auction.owner?.entreprise || auction.owner?.firstName || 'Nom Entreprise';
                
                return (
                  <SwiperSlide key={auction.id} style={{ overflow: 'visible' }}>
                    <div 
                      key={auction.id}
                      style={{ 
                        width: '295px', 
                        height: '410px',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 1,
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                      onClick={() => router.push(`/auction-details/${auction.id}`)}
                    >
                      <div style={{ width: '295px', height: '295px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                          <ShareButton 
                            type="auction" 
                            id={auction.id} 
                            title={auction.title} 
                            description={auction.description} 
                            imageUrl={getAuctionImageUrl(auction)} 
                          />
                        </div>
                        <img 
                          src={getAuctionImageUrl(auction)} 
                          alt={auction.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
                          onError={(e) => (e.currentTarget.src = DEFAULT_AUCTION_IMAGE)} 
                        />
                      </div>
                      <div style={{ 
                        padding: '12px 10px', 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <h4 style={{ 
                          width: '114px',
                          height: '23px',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: '700', 
                          fontSize: '20px', 
                          lineHeight: '100%',
                          letterSpacing: '0px',
                          verticalAlign: 'middle',
                          color: '#062C90', 
                          margin: '0 0 6px 0', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          opacity: 1
                        }}>
                          {auction.title || 'Nom Produit'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ 
                              minWidth: '46px',
                              height: '29px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: '700', 
                              fontSize: '24px', 
                              lineHeight: '100%',
                              color: '#062C90',
                              verticalAlign: 'middle'
                            }}>
                             {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()}
                            </span>
                            <span style={{ 
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px', 
                              fontWeight: '700', 
                              color: '#062C90',
                              marginLeft: '2px'
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ 
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '14px', 
                            fontWeight: '400', 
                            lineHeight: '100%',
                            letterSpacing: '0px',
                            verticalAlign: 'middle',
                            color: '#002896',
                            width: '213px',
                            height: '16px',
                            whiteSpace: 'nowrap'
                          }}>
                            {timer.hasEnded ? 'Terminé' : `Temps restant ${timer.days}j${timer.hours}h ${timer.formattedEnd})`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            
            <div style={{ textAlign: 'center', marginTop: '60px', position: 'relative', zIndex: 10 }}>
              <Link href="/auction-sidebar" style={{ display: 'inline-flex', width: '93px', height: '28px', alignItems: 'center', justifyContent: 'center', color: '#002896', textDecoration: 'none', fontSize: '24px', fontWeight: '700', fontFamily: 'Roboto, sans-serif', lineHeight: '100%', whiteSpace: 'nowrap', position: 'relative', zIndex: 20, cursor: 'pointer', transition: 'all 0.3s ease' }}>
                Voir tout
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ color: '#002896', textAlign: 'center', padding: '40px', fontWeight: 'bold' }}>Aucune enchère en cours</div>
        )}
      </div>
    </div>
  );
};

export default Home1LiveAuction;