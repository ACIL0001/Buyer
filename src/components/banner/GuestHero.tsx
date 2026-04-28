"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const GuestHero = () => {
  const router = useRouter();

  return (
    <div style={{ 
      width: '1218px', 
      maxWidth: '100%',
      height: '315px',
      position: 'relative',
      background: '#f8f9fb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      margin: '10px auto 0', /* 10px margin top as requested */
      borderRadius: '0px',
      opacity: 1,
      transform: 'rotate(0deg)'
    }}>
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

      {/* Content wrapper - Relative to the 1218px box, but coordinated via Figma 1440px offsets */}
      {/* Figma offsets are relative to 1440. We are at 111px left (approx). */}
      {/* Content wrapper - Flex centering for robust alignment */}
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
            fontSize: '48px', 
            fontWeight: '700', 
            lineHeight: '1.2',
            textAlign: 'center',
            letterSpacing: '0px',
            margin: '0 0 20px 0',
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
            fontSize: '18px', 
            fontWeight: '400',
            lineHeight: '1.4',
            textAlign: 'center',
            letterSpacing: '0px',
            margin: '0 0 30px 0',
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
            gap: '15px',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}
        >
          {/* Commencer Button */}
          <button 
            onClick={() => window.location.href = 'http://localhost:3001/auth/register/'}
            style={{
              width: '181px',
              height: '71px',
              borderRadius: '40px',
              padding: '24px 36px',
              background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
              boxShadow: 'inset -1px -1px 1px rgba(6, 44, 144, 0.4), inset 1px 1px 1px rgba(6, 44, 144, 0.4), inset -1px -1px 1px rgba(255, 255, 255, 0.25), inset 1px 1px 4px rgba(255, 255, 255, 0.6)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s ease',
              opacity: 1
            }}
          >
            <span style={{
              width: '109px',
              height: '23px',
              fontFamily: "'DM Sans', sans-serif",
              fontStyle: 'normal',
              fontWeight: '600',
              fontSize: '18px',
              lineHeight: '23px',
              textAlign: 'center',
              color: '#FFFFFF'
            }}>
              Commencer
            </span>
          </button>
          
          {/* Aide Button */}
          <button 
            onClick={() => router.push('/contact')}
            style={{
              width: '112px',
              height: '71px',
              borderRadius: '100px',
              padding: '24px 36px',
              background: '#FFFFFF',
              boxShadow: 'inset 1px 1px 4px 0px #002896, inset -1px -1px 1px 0px #0096E3, inset -1px -1px 1px 0px #002896, inset 1px 1px 1px 0px #002896, 0px 4px 4px 0px #00000040',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              opacity: 1
            }}
          >
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '600',
              fontSize: '18px',
              color: '#002896'
            }}>
              Aide
            </span>
          </button>
        </motion.div>
      </div>

    </div>
  );
};

export default GuestHero;
