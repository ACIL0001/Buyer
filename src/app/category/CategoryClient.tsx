"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CategoryAPI } from '../api/category';
import { AuctionsAPI } from '../api/auctions';
import { useRouter, useSearchParams } from 'next/navigation';
import app from '../../config';

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

interface Auction {
  _id: string;
  title: string;
  description?: string;
  currentPrice?: number;
  startingPrice?: number;
  endingAt?: string;
  thumbs?: Array<{ url: string }>;
  owner?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: { url: string };
  };
  productCategory?: {
    _id: string;
    name: string;
  };
}

export default function CategoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [auctionsLoading, setAuctionsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [viewMode, setViewMode] = useState<'categories' | 'auctions'>('categories');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'product' | 'service'>('all');
  const DEFAULT_CATEGORY_IMAGE = "/assets/images/logo-white.png";
  const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";

  const navigateWithTop = useCallback((url: string) => {
    router.push(url, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement?.scrollTo?.({ top: 0, behavior: "auto" });
    });
  }, [router]);

  const normalizeCategoryType = (value?: string | null): 'PRODUCT' | 'SERVICE' | string | undefined => {
    if (!value) return undefined;
    const normalized = value.toString().trim().toUpperCase();
    if (['PRODUIT', 'PRODUCT', 'PRODUCTS'].includes(normalized)) {
      return 'PRODUCT';
    }
    if (['SERVICE', 'SERVICES'].includes(normalized)) {
      return 'SERVICE';
    }
    return normalized || undefined;
  };

  const getCategoryImageUrl = (category: Category): string => {
    const imageUrl =
      (category.thumb && (category.thumb as any).fullUrl) ||
      category.thumb?.url ||
      (category as any)?.image ||
      (category as any)?.thumbnail ||
      (category as any)?.photo ||
      '';

    if (!imageUrl) {
      return DEFAULT_CATEGORY_IMAGE;
    }

    const baseURL = (app.baseURL || '').replace(/\/$/, '');

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      if (imageUrl.includes('localhost:3000') && baseURL) {
        return imageUrl.replace('http://localhost:3000', baseURL);
      }
      return imageUrl;
    }

    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;

    if (!baseURL) {
      return `/${cleanUrl}`;
    }

    if (cleanUrl.includes('static/')) {
      return `${baseURL}/${cleanUrl}`;
    }

    return `${baseURL}/static/${cleanUrl}`;
  };

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching categories from API...');
        const response = await CategoryAPI.getCategoryTree();
        console.log('📡 API Response:', response);
        
        let categoryData: Category[] | null = null;
        let isSuccess = false;
        
        if (response) {
          if ((response as any).success && Array.isArray((response as any).data)) {
            categoryData = (response as any).data;
            isSuccess = true;
            console.log('✅ Success: Found categories in response.data:', categoryData?.length || 0);
          } else if (Array.isArray(response as any)) {
            categoryData = response as any;
            isSuccess = true;
            console.log('✅ Success: Direct array response:', categoryData?.length || 0);
          } else if ((response as any).data && Array.isArray((response as any).data)) {
            categoryData = (response as any).data;
            isSuccess = true;
            console.log('✅ Success: Found categories in response.data (alternative):', categoryData?.length || 0);
          } else {
            console.log('❌ No valid category data found in response structure');
            console.log('Response structure:', {
              hasSuccess: 'success' in (response as any),
              hasData: 'data' in (response as any),
              isArray: Array.isArray(response),
              responseType: typeof response,
              responseKeys: response && typeof response === 'object' ? Object.keys(response) : []
            });
          }
        } else {
          console.log('❌ No response received from API');
        }
        
        if (isSuccess && categoryData && (categoryData?.length || 0) > 0) {
          console.log('🎉 Setting categories:', categoryData);
          // Debug image URLs
          categoryData.forEach((cat, index) => {
            if (cat.thumb && cat.thumb.url) {
              console.log(`📸 Category ${index} (${cat.name}) image URL:`, cat.thumb.url);
            } else {
              console.log(`❌ Category ${index} (${cat.name}) has no image`);
            }
          });
          setCategories(categoryData as Category[]);
          setError(false);
        } else {
          console.log('❌ No categories to display, throwing error');
          throw new Error('Invalid response structure or no categories found');
        }
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
        setCategories([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchAuctions = async () => {
      if (!selectedCategory) {
        setAuctions([]);
        setFilteredAuctions([]);
        return;
      }
      try {
        setAuctionsLoading(true);
        const response = await AuctionsAPI.getAuctions();
        if (response && Array.isArray(response)) {
          const selectedCategoryObj = findCategoryById(categories, selectedCategory);
          if (selectedCategoryObj) {
            const allCategoryIds = getAllSubcategoryIds(selectedCategoryObj);
            const categoryAuctions = response.filter(auction => {
              if (auction.productCategory && auction.productCategory._id) {
                return allCategoryIds.includes(auction.productCategory._id);
              }
              return false;
            });
            setAuctions(categoryAuctions);
            setFilteredAuctions(categoryAuctions);
          } else {
            const categoryAuctions = response.filter(auction => 
              auction.productCategory && auction.productCategory._id === selectedCategory
            );
            setAuctions(categoryAuctions);
            setFilteredAuctions(categoryAuctions);
          }
        } else {
          setAuctions([]);
          setFilteredAuctions([]);
        }
      } catch (error) {
        console.error("Error fetching auctions:", error);
        setAuctions([]);
        setFilteredAuctions([]);
      } finally {
        setAuctionsLoading(false);
      }
    };
    if (categories.length > 0 && selectedCategory) {
      fetchAuctions();
    }
  }, [selectedCategory, categories]);

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
    setAuctions([]);
    setFilteredAuctions([]);
  };

  const filteredCategories = categories.filter((category: Category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) {
      return false;
    }

    const normalizedType = normalizeCategoryType(category.type);

    if (categoryFilter === 'product') {
      return normalizedType === 'PRODUCT';
    }

    if (categoryFilter === 'service') {
      return normalizedType === 'SERVICE';
    }

    return true;
  });

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAuctions(auctions);
    } else {
      const filtered = auctions.filter(auction =>
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (auction.description && auction.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredAuctions(filtered);
    }
  }, [auctions, searchTerm]);

  const renderCategoryCard = (category: Category): JSX.Element => {
      const categoryId = category._id || '';
    const name = category.name;
    const isExpanded = expandedCategories[categoryId];
    const hasSubcategories = hasChildren(category);
    const categoryType = normalizeCategoryType(category.type) || '';
    const isProduct = categoryType === 'PRODUCT';
    const isService = categoryType === 'SERVICE';

    const handleSelect = () => {
      selectCategory(category);
    };

      return (
      <div key={categoryId} className="category-card-wrapper modern">
        <div
          className={`category-card ${isProduct ? 'product' : isService ? 'service' : ''}`}
          onClick={handleSelect}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleSelect();
            }
          }}
        >
          <img
            src={getCategoryImageUrl(category)}
                  alt={name}
            className="category-image"
            loading="lazy"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
              }}
                />
          <div className="category-overlay" />
              </div>
        <div
          className={`category-ribbon ${isProduct ? 'product' : isService ? 'service' : ''}`}
          aria-hidden="true"
        />
        <div className="category-name">{name}</div>

            {hasSubcategories && (
          <div className="category-subsection">
            <button
              type="button"
              className="category-subtoggle"
              onClick={(event) => {
                event.stopPropagation();
                toggleCategory(categoryId);
              }}
            >
              <span>{isExpanded ? 'Hide subcategories' : 'View subcategories'}</span>
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
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {isExpanded && (
              <ul className="subcategory-list" role="list">
                {category.children?.map((subcategory) => {
                  const subId = subcategory._id || subcategory.name;
                  return (
                    <li key={subId}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          selectCategory(subcategory);
                        }}
                      >
                        {subcategory.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            </div>
          )}
        </div>
      );
  };

  const renderCategoryGrid = (categories: Category[]): JSX.Element[] => {
    return categories.map((category) => renderCategoryCard(category));
  };

  const renderAuctionCard = (auction: Auction) => {
    return (
      <div
        key={auction._id}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        }}
        onClick={() => navigateWithTop(`/auction-details/${auction._id}`)}
      >
        <div style={{
          height: '200px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <img
            src={(() => {
              if (auction.thumbs && auction.thumbs.length > 0 && auction.thumbs[0].url) {
                const url = auction.thumbs[0].url;
                // If the URL already starts with http, use it as is
                if (url.startsWith('http')) {
                  return url;
                } else if (url.startsWith('/static/')) {
                  const finalUrl = `${app.baseURL}${url.substring(1)}`;
                  console.log('🎯 CATEGORY PAGE AUCTION IMAGE:', {
                    originalUrl: url,
                    finalUrl: finalUrl,
                    auctionId: auction._id,
                    auctionTitle: auction.title
                  });
                  return finalUrl;
                } else if (url.startsWith('/')) {
                  const finalUrl = `${app.baseURL}${url.substring(1)}`;
                  console.log('🎯 CATEGORY PAGE AUCTION IMAGE:', {
                    originalUrl: url,
                    finalUrl: finalUrl,
                    auctionId: auction._id,
                    auctionTitle: auction.title
                  });
                  return finalUrl;
                } else {
                  const finalUrl = `${app.baseURL}${url}`;
                  console.log('🎯 CATEGORY PAGE AUCTION IMAGE:', {
                    originalUrl: url,
                    finalUrl: finalUrl,
                    auctionId: auction._id,
                    auctionTitle: auction.title
                  });
                  return finalUrl;
                }
              }
              return DEFAULT_AUCTION_IMAGE;
            })()}
            alt={auction.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            crossOrigin="use-credentials"
            onError={(e) => {
              console.log('❌ Auction image failed to load:', auction.title, e.currentTarget.src);
              e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
            }}
          />
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#fff',
              animation: 'pulse 2s ease-in-out infinite',
            }}></div>
            Live
          </div>
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}>
            {auction.productCategory?.name}
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px',
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {auction.title}
          </h3>
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #e2e8f0',
          }}>
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              margin: '0 0 4px 0',
              fontWeight: '500',
            }}>
              Current Bid
            </p>
            <p style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: 0,
              background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} DA
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}>
              <img
                src={(() => {
                  if (auction.owner?.avatar?.url) {
                    const url = auction.owner.avatar.url;
                    // If the URL already starts with http, use it as is
                    if (url.startsWith('http')) {
                      return url;
                    } else if (url.startsWith('/static/')) {
                      const finalUrl = `${app.baseURL}${url.substring(1)}`;
                      console.log('🎯 CATEGORY PAGE USER AVATAR:', {
                        originalUrl: url,
                        finalUrl: finalUrl,
                        auctionId: auction._id,
                        ownerName: auction.owner?.firstName || auction.owner?.name
                      });
                      return finalUrl;
                    } else if (url.startsWith('/')) {
                      const finalUrl = `${app.baseURL}${url.substring(1)}`;
                      console.log('🎯 CATEGORY PAGE USER AVATAR:', {
                        originalUrl: url,
                        finalUrl: finalUrl,
                        auctionId: auction._id,
                        ownerName: auction.owner?.firstName || auction.owner?.name
                      });
                      return finalUrl;
                    } else {
                      const finalUrl = `${app.baseURL}${url}`;
                      console.log('🎯 CATEGORY PAGE USER AVATAR:', {
                        originalUrl: url,
                        finalUrl: finalUrl,
                        auctionId: auction._id,
                        ownerName: auction.owner?.firstName || auction.owner?.name
                      });
                      return finalUrl;
                    }
                  }
                  return '/assets/images/avatar.jpg';
                })()}
                alt="Owner"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                crossOrigin="use-credentials"
                onError={(e) => {
                  console.log('❌ Owner avatar failed to load:', e.currentTarget.src);
                  e.currentTarget.src = '/assets/images/avatar.jpg';
                }}
              />
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
                fontWeight: '500',
              }}>
                {auction.owner?.firstName && auction.owner?.lastName
                  ? `${auction.owner.firstName} ${auction.owner.lastName}`
                  : auction.owner?.name || 'Anonymous'}
              </p>
            </div>
          </div>
          <button
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #1d4ed8, #3b82f6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Place Bid
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        padding: '40px',
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid rgba(0, 99, 177, 0.2)', 
          borderTop: '3px solid #0063b1', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
      </div>
    );
  }

  if (error || categories.length === 0) {
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
          No Categories Found
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Categories will be available soon. Please try again later.
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
        
        .category-filter-toggle {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: clamp(12px, 3vw, 20px);
          margin-bottom: clamp(20px, 4vw, 36px);
          flex-wrap: wrap;
        }

        .category-filter-toggle .filter-button {
          padding: clamp(10px, 2.8vw, 14px) clamp(22px, 6vw, 32px);
          border-radius: 35px;
          font-size: clamp(0.85rem, 1.4vw, 1rem);
          font-weight: 700;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.35s ease;
          background: linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%);
          color: #475569;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .category-filter-toggle .filter-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transition: left 0.5s ease;
        }

        .category-filter-toggle .filter-button:hover::before {
          left: 100%;
        }

        .category-filter-toggle .filter-button.product {
          background: linear-gradient(135deg, #0063b1 0%, #005299 50%, #004080 100%);
          color: white;
          border-color: #0056a1;
          box-shadow: 0 8px 24px rgba(0, 99, 177, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          background-size: 200% 200%;
        }

        .category-filter-toggle .filter-button.service {
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          color: white;
          border-color: #089e6b;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          background-size: 200% 200%;
        }

        .category-filter-toggle .filter-button.active {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
        }

        .category-filter-toggle .filter-button:not(.active):hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.12);
        }

        .category-card-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(10px, 2vw, 16px);
          padding: clamp(18px, 3vw, 26px);
          border-radius: clamp(18px, 4vw, 26px);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .category-card-wrapper:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);
        }

        .category-card {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: clamp(16px, 3vw, 24px);
          overflow: hidden;
          background: #f3f4f6;
          cursor: pointer;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
        }

        .category-card:hover {
          transform: scale(1.03);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
        }

        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .category-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.1) 55%, rgba(15, 23, 42, 0.15) 100%);
          pointer-events: none;
        }

        .category-name {
          background: rgba(255, 255, 255, 0.95);
          padding: clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 18px);
          border-radius: clamp(12px, 3vw, 18px);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
          font-weight: 700;
          color: #1f2937;
          text-align: center;
          letter-spacing: 0.2px;
          max-width: 90%;
        }

        .category-ribbon {
          position: absolute;
          top: 50%;
          right: clamp(-18px, -3vw, -12px);
          transform: translateY(-50%);
          width: clamp(6px, 1.2vw, 10px);
          height: clamp(56px, 14vw, 92px);
          border-radius: 9999px;
          background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
          opacity: 0.95;
          pointer-events: none;
        }

        .category-ribbon.product {
          background: linear-gradient(180deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%);
        }

        .category-ribbon.service {
          background: linear-gradient(180deg, #047857 0%, #10b981 45%, #34d399 100%);
        }

        .category-subsection {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .category-subtoggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px 16px;
          border-radius: 16px;
          border: 1px solid rgba(0, 99, 177, 0.18);
          background: rgba(248, 250, 252, 0.85);
          color: #0063b1;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .category-subtoggle:hover {
          background: rgba(0, 99, 177, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
        }

        .subcategory-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .subcategory-list li button {
          width: 100%;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: white;
          border-radius: 12px;
          padding: 10px 14px;
          text-align: left;
          font-size: 13px;
          color: #334155;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .subcategory-list li button:hover {
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
          border-color: rgba(59, 130, 246, 0.24);
          transform: translateX(4px);
        }

        @media (max-width: 767px) {
          .category-card-wrapper {
            padding: clamp(14px, 4vw, 20px);
          }

          .category-ribbon {
            right: clamp(-12px, -4vw, -8px);
            height: clamp(44px, 24vw, 64px);
            width: clamp(4px, 1.8vw, 6px);
          }

          .category-filter-toggle {
            gap: clamp(10px, 4vw, 14px);
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
            {viewMode === 'categories' ? 'Browse Categories' : selectedCategoryName}
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            {viewMode === 'categories' 
              ? 'Explore our wide range of auction categories and find exactly what you\'re looking for'
              : `Discover amazing auctions in the ${selectedCategoryName} category`
            }
          </p>
        </div>

        {/* Search Bar */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 40px',
          position: 'relative',
        }}>
          <input
            type="text"
            placeholder={viewMode === 'categories' ? 'Search categories...' : 'Search auctions...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0063b1';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 99, 177, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
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
        </div>

        {viewMode === 'categories' && (
          <div className="category-filter-toggle">
            <button
              type="button"
              className={`filter-button product ${categoryFilter === 'product' ? 'active' : ''}`}
              onClick={() => setCategoryFilter(categoryFilter === 'product' ? 'all' : 'product')}
              aria-pressed={categoryFilter === 'product'}
            >
              Produit
            </button>
            <button
              type="button"
              className={`filter-button service ${categoryFilter === 'service' ? 'active' : ''}`}
              onClick={() => setCategoryFilter(categoryFilter === 'service' ? 'all' : 'service')}
              aria-pressed={categoryFilter === 'service'}
            >
              Service
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
              Back to Categories
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="container-responsive">
        {viewMode === 'categories' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
            {auctionsLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '200px',
              }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  border: '3px solid rgba(0, 99, 177, 0.2)', 
                  borderTop: '3px solid #0063b1', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }} />
              </div>
            ) : filteredAuctions.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                maxWidth: '1400px',
                margin: '0 auto',
              }}>
                {filteredAuctions.map(renderAuctionCard)}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 99, 177, 0.1)',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.6 }}>🔍</div>
                <h3 style={{ color: '#0063b1', marginBottom: '10px', fontSize: '20px', fontWeight: '600' }}>
                  No Auctions Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px' }}>
                  {searchTerm ? 'No auctions match your search criteria.' : 'No auctions available in this category yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
    </>
  );
}






