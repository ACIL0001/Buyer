"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface VerificationPopupProps {
  onClose: () => void;
  onContinue: () => void;
}

export default function VerificationPopup({ onClose, onContinue }: VerificationPopupProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 9999,
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          width: '380px',
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(0,0,0,0.05)',
          borderLeft: '4px solid #0063B1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {/* Icon */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: '#0063B1',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '700',
                color: '#1F2937'
              }}>
                Action requise
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#9CA3AF',
                  marginTop: '-4px',
                  marginRight: '-4px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content */}
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#4B5563'
            }}>
              Complétez votre profil pour obtenir les badges <strong style={{ color: '#0063B1' }}>Vérifié</strong> et <strong style={{ color: '#0063B1' }}>PRO</strong>. Cela augmente la confiance des acheteurs.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'none',
                  color: '#6B7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Plus tard
              </button>
              <button
                onClick={onContinue}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0063B1',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0, 99, 177, 0.2)',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#005499'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0063B1'}
              >
                Compléter mon profil
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
