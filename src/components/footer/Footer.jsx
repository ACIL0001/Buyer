import Link from 'next/link'
import React from 'react'
import { useSettingsStore } from "@/contexts/settingsStore";

const Footer = () => {
  const { logoUrl } = useSettingsStore();

  const headingStyle = {
    fontFamily: '"Inter", "DM Sans", sans-serif',
    fontWeight: 700,
    fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
    lineHeight: 1.2,
    color: '#002896',
    opacity: 0.9,
    margin: 0,
    marginBottom: 'clamp(12px, 1.6vw, 20px)',
  };

  const linkStyle = {
    fontFamily: '"Inter", "DM Sans", sans-serif',
    fontWeight: 300,
    fontSize: 'clamp(0.875rem, 1.3vw, 1.125rem)',
    lineHeight: 1.4,
    color: '#757575',
    opacity: 0.85,
    textDecoration: 'none',
    display: 'inline-block',
    padding: '6px 0',
  };

  const columnStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(6px, 1vw, 10px)',
    minWidth: 0,
  };

  return (
    <footer
      style={{
        position: 'relative',
        width: '1440px',
        height: '568px',
        background: '#FFFFFF',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '80px',
        paddingBottom: '30px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1440px',
          marginInline: 'auto',
          paddingInline: 'clamp(16px, 4vw, 110px)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          gap: 'clamp(24px, 4vw, 48px)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 'clamp(24px, 3vw, 48px)',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
          }}
        >
          {/* Brand */}
          <div style={{ ...columnStyle, gap: 'clamp(12px, 2vw, 20px)' }}>
            <Link href="/" style={{ display: 'inline-block' }}>
              <img
                src={logoUrl || '/assets/img/logo.png'}
                alt="MazadClick"
                style={{ height: 'clamp(32px, 4vw, 40px)', objectFit: 'contain' }}
              />
            </Link>
            <p
              style={{
                fontFamily: '"Inter", "DM Sans", sans-serif',
                fontWeight: 300,
                fontSize: 'clamp(0.875rem, 1.3vw, 1.125rem)',
                lineHeight: 1.65,
                color: '#757575',
                opacity: 0.85,
                margin: 0,
                maxWidth: '340px',
              }}
            >
              Lorem ipsum dolor sit amet consectetur. Ultrices velit eget mattis eu enim volutpat.
            </p>
          </div>

          {/* Produit */}
          <div style={columnStyle}>
            <h4 style={headingStyle}>Produit</h4>
            <Link href="/services" style={linkStyle}>Services</Link>
            <Link href="/auction-sidebar" style={linkStyle}>Enchère</Link>
            <Link href="/tenders" style={linkStyle}>Offres</Link>
            <Link href="/startup" style={linkStyle}>Startup</Link>
            <Link href="/international" style={linkStyle}>International</Link>
            <Link href="/plans" style={linkStyle}>Tarifs</Link>
          </div>

          {/* Entreprise */}
          <div style={columnStyle}>
            <h4 style={headingStyle}>Entreprise</h4>
            <Link href="/support" style={linkStyle}>Support</Link>
            <Link href="/contact" style={linkStyle}>Nous contacter</Link>
            <Link href="/recrutement" style={linkStyle}>Recrutement</Link>
            <Link href="/about" style={linkStyle}>Notre équipe</Link>
          </div>

          {/* Support */}
          <div style={columnStyle}>
            <h4 style={headingStyle}>Support</h4>
            <Link href="/how-to-bid" style={linkStyle}>Comment ça marche</Link>
            <Link href="/help-center" style={linkStyle}>Centre d'aide</Link>
            <Link href="/customer-service" style={linkStyle}>Service client</Link>
            <Link href="/report-bug" style={linkStyle}>Signaler un bug</Link>
          </div>
        </div>

        <div
          style={{
            width: '100%',
            height: '1px',
            background: '#0096E3',
            opacity: 0.5,
          }}
        />

        <p
          style={{
            fontFamily: '"Inter", "DM Sans", sans-serif',
            fontWeight: 300,
            fontSize: 'clamp(0.8rem, 1.2vw, 1.125rem)',
            lineHeight: 1.5,
            textAlign: 'center',
            color: '#757575',
            opacity: 0.85,
            margin: 0,
          }}
        >
          Copyright © 2026 Mazadclick | Touts droits réservés |{' '}
          <Link href="/terms-condition" style={{ color: '#757575', textDecoration: 'none' }}>
            Termes et conditions
          </Link>
          {' | '}
          <Link href="/privacy-policy" style={{ color: '#757575', textDecoration: 'none' }}>
            Politique de confidentialité
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
