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
        <section style={{
          position: 'relative',
          width: '100%',
          minHeight: 'clamp(420px, 60vw, 657px)',
          margin: 0,
          overflow: 'hidden',
          background: '#002896',
          display: 'flex',
          alignItems: 'center',
          padding: 'clamp(40px, 8vw, 107px) clamp(20px, 5vw, 76px)',
          boxSizing: 'border-box',
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          >
            <source src="/assets/images/teamwork-in-creative-video-production-company-woma-2026-01-21-02-14-14-utc.mp4" type="video/mp4" />
          </video>

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(0deg, rgba(0, 40, 150, 0.54), rgba(0, 40, 150, 0.54))',
            zIndex: 1,
          }} />

          <div style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
          }}>
            <div style={{ maxWidth: '793px', display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 4vw, 45px)' }}>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  color: '#FFFFFF',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(28px, 5.5vw, 56px)',
                  lineHeight: 1.18,
                  margin: 0,
                }}
              >
                Vous êtes une entreprise basée en dehors du territoire algérien ?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  color: '#FFFFFF',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(14px, 1.6vw, 18px)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Développez votre activité et accédez à de nouvelles opportunités de croissance. MazadClick vous accompagne dans votre expansion sur le marché algérien.
              </motion.p>

              <button
                onClick={() => router.push('/contact')}
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 'clamp(14px, 2.5vw, 24px) clamp(20px, 4vw, 36px)',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '310px',
                  minHeight: 'clamp(52px, 8vw, 71px)',
                  background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
                  boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
                  borderRadius: '40px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(15px, 1.6vw, 18px)',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Contactez-nous
              </button>
            </div>
          </div>
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
            fontSize: 'clamp(22px, 3vw, 32px)',
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
                  fontSize: 'clamp(17px, 1.6vw, 20px)',
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.3,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(15px, 1.5vw, 18px)',
                  lineHeight: 1.6,
                  color: '#000000',
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
            fontSize: 'clamp(22px, 3.6vw, 36px)',
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
              <p style={{ color: '#444', fontSize: 'clamp(15px, 1.7vw, 18px)', marginBottom: '32px', lineHeight: 1.6 }}>
                <strong>Accélérez votre expansion à l&apos;export</strong><br /><br />
                L&apos;économie de demain se joue au-delà des frontières. MazadClick offre aux entreprises algériennes une vitrine structurée pour se positionner sur les marchés africains et européens, en les connectant à des partenaires fiables et en transformant leur potentiel export en opportunités concrètes.
              </p>
              <p style={{ color: '#444', fontSize: 'clamp(15px, 1.7vw, 18px)', marginBottom: '32px', lineHeight: 1.6 }}>
                <strong>Le point de liaison pour la diaspora et les investisseurs.</strong><br /><br />
                MazadClick simplifie l&apos;investissement en Algérie en centralisant les opportunités et en sécurisant les mises en relation. Une solution claire et fiable pour connecter efficacement diaspora, investisseurs et porteurs de projets.
              </p>
              <p style={{ color: '#444', fontSize: 'clamp(15px, 1.7vw, 18px)', marginBottom: 0, lineHeight: 1.6 }}>
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
              fontSize: 'clamp(26px, 5vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.2,
              textAlign: 'center',
              margin: 0,
              maxWidth: '935px',
            }}>
              Contactez notre équipe pour plus de renseignements
            </h2>

            <p style={{
              color: '#002896',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(15px, 2vw, 24px)',
              lineHeight: 1.4,
              textAlign: 'center',
              margin: 0,
              maxWidth: '623px',
            }}>
              Lorem ipsum dolor sit amet consectetur. Sed vestibulum mauris elit sagittis eu. Dui felis tristique consectetur sagittis faucibus non et fusce lacinia.
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
              Commencez
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
        `}</style>

      </main>
      <Footer />
      <DynamicScrollToTop colorSchema="gradient" />
    </>
  );
};

export default InternationalPage;
