"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

const CTARegistration = () => {
  const router = useRouter();

  return (
    <div style={{ 
      width: '100%', 
      background: '#ffffff', 
      padding: '80px 20px',
      overflow: 'hidden',
      fontFamily: '"DM Sans", sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '60px',
        flexWrap: 'wrap'
      }}>
        
        {/* Left Side: Illustration */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/assets/images/Home.png" 
            alt="Registration Illustration" 
            style={{ width: '100%', maxWidth: '450px', height: 'auto' }}
          />
        </div>

        {/* Right Side: Content */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h2 style={{ 
            color: '#002896', 
            fontSize: 'clamp(28px, 4vw, 42px)', 
            fontWeight: '700', 
            lineHeight: '1.2',
            marginBottom: '20px'
          }}>
            Ne ratez plus aucune opportunité ! <br/>
            Créez votre compte et rejoignez MazadClick en un clic.
          </h2>
          <p style={{ 
            color: '#64748b', 
            fontSize: '17px', 
            lineHeight: '1.6',
            marginBottom: '40px',
            maxWidth: '500px'
          }}>
            Enchérissez, achetez immédiatement ou
            soumissionnez en toute confiance. Accédez à
            un marché dynamique où chaque transaction
            est simplifiée et sécurisée pour vous offrir le
            meilleur choix.
          </p>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.location.href = 'http://localhost:3001/auth/register/'}
              style={{
                background: 'linear-gradient(135deg, #002896 0%, #0ea5e9 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '16px 45px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(0, 40, 150, 0.25)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 40, 150, 0.35)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 40, 150, 0.25)';
              }}
            >
              Inscrivez-vous
            </button>
            
            <button 
              onClick={() => router.push('/contact')}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '2px solid #e2e8f0',
                borderRadius: '50px',
                padding: '16px 45px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#002896';
                e.currentTarget.style.color = '#002896';
                e.currentTarget.style.background = 'rgba(0, 40, 150, 0.02)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#1e293b';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              Comment ça marche
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CTARegistration;
