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
        height: '589px',
        background: '#FFFFFF',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Brand Section */}
        <div 
          style={{ 
            position: 'absolute',
            left: '109.2px',
            top: '80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          <Link href="/" style={{ display: 'inline-block' }}>
            <img
              src={logoUrl || '/assets/img/logo.png'}
              alt="MazadClick"
              style={{ height: '40px', objectFit: 'contain' }}
            />
          </Link>
          
          <p
            style={{
              width: '340.6px',
              height: '90px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 400,
              fontSize: '18px',
              lineHeight: '30px',
              color: '#757575',
              margin: 0,
            }}
          >
            Lorem ipsum dolor sit amet consectetur. Ultrices velit eget mattis eu enim volutpat.
          </p>

          {/* Social Icons */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
            <Link href="#" style={{ color: '#002896', fontSize: '24px' }}><i className="bi bi-instagram"></i></Link>
            <Link href="#" style={{ color: '#002896', fontSize: '24px' }}><i className="bi bi-youtube"></i></Link>
            <Link href="#" style={{ color: '#002896', fontSize: '24px' }}><i className="bi bi-twitter-x"></i></Link>
            <Link href="#" style={{ color: '#002896', fontSize: '24px' }}><i className="bi bi-facebook"></i></Link>
            <Link href="#" style={{ color: '#002896', fontSize: '24px' }}><i className="bi bi-linkedin"></i></Link>
          </div>
        </div>

        {/* Produit Column */}
        <div style={{ position: 'absolute', left: '559px', top: '120px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h4 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '20px', lineHeight: '20px', color: '#002896', margin: 0 }}>Produit</h4>
          <Link href="/services" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Services</Link>
          <Link href="/auction-sidebar" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Enchère</Link>
          <Link href="/tenders" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Offres</Link>
          <Link href="/startup" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Startup</Link>
          <Link href="/international" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>International</Link>
          <Link href="/plans" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Tarifs</Link>
        </div>

        {/* Entreprise Column */}
        <div style={{ position: 'absolute', left: '754px', top: '120px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h4 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '20px', lineHeight: '20px', color: '#002896', margin: 0 }}>Entreprise</h4>
          <Link href="/support" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Support</Link>
          <Link href="/contact" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Nous contacter</Link>
          <Link href="/recrutement" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Recrutement</Link>
          <Link href="/about" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Notre équipe</Link>
        </div>

        {/* Support Column */}
        <div style={{ position: 'absolute', left: '985px', top: '120px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h4 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '20px', lineHeight: '20px', color: '#002896', margin: 0 }}>Support</h4>
          <Link href="/how-to-bid" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Comment ça marche</Link>
          <Link href="/help-center" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Centre d'aide</Link>
          <Link href="/customer-service" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Service client</Link>
          <Link href="/report-bug" style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', lineHeight: '18px', color: '#757575', textDecoration: 'none' }}>Signaler un bug</Link>
        </div>

        {/* Divider Line */}
        <div
          style={{
            position: 'absolute',
            width: '1220px',
            height: '0px',
            left: '110px',
            top: '474.81px',
            border: '1px solid #0096E3',
            transform: 'rotate(180deg)',
          }}
        />

        {/* Copyright */}
        <p
          style={{
            position: 'absolute',
            width: '1220px', // Adjusted to span the width for centering
            height: '30px',
            left: '110px',
            top: '493px',
            fontFamily: 'DM Sans',
            fontWeight: 400,
            fontSize: '18px',
            lineHeight: '30px',
            textAlign: 'center',
            color: '#757575',
            margin: 0
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
