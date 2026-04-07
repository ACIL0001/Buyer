"use client";

import React, { useState, useEffect } from 'react';
import { MdKeyboardArrowUp } from 'react-icons/md';

interface Props {
  colorSchema?: 'blue' | 'green' | 'yellow' | 'gradient';
}

export default function DynamicScrollToTop({ colorSchema = 'gradient' }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollTargetRef = React.useRef<Element | Window | null>(null);

  useEffect(() => {
    const handleScroll = (e?: Event) => {
      let currentScroll = 0;
      
      if (e && e.target) {
        // If it's a document/window scroll
        if (e.target === document || e.target === window) {
          currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
          scrollTargetRef.current = window;
        } else {
          // If it's a specific div/container scrolling
          const target = e.target as Element;
          if (target.scrollTop !== undefined) {
             currentScroll = target.scrollTop;
             // Only register it if it truly scrolled down significantly 
             // (to avoid registering tiny unrelative nested scrolls)
             if (currentScroll > 300) {
                 scrollTargetRef.current = target;
             }
          }
        }
      } else {
        currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      }
      
      if (currentScroll > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Use capture: true so we listen to ALL scroll events, even inside independent overflow containers!
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    // Check initial scroll position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll, { capture: true } as any);
  }, []);

  const scrollToTop = () => {
    // 1. Scroll the specific element that was detected as scrolling
    if (scrollTargetRef.current && typeof (scrollTargetRef.current as any).scrollTo === 'function') {
      try {
        (scrollTargetRef.current as any).scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      } catch (e) {}
    }

    // 2. Bruteforce scroll the window just in case
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };

  // Default gradients and shadows mapping
  const schemeStyles = {
    blue: {
      background: 'var(--primary-auction-color, #0063b1)',
      shadow: 'color-mix(in srgb, var(--primary-auction-color, #0063b1) 40%, transparent)',
      hover: 'color-mix(in srgb, var(--primary-auction-color, #0063b1) 80%, black)',
    },
    green: {
      background: 'var(--primary-tender-color, #059669)',
      shadow: 'color-mix(in srgb, var(--primary-tender-color, #059669) 40%, transparent)',
      hover: 'color-mix(in srgb, var(--primary-tender-color, #059669) 80%, black)',
    },
    yellow: {
      background: 'var(--primary-ds-color, #eab308)', 
      shadow: 'color-mix(in srgb, var(--primary-ds-color, #eab308) 40%, transparent)',
      hover: 'color-mix(in srgb, var(--primary-ds-color, #eab308) 80%, black)',
    },
    gradient: {
      background: 'linear-gradient(135deg, #0063b1 0%, #0ea5e9 100%)',
      shadow: 'rgba(0, 40, 150, 0.4)',
      hover: 'linear-gradient(135deg, #005496 0%, #0284c7 100%)',
    },
  };

  const currentTheme = schemeStyles[colorSchema] || schemeStyles.gradient;

  return (
    <button
      onClick={scrollToTop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        bottom: '120px', // Increased clearance above the Chat Button
        right: '25px',
        zIndex: 99999, // Ensure it's above absolutely everything
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: isHovered ? currentTheme.hover : currentTheme.background,
        color: '#ffffff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isVisible ? 'pointer' : 'default',
        boxShadow: isHovered 
          ? `0 12px 30px ${currentTheme.shadow}`
          : `0 8px 24px ${currentTheme.shadow}`,
        transform: isVisible 
          ? (isHovered ? 'translateY(-4px)' : 'translateY(0)') 
          : 'translateY(20px) scale(0.8)',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <MdKeyboardArrowUp size={30} />
    </button>
  );
}
