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
  const [headerHeight, setHeaderHeight] = useState(196);

  useEffect(() => {
    const checkHeaderHeight = () => {
      const width = window.innerWidth;
      let calculatedHeight = 196;
      if (width <= 375) calculatedHeight = 62;
      else if (width <= 768) calculatedHeight = 65;
      else if (width <= 992) calculatedHeight = 70;
      setHeaderHeight(calculatedHeight);
    };
    checkHeaderHeight();
    window.addEventListener('resize', checkHeaderHeight);
    return () => window.removeEventListener('resize', checkHeaderHeight);
  }, []);

  return (
    <>
      <Header />
      <main style={{ 
        width: '100%',
        minHeight: 'auto', 
        background: '#ffffff',
        paddingTop: '304px',
        position: 'relative',
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: '100px',
        opacity: 1
      }}>
        
        {/* 1. Hero Section with Video Background */}
        <section style={{ 
          position: 'relative', 
          width: '100%', 
          height: '657px',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          background: '#002896',
          opacity: 1
        }}>
          {/* Video element */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          >
            <source src="/assets/images/teamwork-in-creative-video-production-company-woma-2026-01-21-02-14-14-utc.mp4" type="video/mp4" />
          </video>

          {/* Rectangle 37 - Figma Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(0deg, rgba(0, 40, 150, 0.54), rgba(0, 40, 150, 0.54))',
            zIndex: 1
          }}></div>

          {/* Content Wrapper */}
          <div style={{ 
            position: 'relative', 
            zIndex: 2, 
            width: '1440px', 
            height: '100%',
            margin: '0 auto'
          }}>
            {/* Vous êtes une entreprise... */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                position: 'absolute',
                width: '740.51px',
                height: '201px',
                left: '76px',
                top: '107px', /* 411px - 304px */
                color: '#FFFFFF', 
                fontFamily: '"DM Sans", sans-serif',
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '56px',
                lineHeight: '66px',
                margin: 0
              }}
            >
              Vous êtes une entreprise basée en dehors du territoire algérien ?
            </motion.h1>

            {/* Développez votre activité... */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ 
                position: 'absolute',
                width: '793.55px',
                height: '36px',
                left: '76px',
                top: '353px', /* 657px - 304px */
                color: '#FFFFFF', 
                fontFamily: '"Inter", sans-serif',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '26px',
                margin: 0
              }}
            >
              Développez votre activité et accédez à de nouvelles opportunités de croissance. MazadClick vous accompagne dans votre expansion sur le marché algérien.
            </motion.p>

            {/* Bouton */}
            <button 
              onClick={() => router.push('/contact')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px 36px',
                gap: '10px',
                position: 'absolute',
                width: '310px',
                height: '71px',
                left: '76px',
                top: '479px', /* 783px - 304px */
                background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
                boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
                borderRadius: '40px',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{
                width: 'auto',
                whiteSpace: 'nowrap',
                height: '23px',
                fontFamily: '"DM Sans", sans-serif',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: '23px',
                textAlign: 'center',
                color: '#FFFFFF'
              }}>
                Contactez-nous
              </span>
            </button>
          </div>
        </section>

        {/* 2. Why Use MazadClick? (Grid Layout from Image 1) */}
        <section style={{ position: 'relative', width: '1440px', height: '850px', margin: '0 auto' }}>
            <h2 style={{ 
              position: 'absolute',
              width: '1217px',
              height: '42px',
              left: '111px',
              top: '90px', 
              color: '#002896', 
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: '700', 
              fontSize: '32px',
              lineHeight: '42px',
              textAlign: 'center',
              margin: 0
            }}>
              L'Algérie sans frontières : Propulsez vos ambitions sur l'échiquier global avec MazadClick
            </h2>

            {[
                { 
                  title: "Conquérir les marchés mondiaux", 
                  img: "/assets/images/international01.png", 
                  left: '94px',
                  desc: "Déployez vos produits à l’international avec une visibilité structurée et crédible. Venez activer votre export."
                },
                { 
                  title: "Entreprendre au pays, simplement", 
                  img: "/assets/images/international02.png", 
                  left: '423px',
                  desc: "Accédez à des opportunités fiables et investissez à distance en toute confiance."
                },
                { 
                  title: "Créer des partenariats solides", 
                  img: "/assets/images/international03.png", 
                  left: '752px',
                  desc: "Trouvez des partenaires fiables et développez des relations B2B durables."
                },
                { 
                  title: "Sécuriser vos approvisionnements", 
                  img: "/assets/images/international04.png", 
                  left: '1068px', /* User requested 1068px for this one */
                  desc: "Accédez aux meilleures ressources et solutions pour booster votre activité."
                },
            ].map((item, idx) => (
                <div key={idx}>
                    {/* Image */}
                    <img 
                        src={item.img} 
                        alt={item.title}
                        style={{
                            position: 'absolute',
                            width: '301px',
                            height: '276px',
                            left: idx === 3 ? '1081px' : item.left, /* Keep images relative to previous grid or adjust? User said 1068 for text, 1081 was for image. I'll stick to 1081 for image for now unless asked. */
                            top: '222px', 
                            opacity: 1,
                            borderRadius: '15px',
                            objectFit: 'cover'
                        }}
                    />
                    {/* Title */}
                    <h3 style={{ 
                        position: 'absolute',
                        width: '301px',
                        left: idx === 3 ? '1068px' : item.left,
                        top: '520px',
                        color: '#002896', 
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '20px', 
                        fontWeight: '700',
                        textAlign: 'center',
                        margin: 0
                    }}>
                        {item.title}
                    </h3>
                    {/* Description */}
                    <p style={{ 
                        position: 'absolute',
                        width: '301px',
                        left: idx === 3 ? '1068px' : item.left,
                        top: '580px', 
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '18px',
                        lineHeight: '30px',
                        letterSpacing: '0px',
                        textAlign: 'center',
                        color: '#000000',
                        opacity: 1,
                        margin: 0
                    }}>
                        {item.desc}
                    </p>
                </div>
            ))}
        </section>
             {/* 3. How to Launch (Layout from Image 2) */}
        <section style={{ position: 'relative', width: '1440px', height: '900px', margin: '0 auto', background: '#FFFFFF' }}>
            <h2 style={{ 
              position: 'absolute',
              width: '610px', /* Estimated to fit 56px text well center-aligned */
              left: '415px',
              top: '56px', /* 1867px - 1811px start = 56px */
              color: '#002896', 
              fontFamily: '"DM Sans", sans-serif',
              fontStyle: 'normal',
              fontWeight: '700', 
              fontSize: '36px',
              lineHeight: '66px',
              textAlign: 'center',
              margin: 0
            }}>
              Votre passerelle stratégique entre l'Algérie et le monde.
            </h2>
            
            {/* Main Content Box (jsx-3cfa9929b7101d34 specs) */}
            <div style={{
              position: 'absolute',
              width: '1268px',
              height: '531px',
              left: '91px',
              top: '244px', /* 2055px - 1811px = 244px */
              opacity: 1,
            }}>
                <div style={{ position: 'absolute', left: '0px', top: '0px', width: '600px' }}>
                    <p style={{ color: '#444', fontSize: '18px', marginBottom: '40px', lineHeight: '1.6' }}>
                      <strong>Accélérez votre expansion à l'export</strong><br/><br/>
                      L’économie de demain se joue au-delà des frontières. MazadClick offre aux entreprises algériennes une vitrine structurée pour se positionner sur les marchés africains et européens, en les connectant à des partenaires fiables and en transformant leur potentiel export en opportunités concrètes.
                    </p>
                    <p style={{ color: '#444', fontSize: '18px', marginBottom: '40px', lineHeight: '1.6' }}>
                      <strong>Le point de liaison pour la diaspora et les investisseurs.</strong><br/><br/>
                      MazadClick simplifie l’investissement en Algérie en centralisant les opportunités et en sécurisant les mises en relation. Une solution claire et fiable pour connecter efficacement diaspora, investisseurs et porteurs de projets.
                    </p>
                    <p style={{ color: '#444', fontSize: '18px', marginBottom: '40px', lineHeight: '1.6' }}>
                      <strong>Une infrastructure pour des échanges sécurisés</strong><br/><br/>
                      MazadClick agit comme un tiers de confiance en structurant des échanges transparents et directs. Nous facilitons les partenariats import-export tout en réduisant les intermédiaires informels.
                    </p>
                </div>

                <img 
                  src="/assets/images/international05.png" 
                  alt="Strategic Bridge" 
                  style={{ 
                    position: 'absolute',
                    width: '629px', 
                    height: '512px',
                    left: '639px', /* Relative to parent: 730 - 91 = 639px */
                    top: '0px', /* Relative to parent: 2055 - 2055 = 0px */
                    borderRadius: '4px', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    opacity: 1
                  }}
                />
            </div>
        </section>

        {/* 4. Contact Team (Light Blue Glass Section from Image 2) */}
        <section style={{ 
            position: 'relative', 
            width: '1440px', 
            height: '500px', 
            margin: '0 auto',
            background: '#FFFFFF'
        }}>
            {/* Rectangle 48 Background */}
            <div style={{
                position: 'absolute',
                width: '1290px',
                height: '496px',
                left: '74px',
                top: '0px', 
                background: 'rgba(0, 150, 227, 0.12)',
                borderRadius: '0px'
            }}>
                {/* Heading */}
                <h2 style={{ 
                    position: 'absolute',
                    width: '935px',
                    height: '132px',
                    left: '196px', /* 270px - 74px = 196px */
                    top: '84px',   /* 2855px - 2771px = 84px */
                    color: '#002896', 
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '56px', 
                    fontWeight: '700', 
                    lineHeight: '66px',
                    textAlign: 'center',
                    margin: 0
                }}>
                    Contactez notre équipe pour plus de renseignements
                </h2>

                {/* Description */}
                <p style={{ 
                    position: 'absolute',
                    width: '623px',
                    height: '78px',
                    left: '343px', /* 417px - 74px = 343px */
                    top: '247px',  /* 3018px - 2771px = 247px */
                    color: '#002896', 
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: '400',
                    fontSize: '24px',
                    lineHeight: '26px',
                    textAlign: 'center',
                    margin: 0
                }}>
                    Lorem ipsum dolor sit amet consectetur. Sed vestibulum mauris elit sagittis eu. Dui felis tristique consectetur sagittis faucibus non et fusce lacinia.
                </p>

                {/* Button */}
                <button 
                  onClick={() => router.push('/contact')}
                  style={{
                    position: 'absolute',
                    width: '314px',
                    height: '71px',
                    left: '519px', /* 593px - 74px = 519px */
                    top: '374px',  /* 3145px - 2771px = 374px */
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '24px 36px',
                    gap: '10px',
                    background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
                    boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
                    borderRadius: '40px',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    <span style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: '600',
                        fontSize: '18px',
                        lineHeight: '23px',
                        color: '#FFFFFF'
                    }}>
                        Commencez
                    </span>
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

          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
          }

          .feature-card {
            text-align: center;
          }
          .feature-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 15px;
            margin-bottom: 20px;
          }
          .feature-card h3 {
            color: #003399;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 15px;
          }
          .feature-card p {
            color: #777;
            font-size: 14px;
            line-height: 1.5;
          }

          .contact-banner {
            background: #e6f0ff;
            padding: 60px;
            border-radius: 0px;
            text-align: center;
          }
          .contact-banner h2 {
            color: #003399;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 20px;
          }
          .contact-banner p {
            color: #003399;
            max-width: 600px;
            margin: 0 auto 30px;
            opacity: 0.8;
          }

          .pill-button {
            background: linear-gradient(90deg, #002680 0%, #2b65f0 100%);
            color: white;
            border: none;
            padding: 12px 60px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
          }

          @media (max-width: 768px) {
            .contact-banner { padding: 40px 20px; }
          }
        `}</style>

      </main>
      <Footer />
      <DynamicScrollToTop colorSchema="gradient" />
    </>
  );
};

export default InternationalPage;