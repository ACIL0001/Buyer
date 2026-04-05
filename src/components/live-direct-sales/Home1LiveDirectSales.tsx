"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import { DirectSaleAPI } from "@/app/api/direct-sale";
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

const DEFAULT_DIRECT_SALE_IMAGE = "/assets/images/logo-white.png";

const getDirectSaleImageUrl = (directSale: any) => {
  if (directSale.thumbs && directSale.thumbs.length > 0 && directSale.thumbs[0].url) {
    return normalizeImageUrl(directSale.thumbs[0].url);
  }
  return DEFAULT_DIRECT_SALE_IMAGE;
};

const Home1LiveDirectSales = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { auth } = useAuth();
  const { data: allDirectSalesResponse, isLoading: directSalesLoading } = useQuery({
    queryKey: ['direct-sales', 'all'],
    queryFn: () => DirectSaleAPI.getDirectSales(),
  });

  const allDirectSales = useMemo(() => {
    const data = (allDirectSalesResponse as any)?.data || (Array.isArray(allDirectSalesResponse) ? allDirectSalesResponse : []);
    const transformed = (Array.isArray(data) ? data : []).map((sale: any) => ({
      ...sale, id: sale.id || sale._id,
    }));
    const activeSales = transformed.filter((sale: any) => sale.status !== 'ARCHIVED' && sale.status !== 'INACTIVE');
    const isUserVerified = auth.user?.isVerified === true || auth.user?.isVerified === 1;
    return activeSales.filter((sale: any) => sale.verifiedOnly === true ? isUserVerified : true);
  }, [allDirectSalesResponse, auth.user]);

  const queryClient = useQueryClient();
  const socketContext = useCreateSocket();
  const socket = socketContext?.socket;

  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => { if (data?.type === 'directSale') queryClient.invalidateQueries({ queryKey: ['direct-sales'] }); };
    socket.on('newListingCreated', handler);
    return () => { socket.off('newListingCreated', handler); };
  }, [socket, queryClient]);

  const directSales = useMemo(() => {
    return allDirectSales.filter(sale => {
      const availableQuantity = sale.quantity === 0 ? 999 : sale.quantity - (sale.soldQuantity || 0);
      return sale.status !== 'SOLD_OUT' && sale.status !== 'SOLD' && !(sale.quantity > 0 && availableQuantity <= 0);
    }).slice(0, 8);
  }, [allDirectSales]);

  const settings = useMemo(() => ({
    slidesPerView: "auto" as const, speed: 800, spaceBetween: 20,
    breakpoints: {
      280: { slidesPerView: 1 }, 576: { slidesPerView: 2 }, 992: { slidesPerView: 3 }, 1200: { slidesPerView: 4 }
    },
  }), []);

  const formatPrice = useCallback((price: number) => `${Number(price).toLocaleString()} DA`, []);

  if (directSalesLoading) return <div style={{ background: '#fff', padding: '20px' }}><CardSkeleton /></div>;

  return (
    <div style={{ background: 'transparent', width: '100%', paddingBottom: '0px' }}>
      {/* SECTION HEADER - REMOVED OVERFLOW HIDDEN */}
      <div style={{ 
        width: '100%', 
        position: 'relative', 
        padding: '60px 0 40px', 
        textAlign: 'center',
        overflow: 'visible' /* Prevent scale clipping */
      }}>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', top: '10%', right: '20%', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }}
        />
        <div style={{ position: 'relative', zIndex: 1, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ color: '#002896', fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: '900', margin: 0, letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #002896 0%, #0ea5e9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Marchés et ventes en cours
          </motion.h2>
          <motion.div initial={{ width: 0 }} whileInView={{ width: '100px' }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 1 }} style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #002896, transparent)', marginTop: '15px', borderRadius: '10px' }} />
        </div>
      </div>

      <div className="container-responsive" style={{ background: 'transparent', maxWidth: '1400px', margin: '0 auto', padding: '0 20px', overflow: 'visible' }}>
        {directSales.length > 0 ? (
          <div className="direct-sale-carousel-container" style={{ position: 'relative', overflow: 'visible' }}>
            <Swiper modules={[Navigation, Autoplay]} {...settings} className="swiper direct-sale-slider" style={{ padding: '30px 10px', margin: '-30px -10px', overflow: 'visible' }}>
              {directSales.map((sale: any) => {
                const companyName = sale.owner?.entreprise || sale.owner?.companyName || sale.owner?.firstName || 'Nom Entreprise';
                const availableQuantity = sale.quantity > 0 ? (sale.quantity - (sale.soldQuantity || 0)) : 'Illimité';
                
                return (
                  <SwiperSlide key={sale.id} style={{ overflow: 'visible' }}>
                    <div 
                      key={sale.id}
                      style={{ 
                        width: '295px', 
                        height: '383px',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        zIndex: 1,
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'scale(1.03) translateY(-4px)';
                        e.currentTarget.style.zIndex = '10';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.zIndex = '1';
                      }}
                      onClick={() => router.push(`/direct-sale/${sale.id}`)}
                    >
                      <div style={{ width: '295px', height: '295px', borderRadius: '24px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                          <ShareButton 
                            type="directSale" 
                            id={sale.id} 
                            title={sale.title} 
                            description={sale.description} 
                            imageUrl={getDirectSaleImageUrl(sale)} 
                          />
                        </div>
                        <img 
                          src={getDirectSaleImageUrl(sale)} 
                          alt={sale.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
                          onError={(e) => (e.currentTarget.src = DEFAULT_DIRECT_SALE_IMAGE)} 
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
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: '700', 
                          fontSize: '20px', 
                          lineHeight: '100%',
                          letterSpacing: '0px',
                          verticalAlign: 'middle',
                          color: '#002896', 
                          margin: '0 0 6px 0', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {sale.title || 'Nom Produit'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ 
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: '700', 
                            fontSize: '24px', 
                            lineHeight: '100%',
                            letterSpacing: '0px',
                            verticalAlign: 'middle',
                            color: '#002896' 
                          }}>
                           {Number(sale.price || 0).toLocaleString()}
                          </span>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            width: '46px', 
                            height: '29px', 
                            background: 'rgba(0, 40, 150, 0.08)', 
                            color: '#002896', 
                            borderRadius: '8px', 
                            fontSize: '13px', 
                            fontWeight: '800' 
                          }}>DA</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#002896', fontWeight: '700', textTransform: 'uppercase' }}>
                            {availableQuantity} en stock
                          </span>
                          <span style={{ 
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '14px', 
                            fontWeight: '400', 
                            lineHeight: '100%',
                            letterSpacing: '0px',
                            verticalAlign: 'middle',
                            color: '#002896', 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            maxWidth: '101px', 
                            textAlign: 'right' 
                          }}>
                            {companyName}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#002896', fontWeight: '600' }}>
                            Achat Immédiat • {sale.wilaya || "Algérie"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <Link href="/direct-sale" style={{ display: 'inline-block', padding: '10px 30px', color: '#002896', textDecoration: 'none', fontSize: '18px', fontWeight: '800', transition: 'all 0.3s ease' }}>
                Voir tout
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ color: '#002896', textAlign: 'center', padding: '40px', fontWeight: 'bold' }}>Aucune vente en cours</div>
        )}
      </div>
    </div>
  );
};

export default Home1LiveDirectSales;