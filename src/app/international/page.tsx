"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/FooterWithErrorBoundary';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import DynamicScrollToTop from "@/components/common/DynamicScrollToTop";
import { motion } from 'framer-motion';

const InternationalPage = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const features = [
    {
      title: 'Conquérir les marchés mondiaux',
      img: '/assets/images/international01.png',
      desc: 'Déployez vos produits à l’international avec une visibilité structurée et crédible. Venez activer votre export.',
    },
    {
      title: 'Entreprendre au pays, simplement',
      img: '/assets/images/international02.png',
      desc: 'Accédez à des opportunités fiables et investissez à distance en toute confiance.',
    },
    {
      title: 'Créer des partenariats solides',
      img: '/assets/images/international03.png',
      desc: 'Trouvez des partenaires fiables et développez des relations B2B durables.',
    },
    {
      title: 'Sécuriser vos approvisionnements',
      img: '/assets/images/international04.png',
      desc: 'Accédez aux meilleures ressources et solutions pour booster votre activité.',
    },
  ];

  return (
    <>
      <Header />
      <main style={{
        width: '100%',
        background: '#ffffff',
        paddingTop: 'clamp(80px, 18vw, 304px)',
        paddingBottom: 'clamp(40px, 8vw, 100px)',
        position: 'relative',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>

        {/* 1. Hero Section with Video Background */}
        <section className="video-banner-container">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="video-banner-bg"
          >
            <source src="/assets/images/VF_03 - banner international.mp4" type="video/mp4" />
          </video>
        </section>

        {/* 2. Why Use MazadClick? */}
        <section style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: 'clamp(40px, 8vw, 90px) clamp(16px, 4vw, 111px)',
          boxSizing: 'border-box',
        }}>
          <h2 style={{
            color: '#002896',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(22px, 2.5vw, 32px)',
            lineHeight: 1.3,
            textAlign: 'center',
            margin: '0 0 clamp(32px, 6vw, 64px)',
          }}>
            L&apos;Algérie sans frontières : Propulsez vos ambitions sur l&apos;échiquier global avec MazadClick
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'clamp(24px, 3vw, 32px)',
          }}>
            {features.map((item) => (
              <div key={item.title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
                <img
                  src={item.img}
                  alt={item.title}
                  style={{
                    width: '100%',
                    maxWidth: '301px',
                    aspectRatio: '301 / 276',
                    objectFit: 'cover',
                    borderRadius: '15px',
                  }}
                />
                <h3 style={{
                  color: '#002896',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 'clamp(16px, 1.8vw, 20px)',
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.3,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(14px, 1.5vw, 16px)',
                  lineHeight: 1.6,
                  color: '#444444',
                  margin: 0,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. How to Launch */}
        <section style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: 'clamp(30px, 6vw, 56px) clamp(16px, 4vw, 91px)',
          background: '#FFFFFF',
          boxSizing: 'border-box',
        }}>
          <h2 style={{
            color: '#002896',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(22px, 2.5vw, 32px)',
            lineHeight: 1.3,
            textAlign: 'center',
            margin: '0 0 clamp(32px, 6vw, 64px)',
            maxWidth: '780px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Votre passerelle stratégique entre l&apos;Algérie et le monde.
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 'clamp(24px, 4vw, 40px)',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ flex: '1 1 320px', minWidth: 0, maxWidth: '600px' }}>
              <p style={{ color: '#444', fontFamily: '"Inter", sans-serif', fontSize: 'clamp(14px, 1.5vw, 16px)', marginBottom: '32px', lineHeight: 1.6 }}>
                <strong>Accélérez votre expansion à l&apos;export</strong><br /><br />
                L&apos;économie de demain se joue au-delà des frontières. MazadClick offre aux entreprises algériennes une vitrine structurée pour se positionner sur les marchés africains et européens, en les connectant à des partenaires fiables et en transformant leur potentiel export en opportunités concrètes.
              </p>
              <p style={{ color: '#444', fontFamily: '"Inter", sans-serif', fontSize: 'clamp(14px, 1.5vw, 16px)', marginBottom: '32px', lineHeight: 1.6 }}>
                <strong>Le point de liaison pour la diaspora et les investisseurs.</strong><br /><br />
                MazadClick simplifie l&apos;investissement en Algérie en centralisant les opportunités et en sécurisant les mises en relation. Une solution claire et fiable pour connecter diaspora, investisseurs et porteurs de projets.
              </p>
              <p style={{ color: '#444', fontFamily: '"Inter", sans-serif', fontSize: 'clamp(14px, 1.5vw, 16px)', marginBottom: 0, lineHeight: 1.6 }}>
                <strong>Une infrastructure pour des échanges sécurisés</strong><br /><br />
                MazadClick agit comme un tiers de confiance en structurant des échanges transparents et directs. Nous facilitons les partenariats import-export tout en réduisant les intermédiaires informels.
              </p>
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 0, maxWidth: '629px' }}>
              <img
                src="/assets/images/international05.png"
                alt="Strategic Bridge"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '512px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
              />
            </div>
          </div>
        </section>

        {/* 4. Contact Team */}
        <section style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 74px)',
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: '100%',
            background: 'rgba(0, 150, 227, 0.12)',
            padding: 'clamp(40px, 8vw, 84px) clamp(20px, 5vw, 60px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(20px, 4vw, 40px)',
            boxSizing: 'border-box',
          }}>
            <h2 style={{
              color: '#002896',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(22px, 2.5vw, 32px)',
              fontWeight: 700,
              lineHeight: 1.3,
              textAlign: 'center',
              margin: 0,
              maxWidth: '935px',
            }}>
              Contactez notre équipe pour plus de renseignements
            </h2>

            <p style={{
              color: '#002896',
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(14px, 1.6vw, 18px)',
              lineHeight: 1.5,
              textAlign: 'center',
              margin: 0,
              maxWidth: '750px',
            }}>
              Une question sur nos services, nos tarifs ou les modalités d&apos;inscription ? Nos conseillers sont à votre écoute pour vous accompagner dans vos démarches et maximiser vos opportunités de marché.
            </p>

            <button
              onClick={() => router.push('/contact')}
              style={{
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 'clamp(14px, 2.5vw, 24px) clamp(20px, 4vw, 36px)',
                width: '100%',
                maxWidth: '314px',
                minHeight: 'clamp(52px, 8vw, 71px)',
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
                boxSizing: 'border-box',
              }}
            >
              Nous contacter
            </button>
          </div>
        </section>

        <style jsx global>{`
          .glass-button {
            background: linear-gradient(90deg, #0a3296 0%, #3066e6 100%);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            padding: 12px 40px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s;
          }
          .glass-button:hover {
            opacity: 0.9;
            transform: scale(1.02);
          }

          .video-banner-container {
            position: relative;
            width: 100%;
            background: #002896;
            display: flex;
            align-items: center;
            box-sizing: border-box;
            overflow: hidden;
          }

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
        `}</style>

      </main>
      <Footer />
      <DynamicScrollToTop colorSchema="gradient" />
    </>
  );
};

export default InternationalPage;
