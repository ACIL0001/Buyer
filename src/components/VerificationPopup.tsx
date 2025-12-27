"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VerificationPopupProps {
  onClose: () => void;
  onContinue: () => void;
}

export default function VerificationPopup({ onClose, onContinue }: VerificationPopupProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative gradient background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #0063B1 0%, #00A3E0 50%, #10B981 100%)',
          }} />

          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0063B1 0%, #00A3E0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 10px 30px rgba(0, 99, 177, 0.3)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1F2937',
            textAlign: 'center',
            marginBottom: '12px',
          }}>
            Complétez votre profil
          </h2>

          {/* Description */}
          <p style={{
            fontSize: '16px',
            color: '#6B7280',
            textAlign: 'center',
            lineHeight: '1.6',
            marginBottom: '32px',
          }}>
            Pour être <strong style={{ color: '#0063B1' }}>vérifié</strong>, <strong style={{ color: '#10B981' }}>PRO</strong> et <strong style={{ color: '#F59E0B' }}>certifié</strong>, continuez l'inscription complète en ajoutant vos documents.
          </p>

          {/* Benefits list */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span style={{ color: '#374151', fontSize: '14px' }}>Badge de vérification visible</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span style={{ color: '#374151', fontSize: '14px' }}>Plus de confiance des acheteurs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span style={{ color: '#374151', fontSize: '14px' }}>Accès aux fonctionnalités PRO</span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px 24px',
                borderRadius: '12px',
                border: '2px solid #E5E7EB',
                backgroundColor: 'white',
                color: '#6B7280',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              Plus tard
            </button>
            <button
              onClick={onContinue}
              style={{
                flex: 1,
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #0063B1 0%, #00A3E0 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(0, 99, 177, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 99, 177, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 99, 177, 0.3)';
              }}
            >
              Continuer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
