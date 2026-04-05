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
      {/* Background Pattern: Vertical soft pillars/waves effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `repeating-linear-gradient(
          90deg,
          #ffffff 0px,
          #ffffff 80px,
          #f1f5f9 100px,
          #ffffff 120px
        )`,
        opacity: 0.6,
        zIndex: 0
      }}></div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ 
            color: '#002bc5', 
            fontSize: 'clamp(40px, 6vw, 64px)', 
            fontWeight: '900', 
            marginBottom: '20px',
            lineHeight: '1.1'
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
            color: '#0ea5e9', 
            fontSize: '18px', 
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto 45px',
            fontWeight: '500'
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
              background: 'linear-gradient(135deg, #002bc5 0%, #0ea5e9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '16px 50px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(0, 43, 197, 0.25)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 43, 197, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 43, 197, 0.25)';
            }}
          >
            Commencez
          </button>
          
          <button 
            onClick={() => router.push('/contact')}
            style={{
              background: '#ffffff',
              color: '#002bc5',
              border: '2px solid #002bc5',
              borderRadius: '50px',
              padding: '16px 50px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#002bc5';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#002bc5';
              e.currentTarget.style.transform = 'translateY(0)';
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
