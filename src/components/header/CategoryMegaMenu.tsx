"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CategoryAPI } from '@/services/category';
import app from '@/config';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '@/utils/url';

interface Category {
  _id: string;
  name: string;
  type: string;
  description?: string;
  thumb?: {
    _id: string;
    url: string;
    filename: string;
  } | null;
  children?: Category[];
}

export default function CategoryMegaMenu({ item, isActive }: { item: any; isActive: boolean }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const response = await CategoryAPI.getCategoryTree();
      let categoryData: Category[] = [];
      if (response) {
        if ((response as any).success && Array.isArray((response as any).data)) {
          categoryData = (response as any).data;
        } else if (Array.isArray(response)) {
          categoryData = response as Category[];
        } else if ((response as any).data && Array.isArray((response as any).data)) {
          categoryData = (response as any).data;
        }
      }
      return categoryData;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  useEffect(() => {
    if (isOpen && !activeCategoryId && categories.length > 0) {
      const firstCat = categories[0];
      setActiveCategoryId(firstCat._id);
      if (firstCat.children && firstCat.children.length > 0) {
        setActiveSubCategoryId(null);
      }
    }
  }, [isOpen, categories, activeCategoryId]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const getImageUrl = (category: any) => {
    const imageUrl = category.thumb?.url || 
                     category.thumb?.fullUrl || 
                     category.image || 
                     category.thumbnail || 
                     category.photo || 
                     '';
    
    if (!imageUrl) {
      return '/assets/images/cat.avif'; // Fallback image
    }

    return normalizeImageUrl(imageUrl) || '/assets/images/cat.avif';
  };

  const activeCategory = categories.find(c => c._id === activeCategoryId) || categories[0];

  return (
    <div 
      style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link 
        href={item.path} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: isActive || isOpen ? '#0063b1' : '#334155',
          fontWeight: isActive || isOpen ? '600' : '500',
          textDecoration: 'none',
          fontSize: '15px',
          padding: '8px 16px',
          borderRadius: '100px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          background: isOpen ? 'rgba(0, 99, 177, 0.08)' : 'transparent',
        }}
        onClick={() => setIsOpen(false)}
      >
        {item.name}
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            marginTop: '1px'
          }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </Link>

      {/* Mega Menu Dropdown */}
      {isOpen && (() => {
        const hasSubcategories = activeCategory && activeCategory.children && activeCategory.children.length > 0;
        const activeSub = hasSubcategories ? activeCategory?.children?.find((c: Category) => c._id === activeSubCategoryId) : null;
        const showSubSubcategoriesPanel = activeSub && activeSub.children && activeSub.children.length > 0;
        
        let containerWidth = '380px';
        if (hasSubcategories) {
          containerWidth = showSubSubcategoriesPanel ? '980px' : '640px';
        }

        return (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: i18n.language === 'ar' ? 'auto' : '-20px',
            right: i18n.language === 'ar' ? '-20px' : 'auto',
            width: containerWidth,
            paddingTop: '16px', // Give some space to hover down
            zIndex: 1000,
            animation: 'megaMenuFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1), 0 0 20px rgba(0,0,0,0.05)',
              display: 'flex',
              overflow: 'hidden',
              border: '1px solid rgba(0, 99, 177, 0.1)',
              minHeight: hasSubcategories ? '400px' : 'auto'
            }}>
            {isLoading ? (
              <div style={{ padding: '60px', width: '100%', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
                <div className="mega-menu-spinner"></div>
                <span style={{ fontSize: '15px', fontWeight: '500' }}>{t('common.loading', 'Chargement...')}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', width: '100%' }}>
                {/* Left Side: Root Categories */}
                <div className="mega-menu-scroll" style={{
                  width: hasSubcategories ? '340px' : '100%',
                  background: '#f8fafc',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  borderRight: hasSubcategories ? '1px solid #e2e8f0' : 'none',
                  transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  {categories.map((category) => {
                    const isCatActive = activeCategoryId === category._id;
                    const hasChildren = category.children && category.children.length > 0;
                    return (
                      <div
                        key={category._id}
                        onMouseEnter={() => {
                          if (activeCategoryId !== category._id) {
                            setActiveCategoryId(category._id);
                            setActiveSubCategoryId(null);
                          }
                        }}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/category?category=${category._id}&name=${encodeURIComponent(category.name)}`);
                        }}
                        style={{
                          position: 'relative',
                          height: '80px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: isCatActive ? '2px solid #0063b1' : '2px solid transparent',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          flexShrink: 0,
                          transform: isCatActive && !hasSubcategories ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        {/* Background Image */}
                        <img 
                          src={getImageUrl(category)} 
                          alt={category.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 1
                          }}
                          onError={(e) => {
                            e.currentTarget.src = "/assets/images/cat.avif";
                          }}
                        />
                        {/* Overlay */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: isCatActive ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.6)',
                          zIndex: 2,
                          transition: 'background 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}></div>
                        {/* Content */}
                        <div style={{
                          position: 'relative',
                          zIndex: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          height: '100%',
                          padding: '0 20px',
                          color: isCatActive ? '#80c2ff' : '#fff', 
                          fontWeight: '700',
                          fontSize: '15px'
                        }}>
                          <span>{category.name}</span>
                          {hasChildren && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isCatActive ? (i18n.language === 'ar' ? 'translateX(-4px)' : 'translateX(4px)') : 'translateX(0)' }}>
                              {i18n.language === 'ar' ? (
                                 <path d="M15 18l-6-6 6-6"/>
                              ) : (
                                 <path d="M9 18l6-6-6-6"/>
                              )}
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Middle and Right: Subcategories Area */}
                {hasSubcategories && (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    background: '#ffffff',
                    maxHeight: '500px',
                    overflow: 'hidden'
                  }}>
                  {activeCategory ? (
                    <>
                      {/* Subcategories Column */}
                      <div className="mega-menu-scroll" style={{
                        width: showSubSubcategoriesPanel ? '300px' : '100%',
                        padding: '30px 24px',
                        overflowY: 'auto',
                        borderRight: showSubSubcategoriesPanel ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}>
                        <h3 style={{
                          color: '#64748b',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: '700',
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {t('category.allProductsIn', 'CATÉGORIES DE')} {activeCategory.name}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {activeCategory.children && activeCategory.children.length > 0 ? (
                            activeCategory.children.map((sub: Category) => {
                              const isSubActive = activeSubCategoryId === sub._id;
                              return (
                                <div 
                                  key={sub._id}
                                  onMouseEnter={() => setActiveSubCategoryId(sub._id)}
                                  onClick={() => {
                                    setIsOpen(false);
                                    router.push(`/category?category=${sub._id}&name=${encodeURIComponent(sub.name)}`);
                                  }}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: isSubActive ? '#eff6ff' : 'transparent',
                                    color: isSubActive ? '#0063b1' : '#475569',
                                    fontWeight: isSubActive ? '600' : '500',
                                    fontSize: '14px',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <span>{sub.name}</span>
                                  {sub.children && sub.children.length > 0 && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: isSubActive ? '#0063b1' : '#94a3b8' }}>
                                      {i18n.language === 'ar' ? (
                                        <path d="M15 18l-6-6 6-6"/>
                                      ) : (
                                        <path d="M9 18l6-6-6-6"/>
                                      )}
                                    </svg>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ color: '#94a3b8', fontSize: '14px', padding: '10px 0', fontStyle: 'italic' }}>
                              {t('common.empty', 'Aucune sous-catégorie')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sub-subcategories Column */}
                      {showSubSubcategoriesPanel && (() => {
                        return (
                          <div className="mega-menu-scroll" style={{
                            flex: 1,
                            padding: '30px 24px',
                            overflowY: 'auto',
                            background: '#fafbfc',
                            display: 'flex',
                            flexDirection: 'column'
                          }}>
                            <h3 style={{
                              color: '#1e293b',
                              fontSize: '16px',
                              fontWeight: '700',
                              marginBottom: '20px',
                            }}>
                              {t('common.selectionIn', 'Sélection dans')} {activeSub.name}
                            </h3>
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                              gap: '12px' 
                            }}>
                              {activeSub.children!.map((child: Category) => (
                                <div 
                                  key={child._id}
                                  className="mega-menu-child-card"
                                  onClick={() => {
                                    setIsOpen(false);
                                    router.push(`/category?category=${child._id}&name=${encodeURIComponent(child.name)}`);
                                  }}
                                  style={{
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    color: '#475569',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                  }}
                                >
                                  {child.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div style={{ color: '#888', fontStyle: 'italic', padding: '30px' }}>
                      {t('category.noCategoriesFoundTitle', 'No categories found')}
                    </div>
                  )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        );
      })()}
      <style jsx>{`
        @keyframes megaMenuFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .mega-menu-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 99, 177, 0.1);
          border-radius: 50%;
          border-top-color: #0063b1;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .mega-menu-child-card:hover {
          background: #eff6ff !important;
          border-color: #bfdbfe !important;
          color: #0063b1 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 99, 177, 0.08) !important;
        }

        .mega-menu-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .mega-menu-scroll::-webkit-scrollbar-track {
          background: transparent; 
        }
        .mega-menu-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 100px;
        }
        .mega-menu-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}</style>
    </div>
  );
}
