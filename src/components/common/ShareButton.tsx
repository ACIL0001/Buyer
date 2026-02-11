"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton, 
  WhatsappShareButton, 
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  EmailIcon
} from 'react-share';
import { useTranslation } from 'react-i18next';
import { getFrontendUrl } from '@/config';
import { useSnackbar } from 'notistack';

interface ShareButtonProps {
  type: 'auction' | 'tender' | 'directSale' | 'profile';
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  className?: string; // Allow custom styling
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
  const [copied, setCopied] = useState(false);
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
  
  // Platform share URLs for manual opening (fallback)
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=966242223397117&redirect_uri=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    viber: `viber://forward?text=${encodedTitle}%20${encodedUrl}`,
  };


  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events (like card navigation)
    
     // Check for native Web Share API support
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: detailUrl,
        });
        console.log('Shared successfully via Web Share API');
        return; // Exit if successful
      } catch (error) {
         if ((error as any).name !== 'AbortError') {
             console.error('Error sharing via Web Share API:', error);
         }
         // If user cancelled or other error, fallback to dropdown could be an option, 
         // but usually if they cancel native share, they don't want to share.
         // Let's just return. If it failed due to not being supported (unlikely if we check navigator.share), 
         // then we might want fallback, but we checked it.
         return; 
      }
    }
    
    // Fallback to custom dropdown
    setIsOpen(!isOpen);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(detailUrl).then(() => {
        enqueueSnackbar(t('common.copied') || 'Lien copié!', { variant: 'success' });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
    // Check for localhost and warn about previews
    if ((detailUrl.includes('localhost') || detailUrl.includes('127.0.0.1')) && (platform === 'facebook' || platform === 'linkedin')) {
       enqueueSnackbar('Note: Social media previews (image/title) do not work on localhost.', { variant: 'warning', autoHideDuration: 3000 });
    }

    const url = shareUrls[platform as keyof typeof shareUrls];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    }
  };

  return (
    <div className={`share-button-container ${className || ''}`} style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button 
        className="share-btn"
        onClick={handleShareClick}
        title={t('common.share') || "Partager"}
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #e0e0e0',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          color: '#555',
          fontSize: '18px'
        }}
      >
        <i className="bi bi-share-fill"></i>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute', // Changed from fixed to absolute for better context positioning if needed, or keep fixed for mobile centered
            // For now, keeping the design from previous version which seemed attempting to be a bottom sheet or centered modal on mobile, 
            // but let's make it a dropdown relative to button for desktop consistency or fallback.
            // Actually, the previous code had a specific mobile-like design. Let's stick to a dropdown for simplicity and robustness.
            top: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
            padding: '15px',
            zIndex: 1000,
            width: '280px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ paddingBottom: '10px',marginBottom: '10px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: '14px' }}>
            {t('common.shareVia') || "Partager via"}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
            <WhatsappShareButton url={detailUrl} title={title} separator=" - ">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <WhatsappIcon size={40} round />
                <span style={{ fontSize: '11px', color: '#555' }}>WhatsApp</span>
              </div>
            </WhatsappShareButton>

            <FacebookShareButton url={detailUrl} hashtag="#MazadClick">
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <FacebookIcon size={40} round />
                <span style={{ fontSize: '11px', color: '#555' }}>Facebook</span>
              </div>
            </FacebookShareButton>
            
            <TwitterShareButton url={detailUrl} title={title}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <TwitterIcon size={40} round />
                <span style={{ fontSize: '11px', color: '#555' }}>X</span>
              </div>
            </TwitterShareButton>

            <LinkedinShareButton url={detailUrl} title={title} summary={description} source="MazadClick">
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <LinkedinIcon size={40} round />
                <span style={{ fontSize: '11px', color: '#555' }}>LinkedIn</span>
              </div>
            </LinkedinShareButton>

             <EmailShareButton url={detailUrl} subject={title} body={description}>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <EmailIcon size={40} round />
                <span style={{ fontSize: '11px', color: '#555' }}>Email</span>
              </div>
            </EmailShareButton>
            
             {/* Viber Manual */}
             <button onClick={handleViberShare} style={{background: 'none', border:'none', padding: 0, cursor: 'pointer'}}>
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                     <div style={{width: 40, height: 40, borderRadius: '50%', background: '#7360f2', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white'}}>
                        <i className="bi bi-telephone-fill"></i>
                     </div>
                    <span style={{ fontSize: '11px', color: '#555' }}>Viber</span>
                 </div>
             </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', padding: '8px', borderRadius: '6px' }}>
            <input 
              type="text" 
              readOnly 
              value={detailUrl} 
              style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '12px', color: '#666', outline: 'none', textOverflow: 'ellipsis' }}
            />
            <button 
              onClick={handleCopyLink}
              style={{ background: 'none', border: 'none', color: copied ? 'green' : '#0063b1', fontWeight: 600, fontSize: '12px', cursor: 'pointer', marginLeft: '5px' }}
            >
              {copied ? (t('common.copied') || "Copié!") : (t('common.copy') || "Copier")}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default ShareButton;
