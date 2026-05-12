"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const GuestHero = () => {
  const router = useRouter();

  return (
    <>
      <style jsx>{`
        .guest-hero-root {
          width: 100%;
          max-width: 1218px;
          min-height: 315px;
          position: relative;
          background: #f8f9fb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin: 10px auto 0;
          border-radius: 0px;
        }
        @media (max-width: 767px) {
          .guest-hero-root {
            min-height: 50vh;
            max-height: 380px;
            margin-top: 0;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .guest-hero-root {
            min-height: 45vh;
            max-height: 420px;
          }
        }
      `}</style>
      <div className="guest-hero-root">
      {/* Video Background */}
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
          opacity: 0.8
        }}
      >
        <source src="/assets/images/white-background-2026-01-28-04-31-25-utc.mp4" type="video/mp4" />
      </video>

      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            width: '100%',
            maxWidth: '800px',
            color: '#002896',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(20px, 5vw, 48px)',
            fontWeight: '700',
            lineHeight: '1.2',
            textAlign: 'center',
            letterSpacing: '0px',
            margin: '0 0 12px 0',
            opacity: 1
          }}
        >
          Bienvenue sur Mazadclick
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            width: '100%',
            maxWidth: '600px',
            color: '#0096E3',
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(13px, 2.5vw, 18px)',
            fontWeight: '400',
            lineHeight: '1.4',
            textAlign: 'center',
            letterSpacing: '0px',
            margin: '0 0 20px 0',
            opacity: 1
          }}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit<br/>
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            display: 'flex',
            gap: 'clamp(8px, 2vw, 15px)',
            flexWrap: 'nowrap',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}
        >
          {/* Commencer Button */}
          <button
            onClick={() => window.location.href = 'http://localhost:3001/auth/register/'}
            style={{
              minWidth: 'clamp(110px, 28vw, 140px)',
              minHeight: 'clamp(40px, 9vw, 52px)',
              padding: 'clamp(8px, 2vw, 24px) clamp(14px, 3vw, 36px)',
              borderRadius: '40px',
              background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
              boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '600',
              fontSize: 'clamp(0.85rem, 1.6vw, 1.125rem)',
              lineHeight: 1.3,
              textAlign: 'center',
              color: '#FFFFFF',
              whiteSpace: 'nowrap'
            }}>
              Commencer
            </span>
          </button>

          {/* Aide Button */}
          <button
            onClick={() => router.push('/contact')}
            style={{
              minWidth: 'clamp(78px, 20vw, 92px)',
              minHeight: 'clamp(40px, 9vw, 52px)',
              padding: 'clamp(8px, 2vw, 24px) clamp(12px, 2.5vw, 36px)',
              borderRadius: '100px',
              background: '#FFFFFF',
              boxShadow: 'inset 1px 1px 4px 0px #002896, inset -1px -1px 1px 0px #0096E3, inset -1px -1px 1px 0px #002896, inset 1px 1px 1px 0px #002896, 0px 4px 4px 0px #00000040',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '600',
              fontSize: 'clamp(0.85rem, 1.6vw, 1.125rem)',
              color: '#002896'
            }}>
              Aide
            </span>
          </button>
        </motion.div>
      </div>
      </div>
    </>
  );
};

export default GuestHero;
