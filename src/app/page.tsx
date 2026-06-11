"use client";

import Header from "@/components/header/Header"
import AdsSlider from "@/components/banner/AdsSlider";
import GuestHero from "@/components/banner/GuestHero";
import dynamic from "next/dynamic";

const Home1LiveAuction = dynamic(() => import("@/components/live-auction/Home1LiveAuction"), { ssr: false });
const Home1LiveTenders = dynamic(() => import("@/components/live-tenders/Home1LiveTenders"), { ssr: false });
const Home1LiveDirectSales = dynamic(() => import("@/components/live-direct-sales/Home1LiveDirectSales"), { ssr: false });
const Footer = dynamic(() => import("@/components/footer/FooterWithErrorBoundary"), { ssr: false });
const DynamicScrollToTop = dynamic(() => import("@/components/common/DynamicScrollToTop"), { ssr: false });
const CategoryGrid = dynamic(() => import("@/components/category-grid/CategoryGrid"), { ssr: false });
const Testimonials = dynamic(() => import("@/components/testimonials/Testimonials"), { ssr: false });
const CTARegistration = dynamic(() => import("@/components/cta/CTARegistration"), { ssr: false });
const FAQSection = dynamic(() => import("@/components/faq/FAQSection"), { ssr: false });
import RequestProvider from "@/contexts/RequestContext";

import { useEffect, useState } from "react";
import { SnackbarProvider } from 'notistack';
import useAuth from '@/hooks/useAuth';
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import './style.css'
import SocketProvider from "@/contexts/socket";
import { useRouter } from 'next/navigation';
import ResponsiveTest from '@/components/common/ResponsiveTest';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

export default function Home() {
  const { t } = useTranslation();
  const { isLogged, isReady, initializeAuth } = useAuth();
  const router = useRouter();
  
  const [headerHeight, setHeaderHeight] = useState(112);
  // On mobile the action cards hide their buttons until the card is tapped
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const toggleCard = (i: number) => () => setExpandedCard((prev) => (prev === i ? null : i));

  const goTo = (path: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(path);
  };

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      
      // Header switches to compact mobile bar at <= 1024 (see Header.jsx showMobileHeader).
      // Desktop header is a flex column: 16px pad + 65px top row + 18px gap + 36px nav + 16px pad ≈ 151px.
      let calculatedHeight = 152;
      if (width <= 375) calculatedHeight = 60;
      else if (width <= 1024) calculatedHeight = 68;
      else calculatedHeight = 152;
      
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10) || 0;
      setHeaderHeight(calculatedHeight + safeAreaTop);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  return (
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
          height: 356px;
          border-radius: 24px;
          padding: 0px 24px 25px;
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
        /* Card body holds the title + buttons; flex:1 keeps buttons pinned to the card bottom */
        .card-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          flex: 1;
        }

        /* Shared responsive home container (Figma: 1216px content column, 112px gutters) */
        .home-container {
          width: 100%;
          max-width: 1600px;
          margin-inline: auto;
          padding-inline: clamp(16px, 3vw, 48px);
        }

        /* Que voulez-vous faire section */
        @media (max-width: 767px) {
          .qvf-section h2 {
            font-size: clamp(22px, 5vw, 36px) !important;
            line-height: 1.25 !important;
            margin-bottom: 8px !important;
          }
          .qvf-section > div > p {
            font-size: clamp(13px, 3.5vw, 18px) !important;
            line-height: 1.5 !important;
            margin-bottom: 24px !important;
          }
        }

        /* Action cards: one design at every width — columns reflow 3 -> 2 -> 1, no layout swap */
        .action-cards-wrap {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(12px, 2vw, 26px);
          justify-content: center;
          align-items: stretch;
        }
        .action-cards-wrap > .grey-glass-card {
          width: 100%;
          height: auto;
          min-height: 320px;
        }
        .action-cards-wrap .btn-3d-blue {
          width: 100%;
          max-width: 140px;
          min-width: 0;
        }
        @media (max-width: 1023px) {
          .action-cards-wrap { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 639px) {
          /* Mobile: keep all three cards inline in one row — just smaller */
          .action-cards-wrap {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
          }
          .action-cards-wrap > .grey-glass-card {
            width: 100%;
            min-height: 0;
            height: auto;
            padding: 12px 8px 14px;
          }
          /* Smaller icon */
          .action-cards-wrap > .grey-glass-card > div:first-child {
            height: 54px !important;
            width: 54px !important;
            margin: 0 0 6px !important;
          }
          .action-cards-wrap > .grey-glass-card > div:first-child img {
            width: 48px !important;
            height: 48px !important;
          }
          .action-cards-wrap > .grey-glass-card {
            cursor: pointer;
          }
          .action-cards-wrap .card-body h3 {
            font-size: 12px !important;
            line-height: 1.25 !important;
            margin-bottom: 0 !important;
          }
          /* Buttons hidden until the card is tapped */
          .action-cards-wrap .card-body > div {
            display: none !important;
            flex-direction: column;
            align-items: center !important;
            gap: 5px !important;
            margin-top: 8px !important;
          }
          .action-cards-wrap > .grey-glass-card.expanded .card-body > div {
            display: flex !important;
          }
          /* Compact pills sized to the small card */
          .action-cards-wrap .btn-3d-blue {
            height: 24px !important;
            min-height: 0 !important;
            width: auto !important;
            min-width: 0 !important;
            max-width: 100% !important;
            padding: 0 12px !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            border-radius: 100px !important;
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
                      {isLogged ? <AdsSlider /> : (
                        <div className="home-container">
                          <GuestHero />
                        </div>
                      )}
                    </div>

                    {/* Que voulez-vous faire? Section with ambient background for glass effect */}
                    <div className="qvf-section" style={{
                      position: 'relative', zIndex: 3, width: '100%', margin: '0 auto',
                      padding: '40px 20px', textAlign: 'center',
                      background: '#ffffff', overflow: 'hidden'
                    }}>
                      
                      {/* Ambient background blur blobs to make the glass effect visible */}


                      <div className="home-container" style={{ position: 'relative', zIndex: 2 }}>
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

                        {/* Grid of 3 Grey Glassmorphism Cards — same design, columns reflow on small screens */}
                        <div className="action-cards-wrap">

                          {/* CARD 1: Enchères */}
                          <div className={`grey-glass-card${expandedCard === 0 ? ' expanded' : ''}`} onClick={toggleCard(0)}>
                            <div style={{ height: '145px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: '0px', marginTop: '-10px', position: 'relative', width: '100%' }}>
                              <Image src="/assets/images/icon 1.png" alt="Enchères" width={150} height={145} style={{ objectFit: 'contain' }} priority />
                            </div>
                            <div className="card-body">
                              <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '30px', lineHeight: '38px', textAlign: 'center', marginBottom: '10px' }}>Enchères</h3>

                              <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
                                <button onClick={goTo('/auction-sidebar')} className="btn-3d-blue">Enchérir</button>
                                <button onClick={goTo('/dashboard/auctions/create')} className="btn-3d-blue">Poster</button>
                              </div>
                            </div>
                          </div>

                          {/* CARD 2: Vente directe */}
                          <div className={`grey-glass-card${expandedCard === 1 ? ' expanded' : ''}`} onClick={toggleCard(1)}>
                            <div style={{ height: '145px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: '0px', marginTop: '-10px', position: 'relative', width: '100%' }}>
                              <Image src="/assets/images/icon 2.png" alt="Vente directe" width={150} height={145} style={{ objectFit: 'contain' }} priority />
                            </div>
                            <div className="card-body">
                              <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '30px', lineHeight: '38px', textAlign: 'center', marginBottom: '10px' }}>Vente et Service</h3>

                              <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
                                <button onClick={goTo('/dashboard/direct-sales/create')} className="btn-3d-blue">Vendre</button>
                                <button onClick={goTo('/direct-sale')} className="btn-3d-blue">Acheter</button>
                              </div>
                            </div>
                          </div>

                          {/* CARD 3: Soumission d'offre */}
                          <div className={`grey-glass-card${expandedCard === 2 ? ' expanded' : ''}`} onClick={toggleCard(2)}>
                            <div style={{ height: '145px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: '0px', marginTop: '-10px', position: 'relative', width: '100%' }}>
                              <Image src="/assets/images/icon 3.png" alt="Soumission" width={150} height={145} style={{ objectFit: 'contain' }} priority />
                            </div>
                            <div className="card-body">
                              <h3 style={{ color: '#002896', fontFamily: '"DM Sans", sans-serif', fontWeight: '700', fontSize: '28px', lineHeight: '30px', textAlign: 'center', marginBottom: '10px' }}>Soumissions (Appels d'offres)</h3>

                              <div style={{ display: 'flex', gap: '15px', width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
                                <button onClick={goTo('/dashboard/tenders/create')} className="btn-3d-blue">Publier</button>
                                <button onClick={goTo('/tenders')} className="btn-3d-blue">Postuler</button>
                              </div>
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
  );
}