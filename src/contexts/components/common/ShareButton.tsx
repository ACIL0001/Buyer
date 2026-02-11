'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getFrontendUrl } from '@/config';
import { useSnackbar } from 'notistack';

interface ShareButtonProps {
  type: 'auction' | 'tender' | 'directSale';
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ type, id, title, description, imageUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  // Generate the detail page URL
  const getDetailUrl = () => {
    const baseUrl = getFrontendUrl();
    switch (type) {
      case 'auction':
        return `${baseUrl}/auction-details/${id}`;
      case 'tender':
        return `${baseUrl}/tender-details/${id}`;
      case 'directSale':
        return `${baseUrl}/direct-sale/${id}`;
      default:
        return baseUrl;
    }
  };

  const detailUrl = getDetailUrl();
  const encodedUrl = encodeURIComponent(detailUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  // Platform share URLs
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=966242223397117&redirect_uri=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    viber: `viber://forward?text=${encodedTitle}%20${encodedUrl}`,
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(detailUrl).then(() => {
      enqueueSnackbar('Lien copié dans le presse-papiers!', { variant: 'success' });
      setIsOpen(false);
    }).catch(() => {
      enqueueSnackbar('Erreur lors de la copie du lien', { variant: 'error' });
    });
  };

  const handleInstagramShare = () => {
    // Copy link first
    navigator.clipboard.writeText(detailUrl).then(() => {
      // Open Instagram website
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      enqueueSnackbar('Instagram ouvert! Lien copié - collez-le dans votre post', { variant: 'info', autoHideDuration: 4000 });
    }).catch(() => {
      // If copy fails, still open Instagram
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      enqueueSnackbar('Instagram ouvert!', { variant: 'info' });
    });
    
    setIsOpen(false);
  };

  const handleTikTokShare = () => {
    // Copy link first
    navigator.clipboard.writeText(detailUrl).then(() => {
      // Open TikTok website
      window.open('https://www.tiktok.com/upload', '_blank', 'noopener,noreferrer');
      enqueueSnackbar('TikTok ouvert! Lien copié - collez-le dans votre vidéo', { variant: 'info', autoHideDuration: 4000 });
    }).catch(() => {
      // If copy fails, still open TikTok
      window.open('https://www.tiktok.com/upload', '_blank', 'noopener,noreferrer');
      enqueueSnackbar('TikTok ouvert!', { variant: 'info' });
    });
    
    setIsOpen(false);
  };

  const handleViberShare = () => {
    // Copy link and open Viber web
    navigator.clipboard.writeText(detailUrl).then(() => {
      // Open Viber web
      window.open('https://www.viber.com/', '_blank', 'noopener,noreferrer');
      enqueueSnackbar('Lien copié! Ouvrez Viber pour partager', { variant: 'info', autoHideDuration: 3000 });
    }).catch(() => {
      window.open('https://www.viber.com/', '_blank', 'noopener,noreferrer');
      enqueueSnackbar('Viber ouvert!', { variant: 'info' });
    });
    
    setIsOpen(false);
  };

  const handleShare = (platform: string) => {
    const url = shareUrls[platform as keyof typeof shareUrls];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    }
  };

  const platforms = [
    { name: 'WhatsApp', key: 'whatsapp', icon: '📱', color: '#25D366' },
    { name: 'Facebook', key: 'facebook', icon: '👥', color: '#1877F2' },
    { name: 'LinkedIn', key: 'linkedin', icon: '💼', color: '#0A66C2' },
    { name: 'Twitter', key: 'twitter', icon: '🐦', color: '#1DA1F2' },
    { name: 'Messenger', key: 'messenger', icon: '💬', color: '#00B2FF' },
    { name: 'Telegram', key: 'telegram', icon: '✈️', color: '#0088cc' },
    { name: 'Viber', key: 'viber', icon: '📞', color: '#7360f2' },
    { name: 'Copier le lien', key: 'copy', icon: '📋', color: '#6B7280', action: handleCopyLink },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
          transition: 'all 0.3s ease',
          color: 'white',
          fontSize: '14px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
        }}
        title="Partager"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '60px',
            right: '20px',
            left: '20px',
            maxWidth: '600px',
            marginLeft: 'auto',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
            zIndex: 99999,
            padding: '8px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'slideUpFade 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* WhatsApp */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare('whatsapp');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#25D36610';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="WhatsApp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>

          {/* Facebook */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare('facebook');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#1877F210';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Facebook"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          {/* LinkedIn */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare('linkedin');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#0A66C210';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="LinkedIn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </button>

          {/* Instagram */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleInstagramShare();
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#E4405F10';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Instagram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
              <defs>
                <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FD5949"/>
                  <stop offset="50%" stopColor="#D6249F"/>
                  <stop offset="100%" stopColor="#285AEB"/>
                </linearGradient>
              </defs>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </button>

          {/* TikTok */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTikTokShare();
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#00000010';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="TikTok"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </button>

          {/* Messenger */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare('messenger');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#00B2FF10';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Messenger"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#00B2FF">
              <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.11C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8z"/>
            </svg>
          </button>

          {/* Telegram */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleShare('telegram');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#0088cc10';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Telegram"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0088cc">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </button>

          {/* Viber */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViberShare();
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#7360f210';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Viber"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#7360f2">
              <path d="M11.398.002C9.473.028 5.331.344 2.862 2.031 1.137 3.194.035 5.235.004 7.851c-.031 2.617-.096 7.702 4.727 9.078v2.031s-.043.753.494.903c.652.181 1.032-.443 1.654-1.131.344-.381.828-.927 1.198-1.354 3.297.279 5.833-.359 6.129-.453.684-.219 4.551-.702 5.184-5.737.652-5.19-.317-8.464-2.036-9.887-.521-.516-3.125-1.619-6.654-1.299-.309-.074-.388-.141-.388-.141-.032-.014-.153-.064-.388-.022zm.366 1.541a.39.39 0 01.164.011c.168.026.25.082.25.082s.509.164 1.148.458c2.654.712 3.821 2.269 4.053 2.565.851 1.062 1.754 3.596 1.164 7.733-.485 3.618-3.086 3.801-3.607 3.967-.521.166-2.656.669-5.516.514 0 0-2.182 2.632-2.863 3.313-.109.115-.236.161-.327.134-.131-.04-.168-.196-.168-.431l.019-3.654c-3.531-1.015-3.3-4.762-3.275-6.85.025-2.088.844-3.589 2.089-4.466 1.952-1.378 5.269-1.649 7.017-1.676a.39.39 0 01.052 0z"/>
            </svg>
          </button>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '24px',
            background: 'rgba(0, 0, 0, 0.1)',
            margin: '0 4px',
          }}></div>

          {/* Copy Link */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopyLink();
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#6B728010';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Copier le lien"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#6B7280">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ShareButton;
