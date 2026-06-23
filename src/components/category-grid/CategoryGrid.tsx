"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CategoryAPI } from '@/app/api/category';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import useAuth from '@/hooks/useAuth';
import { getAbsoluteUrl } from '@/utils/url';

const iconMap: Record<string, React.ReactNode> = {
  'Batiment': (
    <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4M3 7l9-4 9 4M4 7v14M20 7v14M9 11h6" />
    </svg>
  ),
  'Industrie': (
    <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 7v14M21 7v14M3 7l5-4 5 4 5-4 3 4M7 11h2M7 15h2M15 11h2M15 15h2" />
    </svg>
  ),
  'Artisanat': (
    <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5M11 11l1 1" />
    </svg>
  ),
  'Pour les entreprises': (
    <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  'Recyclage': (
    <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11l5-5 5 5M7 11h10M17 13l-5 5-5-5M17 13H7" />
    </svg>
  ),
  'Transport': (
    <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="9" rx="2" />
      <path d="M7 10l3-5h4l3 5M6 19v2M18 19v2" />
    </svg>
  ),
  'Agriculture': (
    <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 14a7 7 0 0 1 14 0M12 14v7" />
      <path d="M12 7l-2 2M12 7l2 2" />
    </svg>
  ),
  'Commerce': (
    <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
};

const DefaultIcon = () => (
  <svg width="33" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const CategoryItem = ({ cat, router }: { cat: any; router: any }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Root categories already embed their direct children ({ _id, name }), so the list can
  // render instantly without a click-time request. Only fall back to the by-parent endpoint
  // when the embedded list is missing.
  const embeddedChildren = Array.isArray(cat.children) ? cat.children : [];
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['categories', 'sub', cat._id],
    queryFn: () => CategoryAPI.getCategoriesByParent(cat._id),
    enabled: isExpanded && embeddedChildren.length === 0
  });

  const subCategories = embeddedChildren.length > 0 ? embeddedChildren : (subData?.data || []);

  return (
    <div className="cat-item">
      <motion.div
        className="cat-row"
        whileHover={{ x: 5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0',
          minHeight: 'clamp(56px, 8vw, 72px)',
          cursor: 'pointer'
        }}
      >
        <div
          className="cat-clickable"
          onClick={() => router.push(`/auction-sidebar?category=${cat._id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 22px)', flex: 1, minWidth: 0 }}
        >
          <div className="cat-icon" style={{ color: '#002896', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {cat.thumb?.url ? (
              <img 
                src={getAbsoluteUrl(cat.thumb.url)} 
                alt={cat.name} 
                className="category-dynamic-icon"
                style={{ width: '33px', height: '30px', objectFit: 'contain' }} 
              />
            ) : (
              iconMap[cat.name] || <DefaultIcon />
            )}
          </div>
          <span className="cat-name" style={{ color: '#002896', fontSize: 'clamp(0.95rem, 1.5vw, 1.25rem)', fontWeight: '700', fontFamily: 'Roboto, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cat.name}
          </span>
        </div>
        <div
          className="cat-chevron"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          style={{
            color: '#002896',
            cursor: 'pointer',
            padding: '10px',
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </motion.div>

      {isExpanded && (
        <motion.div
          className="cat-expandable"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ overflow: 'hidden', paddingBottom: '20px' }}
        >
          {subLoading ? (
            <div style={{ padding: '10px 44px', color: '#64748b', fontStyle: 'italic' }}>Chargement...</div>
          ) : subCategories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '44px' }}>
              {subCategories.map((sub: any) => (
                <div
                  key={sub._id}
                  onClick={() => router.push(`/auction-sidebar?category=${sub._id}`)}
                  style={{
                    color: '#002896',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '12px' }}>•</span>
                  {sub.name}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '10px 44px', color: '#64748b', fontSize: '14px' }}>Aucune sous-catégorie disponible</div>
          )}
        </motion.div>
      )}
    </div>
  );
};

const CategoryGrid = () => {
  const router = useRouter();
  const { isLogged, isReady } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['categories', 'roots'],
    queryFn: () => CategoryAPI.getRootCategories()
  });

  const categories = data?.data || [];
  const displayTitle = "Découvrez des produits de diverses catégories";

  if (isLoading) {
    return (
      <div style={{ width: '100%', background: '#ffffff', padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 20px)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 clamp(16px, 3vw, 48px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'clamp(16px, 3vw, 40px)' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ height: '72px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        </div>
        <style jsx>{` @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } `}</style>
      </div>
    );
  }

  return (
    <div className="cat-section" style={{ width: '100%', background: '#ffffff', padding: 'clamp(48px, 8vw, 100px) 0', fontFamily: '"DM Sans", sans-serif' }}>
      <style jsx global>{`
        /* Same row design at every width (icon + name + chevron, blue underline) — columns reflow 3 -> 2 -> 1 */
        .cat-item { border-bottom: 2px solid #002896; width: 100%; min-width: 0; }

        @media (max-width: 1023px) {
          .cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 639px) {
          .cat-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .cat-section h2 { font-size: clamp(18px, 5vw, 28px) !important; line-height: 1.3 !important; }
        }
      `}</style>
      <div className="container-responsive" style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', padding: '0 clamp(16px, 3vw, 48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 4vw, 60px)' }}>
          <h2 style={{ color: '#002896', fontSize: 'clamp(1.2rem, 4vw, 2.4rem)', fontWeight: '700', margin: 0, letterSpacing: '-1px', lineHeight: 1.2 }}>
            {displayTitle}
          </h2>
        </div>

        <div className="cat-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          columnGap: 'clamp(20px, 4vw, 56px)',
          rowGap: 'clamp(4px, 1vw, 12px)',
          margin: '0 auto',
          width: '100%'
        }}>
          {categories.slice(0, 9).map((cat: any) => (
            <CategoryItem key={cat._id} cat={cat} router={router} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
