"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    id: 1,
    question: "Qu'est-ce que Mazadclick ?",
    answer: "Mazadclick est une plateforme innovante d'enchères en ligne, de soumissions d'offres et de vente directe, conçue pour connecter les acheteurs et les vendeurs dans un environnement sécurisé et transparent."
  },
  {
    id: 2,
    question: "Qu'est-ce que Mazadclick ?",
    answer: "Mazadclick est une plateforme innovante d'enchères en ligne, de soumissions d'offres et de vente directe, conçue pour connecter les acheteurs et les vendeurs dans un environnement sécurisé et transparent."
  },
  {
    id: 3,
    question: "Qu'est-ce que Mazadclick ?",
    answer: "Mazadclick est une plateforme innovante d'enchères en ligne, de soumissions d'offres et de vente directe, conçue pour connecter les acheteurs et les vendeurs dans un environnement sécurisé et transparent."
  },
  {
    id: 4,
    question: "Qu'est-ce que Mazadclick ?",
    answer: "Mazadclick est une plateforme innovante d'enchères en ligne, de soumissions d'offres et de vente directe, conçue pour connecter les acheteurs et les vendeurs dans un environnement sécurisé et transparent."
  }
];

const FAQSection = () => {
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div style={{ width: '100%', background: '#ffffff', padding: '80px 20px', fontFamily: '"DM Sans", sans-serif', minHeight: '378px' }}>
      <div style={{ maxWidth: '714px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ color: '#002896', fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: '700', marginBottom: '20px' }}>
            Tout Mazadclic en un clic
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
            Optimisez votre temps. Apprenez à piloter vos enchères, ventes et
            soumissions en toute simplicité pour ne plus jamais laisser passer
            une opportunité.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {faqs.map((faq) => (
            <div key={faq.id} style={{ width: '100%' }}>
              <div 
                onClick={() => setActiveId(activeId === faq.id ? null : faq.id)}
                style={{ 
                  background: 'linear-gradient(127.45deg, rgba(230, 230, 230, 0.7) 2.15%, rgba(195, 201, 215, 0.14) 63.05%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '24px', 
                  padding: '20px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderImageSource: 'linear-gradient(127.23deg, rgba(255, 255, 255, 0.42) 2.46%, rgba(255, 255, 255, 0.24) 97.36%)',
                  borderImageSlice: 1,
                  boxShadow: '0px 10px 20px 0px rgba(0,0,0,0.1), 0px 4px 1px 0px rgba(0,0,0,0.25)',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  height: '72px'
                }}
              >
                <span style={{ color: '#002896', fontSize: '20px', fontWeight: '700' }}>
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: activeId === faq.id ? 180 : 0 }}
                  style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#0ea5e9" fillOpacity="0.1"/>
                    <path d="M8 10L12 14L16 10" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
      </div>
    </div>
  );
};

export default FAQSection;
