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
      
      let calculatedHeight = 196; // matches the actual header inner wrapper height (1440px design)
      if (width <= 375) calculatedHeight = 62;
      else if (width <= 768) calculatedHeight = 65;
      else if (width <= 992) calculatedHeight = 70;
      else calculatedHeight = 196;
      
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
          background: #E6E6E6;
          background: linear-gradient(180deg, #1A71F6 0%, #0F4290 100%);
          color: white;
          border: none;
          border-radius: 100px;
          width: 132px;
          height: 52px;
          font-weight: 900;
          font-size: 20px;
          line-height: 20px;
          letter-spacing: -0.1px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 
            0px 1px 8px 0px #0000001A, 
            0px 0px 2px 0px #0000001A, 
            0px 0px 1px 1px #999999 inset;
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
          width: 388px;
          height: 280px;
          border-radius: 24px;
          padding: 25px 24px;
          background: 
            linear-gradient(127.45deg, rgba(220, 225, 235, 0.78) 2.15%, rgba(190, 195, 210, 0.28) 63.05%) padding-box,
            linear-gradient(127.23deg, rgba(255, 255, 255, 0.45) 2.46%, rgba(255, 255, 255, 0.25) 97.36%) border-box;
          border: 1px solid transparent;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0px 20px 40px 0px #0000001A, 0px 4px 4px 0px #00000040;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .grey-glass-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 40, 150, 0.2);
        }
        @media (max-width: 768px) {
          .grey-glass-card {
            max-width: 100%;
            height: auto;
            min-height: 280px;
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
                  width: '100%',
                  minHeight: '100vh',
                  height: 'auto',
                  background: '#FFFFFF',
                  opacity: 1,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#f0f2f5',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  position: 'relative',
                  paddingTop: `${headerHeight}px`,
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  boxSizing: 'border-box',
                  transform: 'rotate(0deg)',
                }}>
                  
                  {/* Hero Section: Ads for logged users, Welcome for guests */}
                  <section style={{ width: '100%', background: '#ffffff', overflow: 'hidden' }}>
                    <div style={{ width: '100%', maxWidth: '100vw' }}>
                      {isLogged ? <AdsSlider /> : <GuestHero />}
                    </div>

                    {/* Que voulez-vous faire? Section with ambient background for glass effect */}
                    <div style={{
                      position: 'relative', zIndex: 3, width: '100%', margin: '0 auto', 
                      padding: '40px 20px', textAlign: 'center', 
                      background: '#ffffff', overflow: 'hidden'
                    }}>
                      
                      {/* Ambient background blur blobs to make the glass effect visible */}


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
                          
                          {/* CARD 1: Enchères */}
                          <div className="grey-glass-card">
                            <div style={{ height: '105px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
                              <img src="/assets/images/icon 1.png" alt="Enchères" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                            <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '30px', lineHeight: '38px', textAlign: 'center', marginBottom: 'auto' }}>Enchères</h3>

                            <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                              <button onClick={() => router.push('/auction-sidebar')} className="btn-3d-blue">Enchérir</button>
                              <button onClick={() => router.push('/dashboard/auctions/create')} className="btn-3d-blue">Poster</button>
                            </div>
                          </div>

                          {/* CARD 2: Vente directe */}
                          <div className="grey-glass-card">
                            <div style={{ height: '105px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
                              <img src="/assets/images/icon 2.png" alt="Vente directe" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                            <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '30px', lineHeight: '38px', textAlign: 'center', marginBottom: 'auto' }}>Vente directe</h3>

                            <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                              <button onClick={() => router.push('/dashboard/direct-sales/create')} className="btn-3d-blue">Vendre</button>
                              <button onClick={() => router.push('/direct-sale')} className="btn-3d-blue">Acheter</button>
                            </div>
                          </div>

                          {/* CARD 3: Soumission d'offre */}
                          <div className="grey-glass-card">
                            <div style={{ height: '105px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
                              <img src="/assets/images/icon 3.png" alt="Soumission" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                            <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '28px', lineHeight: '30px', textAlign: 'center', marginBottom: 'auto' }}>Consultez les projets et soumissionnez</h3>

                            <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center' }}>
                              <button onClick={() => router.push('/dashboard/tenders/create')} className="btn-3d-blue">Publier</button>
                              <button onClick={() => router.push('/tenders')} className="btn-3d-blue">Postuler</button>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </section>

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

                  <section style={{ width: '100%', background: '#ffffff', padding: 0 }}>
                    <CategoryGrid />
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