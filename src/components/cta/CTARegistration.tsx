"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

const CTARegistration = () => {
  const router = useRouter();

  return (
    <div style={{
      width: '100%',
      background: '#ffffff',
      padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 20px)',
      overflow: 'hidden',
      fontFamily: '"DM Sans", sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(24px, 5vw, 60px)',
        flexWrap: 'wrap'
      }}>

        {/* Left Side: Illustration */}
        <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <img
            src="/assets/images/Home.png"
            alt="Registration Illustration"
            style={{ width: '100%', maxWidth: '450px', height: 'auto' }}
          />
        </div>

        {/* Right Side: Content */}
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <h2 style={{
            color: '#002896',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 'clamp(22px, 3.6vw, 36px)',
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: '20px',
          }}>
            Ne ratez plus aucune opportunité ! <br />
            Créez votre compte et rejoignez MazadClick en un clic.
          </h2>
          <p style={{
            color: '#757575',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 'clamp(15px, 1.7vw, 18px)',
            fontWeight: 400,
            lineHeight: 1.6,
            marginBottom: '32px',
            maxWidth: '500px',
          }}>
            Enchérissez, achetez immédiatement ou
            soumissionnez en toute confiance. Accédez à
            un marché dynamique où chaque transaction
            est simplifiée et sécurisée pour vous offrir le
            meilleur choix.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
            <button
              onClick={() => window.location.href = 'http://localhost:3001/auth/register/'}
              style={{
                minWidth: 0,
                minHeight: 'clamp(52px, 8vw, 71px)',
                background: 'linear-gradient(88.88deg, #062C90 50.03%, #3F95DD 98.92%)',
                border: 'none',
                borderRadius: '40px',
                padding: 'clamp(14px, 2.5vw, 24px) clamp(20px, 4vw, 36px)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: 'inset 1px 1px 4px 0px #FFFFFF99, inset -1px -1px 1px 0px #FFFFFF40, inset 1px 1px 1px 0px #062C9066, inset -1px -1px 1px 0px #062C9066',
                transition: 'transform 0.2s ease',
                boxSizing: 'border-box',
                flex: '1 1 auto',
              }}
            >
              <span style={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(15px, 1.6vw, 18px)',
                lineHeight: 1,
                textAlign: 'center',
                color: '#FFFFFF',
                whiteSpace: 'nowrap'
              }}>
                Inscrivez-vous
              </span>
            </button>

            <button
              onClick={() => router.push('/contact')}
              style={{
                minWidth: 0,
                minHeight: 'clamp(52px, 8vw, 71px)',
                background: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                padding: 'clamp(14px, 2.5vw, 24px) clamp(20px, 4vw, 36px)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: 'inset 1px 1px 4px 0px #002896, inset -1px -1px 1px 0px #0096E3, inset -1px -1px 1px 0px #002896, inset 1px 1px 1px 0px #002896, 0px 4px 4px 0px #00000040',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                flex: '1 1 auto',
              }}
            >
              <span style={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(15px, 1.6vw, 18px)',
                lineHeight: 1,
                textAlign: 'center',
                color: '#002896',
                whiteSpace: 'nowrap'
              }}>
                Comment ça marche
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CTARegistration;
