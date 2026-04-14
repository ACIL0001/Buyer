import Link from 'next/link'
import React from 'react'
import { useSettingsStore } from "@/contexts/settingsStore";

const Footer = () => {
  const { logoUrl } = useSettingsStore();

  const headingStyle = {
    position: 'absolute',
    fontFamily: '"Inter", "DM Sans", sans-serif',
    fontStyle: 'normal',
    fontWeight: 'normal',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    fontSize: '20px',
    lineHeight: '20px',
    color: '#002896',
    opacity: 0.9
  };

  const linkStyle = {
    position: 'absolute',
    fontFamily: '"Inter", "DM Sans", sans-serif',
    fontStyle: 'normal',
    fontWeight: 'normal',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    fontSize: '18px',
    lineHeight: '18px',
    color: '#757575',
    opacity: 0.85,
    textDecoration: 'none',
    textAlign: 'center',
    whiteSpace: 'nowrap'
  };

  return (
    <footer style={{ 
      position: 'relative', 
      width: '100%', 
      height: '568px', 
      background: '#FFFFFF',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'relative', 
        width: '1440px', 
        height: '100%', 
        margin: '0 auto' 
      }}>
        
        {/* Logo */}
        <Link href="/" style={{ 
          position: 'absolute', 
          left: '109px', 
          top: '120px' 
        }}>
          <img src={logoUrl || "/assets/img/logo.png"} alt="MazadClick" style={{ height: '40px', objectFit: 'contain' }} />
        </Link>

        {/* Description */}
        <p style={{ 
          position: 'absolute',
          width: '340.6px',
          height: '90px',
          left: '109.2px',
          top: '194.35px',
          fontFamily: '"Inter", "DM Sans", sans-serif',
          fontStyle: 'normal',
          fontWeight: 'normal',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          fontSize: '18px',
          lineHeight: '30px',
          color: '#757575',
          opacity: 0.85,
          margin: 0
        }}>
          Lorem ipsum dolor sit amet consectetur. Ultrices velit eget mattis eu enim volutpat.
        </p>

        {/* Produit Column */}
        <h4 style={{ ...headingStyle, width: '73px', height: '20px', left: '559px', top: '120px' }}>Produit</h4>
        <Link href="/services" style={{ ...linkStyle, width: '71px', left: '559px', top: '158px' }}>Services</Link>
        <Link href="/auction-sidebar" style={{ ...linkStyle, width: '68px', left: '559px', top: '194px' }}>Enchère</Link>
        <Link href="/tenders" style={{ ...linkStyle, width: '52px', left: '559px', top: '230px' }}>Offres</Link>
        <Link href="/startup" style={{ ...linkStyle, width: '63px', left: '559px', top: '266px' }}>Startup</Link>
        <Link href="/international" style={{ ...linkStyle, width: '105px', left: '559px', top: '302px' }}>International</Link>
        <Link href="/plans" style={{ ...linkStyle, width: '45px', left: '559px', top: '338px' }}>Tarifs</Link>

        {/* Entreprise Column */}
        <h4 style={{ ...headingStyle, width: '103px', height: '20px', left: '754px', top: '120px' }}>Entreprise</h4>
        <Link href="/support" style={{ ...linkStyle, width: '79px', left: '754px', top: '158px' }}>Support</Link>
        <Link href="/contact" style={{ ...linkStyle, width: '130px', left: '754px', top: '194px' }}>Nous contacter</Link>
        <Link href="/recrutement" style={{ ...linkStyle, width: '109px', left: '754px', top: '230px' }}>Recrutement</Link>
        <Link href="/about" style={{ ...linkStyle, width: '109px', left: '754px', top: '266px' }}>Notre équipe</Link>

        {/* Support Column */}
        <h4 style={{ ...headingStyle, width: '80px', height: '20px', left: '985px', top: '120px' }}>Support</h4>
        <Link href="/how-to-bid" style={{ ...linkStyle, width: '176px', left: '985px', top: '158px', textAlign: 'left' }}>Comment ça marche</Link>
        <Link href="/help-center" style={{ ...linkStyle, width: '113px', left: '985px', top: '194px', textAlign: 'left' }}>Centre d'aide</Link>
        <Link href="/customer-service" style={{ ...linkStyle, width: '113px', left: '985px', top: '230px', textAlign: 'left' }}>Service client</Link>
        <Link href="/report-bug" style={{ ...linkStyle, width: '128px', left: '985px', top: '266px', textAlign: 'left' }}>Signaler un bug</Link>

        {/* Divider Line */}
        <div style={{ 
          position: 'absolute',
          width: '1220px',
          height: '0px',
          left: '110px',
          top: '474.81px',
          border: '1px solid #0096E3',
          transform: 'rotate(180deg)'
        }} />

        {/* Copyright Section */}
        <p style={{ 
          position: 'absolute',
          width: '862px',
          height: '30px',
          left: '207px',
          top: '506px',
          fontFamily: '"Inter", "DM Sans", sans-serif',
          fontStyle: 'normal',
          fontWeight: 'normal',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          fontSize: '18px',
          lineHeight: '30px',
          textAlign: 'center',
          color: '#757575',
          opacity: 0.85,
          margin: 0
        }}>
          Copyright © 2026 Mazadclick | Touts droits réservés | <Link href="/terms-condition" style={{ color: '#757575', textDecoration: 'none' }}>Termes et conditions</Link> | <Link href="/privacy-policy" style={{ color: '#757575', textDecoration: 'none' }}>Politique de confidentialité</Link>
        </p>

      </div>
    </footer>
  )
}

export default Footer