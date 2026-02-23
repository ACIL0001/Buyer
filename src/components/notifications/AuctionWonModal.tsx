"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BiMessageDetail, BiX, BiTrophy } from 'react-icons/bi';
import { useRouter } from 'next/navigation';

interface AuctionWonModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionTitle: string;
  sellerName: string;
  price: number;
  chatId?: string;
  image?: string;
  sellerId?: string;
  quantity?: number;
}

const AuctionWonModal: React.FC<AuctionWonModalProps> = ({
  isOpen,
  onClose,
  auctionTitle,
  sellerName,
  price,
  chatId,
  image,
  sellerId,
  quantity = 1
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
    if (chatId) {
      router.push(`/dashboard/chat?chatId=${chatId}`);
      onClose();
    } else if (sellerId) {
      // Fallback to start chat with user
      router.push(`/dashboard/chat?userId=${sellerId}`);
      onClose();
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
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
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
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '32px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 40px 80px -15px rgba(0, 0, 0, 0.35)',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              {/* Top Banner Gradient */}
              <div style={{
                height: '120px',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffc107 100%)',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 0
              }} />

              {/* Close Button Pin */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '14px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  zIndex: 10,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <BiX size={28} />
              </button>

              <div style={{ padding: '60px 40px 40px', position: 'relative', zIndex: 1 }}>
                {/* Success Header Area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '24px',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 15px 35px rgba(255, 193, 7, 0.4)',
                      marginBottom: '20px',
                      border: '4px solid #fff9db'
                    }}
                  >
                    <BiTrophy size={48} color="#ffc107" />
                  </motion.div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '900',
                    color: '#111827',
                    letterSpacing: '-0.03em',
                    textAlign: 'center'
                  }}>
                    Félicitations ! <br/> Vous avez gagné !
                  </h2>
                </div>

                {/* Main Content Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Product Details Card */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}>
                     {image && (
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          marginBottom: '10px'
                        }}>
                          <img src={image} alt={auctionTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                     )}
                     
                     <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' }}>
                          Enchère remportée
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '5px 0' }}>{auctionTitle}</h3>
                     </div>

                     <div style={{ width: '100%', height: '1px', background: '#f3f4f6' }} />

                     <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 10px' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Prix Final (Offre)</p>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0063b1' }}>{price?.toLocaleString()} DA</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Quantité</p>
                            <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#374151' }}>{quantity}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Total</p>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#10b981' }}>{(price * quantity).toLocaleString()} DA</p>
                        </div>
                     </div>

                     <div style={{ width: '100%', height: '1px', background: '#f3f4f6', margin: '10px 0' }} />

                     <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '0 10px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Vendeur</p>
                          <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#374151' }}>{sellerName}</p>
                        </div>
                     </div>
                  </div>

                  {/* Chat Button */}
                  {(chatId || sellerId) && (
                    <motion.button
                      whileHover={{ y: -2, boxShadow: '0 12px 20px rgba(0, 99, 177, 0.3)' }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleChatClick}
                      style={{
                        padding: '18px',
                        background: 'linear-gradient(135deg, #0063b1, #004a87)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '16px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 8px 15px rgba(0, 99, 177, 0.2)',
                        transition: 'all 0.3s ease',
                        width: '100%'
                      }}
                    >
                      <BiMessageDetail size={24} />
                      Discuter avec le vendeur
                    </motion.button>
                  )}
                  
                  {(!chatId && !sellerId) && (
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                      Le chat n'est pas encore disponible.
                    </p>
                  )}

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

export default AuctionWonModal;
