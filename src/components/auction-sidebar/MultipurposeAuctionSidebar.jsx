"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import SelectComponent from '../common/SelectComponent'
import { AuctionsAPI } from '@/app/api/auctions'
import { CategoryAPI } from '@/app/api/category'
import { SubCategoryAPI } from '@/app/api/subcategory'
import app from '@/config'; // Import the app config
import { useTranslation } from 'react-i18next';

// Define BID_TYPE enum to match server definition
const BID_TYPE = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE'
};

// Default image constants
const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";
// Use server baseURL for default category image with multiple fallback options
const getDefaultCategoryImage = () => {
    const baseURL = app.baseURL.replace(/\/$/, '');
    // Try common default category image paths on the server
    // If server image doesn't exist, use a data URI placeholder
    return `${baseURL}/static/default-category.png`;
};

const MultipurposeAuctionSidebar = () => {
    const { t } = useTranslation();
    const router = useRouter();

    const [activeColumn, setActiveColumn] = useState(3);
    const [currentPage, setCurrentPage] = useState(1);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedBidType, setSelectedBidType] = useState(""); // "" for all, "PRODUCT", or "SERVICE"
    const [auctionTimers, setAuctionTimers] = useState({});
    const [filteredAuctions, setFilteredAuctions] = useState([]);
    const [sortOption, setSortOption] = useState(t('auctionSidebar.defaultSort'));
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);

    const navigateWithTop = useCallback((url) => {
        router.push(url, { scroll: false });
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: "auto" });
            document.documentElement?.scrollTo?.({ top: 0, behavior: "auto" });
        });
    }, [router]);
    const [subCategories, setSubCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [hoveredSubCategory, setHoveredSubCategory] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    
    // Pagination constants
    const ITEMS_PER_PAGE = 9;
    const totalPages = Math.ceil(filteredAuctions.length / ITEMS_PER_PAGE);
    const paginatedAuctions = filteredAuctions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Helper function to find all descendant category IDs
    const getAllDescendantCategoryIds = (categoryId, categoriesTree) => {
        const descendants = [];
        
        const findDescendants = (categories) => {
            categories.forEach(category => {
                if (category._id === categoryId || category.id === categoryId) {
                    // Found the target category, collect all its descendants
                    const collectAllChildren = (cat) => {
                        if (cat.children && cat.children.length > 0) {
                            cat.children.forEach(child => {
                                descendants.push(child._id || child.id);
                                collectAllChildren(child);
                            });
                        }
                    };
                    collectAllChildren(category);
                } else if (category.children && category.children.length > 0) {
                    // Continue searching in children
                    findDescendants(category.children);
                }
            });
        };
        
        findDescendants(categoriesTree);
        return descendants;
    };

    // Helper function to check if an auction belongs to a category or its descendants
    const doesAuctionBelongToCategory = (auction, selectedCategoryId, categoriesTree) => {
        if (!auction.productCategory || !selectedCategoryId) return false;
        
        const auctionCategoryId = auction.productCategory._id || auction.productCategory;
        
        // Direct match
        if (auctionCategoryId === selectedCategoryId) return true;
        
        // Check if auction category is a descendant of selected category
        const allDescendants = getAllDescendantCategoryIds(selectedCategoryId, categoriesTree);
        return allDescendants.includes(auctionCategoryId);
    };

    // Helper function to check if category has children
    const hasChildren = (category) => {
        return category.children && category.children.length > 0;
    };

    // Toggle category expansion
    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    // Get category image URL
    const getCategoryImageUrl = (category) => {
        const imageUrl = category.thumb?.url || 
                         category.thumb?.fullUrl || 
                         category.image || 
                         category.thumbnail || 
                         category.photo || 
                         '';
        
        if (!imageUrl) {
            // Return data URI placeholder directly if no image URL
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

    // Render categories in circular format
    const renderCircularCategories = (categories) => {
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
                            {/* Circular Icon */}
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: isSelected 
                                    ? 'linear-gradient(135deg, #0063b1, #00a3e0)' 
                                    : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '12px',
                                boxShadow: isSelected 
                                    ? '0 8px 20px rgba(0, 99, 177, 0.3)' 
                                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                                border: isSelected ? '3px solid #0063b1' : '2px solid #e2e8f0',
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
                                        // Immediately use data URI placeholder to avoid multiple failed requests
                                        const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ECategory%3C/text%3E%3C/svg%3E";
                                        if (target.src !== placeholder) {
                                            target.onerror = null; // Prevent infinite loop
                                            target.src = placeholder;
                                        }
                                    }}
                                />
                            </div>
                            {/* Category Name */}
                            <span style={{
                                fontSize: '12px',
                                fontWeight: isSelected ? '700' : '500',
                                color: isSelected ? '#0063b1' : '#333',
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

    // Render hierarchical category tree (kept for backward compatibility if needed)
    const renderCategoryHierarchy = (categories, level = 0) => {
        return categories.map((category) => {
            const categoryId = category._id || category.id;
            const hasSubcategories = hasChildren(category);
            const isExpanded = expandedCategories[categoryId];
            const isSelected = selectedCategory === categoryId;

            return (
                <div key={categoryId} style={{ marginBottom: '8px' }}>
                    {/* Category Item */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            marginLeft: `${level * 20}px`,
                            background: level === 0 
                                ? 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)' 
                                : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '12px',
                            border: level === 0 ? '2px solid #e2e8f0' : '1px solid #f1f5f9',
                            transition: 'all 0.3s ease',
                            cursor: hasSubcategories ? 'pointer' : 'default',
                            position: 'relative',
                            ...(isSelected && {
                                borderColor: '#0063b1',
                                backgroundColor: 'rgba(0, 99, 177, 0.05)',
                                boxShadow: '0 4px 12px rgba(0, 99, 177, 0.15)',
                            }),
                        }}
                        onClick={() => {
                            // Row click only handles expansion for categories with subcategories
                            if (hasSubcategories) {
                                toggleCategory(categoryId);
                            }
                            // For leaf categories, user should click name/image for selection
                        }}
                        onMouseEnter={() => setHoveredCategory(categoryId)}
                        onMouseLeave={() => setHoveredCategory(null)}
                    >
                        {/* Level Indicator */}
                        {level > 0 && (
                            <div style={{
                                position: 'absolute',
                                left: '-10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '20px',
                                height: '1px',
                                background: '#cbd5e1',
                            }} />
                        )}
                        
                        {/* Expand/Collapse Icon */}
                        {hasSubcategories && (
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: isExpanded ? '#0063b1' : '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                transition: 'all 0.3s ease',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}>
                                <svg 
                                    width="12" 
                                    height="12" 
                                    viewBox="0 0 24 24" 
                                    fill={isExpanded ? 'white' : '#64748b'}
                                >
                                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                                </svg>
                            </div>
                        )}

                        {/* Category Image - Clickable for filter selection */}
                        <img
                            src={(() => {
                              if (category.thumb && category.thumb.url) {
                                const imageUrl = category.thumb.url;
                                if (imageUrl.startsWith('http')) {
                                  return imageUrl;
                                } else if (imageUrl.startsWith('/static/')) {
                                  const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                  console.log('🎯 AUCTION SIDEBAR CATEGORY IMAGE:', {
                                    originalUrl: imageUrl,
                                    finalUrl: finalUrl,
                                    categoryId: category._id,
                                    categoryName: category.name
                                  });
                                  return finalUrl;
                                } else if (imageUrl.startsWith('/')) {
                                  const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                  console.log('🎯 AUCTION SIDEBAR CATEGORY IMAGE:', {
                                    originalUrl: imageUrl,
                                    finalUrl: finalUrl,
                                    categoryId: category._id,
                                    categoryName: category.name
                                  });
                                  return finalUrl;
                                } else {
                                  const finalUrl = `${app.baseURL}${imageUrl}`;
                                  console.log('🎯 AUCTION SIDEBAR CATEGORY IMAGE:', {
                                    originalUrl: imageUrl,
                                    finalUrl: finalUrl,
                                    categoryId: category._id,
                                    categoryName: category.name
                                  });
                                  return finalUrl;
                                }
                              }
                              return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ECategory%3C/text%3E%3C/svg%3E";
                            })()}
                            alt={category.name}
                            style={{
                                width: level === 0 ? '40px' : '32px',
                                height: level === 0 ? '40px' : '32px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                marginRight: '12px',
                                border: '2px solid white',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                            onError={(e) => {
                                const target = e.target;
                                // Immediately use data URI placeholder to avoid multiple failed requests
                                const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ECategory%3C/text%3E%3C/svg%3E";
                                if (target.src !== placeholder) {
                                    target.onerror = null; // Prevent infinite loop
                                    target.src = placeholder;
                                }
                            }}
                            crossOrigin="use-credentials"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryChange(categoryId);
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }}
                        />

                        {/* Category Info */}
                        <div style={{ flex: 1 }}>
                            <h4 
                                style={{
                                    fontSize: level === 0 ? '16px' : '14px',
                                    fontWeight: level === 0 ? '700' : '600',
                                    color: isSelected ? '#0063b1' : '#1e293b',
                                    margin: '0 0 2px 0',
                                    lineHeight: '1.3',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    transition: 'all 0.3s ease',
                                    display: 'inline-block',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCategoryChange(categoryId);
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 99, 177, 0.1), rgba(0, 163, 224, 0.1))';
                                    e.currentTarget.style.color = '#0063b1';
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = isSelected ? '#0063b1' : '#1e293b';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                            >
                                {category.name}
                            </h4>
                            <p style={{
                                fontSize: '12px',
                                color: '#64748b',
                                margin: 0,
                            }}>
                                {hasSubcategories 
                                    ? `${category.children.length} subcategories • Click row to expand, name to filter` 
                                    : 'Click name or image to filter auctions'
                                }
                            </p>
                        </div>

                        {/* Subcategory Count Badge */}
                        {hasSubcategories && (
                            <span style={{
                                background: 'linear-gradient(135deg, #0063b1, #00a3e0)',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: '600',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                marginLeft: '8px',
                            }}>
                                {category.children.length}
                            </span>
                        )}

                        {/* Selection Indicator */}
                        {isSelected && (
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#0063b1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: '8px',
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Recursive Subcategories */}
                    {hasSubcategories && isExpanded && (
                        <div style={{
                            marginTop: '8px',
                            paddingLeft: '16px',
                            borderLeft: level < 2 ? '2px solid #f1f5f9' : 'none',
                            marginLeft: `${level * 20 + 8}px`,
                        }}>
                            {renderCategoryHierarchy(category.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    // Parse URL parameters on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const categoryParam = urlParams.get('category');
            const subCategoryParam = urlParams.get('subcategory');
            const bidTypeParam = urlParams.get('bidType');
            const searchParam = urlParams.get('search');

            if (categoryParam) setSelectedCategory(categoryParam);
            if (subCategoryParam) setSelectedSubCategory(subCategoryParam);
            if (bidTypeParam) setSelectedBidType(bidTypeParam);
            if (searchParam) setSearchTerm(searchParam);
        }
    }, []);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                setLoading(true);
                // Ensure this API call fetches bids/auctions with populated owner and avatar
                // This call should hit your backend endpoint that uses the updated bid.service.ts
                const data = await AuctionsAPI.getAuctions();
                setAuctions(data);
                // Initial filtering for display, the useEffect below will refine it
                setFilteredAuctions(data);

                // Initialize countdown timers for each auction
                const timers = {};
                data.forEach(auction => {
                    if (auction._id) {
                        const endTime = auction.endingAt || "2024-10-23 12:00:00";
                        const currentTime = new Date();
                        const timeDifference = new Date(endTime) - currentTime;

                        if (timeDifference > 0) {
                            timers[auction._id] = calculateTimeRemaining(endTime);
                        } else {
                            timers[auction._id] = { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: true }; // Mark as ended
                        }
                    }
                });
                setAuctionTimers(timers);

                // Update timers every second
                const interval = setInterval(() => {
                    const updatedTimers = {};
                    data.forEach(auction => {
                        if (auction._id) {
                            const endTime = auction.endingAt || "2024-10-23 12:00:00";
                            updatedTimers[auction._id] = calculateTimeRemaining(endTime);
                        }
                    });
                    setAuctionTimers(updatedTimers);
                }, 1000);

                setLoading(false);

                return () => clearInterval(interval);
            } catch (err) {
                console.error("Error fetching auctions:", err);
                setError("Failed to load auctions");
                setLoading(false);
            }
        };

        fetchAuctions();
    }, []);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                const response = await CategoryAPI.getCategoryTree();
                
                // Handle different response structures
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

    // Update filtered categories when selectedBidType or searchTerm changes
    useEffect(() => {
        if (categories && categories.length > 0) {
            let filtered = [...categories];
            
            // 1. Filter by bidType (Produit/Service)
            if (selectedBidType) {
                filtered = filtered.filter(category => {
                    const categoryType = category.type?.toUpperCase();
                    return categoryType === selectedBidType;
                });
            }
            
            // 2. Filter by searchTerm (search in category names)
            if (searchTerm.trim() !== "") {
                const searchLower = searchTerm.toLowerCase().trim();
                filtered = filtered.filter(category => {
                    const categoryName = category.name?.toLowerCase() || '';
                    return categoryName.includes(searchLower);
                });
            }
            
            setFilteredCategories(filtered);
        }
    }, [selectedBidType, categories, searchTerm]);

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

    // useEffect to handle filtering and sorting
    useEffect(() => {
        if (auctions.length === 0) return;

        let result = [...auctions];

        // Do NOT filter out auctions that have already ended.
        // Instead, their 'hasEnded' flag will be used for styling and click prevention.

        // 1. Apply bidType filter if selected
        if (selectedBidType) {
            result = result.filter(auction =>
                auction.bidType && auction.bidType === selectedBidType
            );
        }

        // 2. Apply category filter if selected (with hierarchical support)
        if (selectedCategory) {
            result = result.filter(auction =>
                doesAuctionBelongToCategory(auction, selectedCategory, categories)
            );
        }

        // 3. Apply subcategory filter if selected
        if (selectedSubCategory) {
            result = result.filter(auction =>
                auction.productSubCategory && auction.productSubCategory._id === selectedSubCategory
            );
        }

        // 4. Apply search term filter
        if (searchTerm.trim() !== "") {
            const searchLower = searchTerm.toLowerCase().trim();
            result = result.filter(auction =>
                (auction.title && auction.title.toLowerCase().includes(searchLower)) ||
                (auction.description && auction.description.toLowerCase().includes(searchLower))
            );
        }

        // 5. Apply sorting
        if (sortOption === t('auctionSidebar.priceAsc')) {
            result.sort((a, b) =>
                (a.currentPrice || a.startingPrice || 0) - (b.currentPrice || b.startingPrice || 0)
            );
        } else if (sortOption === t('auctionSidebar.priceDesc')) {
            result.sort((a, b) =>
                (b.currentPrice || b.startingPrice || 0) - (a.currentPrice || a.startingPrice || 0)
            );
        }
        
        setCurrentPage(1); // Reset to first page on any filter change
        setFilteredAuctions(result);
    }, [auctions, selectedCategory, selectedSubCategory, selectedBidType, searchTerm, sortOption, categories]);

    // Function to calculate time remaining
    function calculateTimeRemaining(endTime) {
        const currentTime = new Date();
        const timeDifference = new Date(endTime) - currentTime;

        if (timeDifference <= 0) {
            return {
                days: "00",
                hours: "00",
                minutes: "00",
                seconds: "00",
                hasEnded: true, // Add a flag to indicate if the auction has ended
            };
        }

        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        return {
            days: days.toString().padStart(2, "0"),
            hours: hours.toString().padStart(2, "0"),
            minutes: minutes.toString().padStart(2, "0"),
            seconds: seconds.toString().padStart(2, "0"),
            hasEnded: false,
        };
    }

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle category selection
    const handleCategoryChange = (categoryId) => {
        const newCategoryId = categoryId === selectedCategory ? "" : categoryId;
        setSelectedCategory(newCategoryId);
        // Clear subcategory when category changes
        setSelectedSubCategory("");
    };

    // Handle clear category filter
    const handleClearCategoryFilter = () => {
        // Clear URL parameters first
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.delete('category');
            url.searchParams.delete('subcategory');
            window.history.replaceState({}, '', url);
        }
        
        // Clear states
        setSelectedCategory("");
        setSelectedSubCategory("");
        setExpandedCategories({});
    };

    // Handle subcategory selection
    const handleSubCategoryChange = (subCategoryId) => {
        setSelectedSubCategory(subCategoryId === selectedSubCategory ? "" : subCategoryId);
    };

    // Handle bidType selection
    const handleBidTypeChange = (bidType) => {
        const newBidType = bidType === selectedBidType ? "" : bidType;
        setSelectedBidType(newBidType);
        // Clear category and subcategory when bid type changes
        setSelectedCategory("");
        setSelectedSubCategory("");
    };

    const handleSortChange = (option) => {
        setSortOption(option);
    };

    const sortOptions = [
        t('auctionSidebar.defaultSort'),
        t('auctionSidebar.priceAsc'),
        t('auctionSidebar.priceDesc'),
    ];

    const handleColumnClick = (columnNumber) => {
        setActiveColumn(columnNumber);
    };

    // Handle auction card click
    const handleAuctionCardClick = (auctionId) => {
        navigateWithTop(`/auction-details/${auctionId}`);
    };

    return (
        <div className="auction-grid-section pt-10 mb-110">
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
                .hero-section {
                    animation: slideIn 0.8s ease-out;
                }
                .filter-card {
                    animation: slideIn 0.8s ease-out 0.2s both;
                }
                .auction-card {
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
                                                placeholder={t('auctionSidebar.searchAuctionPlaceholder')}
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

                                {/* Produit/Service Buttons with Categories Text - Like Home1Banner */}
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
                                            <button
                                                type="button"
                                                className={`filter-button product ${selectedBidType === BID_TYPE.PRODUCT ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleBidTypeChange(BID_TYPE.PRODUCT);
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
                                                    boxShadow: selectedBidType === BID_TYPE.PRODUCT
                                                        ? '0 6px 24px rgba(0, 99, 177, 0.35)'
                                                        : '0 4px 16px rgba(0, 99, 177, 0.25)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.6px',
                                                    minWidth: '110px',
                                                    position: 'relative',
                                                    zIndex: 10,
                                                    opacity: selectedBidType === BID_TYPE.PRODUCT ? 1 : 0.8,
                                                }}
                                            >
                                                Produit
                                            </button>
                                            
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
                                                Categories
                                            </h2>
                                            
                                            <button
                                                type="button"
                                                className={`filter-button service ${selectedBidType === BID_TYPE.SERVICE ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleBidTypeChange(BID_TYPE.SERVICE);
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
                                                    boxShadow: selectedBidType === BID_TYPE.SERVICE
                                                        ? '0 6px 24px rgba(16, 185, 129, 0.35)'
                                                        : '0 4px 16px rgba(16, 185, 129, 0.25)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.6px',
                                                    minWidth: '110px',
                                                    position: 'relative',
                                                    zIndex: 10,
                                                    opacity: selectedBidType === BID_TYPE.SERVICE ? 1 : 0.8,
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
                                                    {t('auctionSidebar.loadingCategories')}
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
                                                    {selectedBidType ? t('auctionSidebar.noCategoryAvailable') : t('auctionSidebar.noCategoryAvailable')}
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
                                                disabled={false}
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
                                                Clear Category Filter
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>

                {/* Auction Items Grid */}
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
                                            border: '4px solid rgba(0, 99, 177, 0.1)',
                                            borderRadius: '50%',
                                            borderTop: '4px solid #0063b1',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        <p style={{ marginTop: '15px', color: '#666' }}>{t('auctionSidebar.loadingAuctions')}</p>
                                    </div>
                                ) : error ? (
                                    <div className="col-12 text-center py-5">
                                        <p style={{ color: '#ff5555' }}>{error}</p>
                                    </div>
                                ) : paginatedAuctions && paginatedAuctions.length > 0 ? (
                                    paginatedAuctions.map((auction, index) => {
                                        const thumbObj = auction.thumbs && auction.thumbs.length > 0 ? auction.thumbs[0] : null;
                                        const hasAuctionEnded = auctionTimers[auction._id]?.hasEnded || false; // Check if the auction has ended
                                        return (
                                            <div
                                                key={auction._id}
                                                className={`col-lg-${activeColumn === 2 ? '6' : '4'} col-md-6 item`}
                                            >
                                                <div
                                                    className="modern-auction-card auction-card"
                                                    style={{
                                                        background: hasAuctionEnded ? '#f0f0f0' : 'white', // Grey background when ended
                                                        borderRadius: '20px',
                                                        overflow: 'hidden',
                                                        boxShadow: hasAuctionEnded ? 'none' : '0 8px 25px rgba(0, 0, 0, 0.08)', // No shadow when ended
                                                        height: '100%',
                                                        maxWidth: '350px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        position: 'relative',
                                                        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                        border: hasAuctionEnded ? '1px solid #d0d0d0' : '1px solid rgba(0, 0, 0, 0.05)', // Grey border when ended
                                                        cursor: hasAuctionEnded ? 'not-allowed' : 'pointer', // Change cursor
                                                        opacity: hasAuctionEnded ? 0.6 : 1, // Grey out the card
                                                        pointerEvents: hasAuctionEnded ? 'none' : 'auto', // Disable clicks
                                                        margin: '0 auto',
                                                    }}
                                                    onClick={() => !hasAuctionEnded && handleAuctionCardClick(auction._id)}
                                                    onMouseEnter={(e) => {
                                                        if (!hasAuctionEnded) { // Only apply hover effects if not ended
                                                            e.currentTarget.style.transform = 'translateY(-10px)';
                                                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 99, 177, 0.15)';
                                                            e.currentTarget.style.borderColor = 'rgba(0, 99, 177, 0.2)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!hasAuctionEnded) { // Only apply hover effects if not ended
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                                                            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                                                        }
                                                    }}
                                                >
                                                    {/* Auction Image */}
                                                    <div
                                                        className="auction-image"
                                                        style={{
                                                            height: '240px',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                    <Link
                                                        href={hasAuctionEnded ? "#" : `/auction-details/${auction._id}`}
                                                        scroll={false}
                                                        style={{ display: 'block', height: '100%', cursor: hasAuctionEnded ? 'not-allowed' : 'pointer' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (hasAuctionEnded) {
                                                                e.preventDefault();
                                                                return;
                                                            }
                                                            e.preventDefault();
                                                            navigateWithTop(`/auction-details/${auction._id}`);
                                                        }}
                                                    >
                                                            <img
                                                                src={(() => {
                                                                    if (auction.thumbs && auction.thumbs.length > 0) {
                                                                        const imageUrl = auction.thumbs[0].url;
                                                                        if (imageUrl.startsWith('http')) {
                                                                            return imageUrl;
                                                                        } else if (imageUrl.startsWith('/static/')) {
                                                                            const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                                                            console.log('🎯 AUCTION SIDEBAR AUCTION IMAGE:', {
                                                                                originalUrl: imageUrl,
                                                                                finalUrl: finalUrl,
                                                                                auctionId: auction._id,
                                                                                auctionTitle: auction.title
                                                                            });
                                                                            return finalUrl;
                                                                        } else if (imageUrl.startsWith('/')) {
                                                                            const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                                                            console.log('🎯 AUCTION SIDEBAR AUCTION IMAGE:', {
                                                                                originalUrl: imageUrl,
                                                                                finalUrl: finalUrl,
                                                                                auctionId: auction._id,
                                                                                auctionTitle: auction.title
                                                                            });
                                                                            return finalUrl;
                                                                        } else {
                                                                            const finalUrl = `${app.baseURL}${imageUrl}`;
                                                                            console.log('🎯 AUCTION SIDEBAR AUCTION IMAGE:', {
                                                                                originalUrl: imageUrl,
                                                                                finalUrl: finalUrl,
                                                                                auctionId: auction._id,
                                                                                auctionTitle: auction.title
                                                                            });
                                                                            return finalUrl;
                                                                        }
                                                                    }
                                                                    return DEFAULT_AUCTION_IMAGE;
                                                                })()}
                                                                alt={auction.title || "Auction Item"}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    transition: 'transform 0.5s ease',
                                                                    filter: hasAuctionEnded ? 'grayscale(100%)' : 'none', // Grey out image
                                                                }}
                                                                onError={(e) => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = DEFAULT_AUCTION_IMAGE;
                                                                }}
                                                                crossOrigin="use-credentials"
                                                            />
                                                        </Link>

                                                        {/* Auction Type Badge */}
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
                                                            {auction.bidType === 'PRODUCT' ? 'Produit' : 'Service'}
                                                            </div>

                                                        {/* Countdown Timer */}
                                                        <div
                                                            className="countdown-overlay"
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '0',
                                                                left: '0',
                                                                right: '0',
                                                                background: hasAuctionEnded ? 'rgba(0, 0, 0, 0.6)' : 'linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), transparent)', // Darker grey background when ended
                                                                padding: '20px 15px 15px',
                                                                color: 'white',
                                                            }}
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                fontSize: '14px',
                                                                fontWeight: '600',
                                                            }}>
                                                                <div style={{
                                                                    background: hasAuctionEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)', // Grey timer background
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {auctionTimers[auction._id]?.days || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{t('auctionSidebar.daysAbbr')}</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasAuctionEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)', // Grey timer background
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {auctionTimers[auction._id]?.hours || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{t('auctionSidebar.hoursAbbr')}</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasAuctionEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)', // Grey timer background
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {auctionTimers[auction._id]?.minutes || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{t('auctionSidebar.minutesAbbr')}</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasAuctionEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)', // Grey timer background
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {auctionTimers[auction._id]?.seconds || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>{t('auctionSidebar.secondsAbbr')}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Auction Content */}
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
                                                            color: hasAuctionEnded ? '#666' : '#333', // Grey text for title
                                                            marginBottom: '12px',
                                                            lineHeight: '1.3',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            <Link
                                                                href={hasAuctionEnded ? "#" : `/auction-details/${auction._id}`} // Prevent navigation if ended
                                                                scroll={false}
                                                                style={{ color: 'inherit', textDecoration: 'none', cursor: hasAuctionEnded ? 'not-allowed' : 'pointer' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (hasAuctionEnded) {
                                                                        e.preventDefault();
                                                                        return;
                                                                    }
                                                                    e.preventDefault();
                                                                    navigateWithTop(`/auction-details/${auction._id}`);
                                                                }}
                                                            >
                                                                {auction.title || t('auctionSidebar.noTitle')}
                                                            </Link>
                                                        </h3>

                                                        {/* Quantity and Location Info */}
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: auction?.bidType === 'SERVICE' ? '1fr' : '1fr 1fr',
                                                            gap: '12px',
                                                            marginBottom: '16px',
                                                        }}>
                                                            {auction?.bidType !== 'SERVICE' && (
                                                                <div>
                                                                    <p style={{
                                                                        fontSize: '12px',
                                                                        color: hasAuctionEnded ? '#888' : '#666',
                                                                        margin: '0 0 4px 0',
                                                                        fontWeight: '600',
                                                                    }}>
                                                                        Quantité
                                                                    </p>
                                                                    <p style={{
                                                                        fontSize: '14px',
                                                                        color: hasAuctionEnded ? '#888' : '#333',
                                                                        margin: 0,
                                                                        fontWeight: '500',
                                                                    }}>
                                                                        {auction.quantity || 'Non spécifiée'}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <p style={{
                                                                    fontSize: '12px',
                                                                    color: hasAuctionEnded ? '#888' : '#666',
                                                                    margin: '0 0 4px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    Localisation
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '14px',
                                                                    color: hasAuctionEnded ? '#888' : '#333',
                                                                    margin: 0,
                                                                    fontWeight: '500',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}>
                                                                    {(() => {
                                                                      const place = auction.place || '';
                                                                      const address = auction.address || '';
                                                                      const location = auction.location || '';
                                                                      const wilaya = auction.wilaya || '';
                                                                      // For auctions, 'place' contains the full address
                                                                      // Combine: place (full address), address, location, wilaya
                                                                      const parts = [place, address, location, wilaya].filter(Boolean);
                                                                      // Remove duplicates and join
                                                                      const uniqueParts = [...new Set(parts)];
                                                                      return uniqueParts.length > 0 ? uniqueParts.join(', ') : 'Non spécifiée';
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Separator Line */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '1px',
                                                            background: hasAuctionEnded ? '#e0e0e0' : 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                            margin: '0 0 16px 0',
                                                        }}></div>

                                                        {/* Description */}
                                                        {auction.description && (
                                                            <div style={{
                                                                marginBottom: '16px',
                                                            }}>
                                                                <p style={{
                                                                    fontSize: '12px',
                                                                    color: hasAuctionEnded ? '#888' : '#666',
                                                                    margin: '0 0 4px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    Description
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '13px',
                                                                    color: hasAuctionEnded ? '#888' : '#555',
                                                                    margin: 0,
                                                                    lineHeight: '1.4',
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}>
                                                                    {auction.description}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Separator Line after Description */}
                                                        {auction.description && (
                                                            <div style={{
                                                                width: '100%',
                                                                height: '1px',
                                                                background: hasAuctionEnded ? '#e0e0e0' : 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                                margin: '0 0 16px 0',
                                                            }}></div>
                                                        )}

                                                        {/* Price Info */}
                                                        <div style={{
                                                            background: hasAuctionEnded ? '#f0f0f0' : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            marginBottom: '16px',
                                                            border: hasAuctionEnded ? '1px solid #e0e0e0' : '1px solid #e9ecef',
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                            }}>
                                                                <div style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    background: hasAuctionEnded ? '#ccc' : '#28a745',
                                                                    animation: hasAuctionEnded ? 'none' : 'pulse 2s infinite',
                                                                }}></div>
                                                                <span style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: '600',
                                                                    color: hasAuctionEnded ? '#888' : '#28a745',
                                                                }}>
                                                                    {hasAuctionEnded ? 'Enchère terminée' : 'Prix actuel'}
                                                                </span>
                                                            </div>
                                                            <div style={{
                                                                textAlign: 'center',
                                                                marginTop: '8px',
                                                            }}>
                                                                    <p style={{
                                                                        fontSize: '22px',
                                                                        fontWeight: '800',
                                                                        margin: 0,
                                                                    color: hasAuctionEnded ? '#888' : '#0063b1',
                                                                        background: hasAuctionEnded ? 'none' : 'linear-gradient(90deg, #0063b1, #00a3e0)',
                                                                        WebkitBackgroundClip: hasAuctionEnded ? undefined : 'text',
                                                                        backgroundClip: hasAuctionEnded ? undefined : 'text',
                                                                        WebkitTextFillColor: hasAuctionEnded ? '#888' : 'transparent',
                                                                    }}>
                                                                        {Number(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} DA
                                                                    </p>
                                                            </div>
                                                        </div>

                                                        {/* Separator Line after Price */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '1px',
                                                            background: hasAuctionEnded ? '#e0e0e0' : 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                            margin: '0 0 16px 0',
                                                        }}></div>

                                                        {/* Bidders Count */}
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                            borderRadius: '12px',
                                                            padding: '12px',
                                                            marginBottom: '16px',
                                                            border: '1px solid #e9ecef',
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                            }}>
                                                                <div style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    background: hasAuctionEnded ? '#ccc' : '#0063b1',
                                                                    animation: hasAuctionEnded ? 'none' : 'pulse 2s infinite',
                                                                }}></div>
                                                                <span style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: '600',
                                                                    color: hasAuctionEnded ? '#888' : '#0063b1',
                                                                }}>
                                                                    {auction.biddersCount || 0} participant{(auction.biddersCount || 0) !== 1 ? 's' : ''}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '12px',
                                                                    color: hasAuctionEnded ? '#888' : '#666',
                                                                }}>
                                                                    ont enchéri
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Separator Line after Bidders Count */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '1px',
                                                            background: hasAuctionEnded ? '#e0e0e0' : 'linear-gradient(90deg, transparent, #e9ecef, transparent)',
                                                            margin: '0 0 16px 0',
                                                        }}></div>

                                                        {/* Owner Info */}
                                                        <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                            gap: '10px',
                                                            marginBottom: '16px',
                                                                }}>
                                                                    <img
                                                                src={(() => {
                                                                    if (auction.owner?.avatar?.url) {
                                                                        const imageUrl = auction.owner.avatar.url;
                                                                        if (imageUrl.startsWith('http')) {
                                                                            return imageUrl;
                                                                        } else if (imageUrl.startsWith('/static/')) {
                                                                            const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                                                            console.log('🎯 AUCTION SIDEBAR USER AVATAR:', {
                                                                                originalUrl: imageUrl,
                                                                                finalUrl: finalUrl,
                                                                                auctionId: auction._id,
                                                                                ownerName: auction.owner?.firstName || auction.owner?.name
                                                                            });
                                                                            return finalUrl;
                                                                        } else if (imageUrl.startsWith('/')) {
                                                                            const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                                                            console.log('🎯 AUCTION SIDEBAR USER AVATAR:', {
                                                                                originalUrl: imageUrl,
                                                                                finalUrl: finalUrl,
                                                                                auctionId: auction._id,
                                                                                ownerName: auction.owner?.firstName || auction.owner?.name
                                                                            });
                                                                            return finalUrl;
                                                                        } else {
                                                                            const finalUrl = `${app.baseURL}${imageUrl}`;
                                                                            console.log('🎯 AUCTION SIDEBAR USER AVATAR:', {
                                                                                originalUrl: imageUrl,
                                                                                finalUrl: finalUrl,
                                                                                auctionId: auction._id,
                                                                                ownerName: auction.owner?.firstName || auction.owner?.name
                                                                            });
                                                                            return finalUrl;
                                                                        }
                                                                    }
                                                                    return DEFAULT_PROFILE_IMAGE;
                                                                })()}
                                                                        alt="Owner"
                                                                        style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                            objectFit: 'cover',
                                                                    filter: hasAuctionEnded ? 'grayscale(100%)' : 'none',
                                                                        }}
                                                                        onError={(e) => {
                                                                    const target = e.target;
                                                                    target.src = DEFAULT_PROFILE_IMAGE;
                                                                }}
                                                            />
                                                            <span style={{
                                                                fontSize: '14px',
                                                                color: hasAuctionEnded ? '#888' : '#666',
                                                                        fontWeight: '500',
                                                                    }}>
                                                                        {(() => {
                                                                            // Check if seller is hidden (anonymous)
                                                                            if (auction.hidden === true) {
                                                                        return 'Anonyme';
                                                                            }
                                                                            
                                                                            // Try owner firstName + lastName first
                                                                            if (auction.owner?.firstName && auction.owner?.lastName) {
                                                                                return `${auction.owner.firstName} ${auction.owner.lastName}`;
                                                                            }
                                                                            // Try owner name field
                                                                            if (auction.owner?.name) {
                                                                                return auction.owner.name;
                                                                            }
                                                                            // Try seller name
                                                                            if (auction.seller?.name) {
                                                                                return auction.seller.name;
                                                                            }
                                                                            // Try just firstName
                                                                            if (auction.owner?.firstName) {
                                                                                return auction.owner.firstName;
                                                                            }
                                                                            // Default fallback
                                                                    return 'Vendeur';
                                                                        })()}
                                                            </span>
                                                            </div>

                                                        {/* View Auction Button */}
                                                        <Link
                                                            href={hasAuctionEnded ? "#" : `/auction-details/${auction._id}`}
                                                            scroll={false}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                width: '100%',
                                                                padding: '12px 20px',
                                                                background: hasAuctionEnded ? '#cccccc' : 'linear-gradient(90deg, #0063b1, #00a3e0)',
                                                                color: hasAuctionEnded ? '#888' : 'white',
                                                                textDecoration: 'none',
                                                                borderRadius: '25px',
                                                                fontWeight: '600',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: hasAuctionEnded ? 'none' : '0 4px 12px rgba(0, 99, 177, 0.3)',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!hasAuctionEnded) {
                                                                    e.currentTarget.style.background = 'linear-gradient(90deg, #00a3e0, #0063b1)';
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 99, 177, 0.4)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!hasAuctionEnded) {
                                                                    e.currentTarget.style.background = 'linear-gradient(90deg, #0063b1, #00a3e0)';
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 99, 177, 0.3)';
                                                                }
                                                            }}
                                                            onClick={(event) => {
                                                                if (hasAuctionEnded) {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    return;
                                                                }
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                navigateWithTop(`/auction-details/${auction._id}`);
                                                            }}
                                                        >
                                                            Voir les détails
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
                                            border: '2px dashed rgba(0, 99, 177, 0.2)',
                                        }}>
                                            <div style={{
                                                fontSize: '48px',
                                                marginBottom: '20px',
                                                opacity: 0.5,
                                            }}>
                                                🔍
                                            </div>
                                            <h3 style={{
                                                fontSize: '24px',
                                                fontWeight: '600',
                                                color: '#666',
                                                marginBottom: '10px',
                                            }}>
                                                {t('auctionSidebar.noAuctionsFound')}
                                            </h3>
                                            <p style={{
                                                fontSize: '16px',
                                                color: '#999',
                                                margin: 0,
                                            }}>
                                                {t('auctionSidebar.modifyFiltersOrSearch')}
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
                                                background: currentPage === page ? 'linear-gradient(135deg, #0063b1, #00a3e0)' : '#f5f5f5',
                                                color: currentPage === page ? 'white' : '#333',
                                                fontWeight: currentPage === page ? '700' : '600',
                                                textDecoration: 'none',
                                                boxShadow: currentPage === page ? '0 4px 15px rgba(0, 99, 177, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
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

export default MultipurposeAuctionSidebar;