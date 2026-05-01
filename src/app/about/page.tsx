"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/FooterWithErrorBoundary';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DynamicScrollToTop from "@/components/common/DynamicScrollToTop";

const AboutPage = () => {
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState(196);

  useEffect(() => {
    const checkHeaderHeight = () => {
      const width = window.innerWidth;
      let calculatedHeight = width <= 375 ? 62 : width <= 768 ? 65 : width <= 992 ? 70 : 196;
      setHeaderHeight(calculatedHeight);
    };
    checkHeaderHeight();
    window.addEventListener('resize', checkHeaderHeight);
    return () => window.removeEventListener('resize', checkHeaderHeight);
  }, []);

  // Updated glass style with a light grey base instead of white
  const glassStyleGrey = {
    background: 'rgba(255, 255, 255, 0.7)', // White base
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
  };

  return (
    <>
      <Header />
      <main style={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        paddingTop: `${headerHeight}px`,
      }}>
        
        {/* 1. Hero Section */}
        <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 20px)', textAlign: 'center' }}>
          <div className="container" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                color: '#002896',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
                fontWeight: '700',
                lineHeight: 1.18,
                textAlign: 'center',
                marginTop: 'clamp(20px, 4vw, 60px)',
                marginBottom: '20px',
              }}
            >
              Contactez notre équipe pour plus de renseignements
            </motion.h1>
            <p style={{
              color: '#0096E3',
              fontFamily: '"Inter", sans-serif',
              fontSize: 'clamp(0.95rem, 1.6vw, 1.125rem)',
              fontWeight: '400',
              lineHeight: 1.4,
              textAlign: 'center',
              maxWidth: '800px',
              margin: '0 auto clamp(28px, 5vw, 60px)',
            }}>
              MazadClick ne digitalise pas le marché : elle l'organise.
            </p>

            <div className="about-grid-container">
              {/* Left Column Text */}
              <div className="about-text-column">
                <p style={{ marginBottom: '24px' }}>
                  Le marché algérien regorge de potentiel, mais
                  les opportunités s'égarent trop souvent dans
                  l'informel ou les réseaux fermés. MazadClick
                  est née d'une mission claire : transformer ce
                  potentiel en réalité économique grâce à une
                  infrastructure digitale nationale.
                </p>
                <p style={{ marginBottom: '24px' }}>
                  Nous connectons entreprises, institutions et
                  porteurs de projets autour d'un écosystème
                  intelligent où chaque clic déclenche une
                  décision. Plus qu'une plateforme, MazadClick
                  est le point de ralliement de ceux qui veulent
                  produire, échanger et investir avec clarté,
                  équité et performance.
                </p>
              </div>

              {/* Right Column Image */}
              <div
                className="about-images-column"
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img
                  src="/assets/images/about.jpg"
                  alt="About MazadClick"
                  style={{
                    width: '100%',
                    maxWidth: '630px',
                    aspectRatio: '630 / 523',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Stats Bar - Advanced Glassmorphism Design */}
        <section style={{
          padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 20px)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1282px',
            minHeight: '160px',
            padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px)',
            background: '#d8d8d8',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid',
            borderImageSource: 'linear-gradient(127.23deg, rgba(255, 255, 255, 0.42) 2.46%, rgba(255, 255, 255, 0.24) 97.36%)',
            borderImageSlice: 1,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            alignItems: 'center',
            gap: 'clamp(16px, 3vw, 32px)',
            textAlign: 'center',
            boxShadow: '0px 20px 40px 0px #0000001A, 0px 4px 4px 0px #00000040',
            boxSizing: 'border-box'
          }}>
              <div style={{ flex: '1 1 140px' }}>
                <h2 style={{ color: '#002896', fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: '800', margin: 0 }}>15</h2>
                <p style={{ color: '#002896', fontSize: 'clamp(0.8rem, 1.4vw, 0.875rem)', fontWeight: '600', margin: '6px 0 0' }}>Membres de l'équipe</p>
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <h2 style={{ color: '#002896', fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: '800', margin: 0 }}>10</h2>
                <p style={{ color: '#002896', fontSize: 'clamp(0.8rem, 1.4vw, 0.875rem)', fontWeight: '600', margin: '6px 0 0' }}>Fonctionnalités</p>
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <h2 style={{ color: '#002896', fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: '800', margin: 0 }}>+10</h2>
                <p style={{ color: '#002896', fontSize: 'clamp(0.8rem, 1.4vw, 0.875rem)', fontWeight: '600', margin: '6px 0 0' }}>Entreprises</p>
              </div>
            </div>
        </section>

        {/* 3. Nos Valeurs Section */}
        <section style={{ padding: 'clamp(48px, 10vw, 100px) clamp(16px, 4vw, 20px)' }}>
          <div className="container" style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{
              color: '#002896',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(2rem, 6vw, 4rem)',
              fontWeight: '700',
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: 'clamp(28px, 5vw, 60px)',
            }}>
              Nos valeurs
            </h2>
            <div className="values-grid">
              {[
                { title: "Clarté Totale", desc: "Des processus d'enchères et de soumissions traçables pour une confiance absolue." },
                { title: "Marché Unifié", desc: "Nous organisons les flux pour rendre le marché lisible et accessible à tous." },
                { title: "Économie Inclusive", desc: "Une plateforme pensée pour chaque acteur, de la grande institution à l'artisan local." },
                { title: "Le Clic Stratégique", desc: "L'usage du numérique au service de l'efficacité réelle et de la prise de décision rapide." },
                { title: "Tiers de Confiance", desc: "Une infrastructure sécurisée garantissant l'intégrité de chaque échange économique." },
                { title: "Croissance Collective", desc: "Accélérez les cycles de vente et d'achat pour booster la compétitivité." }
              ].map((item, i) => (
                <div key={i} className="value-card" style={glassStyleGrey}>
                  <div className="star-icon">★</div>
                  <h3 style={{ color: '#002896', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>{item.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Contact CTA */}
        <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 20px)', textAlign: 'center' }}>
          <div className="container" style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{
              color: '#002896',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(1.5rem, 5vw, 3.5rem)',
              fontWeight: '700',
              lineHeight: 1.2,
              textAlign: 'center',
              marginBottom: 'clamp(20px, 4vw, 40px)',
            }}>
              Besoin d&rsquo;un accompagnement
            </h2>
            <p style={{
              color: '#002896',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(1rem, 2.2vw, 1.5rem)',
              fontWeight: '400',
              lineHeight: 1.4,
              textAlign: 'center',
              maxWidth: '800px',
              margin: '0 auto clamp(24px, 4vw, 45px)',
            }}>
              Nos experts sont là pour vous aider à optimiser vos enchères ou finaliser vos soumissions. Envoyez-nous un message et recevez une réponse rapide.
            </p>
            <button className="gradient-btn" onClick={() => router.push('/contact')}>
              Contacter un conseiller
            </button>
          </div>
        </section>

        <style jsx>{`
          .about-grid-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: clamp(24px, 4vw, 60px);
            text-align: center;
            align-items: center;
          }
          .about-text-column {
            color: #64748b;
            font-family: 'Inter', sans-serif;
            font-weight: 400;
            font-size: clamp(1rem, 2vw, 1.5rem);
            line-height: 1.5;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .about-images-column {
            width: 100%;
          }

          @media (min-width: 992px) {
            .about-grid-container {
              grid-template-columns: 1fr 1fr;
              gap: 60px;
            }
            .about-text-column {
              text-align: left;
            }
          }

          .values-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
            gap: clamp(16px, 3vw, 30px);
            width: 100%;
          }
          .value-card {
            padding: clamp(28px, 5vw, 50px) clamp(20px, 4vw, 30px);
            border-radius: 30px;
            text-align: center;
            transition: all 0.3s ease;
          }
          .value-card:hover {
            transform: translateY(-10px);
            background: rgba(230, 235, 240, 0.9) !important;
          }
          .star-icon {
            color: #fbbf24;
            font-size: clamp(28px, 5vw, 36px);
            margin-bottom: 20px;
          }
          .gradient-btn {
            background: linear-gradient(95deg, #002896 0%, #3b82f6 100%);
            color: white;
            padding: clamp(14px, 2.5vw, 18px) clamp(32px, 7vw, 70px);
            border-radius: 50px;
            border: none;
            font-weight: 700;
            font-size: clamp(0.875rem, 1.5vw, 1rem);
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px rgba(0, 40, 150, 0.2);
            min-height: 44px;
          }
          .gradient-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 15px 30px rgba(0, 40, 150, 0.3);
          }
        `}</style>
      </main>
      <Footer />
      <DynamicScrollToTop colorSchema="gradient" />
    </>
  );
};

export default AboutPage;