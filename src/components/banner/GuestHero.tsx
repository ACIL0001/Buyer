"use client";

import React from 'react';

const GuestHero = () => {
  return (
    <>
      <style jsx>{`
        .guest-hero-root {
          width: 100%;
          max-width: 1600px;
          height: 390px;
          position: relative;
          background: #f8f9fb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin: 10px auto 0;
          border-radius: 0px;
        }
        @media (max-width: 1023px) {
          .guest-hero-root {
            height: 350px;
            margin-top: 0;
          }
        }
        @media (max-width: 767px) {
          .guest-hero-root {
            height: 300px;
            margin-top: 0;
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
            opacity: 1
          }}
        >
          <source src="/assets/images/VF_01 - Carossel.mp4" type="video/mp4" />
        </video>
      </div>
    </>
  );
};

export default GuestHero;

