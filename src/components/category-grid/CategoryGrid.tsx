"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CategoryAPI } from '@/app/api/category';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import useAuth from '@/hooks/useAuth';

const iconMap: Record<string, React.ReactNode> = {
  'Batiment': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4M3 7l9-4 9 4M4 7v14M20 7v14M9 11h6" />
    </svg>
  ),
  'Industrie': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M3 7v14M21 7v14M3 7l5-4 5 4 5-4 3 4M7 11h2M7 15h2M15 11h2M15 15h2" />
    </svg>
  ),
  'Artisanat': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5M11 11l1 1" />
    </svg>
  ),
  'Pour les entreprises': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  'Recyclage': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11l5-5 5 5M7 11h10M17 13l-5 5-5-5M17 13H7" />
    </svg>
  ),
  'Transport': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="9" rx="2" />
      <path d="M7 10l3-5h4l3 5M6 19v2M18 19v2" />
    </svg>
  ),
  'Agriculture': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 14a7 7 0 0 1 14 0M12 14v7" />
      <path d="M12 7l-2 2M12 7l2 2" />
    </svg>
  ),
  'Commerce': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
};

const DefaultIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const CategoryItem = ({ cat, router }: { cat: any; router: any }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['categories', 'sub', cat._id],
    queryFn: () => CategoryAPI.getCategoriesByParent(cat._id),
    enabled: isExpanded
  });

  const subCategories = subData?.data || [];

  return (
    <div style={{ borderBottom: '2px solid #002896' }}>
      <motion.div 
        whileHover={{ x: 5 }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '20px 0',
          cursor: 'pointer'
        }}
      >
        <div 
          onClick={() => router.push(`/auction-sidebar?category=${cat._id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}
        >
          <div style={{ color: '#002896' }}>
            {iconMap[cat.name] || <DefaultIcon />}
          </div>
          <span style={{ color: '#002896', fontSize: '20px', fontWeight: '700' }}>
            {cat.name}
          </span>
        </div>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          style={{ 
            color: '#002bc5', 
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
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
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
                    color: '#002bc5', 
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
  const displayTitle = "Découvrez toutes les opportunités de marché essentielles pour votre activité";

  if (isLoading) {
    return (
      <div style={{ width: '100%', background: '#ffffff', padding: '80px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ height: '64px', background: '#f1f5f9', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        </div>
        <style jsx>{` @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: '#ffffff', padding: '100px 0', fontFamily: '"DM Sans", sans-serif', minHeight: '288px' }}>
      <div className="container-responsive" style={{ maxWidth: '1258px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ color: '#002896', fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: '700', margin: 0, letterSpacing: '-1px' }}>
            {displayTitle}
          </h2>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          columnGap: '60px',
          rowGap: '20px',
          padding: '0 20px'
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
