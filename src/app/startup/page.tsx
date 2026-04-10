"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/FooterWithErrorBoundary';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import DynamicScrollToTop from "@/components/common/DynamicScrollToTop";
import { motion } from 'framer-motion';

const StartupPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState(104);

  useEffect(() => {
    const checkHeaderHeight = () => {
      const width = window.innerWidth;
      let calculatedHeight = 104;
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
        width: '1440px',
        height: '4614px',
        margin: '0 auto',
        background: '#ffffff',
        paddingTop: `${headerHeight}px`,
        position: 'relative',
        overflow: 'hidden',
        opacity: 1,
        transform: 'rotate(0deg)'
      }}>
        
        {/* 1. Hero Section */}
        <section style={{ 
          position: 'relative', 
          width: '1439px', 
          height: '657px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: 'url("/assets/images/startup banner.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
          transform: 'rotate(0deg)'
        }}>
          {/* Blue Overlay */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#002896A1',
            zIndex: 1
          }}></div>

          <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ color: '#ffffff', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: '800', marginBottom: '16px', lineHeight: 1.1 }}
            >
              Mazadclick Startups<br />
              Lorem Ipsum
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '18px', maxWidth: '600px', marginBottom: '40px', lineHeight: 1.6 }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button 
                onClick={() => router.push('/plans')}
                style={{
                  width: '315px',
                  height: '71px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
                  border: 'none',
                  borderRadius: '40px',
                  padding: '24px 36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: 'inset 1px 1px 4px 0px #FFFFFF99, inset -1px -1px 1px 0px #FFFFFF40, inset 1px 1px 1px 0px #062C9066, inset -1px -1px 1px 0px #062C9066',
                  transition: 'transform 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{
                  width: '179px',
                  height: '23px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: '600',
                  fontSize: '18px',
                  lineHeight: '100%',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  display: 'block',
                  whiteSpace: 'nowrap'
                }}>
                  Découvrez nos plans
                </span>
              </button>
            </motion.div>
          </div>
        </section>

        {/* 2. Comment ça marche Section */}
        <section style={{ padding: '80px 20px', background: '#ffffff' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ 
              color: '#002896', 
              fontSize: 'clamp(28px, 4vw, 42px)', 
              fontWeight: '800', 
              textAlign: 'center', 
              marginBottom: '80px',
              maxWidth: '800px',
              margin: '0 auto 80px'
            }}>
              Devenez le moteur de la transformation économique.
            </h2>

            {/* Row 1 */}
            <div className="feature-row">
              <div className="feature-text">
                <p><strong>Valorisez votre savoir-faire stratégique</strong><br/><br/>Au-delà d’un produit, vous apportez une vision. MazadClick permet aux startups de mettre en avant leur expertise technique et leur réflexion stratégique. Nous transformons votre agilité en un atout pour les entreprises et institutions en quête de solutions innovantes.</p>
              </div>
              <div className="feature-image">
                <img src="/assets/images/startup01.png" alt="Valorisez votre savoir-faire" />
              </div>
            </div>

            {/* Row 2 */}
            <div className="feature-row reverse">
              <div className="feature-text">
                <p><strong>Accédez à des opportunités de haut niveau</strong><br/><br/>Brisez les barrières de l’informel et des réseaux fermés. Notre plateforme structure les mises en relation pour vous offrir un accès direct aux décideurs. Vous gagnez en visibilité professionnelle et assurez que vos solutions atteignent les bons interlocuteurs.</p>
              </div>
              <div className="feature-image">
                <img src="/assets/images/startup02.png" alt="Accédez aux opportunités" />
              </div>
            </div>

            {/* Row 3 */}
            <div className="feature-row">
              <div className="feature-text">
                <p><strong>Sécurisez et accélérez votre collaboration</strong><br/><br/>Le plus MazadClick ? La confiance et la traçabilité. Notre infrastructure digitale crédibilise votre démarche en centralisant échanges et opportunités. Résultat : des décisions plus rapides et un passage accéléré de la prise de contact à la réalisation.</p>
              </div>
              <div className="feature-image">
                <img src="/assets/images/startup03.png" alt="Sécurisez votre collaboration" />
              </div>
            </div>
            
            {/* Added CTA Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
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
          padding: '20px 20px 60px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '1288px',
            height: '211px',
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
            flexWrap: 'wrap',
            gap: '30px',
            boxShadow: '0px 20px 40px 0px #0000001A, 0px 4px 4px 0px #00000040',
            opacity: 1,
            transform: 'rotate(0deg)',
            boxSizing: 'border-box'
          }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#002896', fontSize: '48px', fontWeight: '800', margin: '0 0 8px 0' }}>15</h3>
                <p style={{ color: '#002896', fontSize: '16px', fontWeight: '600', margin: 0 }}>Membres de l'équipe</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#002896', fontSize: '48px', fontWeight: '800', margin: '0 0 8px 0' }}>10</h3>
                <p style={{ color: '#002896', fontSize: '16px', fontWeight: '600', margin: 0 }}>Fonctionnalités</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ color: '#002896', fontSize: '48px', fontWeight: '800', margin: '0 0 8px 0' }}>+10</h3>
                <p style={{ color: '#002896', fontSize: '16px', fontWeight: '600', margin: 0 }}>Entreprises</p>
              </div>
            </div>
        </section>

        {/* 4. Final CTA Section */}
        <section style={{ padding: '0 20px 80px' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Image Banner */}
            <div style={{
              position: 'relative',
              width: '1290px',
              height: '609px',
              backgroundImage: 'url("/assets/images/startup01.png")', 
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '60px',
              marginBottom: '40px',
              boxShadow: '0 20px 40px rgba(0, 40, 150, 0.08)',
              opacity: 1,
              transform: 'rotate(0deg)',
              margin: '0 auto 40px'
            }}>
              {/* Overlay for text legibility (adjusted for blue text) */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 100%)' }}></div>
              
              <div style={{ position: 'relative', zIndex: 2, width: '751px', textAlign: 'right' }}>
                <h2 style={{ 
                  color: '#002896', 
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: '700',
                  fontSize: '56px', 
                  lineHeight: '66px',
                  marginBottom: '16px',
                  opacity: 1,
                  transform: 'rotate(0deg)'
                }}>
                  Prets a lancer votre startup au niveau seconaire ?
                </h2>
                <p style={{ 
                  color: '#002896', 
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: '400',
                  fontSize: '24px', 
                  lineHeight: '26px',
                  textAlign: 'right',
                  opacity: 0.9,
                  margin: 0
                }}>
                  Échangez, innovez et transformez votre vision en réussite économique.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '82px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => router.push('/auth/login')}
                style={{
                  width: '264px',
                  height: '71px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
                  border: 'none',
                  borderRadius: '40px',
                  padding: '24px 36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: 'inset 1px 1px 4px 0px #FFFFFF99, inset -1px -1px 1px 0px #FFFFFF40, inset 1px 1px 1px 0px #062C9066, inset -1px -1px 1px 0px #062C9066',
                  transition: 'transform 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{
                  width: '81px',
                  height: '23px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: '600',
                  fontSize: '18px',
                  lineHeight: '100%',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  display: 'block'
                }}>
                  S'inscrire
                </span>
              </button>

              <button 
                onClick={() => router.push('/contact')}
                style={{
                  width: '260px',
                  height: '71px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  background: 'linear-gradient(0deg, #FFFFFF, #FFFFFF)',
                  border: 'none',
                  borderRadius: '40px',
                  padding: '24px 36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  boxShadow: 'inset 1px 1px 4px 0px #FFFFFF99, inset -1px -1px 1px 0px #FFFFFF40, inset 1px 1px 1px 0px #062C9066, inset -1px -1px 1px 0px #062C9066',
                  transition: 'transform 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{
                  width: '135px',
                  height: '23px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: '600',
                  fontSize: '18px',
                  lineHeight: '100%',
                  textAlign: 'center',
                  color: '#062C90',
                  display: 'block'
                }}>
                  Nous contacter
                </span>
              </button>
            </div>

          </div>
        </section>

        {/* Global Styles */}
        <style jsx global>{`
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
            gap: 60px;
            margin-bottom: 80px;
          }
          .feature-row.reverse {
            flex-direction: row-reverse;
          }
          .feature-text {
            flex: 1;
          }
          .feature-text p {
            color: #64748b;
            font-size: 16px;
            line-height: 1.8;
            margin: 0;
          }
          .feature-image {
            flex: 1;
            max-width: 500px;
          }
          .feature-image img {
            width: 100%;
            height: auto;
            object-fit: cover;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }

          @media (max-width: 768px) {
            .feature-row, .feature-row.reverse {
              flex-direction: column;
              gap: 30px;
              margin-bottom: 50px;
            }
            .feature-image {
              max-width: 100%;
            }
          }
        `}</style>

      </main>
      <Footer />
      <DynamicScrollToTop colorSchema="gradient" />
    </>
  );
};

export default StartupPage;