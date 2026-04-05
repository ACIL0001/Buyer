import Link from 'next/link'
import React from 'react'
import { useSettingsStore } from "@/contexts/settingsStore";

const Footer = () => {
  const { logoUrl } = useSettingsStore();

  return (
    <footer style={{ background: 'white', paddingTop: '60px', paddingBottom: '20px' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* 4 Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '30px',
          marginBottom: '50px'
        }}>
          
          {/* Column 1: Logo, Text & Socials */}
          <div style={{ paddingRight: '40px' }}>
            <Link href="/" style={{ display: 'inline-block', marginBottom: '20px' }}>
              <img src={logoUrl || "/assets/img/logo.png"} alt="MazadClick" style={{ height: '40px', objectFit: 'contain' }} />
            </Link>
            <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.6', marginBottom: '25px' }}>
              Lorem ipsum dolor sit amet consectetur. Ultrices velit eget mattis eu enim volutpat.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href="#" style={{ color: '#003399', fontSize: '18px', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" style={{ color: '#003399', fontSize: '18px', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="bi bi-youtube"></i>
              </a>
              <a href="#" style={{ color: '#003399', fontSize: '18px', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="bi bi-twitter-x"></i>
              </a>
              <a href="#" style={{ color: '#003399', fontSize: '18px', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" style={{ color: '#003399', fontSize: '18px', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Column 2: Produit */}
          <div>
            <h4 style={{ color: '#003399', fontSize: '15px', fontWeight: 'bold', marginBottom: '20px' }}>Produit</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/services" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Services</Link></li>
              <li><Link href="/auction-sidebar" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Enchère</Link></li>
              <li><Link href="/tenders" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Offres</Link></li>
              <li><Link href="/startup" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Startup</Link></li>
              <li><Link href="/international" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>International</Link></li>
              <li><Link href="/plans" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Tarifs</Link></li>
            </ul>
          </div>

          {/* Column 3: Entreprise */}
          <div>
            <h4 style={{ color: '#003399', fontSize: '15px', fontWeight: 'bold', marginBottom: '20px' }}>Entreprise</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/support" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Support</Link></li>
              <li><Link href="/contact" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Nous contacter</Link></li>
              <li><Link href="/recrutement" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Recrutement</Link></li>
              <li><Link href="/about" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Notre équipe</Link></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h4 style={{ color: '#003399', fontSize: '15px', fontWeight: 'bold', marginBottom: '20px' }}>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/how-to-bid" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Comment ça marche</Link></li>
              <li><Link href="/help-center" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Centre d'aide</Link></li>
              <li><Link href="/customer-service" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Service client</Link></li>
              <li><Link href="/report-bug" style={{ color: '#666', fontSize: '13px', textDecoration: 'none' }}>Signaler un bug</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Line & Copyright */}
        <div style={{ borderTop: '1px solid #48a6df', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>
            Copyright © 2026 Mazadclick | Touts droits réservés | <Link href="/terms-condition" style={{ color: '#999', textDecoration: 'none' }}>Termes et conditions</Link> | <Link href="/privacy-policy" style={{ color: '#999', textDecoration: 'none' }}>Politique de confidentialité</Link>
          </p>
        </div>

      </div>

      {/* Responsive adjustments */}
      <style jsx>{`
        @media (max-width: 992px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
          footer > div > div:first-child > div:first-child {
            grid-column: 1 / -1;
            padding-right: 0 !important;
            text-align: center;
          }
          footer > div > div:first-child > div:first-child > div {
            justify-content: center;
          }
        }
        @media (max-width: 576px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          footer > div > div:first-child ul {
            align-items: center;
          }
          footer > div > div:last-child p {
            line-height: 1.8;
          }
        }
      `}</style>
    </footer>
  )
}

export default Footer