"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BiPhone, BiMessageDetail, BiX, BiCheckCircle } from 'react-icons/bi';
import { useRouter } from 'next/navigation';

interface TenderWonModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderTitle: string;
  ownerName: string;
  quantity?: number | string;
  totalPrice?: number;
  contactNumber: string;
  chatId?: string;
  sellerId?: string;
  isMieuxDisant?: boolean;
}

// Tender green/emerald color palette (differentiating from Direct Sales)
const T_GREEN        = '#10B981';
const T_GREEN_DARK   = '#059669';
const T_GREEN_LIGHT  = '#D1FAE5';
const T_GREEN_BORDER = '#34D399';

const TenderWonModal: React.FC<TenderWonModalProps> = ({
  isOpen,
  onClose,
  tenderTitle,
  ownerName,
  quantity,
  totalPrice,
  contactNumber,
  chatId,
  sellerId,
  isMieuxDisant
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleChatClick = () => {
    if (sellerId) {
      router.push(`/dashboard/chat?userId=${sellerId}`);
      onClose();
    } else if (chatId) {
      router.push(`/dashboard/chat?chatId=${chatId}`);
      onClose();
    } else if (contactNumber) {
      window.location.href = `tel:${contactNumber}`;
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div style={{ zIndex: 1000000, position: 'relative' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff',
                borderRadius: '32px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 40px 80px -15px rgba(0,0,0,0.30)',
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${T_GREEN_BORDER}`,
              }}
            >
              {/* Top Banner — Green gradient */}
              <div style={{
                height: '110px',
                background: `linear-gradient(135deg, ${T_GREEN} 0%, #059669 60%, #34D399 100%)`,
                width: '100%',
                position: 'absolute',
                top: 0, left: 0,
                zIndex: 0
              }} />

              {/* Decorative circle on banner */}
              <div style={{
                position: 'absolute',
                top: -30, right: -30,
                width: 140, height: 140,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                zIndex: 0
              }} />

              {/* Close Button */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '18px', right: '18px',
                  background: 'rgba(0,0,0,0.18)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '38px', height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  zIndex: 10,
                  backdropFilter: 'blur(4px)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.32)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.18)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                <BiX size={26} />
              </button>

              <div style={{ padding: '60px 36px 36px', position: 'relative', zIndex: 1 }}>

                {/* Success Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                    style={{
                      width: '78px', height: '78px',
                      borderRadius: '22px',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 12px 30px rgba(16,185,129,0.35)`,
                      marginBottom: '18px',
                      border: `4px solid ${T_GREEN_LIGHT}`,
                    }}
                  >
                    <BiCheckCircle size={44} color={T_GREEN} />
                  </motion.div>

                  <h2 style={{
                    margin: 0,
                    fontSize: '26px',
                    fontWeight: '900',
                    color: '#1a1a1a',
                    letterSpacing: '-0.03em',
                    textAlign: 'center'
                  }}>
                    {"Félicitations !"}
                  </h2>
                  <p style={{
                    margin: '8px 0 0',
                    color: '#555',
                    fontSize: '15px',
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    {isMieuxDisant 
                      ? "Votre offre pour l'appel d'offres a été acceptée." 
                      : "Vous avez remporté l'appel d'offres !"}
                  </p>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Tender Details Card */}
                  <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '18px 22px',
                    border: `1.5px solid ${T_GREEN_BORDER}`,
                    boxShadow: `0 4px 16px rgba(16,185,129,0.08)`
                  }}>
                    <div style={{
                      fontSize: '10px',
                      color: T_GREEN_DARK,
                      textTransform: 'uppercase',
                      fontWeight: '800',
                      letterSpacing: '0.1em',
                      marginBottom: '8px'
                    }}>
                      {"Détails de l'appel d'offres"}
                    </div>
                    <h3 style={{
                      margin: '0 0 14px',
                      fontSize: '17px',
                      fontWeight: '800',
                      color: '#111827',
                      lineHeight: '1.25'
                    }}>
                      {tenderTitle}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Quantity row if exists */}
                      {(quantity !== undefined && quantity !== null) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                            Quantité
                          </span>
                          <span style={{
                            fontSize: '13px',
                            color: T_GREEN_DARK,
                            background: T_GREEN_LIGHT,
                            border: `1px solid ${T_GREEN_BORDER}`,
                            padding: '3px 10px',
                            borderRadius: '10px',
                            fontWeight: '700'
                          }}>
                            {quantity}
                          </span>
                        </div>
                      )}

                      {/* Total price row */}
                      {totalPrice !== undefined && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: (quantity !== undefined && quantity !== null) ? `1px solid ${T_GREEN_BORDER}` : 'none',
                          paddingTop: (quantity !== undefined && quantity !== null) ? '10px' : '0px',
                        }}>
                          <span style={{ fontSize: '15px', color: '#111827', fontWeight: '800' }}>
                            Montant de votre offre
                          </span>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '900',
                            color: T_GREEN_DARK,
                            background: `linear-gradient(135deg, ${T_GREEN_LIGHT}, #ECFDF5)`,
                            padding: '4px 16px',
                            borderRadius: '12px',
                            border: `1.5px solid ${T_GREEN_BORDER}`,
                          }}>
                            {totalPrice.toLocaleString()} DA
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner & Contact Section */}
                  <div style={{
                    background: `linear-gradient(135deg, ${T_GREEN_LIGHT} 0%, #F0FDF4 100%)`,
                    borderRadius: '20px',
                    padding: '20px 22px',
                    border: `1.5px solid ${T_GREEN_BORDER}`,
                  }}>
                    {/* Owner name */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <div style={{
                          fontSize: '10px',
                          color: T_GREEN_DARK,
                          textTransform: 'uppercase',
                          fontWeight: '800',
                          letterSpacing: '0.1em',
                          marginBottom: '4px'
                        }}>
                          Propriétaire
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>
                          {ownerName || 'Acheteur'}
                        </div>
                      </div>
                      <div style={{
                        width: '42px', height: '42px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 10px rgba(16,185,129,0.2)`,
                        border: `1.5px solid ${T_GREEN_BORDER}`,
                        fontSize: '18px'
                      }}>
                        🏢
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: chatId ? '1fr 1fr' : '1fr',
                    gap: '14px',
                    marginTop: '4px'
                  }}>
                    {chatId && (
                      <motion.button
                        whileHover={{ y: -2, boxShadow: `0 10px 20px rgba(16,185,129,0.35)` }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleChatClick}
                        style={{
                          padding: '16px',
                          background: `linear-gradient(135deg, ${T_GREEN}, ${T_GREEN_DARK})`,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '18px',
                          fontSize: '15px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          boxShadow: `0 6px 14px rgba(16,185,129,0.25)`,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <BiMessageDetail size={20} />
                        Chat
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ background: '#f9f9f9' }}
                      whileTap={{ scale: 0.96 }}
                      onClick={onClose}
                      style={{
                        padding: '16px',
                        background: 'white',
                        color: '#555',
                        border: `2px solid ${T_GREEN_BORDER}`,
                        borderRadius: '18px',
                        fontSize: '15px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Fermer
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default TenderWonModal;
