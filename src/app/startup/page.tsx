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
    <div style={{ backgroundColor: '#FFFFFF', width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main
        style={{ 
        width: '100%',
        margin: '0',
        background: '#FFFFFF',
        paddingTop: '256px',
        position: 'relative',
        opacity: 1,
        transform: 'rotate(0deg)',
        boxSizing: 'border-box',
      }}>
        
        {/* 1. Hero Section */}
        <section
          className="startup-hero"
          style={{ 
          position: 'relative', 
          width: '100%',
          height: '657px',
          marginTop: '0px',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(0deg, rgba(0, 40, 150, 0.63), rgba(0, 40, 150, 0.63)), url("/assets/images/startup banner.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
          transform: 'rotate(0deg)'
        }}>
          {/* Centered 1440px Figma Artboard for Absolute Positioning */}
          <div style={{ position: 'relative', width: '1440px', height: '100%', margin: '0 auto' }}>
            {/* Group 17 Container */}
            <div style={{
            position: 'absolute',
            width: '792.45px',
            height: '443px',
            left: '75.95px', /* 80.95px - 5px offset */
            top: '107px',    /* 440px - 333px offset */
            zIndex: 2,
          }}>
            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                position: 'absolute',
                width: '739.49px',
                height: '201px',
                left: 0,
                top: 0,
                fontFamily: '"DM Sans", sans-serif',
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '56px',
                lineHeight: '66px',
                color: '#FFFFFF',
                margin: 0
              }}
            >
              Mazadclick Startups<br />
              Lorem Ipsum
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                position: 'absolute',
                width: '792.45px',
                height: '36px',
                left: 0,
                top: '246px', /* 686px - 440px */
                fontFamily: '"Inter", sans-serif',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '18px',
                lineHeight: '18px',
                color: '#FCFEFF',
                margin: 0
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
            </motion.p>

            {/* Button */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{
                position: 'absolute',
                left: 0,      /* relative to group */
                top: '372px', /* 812px - 440px */
              }}
            >
              <button 
                onClick={() => router.push('/plans')}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '24px 36px',
                  gap: '10px',
                  width: '315px',
                  height: '71px',
                  background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
                  boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
                  borderRadius: '40px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{
                  width: '179px',
                  height: '23px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '18px',
                  lineHeight: '23px',
                  textAlign: 'center',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  display: 'block',
                  whiteSpace: 'nowrap'
                }}>
                  Découvrez nos plans
                </span>
              </button>
            </motion.div>
          </div>
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

            {/* Row 1 - Figma Absolute Layout */}
            <div style={{
              position: 'relative',
              width: '1440px',
              height: '440px', /* Image height determines block height */
              margin: '0 auto',
              marginBottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              {/* Text Block */}
              <div style={{
                position: 'absolute',
                width: '520px',
                height: 'auto',
                left: '91px',
                top: '166px', /* 1360px - 1194px */
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '28px',
                color: '#757575',
              }}>
                <p style={{ margin: 0 }}>
                  <strong>Valorisez votre savoir-faire stratégique</strong><br/><br/>
                  Au-delà d’un produit, vous apportez une vision. MazadClick permet aux startups de mettre en avant leur expertise technique et leur réflexion stratégique. Nous transformons votre agilité en un atout pour les entreprises et institutions en quête de solutions innovantes.
                </p>
              </div>

              {/* Image Block */}
              <img 
                src="/assets/images/startup01.png" 
                alt="Valorisez votre savoir-faire"
                style={{
                  position: 'absolute',
                  width: '554px',
                  height: '440px',
                  left: '827px',
                  top: '0px', /* 1194px - 1194px */
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  objectFit: 'cover'
                }}
              />
            </div>

            {/* Row 2 - Figma Absolute Layout */}
            <div style={{
              position: 'relative',
              width: '1440px',
              height: '440px', /* Image height */
              margin: '0 auto',
              marginBottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              {/* Image Block */}
              <img 
                src="/assets/images/startup02.png" 
                alt="Accédez aux opportunités"
                style={{
                  position: 'absolute',
                  width: '521px',
                  height: '440px',
                  left: '75px',
                  top: '0px', /* 1637px - 1637px */
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  objectFit: 'cover'
                }}
              />
              {/* Text Block */}
              <div style={{
                position: 'absolute',
                width: '520px',
                height: 'auto',
                left: '827px', /* Mirrored offset */
                top: '166px', /* Mirrored offset */
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '28px',
                color: '#757575',
              }}>
                <p style={{ margin: 0 }}>
                  <strong>Accédez à des opportunités de haut niveau</strong><br/><br/>
                  Brisez les barrières de l’informel et des réseaux fermés. Notre plateforme structure les mises en relation pour vous offrir un accès direct aux décideurs. Vous gagnez en visibilité professionnelle et assurez que vos solutions atteignent les bons interlocuteurs.
                </p>
              </div>
            </div>

            {/* Row 3 - Figma Absolute Layout */}
            <div style={{
              position: 'relative',
              width: '1440px',
              height: '440px', /* Image height */
              margin: '0 auto',
              marginBottom: '40px', /* Gap before button */
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
              {/* Text Block */}
              <div style={{
                position: 'absolute',
                width: '520px',
                height: 'auto',
                left: '91px', /* Mirrored offset */
                top: '166px', /* Mirrored offset */
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '28px',
                color: '#757575',
              }}>
                <p style={{ margin: 0 }}>
                  <strong>Sécurisez et accélérez votre collaboration</strong><br/><br/>
                  Le plus MazadClick ? La confiance et la traçabilité. Notre infrastructure digitale crédibilise votre démarche en centralisant échanges et opportunités. Résultat : des décisions plus rapides et un passage accéléré de la prise de contact à la réalisation.
                </p>
              </div>
              {/* Image Block */}
              <img 
                src="/assets/images/startup03.png" 
                alt="Sécurisez votre collaboration"
                style={{
                  position: 'absolute',
                  width: '530px',
                  height: '440px',
                  left: '844px',
                  top: '0px', /* 2074px - 2074px */
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            {/* CTA Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '80px' }}>
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

        {/* 3. Statistics Banner Figma Absolute */}
        <section style={{ 
          position: 'relative',
          width: '1440px',
          height: '211px',
          margin: '0 auto 60px',
        }}>
          {/* Banner Background Tool */}
          <div style={{
            position: 'absolute',
            width: '1288px',
            height: '211px',
            top: '0px', /* 2628px - 2628px */
            left: '85px',
            background: 'linear-gradient(127.45deg, rgba(230, 230, 230, 0.7) 2.15%, rgba(195, 201, 215, 0.14) 63.05%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid',
            borderImageSource: 'linear-gradient(127.23deg, rgba(255, 255, 255, 0.42) 2.46%, rgba(255, 255, 255, 0.24) 97.36%)',
            borderImageSlice: 1,
            boxShadow: '0px 20px 40px 0px rgba(0, 0, 0, 0.1), 0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
            opacity: 1,
            boxSizing: 'border-box'
          }}></div>

          {/* 15 Text */}
          <div style={{
            position: 'absolute',
            width: '138px',
            height: '33px',
            top: '72px', /* 2700px - 2628px */
            left: '276px',
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '64px',
            lineHeight: '18px',
            textAlign: 'center',
            color: '#002896',
          }}>
            15
          </div>
          {/* Membres Text */}
          <div style={{
            position: 'absolute',
            width: '241px',
            height: '46px',
            top: '129px', /* 2757px - 2628px */
            left: '233px',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '18px',
            textAlign: 'center',
            color: '#002896',
          }}>
            Membres de l'équipe
          </div>

          {/* 10 Text */}
          <div style={{
            position: 'absolute',
            width: '137px',
            height: '69px',
            top: '69px', /* 2697px - 2628px */
            left: '686px',
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '64px',
            lineHeight: '18px',
            textAlign: 'center',
            color: '#002896',
          }}>
            10
          </div>
          {/* Fonctionnalités Text */}
          <div style={{
            position: 'absolute',
            width: '241px',
            height: '46px',
            top: '129px', /* 2757px - 2628px */
            left: '645px',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '18px',
            textAlign: 'center',
            color: '#002896',
          }}>
            Fonctionnalités
          </div>

          {/* +10 Text */}
          <div style={{
            position: 'absolute',
            width: '138px',
            height: '69px',
            top: '71px', /* 2699px - 2628px */
            left: '1057px',
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            fontSize: '64px',
            lineHeight: '18px',
            textAlign: 'center',
            color: '#002896',
          }}>
            +10
          </div>
          {/* Entreprises Text */}
          <div style={{
            position: 'absolute',
            width: '241px',
            height: '46px',
            top: '129px', /* 2757px - 2628px */
            left: '1020px',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '18px',
            textAlign: 'center',
            color: '#002896',
          }}>
            Entreprises
          </div>
        </section>

        {/* 4. Final CTA Section Figma Absolute */}
        <section style={{ 
          position: 'relative',
          width: '1440px',
          height: '609px',
          margin: '0 auto',
        }}>
          {/* Image Rect 48 */}
          <div style={{
            position: 'absolute',
            width: '1290px',
            height: '496px',
            top: '0px', /* 2934 - 2934 */
            left: '84px',
            backgroundImage: 'url("/assets/images/startup01.png")', /* Fallback to existing image to avoid missing asset errors */
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '24px'
          }}>
            {/* Keeping overlay from previous design so blue text remains readable if image is light */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 100%)', borderRadius: '24px' }}></div>
          </div>

          {/* Title */}
          <div style={{
            position: 'absolute',
            width: '751px',
            height: '230px',
            right: '115px', /* Figma spec exact */
            top: '207px', /* 3141 - 2934 */
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            fontSize: '56px',
            lineHeight: '66px',
            textAlign: 'right',
            color: '#002896',
          }}>
            Prets a lancer votre startup au niveau seconaire ?
          </div>

          {/* Subtitle */}
          <div style={{
            position: 'absolute',
            width: '623px',
            height: '56px',
            left: '687px',
            top: '365px', /* 3299 - 2934 */
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 400,
            fontSize: '24px',
            lineHeight: '26px',
            textAlign: 'right',
            color: '#002896',
          }}>
            Échangez, innovez et transformez votre vision en réussite économique.
          </div>

          {/* Action Button 1 (Primary) */}
          <button 
            onClick={() => router.push('/auth/login')}
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px 36px',
              gap: '10px',
              width: '264px',
              height: '71px',
              left: '415px',
              top: '538px', /* 3472 - 2934 */
              background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
              boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
              borderRadius: '40px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{
              width: '81px',
              height: '23px',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '23px',
              textAlign: 'center',
              color: '#FFFFFF',
              flex: 'none',
              order: 0,
              flexGrow: 0,
              whiteSpace: 'nowrap'
            }}>
              S'inscrire
            </span>
          </button>

          {/* Action Button 2 (Secondary) */}
          <button 
            onClick={() => router.push('/contact')}
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px 36px',
              gap: '10px',
              width: '260px',
              height: '71px',
              left: '761px',
              top: '538px', /* 3472 - 2934 */
              background: 'linear-gradient(0deg, #FFFFFF, #FFFFFF)',
              boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
              borderRadius: '40px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span style={{
              width: '135px',
              height: '23px',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: '18px',
              lineHeight: '23px',
              textAlign: 'center',
              color: '#062C90',
              flex: 'none',
              order: 0,
              flexGrow: 0,
              whiteSpace: 'nowrap'
            }}>
              Nous contacter
            </span>
          </button>
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
    </div>
  );
};

export default StartupPage;