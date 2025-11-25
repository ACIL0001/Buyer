"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DirectSaleAPI } from '@/app/api/direct-sale'
import { CategoryAPI } from '@/app/api/category'
import { SubCategoryAPI } from '@/app/api/subcategory'
import app from '@/config'
import { useTranslation } from 'react-i18next'
import useAuth from '@/hooks/useAuth'

// Define SALE_TYPE enum
const SALE_TYPE = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE'
};

// Default image constants
const DEFAULT_DIRECT_SALE_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";

interface DirectSale {
  _id: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  soldQuantity?: number;
  // Type might be missing on the item itself, so we make it optional
  type?: 'PRODUCT' | 'SERVICE';
  status: 'ACTIVE' | 'SOLD' | 'PAUSED' | 'ARCHIVED' | 'SOLD_OUT' | 'INACTIVE';
  thumbs?: Array<{ _id: string; url: string; filename?: string; fullUrl?: string }>;
  owner?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    entreprise?: string;
    companyName?: string;
    avatar?: { url: string; };
    photoURL?: string;
  };
  productCategory?: {
    _id: string;
    name: string;
  };
  productSubCategory?: {
    _id: string;
    name: string;
  };
  location?: string;
  wilaya?: string;
  place?: string;
  address?: string;
  isPro?: boolean;
  hidden?: boolean;
}

const MultipurposeDirectSaleSidebar = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLogged, auth } = useAuth();

  const [activeColumn, setActiveColumn] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [directSales, setDirectSales] = useState<DirectSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  
  // Selected Sale Type (Product or Service)
  const [selectedSaleType, setSelectedSaleType] = useState(""); 
  
  const [filteredDirectSales, setFilteredDirectSales] = useState<DirectSale[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finished'>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);

  const navigateWithTop = useCallback((url: string) => {
    router.push(url, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement?.scrollTo?.({ top: 0, behavior: "auto" });
    });
  }, [router]);

  // Pagination constants
  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(filteredDirectSales.length / ITEMS_PER_PAGE);
  const paginatedDirectSales = filteredDirectSales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Helper functions
  const getAllDescendantCategoryIds = (categoryId: string, categoriesTree: any[]): string[] => {
    const descendants: string[] = [];
    
    const findDescendants = (categories: any[]) => {
      categories.forEach(category => {
        if (category._id === categoryId || category.id === categoryId) {
          const collectAllChildren = (cat: any) => {
            if (cat.children && cat.children.length > 0) {
              cat.children.forEach((child: any) => {
                descendants.push(child._id || child.id);
                collectAllChildren(child);
              });
            }
          };
          collectAllChildren(category);
        } else if (category.children && category.children.length > 0) {
          findDescendants(category.children);
        }
      });
    };
    
    findDescendants(categoriesTree);
    return descendants;
  };

  // Build a map of Category ID -> Category Type (PRODUCT/SERVICE) for fast lookup
  // logic adaptation
  const categoryTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    const traverse = (cats: any[]) => {
        cats.forEach(cat => {
            const type = cat.type ? cat.type.toUpperCase() : "";
            if (cat._id) map[cat._id] = type;
            if (cat.id) map[cat.id] = type;
            
            if (cat.children && cat.children.length > 0) {
                traverse(cat.children);
            }
        });
    };
    if (categories.length > 0) {
        traverse(categories);
    }
    return map;
  }, [categories]);

  const doesDirectSaleBelongToCategory = (directSale: DirectSale, selectedCategoryId: string, categoriesTree: any[]): boolean => {
    if (!directSale.productCategory || !selectedCategoryId) return false;
    
    const directSaleCategoryId = typeof directSale.productCategory === 'object' 
        ? directSale.productCategory._id 
        : directSale.productCategory;
    
    if (directSaleCategoryId === selectedCategoryId) return true;
    
    const allDescendants = getAllDescendantCategoryIds(selectedCategoryId, categoriesTree);
    return allDescendants.includes(directSaleCategoryId);
  };

  const getCategoryImageUrl = (category: any) => {
    const imageUrl = category.thumb?.url || 
                     category.thumb?.fullUrl || 
                     category.image || 
                     category.thumbnail || 
                     '';
    
    if (!imageUrl) {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ECategory%3C/text%3E%3C/svg%3E";
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      if (imageUrl.includes('localhost:3000')) {
        return imageUrl.replace('http://localhost:3000', app.baseURL.replace(/\/$/, ''));
      }
      return imageUrl;
    }

    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const baseURL = app.baseURL.replace(/\/$/, '');
    
    if (cleanUrl.includes('static/') || cleanUrl.startsWith('static/')) {
      return `${baseURL}/${cleanUrl}`;
    }
    
    return `${baseURL}/static/${cleanUrl}`;
  };

  const renderCircularCategories = (categories: any[]) => {
    if (!categories || categories.length === 0) return null;

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '20px',
        padding: '20px 0',
      }}>
        {categories.map((category) => {
          const categoryId = category._id || category.id;
          const isSelected = selectedCategory === categoryId;
          
          // Dynamic accent color based on Sale Type
          const accentGradient = selectedSaleType === SALE_TYPE.SERVICE 
            ? 'linear-gradient(135deg, #10b981, #059669)' // Green for Service
            : 'linear-gradient(135deg, #d4af37, #f7ef8a)'; // Golden gradient for Product (Vente Directe)
            
          const accentColor = selectedSaleType === SALE_TYPE.SERVICE ? '#10b981' : '#d4af37';
          const accentShadow = selectedSaleType === SALE_TYPE.SERVICE 
            ? '0 8px 20px rgba(16, 185, 129, 0.3)' 
            : '0 8px 20px rgba(212, 175, 55, 0.3)';

          return (
            <div
              key={categoryId}
              onClick={() => handleCategoryChange(categoryId)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: isSelected 
                  ? accentGradient 
                  : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                boxShadow: isSelected 
                  ? accentShadow 
                  : '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: isSelected ? `3px solid ${accentColor}` : '2px solid #e2e8f0',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <img
                  src={getCategoryImageUrl(category)}
                  alt={category.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ECategory%3C/text%3E%3C/svg%3E";
                    if (target.src !== placeholder) {
                      target.onerror = null;
                      target.src = placeholder;
                    }
                  }}
                />
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: isSelected ? '700' : '500',
                color: isSelected ? accentColor : '#333',
                textAlign: 'center',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {category.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Parse URL parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      const subCategoryParam = urlParams.get('subcategory');
      const searchParam = urlParams.get('search');
      const typeParam = urlParams.get('type');

      if (categoryParam) setSelectedCategory(categoryParam);
      if (subCategoryParam) setSelectedSubCategory(subCategoryParam);
      if (searchParam) setSearchTerm(searchParam);
      if (typeParam) setSelectedSaleType(typeParam);
    }
  }, []);

  useEffect(() => {
    const fetchDirectSales = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await DirectSaleAPI.getDirectSales() as any;
        
        let directSalesData: DirectSale[] = [];
        
        if (data) {
          if (Array.isArray(data)) {
            directSalesData = data;
          } else if (data.data && Array.isArray(data.data)) {
            directSalesData = data.data;
          } else if (data.success && data.data && Array.isArray(data.data)) {
            directSalesData = data.data;
          } else {
            directSalesData = [];
          }
        } else {
          directSalesData = [];
        }
        
        // IMPORTANT: Display ALL direct sales including sold-out ones
        // Sold-out items will be shown but visually deactivated (grayed out, non-clickable)
        // DO NOT filter by status - include ALL items regardless of status or quantity
        // This ensures sold-out items (SOLD_OUT, SOLD, or exhausted quantity) remain visible
        // Only the API response determines what items are returned - we display everything
        setDirectSales(directSalesData);
        setFilteredDirectSales(directSalesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching direct sales:", err);
        setError("Failed to load direct sales");
        setDirectSales([]);
        setFilteredDirectSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectSales();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await CategoryAPI.getCategoryTree();
        
        let categoryData = null;
        let isSuccess = false;
        
        if (response) {
          if (response.success && Array.isArray(response.data)) {
            categoryData = response.data;
            isSuccess = true;
          } else if (Array.isArray(response)) {
            categoryData = response;
            isSuccess = true;
          } else if (response.data && Array.isArray(response.data)) {
            categoryData = response.data;
            isSuccess = true;
          }
        }
        
        if (isSuccess && categoryData && categoryData.length > 0) {
          setCategories(categoryData);
          setFilteredCategories(categoryData);
        }
        setCategoriesLoading(false);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Update filtered categories when searchTerm or SaleType changes
  useEffect(() => {
    if (categories && categories.length > 0) {
      let filtered = [...categories];
      
      // 1. Filter by SaleType (Produit/Service)
      if (selectedSaleType) {
        filtered = filtered.filter(category => {
          const categoryType = category.type?.toUpperCase();
          return categoryType === selectedSaleType;
        });
      }

      // 2. Filter by searchTerm
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(category => {
          const categoryName = category.name?.toLowerCase() || '';
          return categoryName.includes(searchLower);
        });
      }
      
      setFilteredCategories(filtered);
    }
  }, [categories, searchTerm, selectedSaleType]);

  // Fetch subcategories when a category is selected
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedCategory) {
        setSubCategories([]);
        return;
      }

      try {
        setSubCategoriesLoading(true);
        const data = await SubCategoryAPI.getSubCategories(selectedCategory);
        if (data && Array.isArray(data)) {
          setSubCategories(data);
        }
        setSubCategoriesLoading(false);
      } catch (err) {
        console.error("Error fetching subcategories:", err);
        setSubCategoriesLoading(false);
      }
    };

    fetchSubCategories();
  }, [selectedCategory]);

  // useEffect to handle filtering (Including Type Filter with Fallback)
  // IMPORTANT: This does NOT filter out sold-out items - they remain visible but deactivated
  // Sold-out items (SOLD_OUT, SOLD status, or exhausted quantity) are included in all filters
  useEffect(() => {
    if (directSales.length === 0) return;

    // Start with all direct sales - includes sold-out items
    let result = [...directSales];

    // 1. Apply SaleType filter if selected
    if (selectedSaleType) {
      result = result.filter((sale: DirectSale) => {
        // First check if the item itself has the type property
        if (sale.type && sale.type === selectedSaleType) {
          return true;
        }
        
        // If not, check its category's type using our map
        const catId = typeof sale.productCategory === 'object' 
            ? sale.productCategory?._id 
            : sale.productCategory;
            
        if (catId && categoryTypeMap[catId]) {
            return categoryTypeMap[catId] === selectedSaleType;
        }
        
        return false;
      });
    }

    // 2. Apply category filter if selected (with hierarchical support)
    if (selectedCategory) {
      result = result.filter((sale: DirectSale) =>
        doesDirectSaleBelongToCategory(sale, selectedCategory, categories)
      );
    }

    // 3. Apply subcategory filter if selected
    if (selectedSubCategory) {
      result = result.filter((sale: DirectSale) =>
        sale.productSubCategory && (sale.productSubCategory._id === selectedSubCategory)
      );
    }

    // 4. Apply search term filter
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter((sale: DirectSale) =>
        (sale.title && sale.title.toLowerCase().includes(searchLower)) ||
        (sale.description && sale.description.toLowerCase().includes(searchLower))
      );
    }

    // Sort by Price Ascending (Default sort kept consistent)
    result.sort((a, b) => a.price - b.price);
    
    setCurrentPage(1);
    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter((sale: DirectSale) => {
        return sale.status === 'ACTIVE' || sale.status === 'PAUSED';
      });
    } else if (statusFilter === 'finished') {
      result = result.filter((sale: DirectSale) => {
        return sale.status === 'SOLD_OUT' || sale.status === 'SOLD';
      });
    }

    setFilteredDirectSales(result);
    setCurrentPage(1); // Reset to first page on any filter change
  }, [directSales, selectedCategory, selectedSubCategory, searchTerm, selectedSaleType, categories, categoryTypeMap, statusFilter]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle SaleType change
  const handleSaleTypeChange = (type: string) => {
    const newType = type === selectedSaleType ? "" : type;
    setSelectedSaleType(newType);
    // Clear category/subcategory when switching major types
    setSelectedCategory("");
    setSelectedSubCategory("");
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    const newCategoryId = categoryId === selectedCategory ? "" : categoryId;
    setSelectedCategory(newCategoryId);
    setSelectedSubCategory("");
  };

  // Handle clear category filter
  const handleClearCategoryFilter = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('category');
      url.searchParams.delete('subcategory');
      window.history.replaceState({}, '', url);
    }
    
    setSelectedCategory("");
    setSelectedSubCategory("");
  };

  // Handle direct sale card click
  const handleDirectSaleCardClick = (directSaleId: string) => {
    navigateWithTop(`/direct-sale/${directSaleId}`);
  };

  const getSellerDisplayName = (directSale: DirectSale) => {
    if (directSale.hidden === true) {
      return t('common.anonymous') || 'Anonyme';
    }

    if (directSale.owner?.firstName && directSale.owner?.lastName) {
        return `${directSale.owner.firstName} ${directSale.owner.lastName}`;
    }
    if (directSale.owner?.username) {
        return directSale.owner.username;
    }
    if (directSale.owner?.firstName) {
        return directSale.owner.firstName;
    }

    return t('directSale.seller') || 'Vendeur';
  };

  return (
    <div className="direct-sale-grid-section pt-10 mb-110">
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .filter-card {
          animation: slideIn 0.8s ease-out 0.2s both;
        }
        .direct-sale-card {
          animation: slideIn 0.8s ease-out 0.4s both;
        }
      `}</style>
      <div className="container">
        {/* Enhanced Filter Section */}
        <div className="filter-card">
          <div className="row mb-40">
            <div className="col-12">
              <div className="enhanced-filter-wrapper" style={{
                borderRadius: '25px',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.08)',
                padding: '40px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                marginBottom: '40px',
                border: '1px solid rgba(0, 99, 177, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Subtle background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230063b1' fill-opacity='0.02'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
                  opacity: 0.5,
                }}></div>

                {/* Search Bar - At Top */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div style={{
                      maxWidth: '600px',
                      margin: '0 auto 30px',
                      position: 'relative',
                    }}>
                      <input
                        type="text"
                        placeholder={t('') || 'Rechercher une vente directe...'}
                        value={searchTerm}
                        onChange={handleSearchChange}
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
                  </div>
                </div>

                {/* Produit/Service Buttons with Categories Text */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'clamp(16px, 3vw, 24px)',
                            flexWrap: 'nowrap',
                            marginBottom: '30px',
                        }}>
                            {/* Product Button */}
                            <button
                                type="button"
                                className={`filter-button product ${selectedSaleType === SALE_TYPE.PRODUCT ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSaleTypeChange(SALE_TYPE.PRODUCT);
                                }}
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: '35px',
                                    fontSize: 'clamp(0.85rem, 1.4vw, 1rem)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    border: '3px solid transparent',
                                    background: 'linear-gradient(135deg, #0063b1 0%, #005299 50%, #004080 100%)',
                                    backgroundSize: '200% 200%',
                                    color: 'white',
                                    boxShadow: selectedSaleType === SALE_TYPE.PRODUCT
                                        ? '0 6px 24px rgba(0, 99, 177, 0.35)'
                                        : '0 4px 16px rgba(0, 99, 177, 0.25)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.6px',
                                    minWidth: '110px',
                                    position: 'relative',
                                    zIndex: 10,
                                    opacity: selectedSaleType === SALE_TYPE.PRODUCT ? 1 : 0.8,
                                }}
                            >
                                Produit
                            </button>
                            
                            {/* Categories Title */}
                            <h2 style={{
                                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                                fontWeight: '900',
                                background: 'linear-gradient(135deg, #1e293b 0%, #475569 30%, #64748b 50%, #475569 70%, #1e293b 100%)',
                                backgroundSize: '300% auto',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textAlign: 'center',
                                margin: 0,
                                letterSpacing: '-0.5px',
                                padding: '0 clamp(24px, 5vw, 40px)',
                            }}>
                                Catégories
                            </h2>
                            
                            {/* Service Button */}
                            <button
                                type="button"
                                className={`filter-button service ${selectedSaleType === SALE_TYPE.SERVICE ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSaleTypeChange(SALE_TYPE.SERVICE);
                                }}
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: '35px',
                                    fontSize: 'clamp(0.85rem, 1.4vw, 1rem)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    border: '3px solid transparent',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                                    backgroundSize: '200% 200%',
                                    color: 'white',
                                    boxShadow: selectedSaleType === SALE_TYPE.SERVICE
                                        ? '0 6px 24px rgba(16, 185, 129, 0.35)'
                                        : '0 4px 16px rgba(16, 185, 129, 0.25)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.6px',
                                    minWidth: '110px',
                                    position: 'relative',
                                    zIndex: 10,
                                    opacity: selectedSaleType === SALE_TYPE.SERVICE ? 1 : 0.8,
                                }}
                            >
                                Service
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories Filter - Circular Format */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="circular-categories-filter" style={{
                      background: 'rgba(248, 249, 250, 0.8)',
                      borderRadius: '15px',
                      padding: '25px',
                      border: '1px solid rgba(0, 99, 177, 0.1)',
                    }}>
                      {categoriesLoading ? (
                        <div style={{
                          padding: '40px 20px',
                          fontSize: '16px',
                          color: '#666',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px'
                        }}>
                          <div className="spinner" style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid rgba(0, 99, 177, 0.1)',
                            borderRadius: '50%',
                            borderTop: '2px solid #0063b1',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          {t('directSale.loadingCategories') || 'Chargement des catégories...'}
                        </div>
                      ) : filteredCategories && filteredCategories.length > 0 ? (
                        renderCircularCategories(filteredCategories)
                      ) : (
                        <div style={{
                          padding: '40px 20px',
                          fontSize: '16px',
                          color: '#666',
                          textAlign: 'center'
                        }}>
                          {t('directSale.noCategoryAvailable') || 'Aucune catégorie disponible'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clear Category Filter Button */}
                {selectedCategory && (
                  <div className="row mb-4">
                    <div className="col-12 d-flex justify-content-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleClearCategoryFilter();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 24px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid #ef4444',
                          borderRadius: '12px',
                          color: '#ef4444',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontSize: '14px',
                          position: 'relative',
                          zIndex: 10,
                          pointerEvents: 'auto',
                          userSelect: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ef4444';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        {t('directSale.clearCategoryFilter') || 'Effacer le filtre de catégorie'}
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter Buttons - After Categories, Before Cards */}
        <div className="row mb-4">
          <div className="col-12">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '30px',
              marginTop: '20px',
              position: 'relative',
              zIndex: 100,
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStatusFilter('all');
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '25px',
                  border: '2px solid',
                  borderColor: statusFilter === 'all' ? '#f7ef8a' : '#e2e8f0',
                  background: statusFilter === 'all' ? 'linear-gradient(135deg, #f7ef8a, #8a7e1f)' : 'white',
                  color: statusFilter === 'all' ? '#3d370e' : '#666',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: statusFilter === 'all' ? '0 4px 12px rgba(247, 239, 138, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  zIndex: 100,
                  pointerEvents: 'auto',
                }}
              >
                Toutes
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStatusFilter('active');
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '25px',
                  border: '2px solid',
                  borderColor: statusFilter === 'active' ? '#10b981' : '#e2e8f0',
                  background: statusFilter === 'active' ? 'linear-gradient(135deg, #10b981, #059669)' : 'white',
                  color: statusFilter === 'active' ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: statusFilter === 'active' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  zIndex: 100,
                  pointerEvents: 'auto',
                }}
              >
                En Cours
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStatusFilter('finished');
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '25px',
                  border: '2px solid',
                  borderColor: statusFilter === 'finished' ? '#ef4444' : '#e2e8f0',
                  background: statusFilter === 'finished' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'white',
                  color: statusFilter === 'finished' ? 'white' : '#666',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: statusFilter === 'finished' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  zIndex: 100,
                  pointerEvents: 'auto',
                }}
              >
                Terminées
              </button>
            </div>
          </div>
        </div>

        {/* Direct Sales Items Grid */}
        <div className="row">
          <div className="col-12">
            <div
              className={`list-grid-product-wrap column-${activeColumn === 2 ? "2" : activeColumn === 3 ? "3" : "3"}-wrapper`}
            >
              <div className="row g-4 mb-60">
                {loading ? (
                  <div className="col-12 text-center py-5">
                    <div className="spinner" style={{
                      width: '40px',
                      height: '40px',
                      margin: '0 auto',
                      border: '4px solid rgba(212, 175, 55, 0.1)', // Golden color for spinner
                      borderRadius: '50%',
                      borderTop: '4px solid #d4af37', // Golden color for spinner
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '15px', color: '#666' }}>{t('directSale.loadingDirectSales') || 'Chargement des ventes directes...'}</p>
                  </div>
                ) : error ? (
                  <div className="col-12 text-center py-5">
                    <p style={{ color: '#ff5555' }}>{error}</p>
                  </div>
                ) : paginatedDirectSales && paginatedDirectSales.length > 0 ? (
                  paginatedDirectSales.map((directSale, index) => {
                    // Calculate available quantity
                    const availableQuantity = directSale.quantity === 0 
                      ? 999 
                      : directSale.quantity - (directSale.soldQuantity || 0);
                    // Check if sold out: status is SOLD_OUT/SOLD, or quantity > 0 and availableQuantity <= 0
                    const isSoldOut = directSale.status === 'SOLD_OUT' || 
                      directSale.status === 'SOLD' ||
                      (directSale.quantity > 0 && availableQuantity <= 0);
                    const displayName = getSellerDisplayName(directSale);
                    
                    // Determine the type for display (use map as fallback)
                    const catId = typeof directSale.productCategory === 'object' 
                        ? directSale.productCategory?._id 
                        : directSale.productCategory;
                    const itemType = directSale.type || (catId ? categoryTypeMap[catId] : "");

                    return (
                      <div
                        key={directSale._id}
                        className={`col-lg-${activeColumn === 2 ? '6' : '4'} col-md-6 item`}
                      >
                        <div
                          className="modern-direct-sale-card direct-sale-card"
                          style={{
                            background: isSoldOut ? '#f0f0f0' : 'white',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            boxShadow: isSoldOut ? 'none' : '0 8px 25px rgba(0, 0, 0, 0.08)',
                            height: '100%',
                            maxWidth: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                            border: isSoldOut ? '1px solid #d0d0d0' : '1px solid rgba(0, 0, 0, 0.05)',
                            cursor: isSoldOut ? 'not-allowed' : 'pointer',
                            opacity: isSoldOut ? 0.6 : 1,
                            pointerEvents: isSoldOut ? 'none' : 'auto',
                            margin: '0 auto',
                          }}
                          onClick={() => !isSoldOut && handleDirectSaleCardClick(directSale._id)}
                          onMouseEnter={(e) => {
                            if (!isSoldOut) {
                              e.currentTarget.style.transform = 'translateY(-10px)';
                              e.currentTarget.style.boxShadow = '0 20px 40px rgba(212, 175, 55, 0.2)'; // Golden shadow
                              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)'; // Golden border
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSoldOut) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                            }
                          }}
                        >
                          {/* Direct Sale Image */}
                          <div
                            className="direct-sale-image"
                            style={{
                              height: '240px',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            <Link
                              href={isSoldOut ? "#" : `/direct-sale/${directSale._id}`}
                              scroll={false}
                              style={{ display: 'block', height: '100%', cursor: isSoldOut ? 'not-allowed' : 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSoldOut) {
                                  e.preventDefault();
                                  return;
                                }
                                e.preventDefault();
                                navigateWithTop(`/direct-sale/${directSale._id}`);
                              }}
                            >
                              <img
                                src={(() => {
                                    if (directSale.thumbs && directSale.thumbs.length > 0) {
                                        const imageUrl = directSale.thumbs[0].url;
                                        if (imageUrl.startsWith('http')) {
                                            return imageUrl;
                                        } else if (imageUrl.startsWith('/static/')) {
                                            return `${app.baseURL}${imageUrl.substring(1)}`;
                                        } else if (imageUrl.startsWith('/')) {
                                            return `${app.baseURL}${imageUrl.substring(1)}`;
                                        } else {
                                            return `${app.baseURL}${imageUrl}`;
                                        }
                                    }
                                    return DEFAULT_DIRECT_SALE_IMAGE;
                                })()}
                                alt={directSale.title || "Direct Sale Item"}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.5s ease',
                                  filter: isSoldOut ? 'grayscale(100%)' : 'none',
                                }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = DEFAULT_DIRECT_SALE_IMAGE;
                                }}
                                crossOrigin="use-credentials"
                              />
                            </Link>

                            {/* Badge */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '15px',
                                left: '15px',
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                color: '#333',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                zIndex: 2,
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                              }}
                            >
                              {itemType === 'PRODUCT' ? 'Produit' : itemType === 'SERVICE' ? 'Service' : 'Vente Directe'}
                            </div>

                            {/* Sold Out Overlay / Badge */}
                            {isSoldOut && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '15px',
                                  right: '15px',
                                  background: 'rgba(0, 0, 0, 0.7)',
                                  color: 'white',
                                  padding: '8px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                }}
                              >
                                Épuisé
                              </div>
                            )}
                          </div>

                          {/* Direct Sale Content */}
                          <div style={{
                            padding: '25px',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                          }}>
                            {/* Title */}
                            <h3 style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              color: isSoldOut ? '#666' : '#333',
                              marginBottom: '12px',
                              lineHeight: '1.3',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              <Link
                                href={isSoldOut ? "#" : `/direct-sale/${directSale._id}`}
                                scroll={false}
                                style={{ color: 'inherit', textDecoration: 'none', cursor: isSoldOut ? 'not-allowed' : 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSoldOut) {
                                    e.preventDefault();
                                    return;
                                  }
                                  e.preventDefault();
                                  navigateWithTop(`/direct-sale/${directSale._id}`);
                                }}
                              >
                                {directSale.title || t('directSale.noTitle') || 'Sans titre'}
                              </Link>
                            </h3>

                            {/* Location and Quantity Info */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: itemType === 'SERVICE' ? '1fr' : '1fr 1fr',
                              gap: '6px',
                              marginBottom: '8px',
                            }}>
                                {itemType !== 'SERVICE' && (
                                  <div style={{
                                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                    borderRadius: '8px',
                                    padding: '4px 8px',
                                    border: '1px solid #e9ecef',
                                    borderLeft: '3px solid #d4af37',
                                  }}>
                                      <p style={{
                                          fontSize: '10px',
                                          color: isSoldOut ? '#888' : '#666',
                                          margin: '0 0 2px 0',
                                          fontWeight: '600',
                                      }}>
                                          📦 Quantité
                                      </p>
                                      <p style={{
                                          fontSize: '12px',
                                          color: isSoldOut ? '#888' : '#333',
                                          margin: 0,
                                          fontWeight: '500',
                                      }}>
                                          {directSale.quantity || 'Non spécifiée'}
                                      </p>
                                  </div>
                                )}

                              <div style={{
                                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                border: '1px solid #e9ecef',
                                borderLeft: '3px solid #d4af37',
                              }}>
                                <p style={{
                                  fontSize: '10px',
                                  color: isSoldOut ? '#888' : '#666',
                                  margin: '0 0 2px 0',
                                  fontWeight: '600',
                                }}>
                                  📍 Localisation
                                </p>
                                <p style={{
                                  fontSize: '12px',
                                  color: isSoldOut ? '#888' : '#333',
                                  margin: 0,
                                  fontWeight: '500',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {(() => {
                                    const place = directSale.place || '';
                                    const address = directSale.address || '';
                                    const location = directSale.location || '';
                                    const wilaya = directSale.wilaya || '';
                                    const parts = [place, address, location, wilaya].filter(Boolean);
                                    const uniqueParts = [...new Set(parts)];
                                    return uniqueParts.length > 0 ? uniqueParts.join(', ') : 'Non spécifiée';
                                  })()}
                                </p>
                              </div>
                            </div>

                            {/* Price Info */}
                            <div style={{
                              background: isSoldOut ? '#f0f0f0' : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                              borderRadius: '8px',
                              padding: '4px 8px',
                              marginBottom: '8px',
                              border: isSoldOut ? '1px solid #e0e0e0' : '1px solid #e9ecef',
                              borderLeft: isSoldOut ? '3px solid #ccc' : '3px solid #d4af37',
                            }}>
                              <p style={{
                                fontSize: '10px',
                                color: isSoldOut ? '#888' : '#666',
                                margin: '0 0 2px 0',
                                fontWeight: '600',
                              }}>
                                💰 Prix fixe
                              </p>
                              <p style={{
                                fontSize: '12px',
                                color: isSoldOut ? '#888' : '#d4af37',
                                margin: 0,
                                fontWeight: '600',
                              }}>
                                {Number(directSale.price || 0).toLocaleString()} DA
                              </p>
                            </div>

                            {/* Owner Info */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              marginBottom: '16px',
                            }}>
                                <img
                                src={(() => {
                                    if (directSale.owner?.avatar?.url) {
                                        const imageUrl = directSale.owner.avatar.url;
                                        if (imageUrl.startsWith('http')) {
                                            return imageUrl;
                                        } else if (imageUrl.startsWith('/static/')) {
                                            return `${app.baseURL}${imageUrl.substring(1)}`;
                                        } else if (imageUrl.startsWith('/')) {
                                            return `${app.baseURL}${imageUrl.substring(1)}`;
                                        } else {
                                            return `${app.baseURL}${imageUrl}`;
                                        }
                                    }
                                    if (directSale.owner?.photoURL) {
                                        return directSale.owner.photoURL;
                                    }
                                    return DEFAULT_PROFILE_IMAGE;
                                })()}
                                alt={displayName}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  filter: isSoldOut ? 'grayscale(100%)' : 'none',
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = DEFAULT_PROFILE_IMAGE;
                                }}
                              />
                              {directSale.owner && !directSale.hidden ? (
                                <Link
                                  href={`/users/${directSale.owner._id || directSale.owner}`}
                                  scroll={false}
                                  style={{
                                    fontSize: '14px',
                                    color: isSoldOut ? '#888' : '#0063b1',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.3s ease',
                                    cursor: isSoldOut ? 'not-allowed' : 'pointer',
                                    pointerEvents: isSoldOut ? 'none' : 'auto',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSoldOut) {
                                      e.currentTarget.style.textDecoration = 'underline';
                                      e.currentTarget.style.color = '#004c8c';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSoldOut) {
                                      e.currentTarget.style.textDecoration = 'none';
                                      e.currentTarget.style.color = '#0063b1';
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSoldOut || !directSale.owner?._id) {
                                      e.preventDefault();
                                      return;
                                    }
                                    e.preventDefault();
                                    navigateWithTop(`/users/${directSale.owner._id}`);
                                  }}
                                >
                                  {directSale.owner.entreprise || 
                                   directSale.owner.companyName ||
                                   (directSale.owner.firstName && directSale.owner.lastName 
                                     ? `${directSale.owner.firstName} ${directSale.owner.lastName}` 
                                     : directSale.owner.username || displayName)}
                                  {!isSoldOut && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                                      <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                                    </svg>
                                  )}
                                </Link>
                              ) : (
                                <span style={{
                                  fontSize: '14px',
                                  color: isSoldOut ? '#888' : '#666',
                                  fontWeight: '500',
                                }}>
                                  {displayName}
                                </span>
                              )}
                            </div>

                            {/* View Details Button */}
                            <Link
                              href={isSoldOut ? "#" : `/direct-sale/${directSale._id}`}
                              scroll={false}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '12px 20px',
                                background: isSoldOut ? '#cccccc' : 'linear-gradient(135deg, #d4af37, #f7ef8a)', // Golden gradient
                                color: isSoldOut ? '#888' : '#8B7500', // Dark gold text
                                textDecoration: 'none',
                                borderRadius: '25px',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.3s ease',
                                boxShadow: isSoldOut ? 'none' : '0 4px 12px rgba(212, 175, 55, 0.3)', // Golden shadow
                              }}
                              onMouseEnter={(e) => {
                                if (!isSoldOut) {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #f7ef8a, #d4af37)';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(212, 175, 55, 0.4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSoldOut) {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #d4af37, #f7ef8a)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
                                }
                              }}
                              onClick={(event) => {
                                if (isSoldOut) {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  return;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                navigateWithTop(`/direct-sale/${directSale._id}`);
                              }}
                            >
                              {isSoldOut ? 'Épuisé' : 'Voir les détails'}
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12Z"/>
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-12 text-center py-5">
                    <div style={{
                      padding: '60px 20px',
                      background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                      borderRadius: '20px',
                      border: '2px dashed rgba(212, 175, 55, 0.2)', // Golden dashed border
                    }}>
                      <div style={{
                        fontSize: '48px',
                        marginBottom: '20px',
                        opacity: 0.5,
                      }}>
                        🛒
                      </div>
                      <h3 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#666',
                        marginBottom: '10px',
                      }}>
                        {t('No Direct Sales Found') || 'Aucune vente directe trouvée'}
                      </h3>
                      <p style={{
                        fontSize: '16px',
                        color: '#999',
                        margin: 0,
                      }}>
                        {t('Modify Filters Or Search') || 'Modifiez vos filtres ou votre recherche'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="row">
            <div className="col-lg-12 d-flex justify-content-center">
              <div className="inner-pagination-area" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                <ul className="paginations" style={{
                  display: 'flex',
                  gap: '12px',
                  padding: 0,
                  margin: 0,
                  listStyle: 'none'
                }}>
                  {/* Previous Button */}
                  <li className="page-item paginations-button">
                    <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} style={{
                      display: currentPage === 1 ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      background: '#f5f5f5',
                      color: '#333',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}>
                      <svg width={16} height={13} viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
                    </a>
                  </li>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                      <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: currentPage === page ? 'linear-gradient(135deg, #d4af37, #f7ef8a)' : '#f5f5f5', // Golden gradient for active
                        color: currentPage === page ? '#8B7500' : '#333', // Dark gold text for active
                        fontWeight: currentPage === page ? '700' : '600',
                        textDecoration: 'none',
                        boxShadow: currentPage === page ? '0 4px 15px rgba(212, 175, 55, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                      }}>{page.toString().padStart(2, '0')}</a>
                    </li>
                  ))}

                  {/* Next Button */}
                  <li className="page-item paginations-button">
                    <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} style={{
                      display: currentPage === totalPages ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      background: '#f5f5f5',
                      color: '#333',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}>
                      <svg width={16} height={13} viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"></path></svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultipurposeDirectSaleSidebar

