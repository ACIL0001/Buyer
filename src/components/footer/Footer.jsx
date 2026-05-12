"use client";

import Link from 'next/link';
import React, { useState } from 'react';
import { useSettingsStore } from "@/contexts/settingsStore";
import { motion, AnimatePresence } from 'framer-motion';

const FooterColumn = ({ title, links, openColumn, setOpenColumn }) => {
  const isOpen = openColumn === title;

  return (
    <div className={`footer-col ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="footer-col-header"
        onClick={() => setOpenColumn(isOpen ? null : title)}
        aria-expanded={isOpen}
      >
        <h4 className="footer-col-title">{title}</h4>
        <span className="footer-col-chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div className="footer-col-links footer-col-links-desktop">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="footer-col-links footer-col-links-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Footer = () => {
  const { logoUrl } = useSettingsStore();
  const [openColumn, setOpenColumn] = useState(null);

  const produitLinks = [
    { href: '/services', label: 'Services' },
    { href: '/auction-sidebar', label: 'Enchère' },
    { href: '/tenders', label: 'Offres' },
    { href: '/startup', label: 'Startup' },
    { href: '/international', label: 'International' },
    { href: '/plans', label: 'Tarifs' },
  ];
  const entrepriseLinks = [
    { href: '/support', label: 'Support' },
    { href: '/contact', label: 'Nous contacter' },
    { href: '/recrutement', label: 'Recrutement' },
    { href: '/about', label: 'Notre équipe' },
  ];
  const supportLinks = [
    { href: '/how-to-bid', label: 'Comment ça marche' },
    { href: '/help-center', label: "Centre d'aide" },
    { href: '/customer-service', label: 'Service client' },
    { href: '/report-bug', label: 'Signaler un bug' },
  ];

  return (
    <footer className="site-footer">
      <style jsx global>{`
        .site-footer {
          width: 100%;
          background: #ffffff;
          font-family: 'DM Sans', sans-serif;
        }
        .footer-inner {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(40px, 5vw, 80px) clamp(24px, 5vw, 96px) clamp(28px, 3vw, 40px);
          display: grid;
          grid-template-columns: minmax(280px, 1.6fr) repeat(3, minmax(0, 1fr));
          gap: clamp(24px, 4vw, 64px);
          align-items: start;
        }
        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 22px;
          min-width: 0;
          max-width: 360px;
        }
        .footer-brand-logo {
          display: inline-block;
          width: 180px;
          line-height: 0;
        }
        .footer-brand-logo img {
          width: 180px;
          height: auto;
          max-width: 100%;
          object-fit: contain;
        }
        .footer-brand p {
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          font-size: clamp(15px, 1.1vw, 17px);
          line-height: 1.7;
          color: #6b7280;
          margin: 0;
        }
        .footer-social {
          display: flex;
          gap: 18px;
          align-items: center;
          margin-top: 4px;
        }
        .footer-social :global(a) {
          color: #002896;
          font-size: 26px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .footer-social :global(a:hover) {
          opacity: 0.7;
          transform: translateY(-2px);
        }
        .footer-col {
          min-width: 0;
        }
        .footer-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: transparent;
          border: none;
          padding: 0;
          cursor: default;
          color: #002896;
          text-align: left;
        }
        .footer-col-title {
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: clamp(16px, 1.25vw, 19px);
          line-height: 1.2;
          color: #002896;
          margin: 0 0 22px 0;
        }
        .footer-col-chevron {
          display: none;
          color: #002896;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .footer-col.is-open .footer-col-chevron {
          transform: rotate(180deg);
        }
        .footer-col-links {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-col-links-mobile {
          display: none;
        }
        .footer-link {
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          font-size: clamp(14.5px, 1.05vw, 16.5px);
          line-height: 1.4;
          color: #6b7280;
          text-decoration: none;
          transition: color 0.2s ease;
          width: fit-content;
        }
        .footer-link:hover {
          color: #002896;
        }
        .footer-bottom {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 clamp(24px, 5vw, 96px) clamp(20px, 2.5vw, 28px);
        }
        .footer-divider {
          height: 1px;
          background: rgba(0, 150, 227, 0.25);
          width: 100%;
          margin-bottom: 18px;
        }
        .footer-copyright {
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          font-size: clamp(12px, 0.95vw, 14.5px);
          line-height: 1.5;
          color: #757575;
          text-align: center;
          margin: 0;
        }
        .footer-copyright :global(a) {
          color: #757575;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-copyright :global(a:hover) {
          color: #002896;
        }

        /* Tablet */
        @media (min-width: 768px) and (max-width: 1023px) {
          .footer-inner {
            grid-template-columns: repeat(3, 1fr);
            gap: 36px 24px;
            padding: 48px 32px 28px;
          }
          .footer-brand {
            grid-column: 1 / -1;
            max-width: 520px;
          }
        }

        /* Mobile */
        @media (max-width: 767px) {
          .footer-inner {
            grid-template-columns: 1fr;
            gap: 0;
            padding: 32px 20px 8px;
          }
          .footer-brand {
            align-items: flex-start;
            gap: 16px;
            max-width: 100%;
            margin-bottom: 20px;
            padding-bottom: 24px;
            border-bottom: 1px solid rgba(0, 40, 150, 0.1);
          }
          .footer-brand-logo,
          .footer-brand-logo img {
            width: 160px;
          }
          .footer-brand p {
            font-size: 14px;
            line-height: 1.6;
          }
          .footer-social {
            gap: 16px;
          }
          .footer-social :global(a) {
            font-size: 24px;
          }
          .footer-col {
            border-bottom: 1px solid rgba(0, 40, 150, 0.1);
          }
          .footer-col:last-child {
            border-bottom: none;
          }
          .footer-col-header {
            cursor: pointer;
            padding: 18px 4px;
            min-height: 56px;
          }
          .footer-col-title {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
          }
          .footer-col-chevron {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
          }
          .footer-col-links-desktop {
            display: none;
          }
          .footer-col-links-mobile {
            display: flex;
            padding: 4px 4px 20px 4px;
            gap: 14px;
          }
          .footer-link {
            font-size: 14.5px;
            color: #6b7280;
          }
          .footer-bottom {
            padding: 16px 16px 22px;
          }
          .footer-divider {
            margin-bottom: 14px;
          }
          .footer-copyright {
            font-size: 11.5px;
            line-height: 1.6;
          }
        }
      `}</style>

      <div className="footer-inner">
        {/* Brand block */}
        <div className="footer-brand">
          <Link href="/" className="footer-brand-logo" aria-label="MazadClick">
            <img
              src={logoUrl || '/assets/img/logo.png'}
              alt="MazadClick"
            />
          </Link>
          <p>
            Lorem ipsum dolor sit amet consectetur. Ultrices velit eget mattis eu enim volutpat.
          </p>
          <div className="footer-social">
            <Link href="https://www.instagram.com/mazadclick_/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i className="bi bi-instagram"></i></Link>
            <Link href="#" aria-label="YouTube"><i className="bi bi-youtube"></i></Link>
            <Link href="https://www.facebook.com/p/MazadClick-61579383136812/" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><i className="bi bi-facebook"></i></Link>
            <Link href="https://www.linkedin.com/in/mazad-click-515490389/?originalSubdomain=dz" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><i className="bi bi-linkedin"></i></Link>
          </div>
        </div>

        <FooterColumn title="Produit" links={produitLinks} openColumn={openColumn} setOpenColumn={setOpenColumn} />
        <FooterColumn title="Entreprise" links={entrepriseLinks} openColumn={openColumn} setOpenColumn={setOpenColumn} />
        <FooterColumn title="Support" links={supportLinks} openColumn={openColumn} setOpenColumn={setOpenColumn} />
      </div>

      <div className="footer-bottom">
        <div className="footer-divider" />
        <p className="footer-copyright">
          Copyright © 2026 Mazadclick | Touts droits réservés |{' '}
          <Link href="/terms-condition">Termes et conditions</Link>
          {' | '}
          <Link href="/privacy-policy">Politique de confidentialité</Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
