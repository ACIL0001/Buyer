'use client';

import { useEffect } from 'react';

interface MetadataInjectorProps {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
}

export default function MetadataInjector({ title, description, imageUrl, url }: MetadataInjectorProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Update basic meta tags
    updateMetaTag('description', description, false);

    // Update Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', 'product');
   updateMetaTag('og:site_name', 'MazadClick');
    updateMetaTag('og:locale', 'fr_DZ');
    
    if (imageUrl) {
      updateMetaTag('og:image', imageUrl);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:alt', title);
    }

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', false);
    updateMetaTag('twitter:site', '@MazadClick', false);
    updateMetaTag('twitter:title', title, false);
    updateMetaTag('twitter:description', description, false);
    
    if (imageUrl) {
      updateMetaTag('twitter:image', imageUrl, false);
    }

  }, [title, description, imageUrl, url]);

  return null; // This component doesn't render anything
}
