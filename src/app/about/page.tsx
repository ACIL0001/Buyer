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
        
        {/* 1. Hero Section - Design from Image 5 */}
        <section style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                color: '#002896', 
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '56px', 
                fontWeight: '700', 
                lineHeight: '66px',
                textAlign: 'center',
                height: '132px',
                marginTop: '60px',
                marginBottom: '20px',
                opacity: 1,
                transform: 'rotate(0deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Contactez notre équipe pour plus de renseignements
            </motion.h1>
            <p style={{ 
              color: '#0096E3', 
              fontFamily: '"Inter", sans-serif',
              fontSize: '18px', 
              fontWeight: '400', 
              lineHeight: '18px',
              textAlign: 'center',
              height: '54px',
              maxWidth: '800px', 
              margin: '0 auto 60px',
              opacity: 1,
              transform: 'rotate(0deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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

              {/* Right Column Team - Based on Image 5 */}
              <div 
                className="about-images-column"
                style={{ gridColumn: 'span 5', display: 'flex', gap: '30px', justifyContent: 'center', position: 'relative' }}>
                <div className="team-member" style={{ marginTop: '100px' }}>
                  <div className="circle-img-wrapper">
                    <img src="/assets/images/aboutus.png" alt="Founder" />
                  </div>
                  <h4 style={{ color: '#0ea5e9', marginTop: '15px', marginBottom: '4px' }}>Nom prenom</h4>
                  <p style={{ color: '#0ea5e9', fontSize: '14px' }}>co Fondateur</p>
                </div>
                <div className="team-member" style={{ marginTop: '0' }}>
                  <div className="circle-img-wrapper">
                    <img src="/assets/images/aboutus1.png" alt="Founder" />
                  </div>
                  <h4 style={{ color: '#0ea5e9', marginTop: '15px', marginBottom: '4px' }}>Nom prenom</h4>
                  <p style={{ color: '#0ea5e9', fontSize: '14px' }}>Co fondateur</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Stats Bar - Advanced Glassmorphism Design */}
        <section style={{ 
          padding: '40px 20px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{ 
            width: '1282px',
            height: '212px',
            background: '#d8d8d8',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px', 
            border: '1px solid',
            borderImageSource: 'linear-gradient(127.23deg, rgba(255, 255, 255, 0.42) 2.46%, rgba(255, 255, 255, 0.24) 97.36%)',
            borderImageSlice: 1,
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0px 20px 40px 0px #0000001A, 0px 4px 4px 0px #00000040',
            opacity: 1,
            transform: 'rotate(0deg)',
            boxSizing: 'border-box'
          }}>
              <div>
                <h2 style={{ color: '#002896', fontSize: '48px', fontWeight: '800' }}>15</h2>
                <p style={{ color: '#002896', fontSize: '14px', fontWeight: '600' }}>Membres de l'équipe</p>
              </div>
              <div>
                <h2 style={{ color: '#002896', fontSize: '48px', fontWeight: '800' }}>10</h2>
                <p style={{ color: '#002896', fontSize: '14px', fontWeight: '600' }}>Fonctionnalités</p>
              </div>
              <div>
                <h2 style={{ color: '#002896', fontSize: '48px', fontWeight: '800' }}>+10</h2>
                <p style={{ color: '#002896', fontSize: '14px', fontWeight: '600' }}>Entreprises</p>
              </div>
            </div>
        </section>

        {/* 3. Nos Valeurs Section */}
        <section style={{ padding: '100px 20px' }}>
          <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ 
              color: '#002896', 
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '64px', 
              fontWeight: '700', 
              textAlign: 'center', 
              width: '505px',
              height: '104px',
              lineHeight: '18px', // Following exact specification
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '60px',
              opacity: 1,
              transform: 'rotate(0deg)'
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
        <section style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ 
              color: '#002896', 
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '56px', 
              fontWeight: '700', 
              lineHeight: '66px',
              textAlign: 'center',
              height: '66px',
              marginBottom: '40px',
              whiteSpace: 'nowrap',
              opacity: 1,
              transform: 'rotate(0deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              Besoin d’un accompagnement
            </h2>
            <p style={{ 
              color: '#002896', 
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '24px', 
              fontWeight: '400',
              lineHeight: '26px', 
              textAlign: 'center',
              height: '78px',
              maxWidth: '800px', 
              margin: '0 auto 45px', 
              opacity: 1,
              transform: 'rotate(0deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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
            grid-template-columns: repeat(12, 1fr);
            gap: 60px;
            text-align: left;
            align-items: start;
          }
          .about-text-column {
            grid-column: span 7;
            color: #64748b;
            font-size: 16px;
            line-height: 1.8;
          }
          .about-images-column {
            grid-column: span 5;
          }
          @media (max-width: 992px) {
            .about-grid-container {
              display: flex;
              flex-direction: column;
              gap: 40px;
            }
            .about-text-column, .about-images-column {
              width: 100%;
            }
          }
          .circle-img-wrapper {
            width: 295px;
            height: 344px;
            border-radius: 812px;
            overflow: hidden;
            border: 6px solid white;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
          }
          .circle-img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .values-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
          }
          .value-card {
            padding: 50px 30px;
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
            font-size: 36px;
            margin-bottom: 20px;
          }
          .gradient-btn {
            background: linear-gradient(95deg, #002896 0%, #3b82f6 100%);
            color: white;
            padding: 18px 70px;
            border-radius: 50px;
            border: none;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px rgba(0, 40, 150, 0.2);
          }
          .gradient-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 15px 30px rgba(0, 40, 150, 0.3);
          }
          @media (max-width: 992px) {
            .values-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 650px) {
            .values-grid { grid-template-columns: 1fr; }
            .team-member { scale: 0.8; }
          }
        `}</style>
      </main>
      <Footer />
      <DynamicScrollToTop colorSchema="gradient" />
    </>
  );
};

export default AboutPage;