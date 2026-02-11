"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getFrontendUrl } from '@/config';
import { useSnackbar } from 'notistack';

interface ShareButtonProps {
  type: 'auction' | 'tender' | 'directSale' | 'profile';
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  type, 
  id, 
  title = "MazadClick", 
  description = "Check this out on MazadClick", 
  imageUrl,
  className
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDetailUrl = () => {
    let baseUrl = getFrontendUrl();
    if (typeof window !== 'undefined' && (baseUrl.startsWith('/') || !baseUrl.startsWith('http'))) {
        baseUrl = window.location.origin;
    }

    switch (type) {
      case 'auction':
        return `${baseUrl}/auction-details/${id}`;
      case 'tender':
        return `${baseUrl}/tender-details/${id}`;
      case 'directSale':
        return `${baseUrl}/direct-sale/${id}`;
      case 'profile':
          return `${baseUrl}/profile/${id}`;
      default:
        return baseUrl;
    }
  };

  const detailUrl = getDetailUrl();
  const encodedUrl = encodeURIComponent(detailUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(description || title);

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handlePlatformShare = (platform: string) => {
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'tiktok':
        // TikTok doesn't have direct share URL, copy link and open TikTok
        navigator.clipboard.writeText(detailUrl).then(() => {
          window.open('https://www.tiktok.com/upload', '_blank', 'noopener,noreferrer');
          enqueueSnackbar('Lien copié! Ouvrez TikTok pour partager', { variant: 'info', autoHideDuration: 3000 });
        });
        setIsOpen(false);
        return;
      case 'instagram':
        // Instagram doesn't have direct share URL, copy link and open Instagram
        navigator.clipboard.writeText(detailUrl).then(() => {
          window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
          enqueueSnackbar('Lien copié! Ouvrez Instagram pour partager', { variant: 'info', autoHideDuration: 3000 });
        });
        setIsOpen(false);
        return;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'viber':
        shareUrl = `viber://forward?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'messenger':
        shareUrl = `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=966242223397117&redirect_uri=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    }
  };

  const platforms = [
    { name: 'WhatsApp', key: 'whatsapp', icon: '📱', color: '#25D366' },
    { name: 'LinkedIn', key: 'linkedin', icon: '💼', color: '#0A66C2' },
    { name: 'TikTok', key: 'tiktok', icon: '🎵', color: '#000000' },
    { name: 'Instagram', key: 'instagram', icon: '📷', color: '#E4405F' },
    { name: 'Telegram', key: 'telegram', icon: '✈️', color: '#0088cc' },
    { name: 'Viber', key: 'viber', icon: '📞', color: '#7360f2' },
    { name: 'Messenger', key: 'messenger', icon: '💬', color: '#00B2FF' },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={handleShareClick}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          color: '#333',
          fontSize: '18px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        }}
        title="Partager"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            padding: '12px',
            zIndex: 9999,
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            minWidth: '300px',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {platforms.map((platform) => (
            <button
              key={platform.key}
              onClick={() => handlePlatformShare(platform.key)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                background: platform.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
              }}
              title={platform.name}
            >
              {platform.icon}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ShareButton;
