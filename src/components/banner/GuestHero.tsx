"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const GuestHero = () => {
  const router = useRouter();

  return (
    <div style={{ 
      width: '100%', 
      height: '640px',
      position: 'relative',
      background: '#f8f9fb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
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
          opacity: 0.8 // Slightly reduced opacity to ensure text readability if needed
        }}
      >
        <source src="/assets/images/white-background-2026-01-28-04-31-25-utc.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ 
            color: '#002896', 
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '56px', 
            fontWeight: '700', 
            lineHeight: '66px',
            textAlign: 'center',
            width: '400px',
            height: '132px',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '0px'
          }}
        >
          Bienvenue sur <br/>
          Mazadclick
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ 
            color: '#0096E3', 
            fontFamily: "'Inter', sans-serif",
            fontSize: '18px', 
            fontWeight: '400',
            lineHeight: '18px',
            textAlign: 'center',
            width: '579px',
            height: '54px',
            margin: '0 auto 45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '0px'
          }}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit <br/>
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. <br/>
          Ut enim ad minim veniam
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button 
            onClick={() => window.location.href = 'http://localhost:3001/auth/register/'}
            style={{
              width: '181px',
              height: '71px',
              borderRadius: '40px',
              gap: '10px',
              padding: '24px 36px',
              background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
              boxShadow: 'inset 1px 1px 4px 0px #FFFFFF99, inset -1px -1px 1px 0px #FFFFFF40, inset 1px 1px 1px 0px #062C9066, inset -1px -1px 1px 0px #062C9066',
              color: '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '600',
              fontSize: '18px',
              lineHeight: '1',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            Commencez
          </button>
          
          <button 
            onClick={() => router.push('/contact')}
            style={{
              width: '112px',
              height: '71px',
              borderRadius: '100px',
              padding: '24px 36px',
              background: '#FFFFFF',
              boxShadow: 'inset 1px 1px 4px 0px #002896, inset -1px -1px 1px 0px #0096E3, inset -1px -1px 1px 0px #002896, inset 1px 1px 1px 0px #002896, 0px 4px 4px 0px #00000040',
              color: '#002896',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: '600',
              fontSize: '18px',
              lineHeight: '1',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center', // Centers the text visually within the button
              textAlign: 'right',
              gap: '10px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'inset 1px 1px 6px 0px #002896, inset -1px -1px 2px 0px #0096E3, 0px 6px 8px 0px #00000030';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'inset 1px 1px 4px 0px #002896, inset -1px -1px 1px 0px #0096E3, inset -1px -1px 1px 0px #002896, inset 1px 1px 1px 0px #002896, 0px 4px 4px 0px #00000040';
            }}
          >
            Aide
          </button>
        </motion.div>
      </div>

    </div>
  );
};

export default GuestHero;
