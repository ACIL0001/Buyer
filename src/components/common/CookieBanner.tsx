"use client";

import { useState, useEffect } from 'react';
import Script from 'next/script';
import Link from 'next/link';

export default function CookieBanner() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the user has already consented
    const storedConsent = localStorage.getItem('cookie_consent');
    if (storedConsent === 'true') {
      setConsentGiven(true);
    } else if (storedConsent === 'false') {
      setConsentGiven(false);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'true');
    setConsentGiven(true);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'false');
    setConsentGiven(false);
  };

  return (
    <>
      {/* Only load Meta Pixel if consent was given */}
      {consentGiven && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1893599971552570');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* Render banner if no consent state is found */}
      {consentGiven === null && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
          padding: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid #e2e8f0',
        }}>
          <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>🍪 Nous respectons votre vie privée</h3>
              <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
                Nous utilisons des cookies, y compris des traceurs tiers, pour améliorer votre expérience sur notre site, analyser le trafic et personnaliser le contenu. 
                Consultez notre <Link href="/privacy-policy" style={{ color: '#002896', textDecoration: 'underline' }}>Politique de Confidentialité</Link> pour en savoir plus.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={declineCookies}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                Refuser
              </button>
              <button 
                onClick={acceptCookies}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#002896',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#001b6e'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#002896'}
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
