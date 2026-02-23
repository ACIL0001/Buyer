"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BiLike, BiDislike, BiTime, BiX } from 'react-icons/bi';
import { AuctionsAPI } from '@/services/auctions'; // Assuming this exists or I will create it

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  auctionTitle: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  auctionId,
  auctionTitle
}) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [action, setAction] = useState<'LIKE' | 'DISLIKE' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleDelay = async () => {
    try {
      setSubmitting(true);
      await AuctionsAPI.delayFeedback(auctionId);
      onClose();
    } catch (error) {
      console.error('Error delaying feedback:', error);
      onClose(); // Close anyway
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!action) return;
    try {
      setSubmitting(true);
      await AuctionsAPI.saveFeedback(auctionId, { action, reason });
      onClose();
    } catch (error) {
      console.error('Error saving feedback:', error);
    } finally {
      setSubmitting(false);
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
            onClick={onClose} // Clicking backdrop closes? User said "reappear every 2 hours if not given". So closing = delay? Maybe.
            // Let's make backdrop click do nothing to force choice, or just close (which might mean ignore).
            // Better to offer explicit options.
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '450px',
                padding: '30px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                textAlign: 'center'
              }}
            >
               <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                <BiX size={24} />
              </button>

              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px', color: '#111827' }}>
                Votre avis compte !
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '25px' }}>
                Comment s'est passée votre expérience pour <br/><strong>"{auctionTitle}"</strong> ?
              </p>

              {!action ? (
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '25px' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAction('LIKE')}
                    style={{
                      flex: 1,
                      padding: '15px',
                      borderRadius: '16px',
                      border: '2px solid #e5e7eb',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#059669'
                    }}
                  >
                    <BiLike size={32} />
                    <span style={{ fontWeight: '600' }}>J'aime</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAction('DISLIKE')}
                    style={{
                      flex: 1,
                      padding: '15px',
                      borderRadius: '16px',
                      border: '2px solid #e5e7eb',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#dc2626'
                    }}
                  >
                    <BiDislike size={32} />
                    <span style={{ fontWeight: '600' }}>Je n'aime pas</span>
                  </motion.button>
                </div>
              ) : (
                <div style={{ marginBottom: '25px' }}>
                   <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: action === 'LIKE' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                      {action === 'LIKE' ? <BiLike size={24}/> : <BiDislike size={24}/>}
                      {action === 'LIKE' ? "J'aime" : "Je n'aime pas"}
                      <button onClick={() => setAction(null)} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', color: '#6b7280' }}>(Changer)</button>
                   </div>
                   <textarea
                     placeholder="Dites-nous en plus (optionnel)..."
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                     style={{
                       width: '100%',
                       padding: '12px',
                       borderRadius: '12px',
                       border: '1px solid #d1d5db',
                       minHeight: '100px',
                       resize: 'none',
                       fontFamily: 'inherit',
                       marginBottom: '15px'
                     }}
                   />
                   <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: '#0063b1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: submitting ? 'wait' : 'pointer'
                      }}
                   >
                     {submitting ? 'Validation...' : 'Valider mon avis'}
                   </motion.button>
                </div>
              )}

              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '15px' }}>
                <button
                  onClick={handleDelay}
                  disabled={submitting}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <BiTime size={16} />
                  Me rappeler plus tard
                </button>
              </div>

            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FeedbackModal;
