"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CategoryAPI } from '../api/category';
import { AuctionsAPI } from '../api/auctions';
import { TendersAPI } from '../api/tenders';
import { DirectSaleAPI } from '../api/direct-sale';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AuctionCard from '@/components/cards/AuctionCard';
import TenderCard from '@/components/cards/TenderCard';
import DirectSaleCard from '@/components/cards/DirectSaleCard';
import app from '../../config';
import { useQuery } from '@tanstack/react-query';
import CardSkeleton from '@/components/skeletons/CardSkeleton';
import PageSkeleton from '@/components/skeletons/PageSkeleton';

import { Auction } from '@/types/auction';
import { Tender } from '@/types/tender';
import { DirectSale } from '@/types/direct-sale';

// Category interface for component usage (tree structure)
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
  attributes?: string[];
  parent?: string | null;
  children?: Category[]; // Changed to Category[] for tree structure
  level: number;
  path: string[];
  fullPath: string;
  createdAt: string;
  updatedAt: string;
}





export default function CategoryClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'categories' | 'auctions'>('categories');
  const [filterType, setFilterType] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [activeTab, setActiveTab] = useState<'auctions' | 'tenders' | 'directSales'>('auctions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  
  const DEFAULT_CATEGORY_IMAGE = "/assets/images/logo-white.png";
  const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";

  const navigateWithTop = useCallback((url: string) => {
    router.push(url, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement?.scrollTo?.({ top: 0, behavior: "auto" });
    });
  }, [router]);

  useEffect(() => {
    const categoryId = searchParams.get('category');
    const categoryName = searchParams.get('name');
    if (categoryId) {
      setSelectedCategory(categoryId);
      setSelectedCategoryName(decodeURIComponent(categoryName || ''));
      setViewMode('auctions');
    }
  }, [searchParams]);

  const getAllSubcategoryIds = (category: Category): string[] => {
    const categoryId = category._id || '';
    let subcategoryIds = [categoryId];
    if (category.children && category.children.length > 0) {
      category.children.forEach(child => {
        subcategoryIds = [...subcategoryIds, ...getAllSubcategoryIds(child)];
      });
    }
    return subcategoryIds;
  };

  const findCategoryById = (categories: Category[], targetId: string): Category | null => {
    for (const category of categories) {
      const categoryId = category._id || '';
      if (categoryId === targetId) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      console.log('🔄 Fetching categories from API...');
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
    }
  });

  const { data: allAuctionsResponse, isLoading: auctionsLoading } = useQuery({
    queryKey: ['auctions', 'all'],
    queryFn: () => AuctionsAPI.getAuctions(),
  });
  const allAuctions = (allAuctionsResponse as any)?.data || (Array.isArray(allAuctionsResponse) ? allAuctionsResponse : []);

  const { data: tenders = [], isLoading: tendersLoading } = useQuery({
    queryKey: ['tenders', 'active'],
    queryFn: async () => {
      const response = await TendersAPI.getActiveTenders();
      const tendersData = response?.data || response || [];
      return (Array.isArray(tendersData) ? tendersData : []).map((t: any) => ({ ...t, id: t._id || t.id }));
    }
  });

  const { data: allDirectSales = [], isLoading: directSalesLoading } = useQuery({
    queryKey: ['direct-sales', 'all'],
    queryFn: async () => {
      const response = await DirectSaleAPI.getDirectSales();
      const directSalesData = (response as any)?.data || response || [];
      return (Array.isArray(directSalesData) ? directSalesData : []).map((s: any) => ({ ...s, id: s._id || s.id }));
    }
  });

  // Derived state for filtered items based on selected category
  const { auctions, categoryTenders, categoryDirectSales } = useMemo(() => {
    if (!selectedCategory || !categories.length) {
      return { auctions: [], categoryTenders: [], categoryDirectSales: [] };
    }

    const selectedCategoryObj = findCategoryById(categories, selectedCategory);
    let allCategoryIds: string[] = [selectedCategory];
    if (selectedCategoryObj) {
      allCategoryIds = getAllSubcategoryIds(selectedCategoryObj);
    }

    const mappedAuctions = (Array.isArray(allAuctions) ? allAuctions : []).map((a: any) => ({ ...a, id: a._id || a.id }));
    const filteredAuctions = mappedAuctions.filter((auction: any) => {
      const catId = auction.productCategory?._id || auction.category?._id;
      return catId && allCategoryIds.includes(catId);
    });

    const filteredTenders = tenders.filter((tender: any) => {
      const catId = tender.productCategory?._id || tender.category?._id;
      return catId && allCategoryIds.includes(catId);
    });

    const filteredDirectSales = allDirectSales.filter((sale: any) => {
      const catId = sale.productCategory?._id || sale.category?._id;
      return catId && allCategoryIds.includes(catId);
    });

    return { 
      auctions: filteredAuctions, 
      categoryTenders: filteredTenders, 
      categoryDirectSales: filteredDirectSales
    };
  }, [selectedCategory, categories, allAuctions, tenders, allDirectSales]);

  const itemsLoading = auctionsLoading || tendersLoading || directSalesLoading;


  const hasChildren = (category: Category) => {
    return category.children && category.children.length > 0;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const selectCategory = (category: Category) => {
    const categoryId = category._id || '';
    setSelectedCategory(categoryId);
    setSelectedCategoryName(category.name);
    setViewMode('auctions');
  };

  const goBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSelectedCategoryName('');
    setActiveTab('auctions'); // Reset tab
  };

  const showSearchResults = isSearchFocused && searchTerm.trim().length > 0;

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    let filtered = categories;
    
    // Filter by type
    if (filterType !== 'ALL') {
      filtered = categories.filter((category: Category) => {
        const categoryType = (category.type || '').toString().toUpperCase();
        return categoryType === filterType;
      });
    }
    
    // Filter by search term
    if (searchTerm.trim() && !showSearchResults) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((category: Category) => {
        const name = (category.name || '').toLowerCase();
        const description = (category.description || '').toLowerCase();
        return name.includes(searchLower) || description.includes(searchLower);
      });
    }
    
    return filtered;
  }, [categories, filterType, searchTerm, showSearchResults]);

  // Fetch tenders and direct sales on mount



  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return { categories: [], auctions: [], tenders: [], directSales: [] };
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    // Search categories
    const resultsCategories = categories.filter((category: Category) => {
      const name = (category.name || '').toLowerCase();
      const description = (category.description || '').toLowerCase();
      return name.includes(searchLower) || description.includes(searchLower);
    });

    // Search auctions
    const resultsAuctions = (auctions.length > 0 ? auctions : allAuctions).filter((auction: any) => {
      const title = (auction.title || auction.name || '').toLowerCase();
      const description = (auction.description || '').toLowerCase();
      return title.includes(searchLower) || description.includes(searchLower);
    });

    // Search tenders
    const resultsTenders = (categoryTenders.length > 0 ? categoryTenders : tenders).filter((tender: any) => {
      const title = (tender.title || '').toLowerCase();
      const description = (tender.description || '').toLowerCase();
      return title.includes(searchLower) || description.includes(searchLower);
    });

    // Search direct sales
    const resultsDirectSales = (categoryDirectSales.length > 0 ? categoryDirectSales : allDirectSales).filter((sale: any) => {
      const title = (sale.title || '').toLowerCase();
      const description = (sale.description || '').toLowerCase();
      return title.includes(searchLower) || description.includes(searchLower);
    });

    return {
      categories: resultsCategories,
      auctions: resultsAuctions,
      tenders: resultsTenders,
      directSales: resultsDirectSales
    };
  }, [searchTerm, categories, auctions, tenders, allDirectSales, allAuctions, categoryTenders, categoryDirectSales]);

  const { filteredAuctions, filteredTenders, filteredDirectSales } = useMemo(() => {
    if (showSearchResults) {
      return {
        filteredAuctions: searchResults.auctions,
        filteredTenders: searchResults.tenders,
        filteredDirectSales: searchResults.directSales
      };
    }
    return {
      filteredAuctions: auctions,
      filteredTenders: categoryTenders,
      filteredDirectSales: categoryDirectSales
    };
  }, [showSearchResults, searchResults, auctions, categoryTenders, categoryDirectSales]);

  const handleSearchSelect = (item: Category | Auction | Tender | DirectSale, type: 'category' | 'auction' | 'tender' | 'directSale') => {
    setSearchTerm('');
    
    if (type === 'category') {
      const category = item as Category;
      const categoryId = category._id;
      const categoryName = category.name;
      navigateWithTop(`/category?category=${categoryId}&name=${encodeURIComponent(categoryName)}`);
    } else if (type === 'auction') {
      const auction = item as Auction;
      navigateWithTop(`/auction-details/${auction.id}`);
    } else if (type === 'tender') {
      const tender = item as Tender;
      navigateWithTop(`/tender-details/${tender._id}`);
    } else if (type === 'directSale') {
      const sale = item as DirectSale;
      navigateWithTop(`/direct-sale-details/${sale._id}`);
    }
  };

  const renderCategoryCard = (category: Category, index: number = 0): JSX.Element => {
      const categoryId = category._id || '';
    const name = category.name;
      const isHovered = hoveredCategory === categoryId;
    const isExpanded = expandedCategories[categoryId];
    const hasSubcategories = hasChildren(category);

    // Dynamic gradient based on category index
    const gradients = [
      'linear-gradient(135deg, #0063b1 0%, #00a3e0 100%)',
      'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
    ];
    const categoryGradient = gradients[index % gradients.length];

      return (
          <div
        key={categoryId}
        className="category-card-professional"
            style={{
              position: 'relative',
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isHovered 
            ? '0 20px 60px rgba(0, 99, 177, 0.25), 0 0 0 1px rgba(0, 99, 177, 0.1)' 
            : '0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.5)',
          transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
          overflow: isExpanded ? 'visible' : 'hidden',
          zIndex: isExpanded ? 20 : 1,
            }}
            onMouseEnter={() => setHoveredCategory(categoryId)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
        {/* Gradient Accent */}
              <div style={{
                position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '4px',
          background: categoryGradient,
          borderRadius: '20px 20px 0 0',
        }} />

        {/* Floating Decorative Elements */}
              <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '32px',
          height: '32px',
          background: `${categoryGradient}`,
                borderRadius: '50%',
          opacity: isHovered ? 0.8 : 0.3,
          transition: 'all 0.4s ease',
          transform: isHovered ? 'scale(1.2) rotate(45deg)' : 'scale(1) rotate(0deg)',
        }} />

        {/* Category Content */}
        <div 
          onClick={() => selectCategory(category)}
          style={{
            padding: '24px',
            cursor: 'pointer',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Category Image with Creative Frame */}
          <div style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: categoryGradient,
              padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              transition: 'all 0.4s ease',
              transform: isHovered ? 'rotate(6deg) scale(1.1)' : 'rotate(0deg) scale(1)',
              boxShadow: isHovered 
                ? '0 12px 40px rgba(0, 99, 177, 0.3)' 
                : '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '17px',
                overflow: 'hidden',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
            <img
              src={(() => {
                if (category.thumb && category.thumb.url) {
                  const imageUrl = category.thumb.url;
                  if (imageUrl.startsWith('http')) {
                    return imageUrl;
                  } else if (imageUrl.startsWith('/static/')) {
                    const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                    console.log('🎯 CATEGORY PAGE CATEGORY IMAGE:', {
                      originalUrl: imageUrl,
                      finalUrl: finalUrl,
                      categoryId: category._id,
                      categoryName: name
                    });
                    return finalUrl;
                  } else if (imageUrl.startsWith('/')) {
                    const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                    console.log('🎯 CATEGORY PAGE CATEGORY IMAGE:', {
                      originalUrl: imageUrl,
                      finalUrl: finalUrl,
                      categoryId: category._id,
                      categoryName: name
                    });
                    return finalUrl;
                  } else {
                    const finalUrl = `${app.baseURL}${imageUrl}`;
                    console.log('🎯 CATEGORY PAGE CATEGORY IMAGE:', {
                      originalUrl: imageUrl,
                      finalUrl: finalUrl,
                      categoryId: category._id,
                      categoryName: name
                    });
                    return finalUrl;
                  }
                }
                return DEFAULT_CATEGORY_IMAGE;
              })()}
                  alt={name}
              style={{
                    width: '90%',
                    height: '90%',
                objectFit: 'cover',
                    borderRadius: '14px',
                    transition: 'all 0.4s ease',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
              onError={(e) => {
                console.log('❌ Category image failed to load:', category.name, e.currentTarget.src);
                e.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
              }}
                  loading="lazy"
                />
              </div>
            </div>
            
            {/* Badge for subcategories */}
            {hasSubcategories && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                background: categoryGradient,
                borderRadius: '50%',
                border: '3px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                animation: isHovered ? 'pulse 2s infinite' : 'none',
              }}>
                {category.children?.length || 0}
              </div>
            )}
          </div>
          
          {/* Category Name with Modern Typography */}
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
                  color: '#1e293b',
            margin: '0 0 8px 0',
                  lineHeight: '1.3',
            transition: 'all 0.4s ease',
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          }}>
            {name}
          </h3>
          
          {/* Category Description */}
          {category.description && (
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              lineHeight: '1.5',
              margin: '0 0 12px 0',
              textAlign: 'center',
              maxHeight: isHovered ? '40px' : '32px',
              overflow: 'hidden',
              transition: 'all 0.4s ease',
              opacity: isHovered ? 1 : 0.8,
            }}>
              {category.description}
            </p>
          )}
          
          {/* Subcategory Info with Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#64748b',
            fontWeight: '500',
          }}>
            {hasSubcategories && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span>{category.children?.length || 0} {t('category.subcategoryCount')}</span>
              </>
            )}
          </div>

          {/* Animated Underline */}
          <div style={{
            width: isHovered ? '60px' : '30px',
            height: '3px',
            background: categoryGradient,
            borderRadius: '3px',
            margin: '12px auto 0',
            transition: 'all 0.4s ease',
            opacity: isHovered ? 1 : 0.6,
          }} />
        </div>
        
        {/* Modern Expand Button */}
        {hasSubcategories && (
          <div style={{
            borderTop: '1px solid rgba(0, 99, 177, 0.08)',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)',
            borderRadius: '0 0 20px 20px',
          }}>
            <button
                onClick={(e) => {
                  e.stopPropagation();
                toggleCategory(categoryId);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: '#0063b1',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 99, 177, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
              <span>{isExpanded ? t('category.hideSubcategories') : t('category.exploreSubcategories')}</span>
            </button>
            </div>
        )}
        
        {/* Enhanced Subcategories Dropdown */}
        {hasSubcategories && isExpanded && (
          <div 
            className="subcategory-dropdown-modern"
            style={{
              position: 'absolute',
              top: 'calc(100% - 1px)',
              left: '0',
              right: '0',
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
              border: '1px solid rgba(0, 99, 177, 0.15)',
              borderTop: `3px solid`,
              borderImage: `${categoryGradient} 1`,
              borderRadius: '0 0 20px 20px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5)',
              zIndex: 100,
              maxHeight: '350px',
              overflowY: 'auto',
              animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 0',
            }}>
              {category.children?.map((subcategory, subIndex) => renderCategoryCard(subcategory, subIndex))}
            </div>
            </div>
          )}
        </div>
      );
  };

  const renderCategoryGrid = (categories: Category[]): JSX.Element[] => {
    return categories.map((category, index) => renderCategoryCard(category, index));
  };



  if (categoriesLoading) {
    return <PageSkeleton />;
  }

  if (categoriesError || categories.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 99, 177, 0.1)',
        margin: '20px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>📂</div>
          <h3 style={{ color: '#0063b1', marginBottom: '10px', fontSize: '20px', fontWeight: '600' }}>
          {t('category.noCategoriesFoundTitle')}
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          {t('category.errorFetchingCategories')}
        </p>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes shimmer-text {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .filter-button.product:hover {
          background: linear-gradient(135deg, #005299 0%, #004080 50%, #003366 100%) !important;
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 10px 32px rgba(0, 99, 177, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15) inset, inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
        }

        .filter-button.service:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%) !important;
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 10px 32px rgba(16, 185, 129, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15) inset, inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
        }

        .filter-button:not(.product):not(.service):hover {
          background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
        }

        .filter-button.product.active {
          animation: pulse-blue 2s ease-in-out infinite, gradient-shift 3s ease infinite;
        }

        .filter-button.service.active {
          animation: pulse-green 2s ease-in-out infinite, gradient-shift 3s ease infinite;
        }

        @keyframes pulse-blue {
          0%, 100% {
            box-shadow: 0 6px 20px rgba(0, 99, 177, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 8px 28px rgba(0, 99, 177, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
        }

        @keyframes pulse-green {
          0%, 100% {
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 8px 28px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
        }
      `}</style>
    <div style={{ 
        padding: '80px 0', 
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      }}>
      
      {/* Header Section */}
      <div className="container-responsive" style={{ marginBottom: '40px' }}>
        {/* Search Bar - At Top */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 40px',
          position: 'relative',
        }}>
          <input
            type="text"
            placeholder={t('category.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0063b1';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 99, 177, 0.15)';
              setIsSearchFocused(true);
            }}
            style={{
              width: '100%',
              padding: '16px 20px',
              paddingRight: '50px',
              fontSize: '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              background: 'white',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
              // Delay hiding search results to allow clicks
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
          />
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>

          {/* Search Results Dropdown */}
          {isSearchFocused && searchTerm.trim() && (searchResults.categories.length > 0 || searchResults.auctions.length > 0 || searchResults.tenders.length > 0 || searchResults.directSales.length > 0) && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              marginTop: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 1000,
              border: '1px solid #e2e8f0',
            }}>
              {searchResults.categories.length > 0 && (
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('category.searchCategories')}
                  </div>
                  {searchResults.categories.slice(0, 5).map((category) => (
                    <div
                      key={category._id}
                      onClick={() => handleSearchSelect(category, 'category')}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{category.name}</div>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.auctions.length > 0 && (
                <div style={{ padding: '12px', borderTop: searchResults.categories.length > 0 ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('category.searchAuctions')}
                  </div>
                  {searchResults.auctions.slice(0, 5).map((auction: any) => (
                    <div
                      key={auction.id}
                      onClick={() => handleSearchSelect(auction, 'auction')}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{auction.title}</div>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.tenders.length > 0 && (
                <div style={{ padding: '12px', borderTop: (searchResults.categories.length > 0 || searchResults.auctions.length > 0) ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('category.searchTenders')}
                  </div>
                  {searchResults.tenders.slice(0, 5).map((tender) => (
                    <div
                      key={tender._id}
                      onClick={() => handleSearchSelect(tender, 'tender')}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{tender.title}</div>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.directSales.length > 0 && (
                <div style={{ padding: '12px', borderTop: (searchResults.categories.length > 0 || searchResults.auctions.length > 0 || searchResults.tenders.length > 0) ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t('category.searchDirectSales') || 'Ventes Directes'}
                  </div>
                  {searchResults.directSales.slice(0, 5).map((sale) => (
                    <div
                      key={sale._id}
                      onClick={() => handleSearchSelect(sale, 'directSale')}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{sale.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {viewMode === 'categories' && (
          <>
            {/* Filter Buttons Section - styled like Home1Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'clamp(20px, 3vw, 32px)',
              gap: 'clamp(16px, 3vw, 24px)',
              flexWrap: 'nowrap',
              position: 'relative',
              padding: '0 clamp(20px, 4vw, 40px)',
            }}>
              <button
                className={`filter-button product ${filterType === 'PRODUCT' ? 'active' : ''}`}
                onClick={() => setFilterType(filterType === 'PRODUCT' ? 'ALL' : 'PRODUCT')}
                style={{
                  padding: '12px 28px',
                  borderRadius: '35px',
                  fontSize: 'clamp(0.85rem, 1.4vw, 1rem)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '3px solid transparent',
                  background: 'linear-gradient(135deg, #0063b1 0%, #005299 50%, #004080 100%)',
                  backgroundSize: '200% 200%',
                  color: 'white',
                  boxShadow: filterType === 'PRODUCT'
                    ? '0 6px 24px rgba(0, 99, 177, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    : '0 4px 16px rgba(0, 99, 177, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  minWidth: '110px',
                  opacity: filterType === 'PRODUCT' ? 1 : 0.8,
                }}
              >
                {t('common.product')}
              </button>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 30%, #64748b 50%, #475569 70%, #1e293b 100%)',
                backgroundSize: '300% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center',
                margin: 0,
                letterSpacing: '-0.5px',
                position: 'relative',
                padding: '0 clamp(24px, 5vw, 40px)',
                animation: 'shimmer-text 4s ease-in-out infinite',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                lineHeight: '1.2',
              }}>
                Categories
              </h2>
              <button
                className={`filter-button service ${filterType === 'SERVICE' ? 'active' : ''}`}
                onClick={() => setFilterType(filterType === 'SERVICE' ? 'ALL' : 'SERVICE')}
                style={{
                  padding: '12px 28px',
                  borderRadius: '35px',
                  fontSize: 'clamp(0.85rem, 1.4vw, 1rem)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '3px solid transparent',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                  backgroundSize: '200% 200%',
                  color: 'white',
                  boxShadow: filterType === 'SERVICE'
                    ? '0 6px 24px rgba(16, 185, 129, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    : '0 4px 16px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  minWidth: '110px',
                  opacity: filterType === 'SERVICE' ? 1 : 0.8,
                }}
              >
                {t('common.service')}
              </button>
            </div>
          </>
        )}

        {viewMode === 'auctions' && (
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #0063b1 0%, #00a3e0 50%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '16px',
              lineHeight: '1.2',
            }}>
              {selectedCategoryName}
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}>
              {t('category.discoverAuctions', { category: selectedCategoryName })}
            </p>
          </div>
        )}

        {/* Tabs for Item View */}
        {viewMode === 'auctions' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <button 
                   onClick={() => setActiveTab('auctions')}
                   style={{
                       padding: '10px 24px',
                       borderRadius: '20px',
                       border: 'none',
                       background: activeTab === 'auctions' ? '#0063b1' : '#e2e8f0',
                       color: activeTab === 'auctions' ? 'white' : '#64748b',
                       fontWeight: '600',
                       cursor: 'pointer',
                       transition: 'all 0.3s ease',
                       boxShadow: activeTab === 'auctions' ? '0 4px 12px rgba(0,99,177,0.3)' : 'none'
                   }}
                >
                   {t('common.auctions') || 'Enchères'} ({filteredAuctions.length})
                </button>
                <button 
                   onClick={() => setActiveTab('tenders')}
                   style={{
                       padding: '10px 24px',
                       borderRadius: '20px',
                       border: 'none',
                       background: activeTab === 'tenders' ? '#4f46e5' : '#e2e8f0',
                       color: activeTab === 'tenders' ? 'white' : '#64748b',
                       fontWeight: '600',
                       cursor: 'pointer',
                       transition: 'all 0.3s ease',
                       boxShadow: activeTab === 'tenders' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
                   }}
                >
                   {t('common.tenders') || 'Appels d\'offres'} ({filteredTenders.length})
                </button>
                <button 
                   onClick={() => setActiveTab('directSales')}
                   style={{
                       padding: '10px 24px',
                       borderRadius: '20px',
                       border: 'none',
                       background: activeTab === 'directSales' ? '#059669' : '#e2e8f0',
                       color: activeTab === 'directSales' ? 'white' : '#64748b',
                       fontWeight: '600',
                       cursor: 'pointer',
                       transition: 'all 0.3s ease',
                       boxShadow: activeTab === 'directSales' ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none'
                   }}
                >
                   {t('common.directSales') || 'Ventes Directes'} ({filteredDirectSales.length})
                </button>
            </div>
        )}

        {/* Back Button for Auctions View */}
        {viewMode === 'auctions' && (
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <button
              onClick={goBackToCategories}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                color: '#0063b1',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0, #cbd5e1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc, #e2e8f0)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              {t('category.backToCategories')}
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="container-responsive">
        {viewMode === 'categories' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '32px',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '20px',
            overflow: 'visible',
            position: 'relative',
            zIndex: 1,
          }}>
            {renderCategoryGrid(filteredCategories)}
          </div>
        ) : (
          <div>
            {itemsLoading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                maxWidth: '1400px',
                margin: '0 auto',
                width: '100%'
              }}>
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
                <>
                    {activeTab === 'auctions' && (
                        filteredAuctions.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '24px',
                                maxWidth: '1400px',
                                margin: '0 auto',
                            }}>
                                {filteredAuctions.map((auction: any) => (
                                    <div key={auction.id} style={{ height: '100%' }}>
                                        <AuctionCard auction={auction} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                             // Empty State for Auctions
                             <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.9)', borderRadius: '16px', border: '1px solid rgba(0,99,177,0.1)' }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>🔍</div>
                                <h3 style={{ color: '#0063b1', marginBottom: '10px', fontSize: '20px', fontWeight: '600' }}>{t('category.noAuctionsFound')}</h3>
                             </div>
                        )
                    )}

                    {activeTab === 'tenders' && (
                        filteredTenders.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '24px',
                                maxWidth: '1400px',
                                margin: '0 auto',
                            }}>
                                {filteredTenders.map((tender: any) => (
                                    <div key={tender._id} style={{ height: '100%' }}>
                                        <TenderCard tender={tender} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Empty State for Tenders
                             <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.9)', borderRadius: '16px', border: '1px solid rgba(0,99,177,0.1)' }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>📋</div>
                                <h3 style={{ color: '#4f46e5', marginBottom: '10px', fontSize: '20px', fontWeight: '600' }}>{t('category.noTendersFound') || "No tenders found"}</h3>
                             </div>
                        )
                    )}

                    {activeTab === 'directSales' && (
                        filteredDirectSales.length > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '24px',
                                maxWidth: '1400px',
                                margin: '0 auto',
                            }}>
                                {filteredDirectSales.map((sale: any) => (
                                    <div key={sale._id} style={{ height: '100%' }}>
                                        <DirectSaleCard sale={sale} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Empty State for Direct Sales
                             <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.9)', borderRadius: '16px', border: '1px solid rgba(0,99,177,0.1)' }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>🏷️</div>
                                <h3 style={{ color: '#059669', marginBottom: '10px', fontSize: '20px', fontWeight: '600' }}>{t('category.noDirectSalesFound') || "No direct sales found"}</h3>
                             </div>
                        )
                    )}
                </>
            )}
          </div>
        )}
      </div>

    </div>
    </>
  );
}






