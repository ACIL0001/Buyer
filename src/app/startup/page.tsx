"use client";

import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/FooterWithErrorBoundary';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import DynamicScrollToTop from "@/components/common/DynamicScrollToTop";
import { motion } from 'framer-motion';

const StartupPage = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div style={{ backgroundColor: '#FFFFFF', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main
        style={{
          width: '100%',
          margin: '0',
          background: '#FFFFFF',
          paddingTop: 'clamp(80px, 18vw, 256px)',
          position: 'relative',
          opacity: 1,
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        {/* 1. Hero Section with Video Background */}
        <section className="video-banner-container" style={{ marginTop: '20px' }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="video-banner-bg"
          >
            <source src="/assets/images/VF_04 - banner statup mp4.mp4" type="video/mp4" />
          </video>
        </section>

        {/* 2. Comment ça marche Section */}
        <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 20px)', background: '#ffffff' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{
              color: '#002896',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(22px, 2.5vw, 32px)',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 'clamp(40px, 6vw, 60px)',
              maxWidth: '800px',
              margin: '0 auto clamp(40px, 6vw, 60px)',
              lineHeight: 1.3,
            }}>
              Devenez le moteur de la transformation économique.
            </h2>

            {/* Row 1 */}
            <div className="feature-row">
              <div className="feature-text">
                <p>
                  <strong>Valorisez votre savoir-faire stratégique</strong><br /><br />
                  Au-delà d&apos;un produit, vous apportez une vision. MazadClick permet aux startups de mettre en avant leur expertise technique et leur réflexion stratégique. Nous transformons votre agilité en un atout pour les entreprises et institutions en quête de solutions innovantes.
                </p>
              </div>
              <div className="feature-image">
                <img src="/assets/images/startup01.jpg" alt="Valorisez votre savoir-faire" />
              </div>
            </div>

            {/* Row 2 (reverse) */}
            <div className="feature-row reverse">
              <div className="feature-text">
                <p>
                  <strong>Accédez à des opportunités de haut niveau</strong><br /><br />
                  Brisez les barrières de l&apos;informel et des réseaux fermés. Notre plateforme structure les mises en relation pour vous offrir un accès direct aux décideurs. Vous gagnez en visibilité professionnelle et assurez que vos solutions atteignent les bons interlocuteurs.
                </p>
              </div>
              <div className="feature-image">
                <img src="/assets/images/startup02.png" alt="Accédez aux opportunités" />
              </div>
            </div>

            {/* Row 3 */}
            <div className="feature-row">
              <div className="feature-text">
                <p>
                  <strong>Sécurisez et accélérez votre collaboration</strong><br /><br />
                  Le plus MazadClick ? La confiance et la traçabilité. Notre infrastructure digitale crédibilise votre démarche en centralisant échanges et opportunités. Résultat : des décisions plus rapides et un passage accéléré de la prise de contact à la réalisation.
                </p>
              </div>
              <div className="feature-image">
                <img src="/assets/images/startup03.png" alt="Sécurisez votre collaboration" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'clamp(40px, 6vw, 80px)' }}>
              <button
                onClick={(e) => e.preventDefault()}
                className="btn-solid-blue"
                style={{ padding: '16px 48px', fontSize: '18px', boxShadow: '0 10px 25px rgba(0, 92, 230, 0.3)' }}
              >
                Proposer mon expertise
              </button>
            </div>
          </div>
        </section>

        {/* 3. Statistics Banner */}
        <section style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto clamp(30px, 6vw, 60px)',
          padding: '0 clamp(16px, 4vw, 85px)',
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: '100%',
            background: 'linear-gradient(127.45deg, rgba(230, 230, 230, 0.7) 2.15%, rgba(195, 201, 215, 0.14) 63.05%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.42)',
            boxShadow: '0px 20px 40px 0px rgba(0, 0, 0, 0.1), 0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
            padding: 'clamp(28px, 5vw, 48px) clamp(20px, 4vw, 40px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'clamp(20px, 4vw, 40px)',
            boxSizing: 'border-box',
          }}>
            {[
              { number: '15', label: "Membres de l'équipe" },
              { number: '10', label: 'Fonctionnalités' },
              { number: '+10', label: 'Entreprises' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(36px, 4.5vw, 56px)',
                  color: '#002896',
                  lineHeight: 1.1,
                  marginBottom: '12px',
                }}>{s.number}</div>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(14px, 1.4vw, 16px)',
                  color: '#002896',
                  lineHeight: 1.3,
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Final CTA Section */}
        <section style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 84px) clamp(40px, 8vw, 80px)',
          boxSizing: 'border-box',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundImage: 'url("/assets/images/startup01.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            padding: 'clamp(40px, 8vw, 96px) clamp(24px, 5vw, 80px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 'clamp(16px, 3vw, 28px)',
            boxSizing: 'border-box',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 100%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', maxWidth: '100%', width: '100%', textAlign: 'right' }}>
              <h2 
                className="cta-title"
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(22px, 2.5vw, 32px)',
                  lineHeight: 1.3,
                  color: '#002896',
                  margin: 0,
                }}
              >
                Prets a lancer votre startup au niveau seconaire ?
              </h2>
            </div>

            <div style={{ position: 'relative', maxWidth: '623px', width: '100%', textAlign: 'right' }}>
              <p style={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 400,
                fontSize: 'clamp(14px, 1.6vw, 18px)',
                lineHeight: 1.5,
                color: '#002896',
                margin: 0,
              }}>
                Échangez, innovez et transformez votre vision en réussite économique.
              </p>
            </div>

            <div style={{
              position: 'relative',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(12px, 2vw, 20px)',
              justifyContent: 'flex-end',
              width: '100%',
            }}>
              <button
                onClick={() => router.push('/auth/login')}
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 'clamp(14px, 2.5vw, 24px) clamp(20px, 4vw, 36px)',
                  minHeight: 'clamp(50px, 7vw, 71px)',
                  background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
                  boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
                  borderRadius: '40px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(15px, 1.6vw, 18px)',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                }}
              >
                S&apos;inscrire
              </button>

              <button
                onClick={() => router.push('/contact')}
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 'clamp(14px, 2.5vw, 24px) clamp(20px, 4vw, 36px)',
                  minHeight: 'clamp(50px, 7vw, 71px)',
                  background: '#FFFFFF',
                  boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
                  borderRadius: '40px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(15px, 1.6vw, 18px)',
                  color: '#062C90',
                  whiteSpace: 'nowrap',
                }}
              >
                Nous contacter
              </button>
            </div>
          </div>
        </section>

        {/* Global Styles */}
        <style jsx global>{`
          .video-banner-container {
            position: relative;
            width: 100%;
            aspect-ratio: 2436 / 630;
            max-height: 630px;
            overflow: hidden;
            background: #002896;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .video-banner-bg {
            width: 2436px;
            height: 630px;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          .btn-solid-blue {
            background: #002896;
            color: white;
            border: none;
            border-radius: 50px;
            padding: 14px 32px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .btn-solid-blue:hover {
            background: #002896;
            transform: translateY(-2px);
          }

          .btn-outline-blue {
            background: transparent;
            color: #002896;
            border: 1px solid #002896;
            border-radius: 50px;
            padding: 14px 32px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .btn-outline-blue:hover {
            background: rgba(0, 40, 150, 0.05);
            transform: translateY(-2px);
          }

          .feature-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: clamp(24px, 4vw, 60px);
            margin-bottom: clamp(40px, 6vw, 80px);
          }
          .feature-row.reverse {
            flex-direction: row-reverse;
          }
          .feature-text {
            flex: 1 1 0;
            min-width: 0;
          }
          .feature-text p {
            color: #757575;
            font-family: 'Inter', sans-serif;
            font-size: clamp(14px, 1.4vw, 16px);
            line-height: 1.65;
            margin: 0;
          }
          .feature-image {
            flex: 1 1 0;
            min-width: 0;
            max-width: 554px;
          }
          .feature-image img {
            width: 100%;
            height: auto;
            max-height: 440px;
            object-fit: cover;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }

          @media (max-width: 768px) {
            .feature-row, .feature-row.reverse {
              flex-direction: column;
              gap: 24px;
              margin-bottom: 50px;
            }
            .feature-image {
              max-width: 100%;
            }
          }

          .cta-title {
            white-space: nowrap;
          }
          @media (max-width: 540px) {
            .cta-title {
              white-space: normal;
            }
          }
        `}</style>
      </main>
      <Footer />
      <DynamicScrollToTop colorSchema="gradient" />
    </div>
  );
};

export default StartupPage;
