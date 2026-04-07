"use client";

import Header from "@/components/header/Header"
import AdsSlider from "@/components/banner/AdsSlider";
import GuestHero from "@/components/banner/GuestHero";
import Home1LiveAuction from "@/components/live-auction/Home1LiveAuction";
import Home1LiveTenders from "@/components/live-tenders/Home1LiveTenders";
import Home1LiveDirectSales from "@/components/live-direct-sales/Home1LiveDirectSales";
import Footer from "@/components/footer/FooterWithErrorBoundary";
import DynamicScrollToTop from "@/components/common/DynamicScrollToTop";
import CategoryGrid from "@/components/category-grid/CategoryGrid";
import Testimonials from "@/components/testimonials/Testimonials";
import CTARegistration from "@/components/cta/CTARegistration";
import FAQSection from "@/components/faq/FAQSection";
import RequestProvider from "@/contexts/RequestContext";

import { useEffect, useState } from "react";
import { SnackbarProvider } from 'notistack';
import useAuth from '@/hooks/useAuth';
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import './style.css'
import SocketProvider from "@/contexts/socket";
import { CategoryAPI } from '@/app/api/category';
import { AuctionsAPI } from '@/app/api/auctions';
import { TendersAPI } from '@/app/api/tenders';
import { DirectSaleAPI } from '@/app/api/direct-sale';
import { useRouter } from 'next/navigation';
import ResponsiveTest from '@/components/common/ResponsiveTest';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import PageSkeleton from '@/components/skeletons/PageSkeleton';

export default function Home() {
  const { t } = useTranslation();
  const { isLogged, isReady, initializeAuth } = useAuth();
  const router = useRouter();
  
  const [headerHeight, setHeaderHeight] = useState(112);
  
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      
      let calculatedHeight = 104; 
      if (width <= 375) calculatedHeight = 62;
      else if (width <= 768) calculatedHeight = 65;
      else if (width <= 992) calculatedHeight = 70;
      else calculatedHeight = 104;
      
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10) || 0;
      setHeaderHeight(calculatedHeight + safeAreaTop);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { isLoading: categoriesLoading } = useQuery({ queryKey: ['categories', 'all'], queryFn: () => CategoryAPI.getCategories() });
  const { isLoading: auctionsLoading } = useQuery({ queryKey: ['auctions', 'all'], queryFn: () => AuctionsAPI.getAuctions() });
  const { isLoading: tendersLoading } = useQuery({ queryKey: ['tenders', 'active'], queryFn: () => TendersAPI.getActiveTenders() });
  const { isLoading: directSalesLoading } = useQuery({ queryKey: ['direct-sales', 'all'], queryFn: () => DirectSaleAPI.getDirectSales() });

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  return (
    <>
      {(categoriesLoading || auctionsLoading || tendersLoading || directSalesLoading) ? (
        <PageSkeleton />
      ) : (
        <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@700&display=swap" rel="stylesheet" />
      <style jsx global>{`
        :root {
          --scrollbar-width: 6px;
          --primary-color: #002896;
          --text-color: #1f2937;
        }
        
        html {
          scrollbar-gutter: stable;
        }
        
        html::-webkit-scrollbar { width: 6px; }
        html::-webkit-scrollbar-track { background: rgba(0, 40, 150, 0.1); }
        html::-webkit-scrollbar-thumb { background: rgba(0, 40, 150, 0.6); border-radius: 3px; }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          line-height: 1.6;
          color: var(--text-color);
          background: #ffffff;
          overflow-x: hidden;
        }
        
        /* Flat Pill Button Styles */
        .btn-3d-blue {
          background: linear-gradient(180deg, #1A71F6 0%, #0F4290 100%);
          color: white;
          border: none;
          border-radius: 100px;
          width: 132px;
          height: 52px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
        }
        .btn-3d-blue:hover {
          opacity: 0.9;
          color: white;
        }
        .btn-3d-blue:active {
          opacity: 0.8;
        }

        /* Distinct Light Grey Glassmorphism Card Hover */
        .grey-glass-card {
          width: 100%;
          max-width: 388px;
          height: 356px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid;
          border-image-source: linear-gradient(127.23deg, rgba(255, 255, 255, 0.42) 2.46%, rgba(255, 255, 255, 0.24) 97.36%);
          border-image-slice: 1;
          box-shadow: 0px 4px 4px 0px #00000040;
          border-radius: 24px;
          overflow: hidden;
        }
        .grey-glass-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 40, 150, 0.2);
        }
        @media (max-width: 768px) {
          .grey-glass-card {
            max-width: 100%;
            height: auto;
            min-height: 356px;
          }
        }
      `}</style>
      
      <SocketProvider >
        <div>
          <SnackbarProvider maxSnack={3} autoHideDuration={4000} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} style={{ borderRadius: '10px' }}>
            <RequestProvider>
              <AxiosInterceptor>
                <Header />
                <main style={{ 
                  minHeight: '100vh', 
                  background: '#ffffff',
                  position: 'relative',
                  width: '100%',
                  maxWidth: '100vw',
                  paddingTop: `${headerHeight}px`,
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  boxSizing: 'border-box',
                }}>
                  
                  {/* Hero Section: Ads for logged users, Welcome for guests */}
                  <section style={{ width: '100%', background: '#ffffff', overflow: 'hidden' }}>
                    <div style={{ width: '100%', maxWidth: '100vw' }}>
                      {isLogged ? <AdsSlider /> : <GuestHero />}
                    </div>

                    {/* Que voulez-vous faire? Section with ambient background for glass effect */}
                    <div style={{
                      position: 'relative', zIndex: 3, width: '100%', margin: '0 auto', 
                      padding: '80px 20px', textAlign: 'center', 
                      background: '#ffffff', overflow: 'hidden'
                    }}>
                      
                      {/* Ambient background blur blobs to make the glass effect visible */}
                      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0, 40, 150, 0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
                      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0 }}></div>

                      <div style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto' }}>
                        {isLogged && (
                          <>
                            <h2 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '36px', lineHeight: '46px', textAlign: 'center', marginBottom: '15px' }}>
                              Que voulez-vous faire ?
                            </h2>
                            <p style={{ color: '#757575', fontFamily: '"DM Sans", sans-serif', fontWeight: '400', fontSize: '18px', lineHeight: '30px', textAlign: 'center', maxWidth: '756px', margin: '0 auto 50px' }}>
                              Lorem ipsum dolor sit amet consectetur. Ultricies semper neque sed justo amet elit consectetur eget pellentesque. In eu fames non et orci elit.
                            </p>
                          </>
                        )}

                        {/* Grid of 3 Grey Glassmorphism Cards */}
                        <div style={{ 
                          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                          gap: '25px', justifyContent: 'center' 
                        }}>
                          
                          {/* CARD 1: Enchérir */}
                          <div className="grey-glass-card" style={{ 
                            /* Using a more distinct light grey gradient here */
                            background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.9) 0%, rgba(233, 236, 239, 0.7) 100%)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderRadius: '24px', padding: '40px 24px', 
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                          }}>
                            <div style={{ color: '#002896', marginBottom: '20px' }}>
                              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v12m0-12l-4 4m4-4l4 4M20 21a4 4 0 00-4-4h-8a4 4 0 00-4 4"/>
                                <circle cx="12" cy="11" r="3"/>
                              </svg>
                            </div>
                            <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '30px', lineHeight: '38px', textAlign: 'center', marginBottom: '15px' }}>Enchères</h3>
                            <p style={{ color: '#757575', fontFamily: '"DM Sans", sans-serif', fontWeight: '400', fontSize: '16px', lineHeight: '30px', textAlign: 'center', marginBottom: '35px', minHeight: '66px' }}>Lorem ipsum dolor sit amet consectetur.<br/>Fringilla ulla.</p>
                            <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                              <button onClick={() => router.push('/dashboard/auctions/create')} className="btn-3d-blue">Enchérir</button>
                              <button onClick={() => router.push('/auction-sidebar')} className="btn-3d-blue">Poster</button>
                            </div>
                          </div>

                          {/* CARD 2: Vente directe */}
                          <div className="grey-glass-card" style={{ 
                            /* Using a more distinct light grey gradient here */
                            background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.9) 0%, rgba(233, 236, 239, 0.7) 100%)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderRadius: '24px', padding: '40px 24px', 
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                          }}>
                            <div style={{ color: '#002896', marginBottom: '20px' }}>
                              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2"/>
                                <path d="M2 10h20M6 14h12"/>
                              </svg>
                            </div>
                            <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '30px', lineHeight: '38px', textAlign: 'center', marginBottom: '15px' }}>Vente directe</h3>
                            <p style={{ color: '#757575', fontFamily: '"DM Sans", sans-serif', fontWeight: '400', fontSize: '16px', lineHeight: '30px', textAlign: 'center', marginBottom: '35px', minHeight: '66px' }}>Lorem ipsum dolor sit amet consectetur.<br/>Fringilla ulla.</p>
                            <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                              <button onClick={() => router.push('/dashboard/direct-sales/create')} className="btn-3d-blue">Vendre</button>
                              <button onClick={() => router.push('/direct-sale')} className="btn-3d-blue">Acheter</button>
                            </div>
                          </div>

                          {/* CARD 3: Soumission d'offre */}
                          <div className="grey-glass-card" style={{ 
                            /* Using a more distinct light grey gradient here */
                            background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.9) 0%, rgba(233, 236, 239, 0.7) 100%)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderRadius: '24px', padding: '40px 24px', 
                            display: 'flex', flexDirection: 'column', alignItems: 'center'
                          }}>
                            <div style={{ color: '#002896', marginBottom: '20px' }}>
                              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                                <path d="M2 13h4M2 17h4" strokeDasharray="2 2"/>
                              </svg>
                            </div>
                            <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '28px', lineHeight: '25px', textAlign: 'center', marginBottom: '15px' }}>Soumissions (Appels d’offres / Projets)</h3>
                            <p style={{ color: '#757575', fontFamily: '"DM Sans", sans-serif', fontWeight: '400', fontSize: '16px', lineHeight: '30px', textAlign: 'center', marginBottom: '35px', minHeight: '66px' }}>Lorem ipsum dolor sit amet consectetur.<br/>Fringilla ulla.</p>
                            <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                              <button onClick={() => router.push('/dashboard/tenders/create')} className="btn-3d-blue">Publier</button>
                              <button onClick={() => router.push('/tenders')} className="btn-3d-blue">Postuler</button>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </section>
                  
                  {isReady && !isLogged && (
                    <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                      <CategoryGrid />
                    </section>
                  )}
                  
                  {/* Live Lists Components */}
                  <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                    <Home1LiveAuction />
                  </section>
                  <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                    <Home1LiveDirectSales />
                  </section>
                  <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                    <Home1LiveTenders />
                  </section>

                  {!isLogged && (
                    <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                      <Testimonials />
                    </section>
                  )}

                  {!isLogged && (
                    <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                      <CTARegistration />
                    </section>
                  )}

                  {!isLogged && (
                    <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                      <FAQSection />
                    </section>
                  )}

                  {isLogged && (
                    <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                      <CategoryGrid />
                    </section>
                  )}
                  
                </main>
                <Footer />
                <ResponsiveTest />
                <DynamicScrollToTop colorSchema="gradient" />
              </AxiosInterceptor>
            </RequestProvider>
          </SnackbarProvider>
        </div>
      </SocketProvider>
        </>
      )}
    </>
  );
}