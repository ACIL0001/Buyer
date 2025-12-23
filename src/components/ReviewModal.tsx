"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BiLike, BiDislike, BiX } from 'react-icons/bi';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (type: 'like' | 'dislike', comment: string) => void;
  targetUserId: string;
  auctionTitle?: string;
  isLoading?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmitReview,
  auctionTitle,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<'like' | 'dislike' | null>(null);
  const [comment, setComment] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle body scroll locking
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

  const handleSubmit = () => {
    if (!selectedType) return;
    onSubmitReview(selectedType, comment);
  };

  const handleClose = () => {
    setSelectedType(null);
    setComment('');
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 1000000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              overflowY: 'auto'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                padding: '32px',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto',
                margin: 'auto'
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#4b5563',
                  transition: 'background 0.2s'
                }}
              >
                <BiX size={24} />
              </button>

              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                }}>
                  🎉
                </div>
                <h2 style={{
                  margin: '0 0 8px',
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#111827',
                  letterSpacing: '-0.025em'
                }}>
                  {t('review.congratulations')}
                </h2>
                <p style={{
                  margin: 0,
                  color: '#6b7280',
                  fontSize: '15px',
                  lineHeight: '1.5'
                }}>
                  {t('review.youWonAuction')} <br/>
                  {auctionTitle && <span style={{ fontWeight: '600', color: '#374151' }}>"{auctionTitle}"</span>}
                </p>
              </div>

              {/* Review Section */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {t('review.rateYourExperience')}
                </h3>

                {/* Like/Dislike Options */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType('like')}
                    style={{
                      flex: 1,
                      padding: '20px 16px',
                      border: selectedType === 'like' ? '2px solid #10b981' : '1px solid #e5e7eb',
                      borderRadius: '16px',
                      background: selectedType === 'like' ? '#ecfdf5' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedType === 'like' ? '0 4px 6px -1px rgba(16, 185, 129, 0.1)' : 'none'
                    }}
                  >
                    <BiLike size={32} color={selectedType === 'like' ? '#10b981' : '#9ca3af'} />
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: '600',
                      color: selectedType === 'like' ? '#059669' : '#6b7280'
                    }}>
                      {t('review.like')}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType('dislike')}
                    style={{
                      flex: 1,
                      padding: '20px 16px',
                      border: selectedType === 'dislike' ? '2px solid #ef4444' : '1px solid #e5e7eb',
                      borderRadius: '16px',
                      background: selectedType === 'dislike' ? '#fef2f2' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedType === 'dislike' ? '0 4px 6px -1px rgba(239, 68, 68, 0.1)' : 'none'
                    }}
                  >
                    <BiDislike size={32} color={selectedType === 'dislike' ? '#ef4444' : '#9ca3af'} />
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: '600',
                      color: selectedType === 'dislike' ? '#dc2626' : '#6b7280'
                    }}>
                      {t('review.dislike')}
                    </span>
                  </motion.button>
                </div>

                {/* Comment Section */}
                <div style={{ position: 'relative' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    {t('review.addComment')} <span style={{ color: '#9ca3af', fontWeight: '400' }}>({t('review.optional')})</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('review.commentPlaceholder')}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      resize: 'none',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#f9fafb',
                      color: '#1f2937'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                      if (!comment) e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '32px'
              }}>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    background: 'white',
                    color: '#4b5563',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  {t('common.cancel')}
                </button>

                <motion.button
                  whileHover={!isLoading && selectedType ? { scale: 1.02 } : {}}
                  whileTap={!isLoading && selectedType ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={!selectedType || isLoading}
                  style={{
                    flex: 2,
                    padding: '14px',
                    border: 'none',
                    borderRadius: '12px',
                    background: selectedType && !isLoading 
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' 
                      : '#f3f4f6',
                    color: selectedType && !isLoading ? 'white' : '#9ca3af',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: selectedType && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedType && !isLoading ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <span>{t('review.submitting')}</span>
                    </>
                  ) : (
                    <span>{t('review.submitReview')}</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
          <style jsx global>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ReviewModal; 