"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    id: 1,
    question: "Qu'est-ce que Mazad Click et à quoi ça sert ?",
    answer: "MazadClick est une plateforme en ligne innovante spécialisée dans les enchères, la vente directe et la soumission d'offres. Elle permet d'acheter et de vendre des biens et services de manière sécurisée et transparente."
  },
  {
    id: 2,
    question: "Comment s'inscrire sur MazadClick ?",
    answer: "Pour vous inscrire, cliquez sur 'Connexion' ou d'inscription en haut de la page, puis choisissez l'option de création de compte. Renseignez vos coordonnées de contact et validez via le mail de confirmation."
  },
  {
    id: 3,
    question: "Comment compléter son profil ?",
    answer: "Accédez à votre profil depuis le tableau de bord. Vous pourrez y ajouter vos coordonnées professionnelles, vos préférences de notification et les justificatifs d'identité requis."
  },
  {
    id: 4,
    question: "Comment publier votre annonce ?",
    answer: "Depuis votre tableau de bord, cliquez sur le bouton de création d'annonce, sélectionnez le type (enchère, vente directe ou appel d'offres), ajoutez une description, des photos et validez la publication."
  },
  {
    id: 5,
    question: "Comment rédiger une annonce efficace ?",
    answer: "Utilisez un titre explicite, détaillez précisément les caractéristiques du produit ou service, indiquez l'état réel et proposez des visuels de haute qualité avec un prix compétitif."
  },
  {
    id: 6,
    question: "Quels sont les modes de transaction sur MazadClick ?",
    answer: "Vous pouvez vendre et acheter via trois modes flexibles : les enchères en ligne, la vente directe avec prix fixe (achat immédiat), ou les appels d'offres pour soumissionner des propositions commerciales."
  }
];

const FAQSection = () => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const visibleFaqs = isMobile && !showAll ? faqs.slice(0, 6) : faqs;
  const hasMore = isMobile && faqs.length > 6;

  return (
    <div className="faq-section" style={{ width: '100%', background: '#ffffff', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 20px) clamp(60px, 12vw, 140px)', fontFamily: '"DM Sans", sans-serif' }}>
      <style jsx>{`
        @media (max-width: 767px) {
          .faq-section {
            padding: 28px 16px 40px !important;
          }
          .faq-section h2 {
            font-size: 22px !important;
            margin-bottom: 8px !important;
          }
          .faq-section .faq-subtitle {
            font-size: 13px !important;
            line-height: 1.4 !important;
          }
          .faq-list {
            gap: 10px !important;
          }
        }
      `}</style>
      <div style={{ width: '100%', maxWidth: '714px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(18px, 4vw, 60px)' }}>
          <h2 style={{
            color: '#002896',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: '700',
            lineHeight: 1.25,
            marginBottom: 'clamp(8px, 2vw, 20px)',
          }}>
            Tout Mazadclic en un clic
          </h2>
          <p className="faq-subtitle" style={{
            color: '#757575',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 'clamp(1rem, 2.2vw, 1.5rem)',
            fontWeight: '400',
            lineHeight: 1.4,
            maxWidth: '1000px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            Optimisez votre temps. Apprenez à piloter vos enchères, ventes et
            soumissions en toute simplicité pour ne plus jamais laisser passer
            une opportunité.
          </p>
        </div>

        <div className="faq-list" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(10px, 2vw, 32px)',
          width: '100%',
        }}>
          {visibleFaqs.map((faq) => (
            <div key={faq.id} style={{ width: '100%' }}>
              <div
                onClick={() => setActiveId(activeId === faq.id ? null : faq.id)}
                style={{
                  background: 'linear-gradient(127.45deg, rgba(230, 230, 230, 0.7) 2.15%, rgba(195, 201, 215, 0.14) 63.05%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  padding: 'clamp(14px, 2vw, 20px) clamp(16px, 3vw, 28px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderImageSource: 'linear-gradient(127.23deg, rgba(255, 255, 255, 0.42) 2.46%, rgba(255, 255, 255, 0.24) 97.36%)',
                  borderImageSlice: 1,
                  boxShadow: '0px 10px 20px 0px #0000001A, 0px 4px 1px 0px #00000040',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  minHeight: 'clamp(56px, 8vw, 72px)',
                  gap: '20px',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ color: '#002896', fontSize: 'clamp(0.95rem, 1.6vw, 1.25rem)', fontWeight: '700' }}>
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: activeId === faq.id ? 180 : 0 }}
                  style={{ 
                    width: '25px',
                    height: '25px',
                    background: '#0096E3',
                    borderRadius: '15px',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: 1,
                    transform: 'rotate(0deg)'
                  }}
                >
                  <svg 
                    width="25" 
                    height="25" 
                    viewBox="0 0 25 25" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      position: 'absolute',
                      opacity: 1,
                      transform: 'rotate(0deg)'
                    }}
                  >
                    <path 
                      d="M6.25 9.38L12.5 15.63L18.75 9.38" 
                      stroke="#FFFFFF" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </div>

              <AnimatePresence>
                {activeId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '20px 45px 10px', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                background: 'transparent',
                border: '1px solid #002896',
                color: '#002896',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                borderRadius: '24px',
                padding: '10px 22px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {showAll ? 'Voir moins' : 'Voir toutes les questions'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQSection;
