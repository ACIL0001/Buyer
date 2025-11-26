"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import SelectComponent from '@/components/common/SelectComponent'
import { useCountdownTimer } from '@/customHooks/useCountdownTimer'
import { TendersAPI } from '@/app/api/tenders'
import { CategoryAPI } from '@/app/api/category'
import { SubCategoryAPI } from '@/app/api/subcategory'
import app from '@/config'; // Import the app config
import { useTranslation } from 'react-i18next';
import Header from '@/components/header/Header';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Define BID_TYPE enum to match server definition
const BID_TYPE = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE'
};

// Default image constants
const DEFAULT_TENDER_IMAGE = "/assets/images/logo-white.png";
const DEFAULT_PROFILE_IMAGE = "/assets/images/avatar.jpg";
// Use server baseURL for default category image with multiple fallback options
const getDefaultCategoryImage = () => {
    const baseURL = app.baseURL.replace(/\/$/, '');
    // Try common default category image paths on the server
    // If server image doesn't exist, use a data URI placeholder
    return `${baseURL}/static/default-category.png`;
};

// Timer interface
const calculateTimeRemaining = (endDate) => {
  const total = Date.parse(endDate) - Date.now();
  const hasEnded = total <= 0;

  if (hasEnded) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
      hasEnded: true
    };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    days: days.toString().padStart(2, '0'),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    hasEnded: false
  };
};

// Custom hook to manage multiple countdown timers
const useTenderTimers = (tenders) => {
    const [timers, setTimers] = useState({});

    useEffect(() => {
        if (!tenders || tenders.length === 0) return;

        // Initialize timers for each tender
        const newTimers = {};
        tenders.forEach(tender => {
            if (tender._id) {
                newTimers[tender._id] = useCountdownTimer(tender.endingAt || "2024-10-23 12:00:00");
            }
        });

        setTimers(newTimers);
    }, [tenders]);

    return timers;
};

const MultipurposeTenderSidebar = () => {
    const { t } = useTranslation();
    const router = useRouter();
    // Default countdown timer for the page (fallback)
    const defaultTimer = useCountdownTimer("2024-08-23 11:42:00");

    const [activeColumn, setActiveColumn] = useState(3);
    const [currentPage, setCurrentPage] = useState(1);
    const [tenders, setTenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedBidType, setSelectedBidType] = useState(""); // "" for all, "PRODUCT", or "SERVICE"
    const [tenderTimers, setTenderTimers] = useState({});
    const [filteredTenders, setFilteredTenders] = useState([]);
    const [sortOption, setSortOption] = useState(t('defaultSort'));
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'finished'
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [hoveredSubCategory, setHoveredSubCategory] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    
    // Pagination constants
    const ITEMS_PER_PAGE = 9;
    const totalPages = Math.ceil(filteredTenders.length / ITEMS_PER_PAGE);
    const paginatedTenders = filteredTenders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const [timers, setTimers] = useState({});
    const [animatedCards, setAnimatedCards] = useState([]);

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

    // Helper function to check if a tender belongs to a category or its descendants
    const doesTenderBelongToCategory = (tender, selectedCategoryId, categoriesTree) => {
        if (!tender.category || !selectedCategoryId) return false;
        
        const tenderCategoryId = tender.category._id || tender.category;
        
        // Direct match
        if (tenderCategoryId === selectedCategoryId) return true;
        
        // Check if tender category is a descendant of selected category
        const allDescendants = getAllDescendantCategoryIds(selectedCategoryId, categoriesTree);
        return allDescendants.includes(tenderCategoryId);
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
                            borderWidth: level === 0 ? '2px' : '1px',
                            borderStyle: 'solid',
                            borderColor: level === 0 ? '#e2e8f0' : '#f1f5f9',
                            transition: 'all 0.3s ease',
                            cursor: hasSubcategories ? 'pointer' : 'default',
                            position: 'relative',
                            ...(isSelected && {
                                borderColor: '#0063b1',
                                background: 'rgba(0, 99, 177, 0.05)',
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
                                  console.log('🎯 TENDERS PAGE CATEGORY IMAGE:', {
                                    originalUrl: imageUrl,
                                    finalUrl: finalUrl,
                                    categoryId: category._id,
                                    categoryName: category.name
                                  });
                                  return finalUrl;
                                } else if (imageUrl.startsWith('/')) {
                                  const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                  console.log('🎯 TENDERS PAGE CATEGORY IMAGE:', {
                                    originalUrl: imageUrl,
                                    finalUrl: finalUrl,
                                    categoryId: category._id,
                                    categoryName: category.name
                                  });
                                  return finalUrl;
                                } else {
                                  const finalUrl = `${app.baseURL}${imageUrl}`;
                                  console.log('🎯 TENDERS PAGE CATEGORY IMAGE:', {
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
                                    ? `${category.children.length} ${t('tenders.subcategories')} • ${t('tenders.clickRowToExpand')}` 
                                    : t('tenders.clickNameToFilter')
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

    // Update timers
    useEffect(() => {
        if (filteredTenders.length === 0) return;

        const updateTimers = () => {
            const newTimers = {};
            filteredTenders.forEach(tender => {
                if (tender._id && tender.endingAt) {
                    newTimers[tender._id] = calculateTimeRemaining(tender.endingAt);
                }
            });
            setTimers(newTimers);
        };

        // Initial update
        updateTimers();

        // Update every second
        const interval = setInterval(updateTimers, 1000);

        return () => clearInterval(interval);
    }, [filteredTenders]);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index') || '0');
                        setAnimatedCards(prev => [...prev, index]);
                    }
                });
            },
            { threshold: 0.3, rootMargin: '0px 0px -50px 0px' }
        );

        const tenderCards = document.querySelectorAll('.tender-card-animate');
        tenderCards.forEach((card, index) => {
            card.setAttribute('data-index', index.toString());
            observer.observe(card);
        });

        return () => observer.disconnect();
    }, [filteredTenders]);

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
        const fetchTenders = async () => {
            try {
                setLoading(true);
                // Fetch tenders with populated owner and avatar
                const response = await TendersAPI.getActiveTenders();
                
                console.log('Tenders API Response:', response);
                
                // Handle the API response structure
                let tendersData = [];
                if (response && response.success) {
                    // If response has data array
                    if (Array.isArray(response.data)) {
                        tendersData = response.data;
                    } else if (Array.isArray(response)) {
                        // If response is directly an array
                        tendersData = response;
                    }
                } else if (Array.isArray(response)) {
                    // If response is directly an array
                    tendersData = response;
                }
                
                console.log('Processed tenders data:', tendersData);
                
                setTenders(tendersData);
                // Initial filtering for display, the useEffect below will refine it
                setFilteredTenders(tendersData);

                // Initialize countdown timers for each tender
                const timers = {};
                tendersData.forEach(tender => {
                    if (tender._id) {
                        const endTime = tender.endingAt || "2024-10-23 12:00:00";
                        const currentTime = new Date();
                        const timeDifference = new Date(endTime) - currentTime;

                        if (timeDifference > 0) {
                            timers[tender._id] = calculateTimeRemaining(endTime);
                        } else {
                            timers[tender._id] = { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: true }; // Mark as ended
                        }
                    }
                });
                setTenderTimers(timers);

                // Update timers every second
                const interval = setInterval(() => {
                    const updatedTimers = {};
                    tendersData.forEach(tender => {
                        if (tender._id) {
                            const endTime = tender.endingAt || "2024-10-23 12:00:00";
                            updatedTimers[tender._id] = calculateTimeRemaining(endTime);
                        }
                    });
                    setTenderTimers(updatedTimers);
                }, 1000);

                setLoading(false);

                return () => clearInterval(interval);
            } catch (err) {
                console.error("Error fetching tenders:", err);
                setError("Failed to load tenders");
                setLoading(false);
            }
        };

        fetchTenders();
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
        console.log("Filtering useEffect triggered with:", {
            tendersLength: tenders?.length,
            selectedCategory,
            selectedSubCategory,
            selectedBidType,
            searchTerm,
            sortOption
        });
        
        if (!tenders || tenders.length === 0) return;

        let result = [...tenders];

        // Do NOT filter out tenders that have already ended.
        // Instead, their 'hasEnded' flag will be used for styling and click prevention.

        // 1. Apply bidType filter if selected
        if (selectedBidType) {
            result = result.filter(tender =>
                tender.tenderType && tender.tenderType === selectedBidType
            );
        }

        // 2. Apply category filter if selected (with hierarchical support)
        if (selectedCategory) {
            console.log("Applying category filter for:", selectedCategory);
            const beforeFilter = result.length;
            result = result.filter(tender =>
                doesTenderBelongToCategory(tender, selectedCategory, categories)
            );
            console.log(`Category filter: ${beforeFilter} -> ${result.length} tenders`);
        } else {
            console.log("No category filter applied (selectedCategory is empty)");
        }

        // 3. Apply subcategory filter if selected
        if (selectedSubCategory) {
            result = result.filter(tender =>
                tender.subCategory && tender.subCategory._id === selectedSubCategory
            );
        }

        // 4. Apply search term filter
        if (searchTerm.trim() !== "") {
            const searchLower = searchTerm.toLowerCase().trim();
            result = result.filter(tender =>
                (tender.title && tender.title.toLowerCase().includes(searchLower)) ||
                (tender.description && tender.description.toLowerCase().includes(searchLower))
            );
        }

        // 5. Apply status filter
        if (statusFilter === 'active') {
            result = result.filter(tender => {
                if (!tender.endingAt) return false;
                const endTime = new Date(tender.endingAt);
                return endTime > new Date();
            });
        } else if (statusFilter === 'finished') {
            result = result.filter(tender => {
                if (!tender.endingAt) return true;
                const endTime = new Date(tender.endingAt);
                return endTime <= new Date();
            });
        }

        // 6. Apply sorting
        if (sortOption === t('priceAsc')) {
            result.sort((a, b) =>
                (a.maxBudget || 0) - (b.maxBudget || 0)
            );
        } else if (sortOption === t('priceDesc')) {
            result.sort((a, b) =>
                (b.maxBudget || 0) - (a.maxBudget || 0)
            );
        }

        console.log(`Final filtered result: ${result.length} tenders`);
        setFilteredTenders(result);
        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [tenders, selectedCategory, selectedSubCategory, selectedBidType, searchTerm, sortOption, statusFilter]); // Removed tenderTimers from dependency array as it's not filtering, only styling

    // Reset currentPage if it exceeds totalPages after filtering
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    // Debug useEffect to monitor selectedCategory changes
    useEffect(() => {
        console.log("selectedCategory changed to:", selectedCategory);
        console.log("selectedSubCategory changed to:", selectedSubCategory);
    }, [selectedCategory, selectedSubCategory]);

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
        console.log("Clearing category filter...");
        console.log("Before clear - selectedCategory:", selectedCategory);
        console.log("Before clear - selectedSubCategory:", selectedSubCategory);
        
        // Clear URL parameters first
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.delete('category');
            url.searchParams.delete('subcategory');
            window.history.replaceState({}, '', url);
        }
        
        // Clear states using functional updates to ensure they're applied
        setSelectedCategory("");
        setSelectedSubCategory("");
        setExpandedCategories({});
        
        // Force immediate filtering update by directly updating filteredTenders
        if (tenders && tenders.length > 0) {
            let result = [...tenders];
            
            // Apply only non-category filters
            if (selectedBidType) {
                result = result.filter(tender =>
                    tender.tenderType && tender.tenderType === selectedBidType
                );
            }
            
            if (searchTerm.trim() !== "") {
                const searchLower = searchTerm.toLowerCase().trim();
                result = result.filter(tender =>
                    (tender.title && tender.title.toLowerCase().includes(searchLower)) ||
                    (tender.description && tender.description.toLowerCase().includes(searchLower))
                );
            }
            
            // Apply sorting
            if (sortOption) {
                result.sort((a, b) => {
                    switch (sortOption) {
                        case 'newest':
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        case 'oldest':
                            return new Date(a.createdAt) - new Date(b.createdAt);
                        case 'ending_soon':
                            return new Date(a.endingAt) - new Date(b.endingAt);
                        case 'ending_later':
                            return new Date(b.endingAt) - new Date(a.endingAt);
                        default:
                            return 0;
                    }
                });
            }
            
            console.log(`Direct filtering result: ${result.length} tenders`);
            setFilteredTenders(result);
        }
        
        console.log("Clear function completed");
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
        t('defaultSort'),
        t('priceAsc'),
        t('priceDesc'),
    ];

    const handleColumnClick = (columnNumber) => {
        setActiveColumn(columnNumber);
    };

    // Handle tender card click
    const navigateWithTop = useCallback((url) => {
        router.push(url, { scroll: false });
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: "auto" });
            document.documentElement?.scrollTo?.({ top: 0, behavior: "auto" });
        });
    }, [router]);

    const handleTenderCardClick = (tenderId) => {
        navigateWithTop(`/tender-details/${tenderId}`);
    };

    // Swiper settings
    const swiperSettings = useMemo(() => ({
        slidesPerView: "auto",
        speed: 1200,
        spaceBetween: 25,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
        },
        navigation: {
            nextEl: ".tender-slider-next",
            prevEl: ".tender-slider-prev",
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            280: {
                slidesPerView: 1,
                spaceBetween: 15,
            },
            576: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 20,
            },
            992: {
                slidesPerView: 3,
                spaceBetween: 25,
            },
            1200: {
                slidesPerView: 4,
                spaceBetween: 25,
            },
            1400: {
                slidesPerView: 4,
                spaceBetween: 30,
            },
        },
    }), []);

    return (
        <>
            <Header />
            <div className="tender-grid-section mb-110" style={{ paddingTop: 'clamp(70px, 8vw, 100px)' }}>
            <style jsx>{`
                .tender-grid-section {
                  padding-top: clamp(70px, 8vw, 100px) !important;
                }
                @media (max-width: 768px) {
                  .tender-grid-section {
                    padding-top: 80px !important;
                  }
                }
                @media (max-width: 576px) {
                  .tender-grid-section {
                    padding-top: 70px !important;
                  }
                }
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
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .hero-section {
                    animation: slideIn 0.8s ease-out;
                }
                .filter-card {
                    animation: slideIn 0.8s ease-out 0.2s both;
                }
                .tender-card {
                    animation: slideIn 0.8s ease-out 0.4s both;
                }
                .tender-card-animate {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                    transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .tender-card-animate.animated {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                .tender-card-hover {
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .tender-card-hover:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(40, 167, 69, 0.15);
                }
                .timer-digit {
                    animation: pulse 1s infinite;
                }
                .timer-digit.urgent {
                    animation: pulse 0.5s infinite;
                    color: #ff4444;
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
                                                placeholder={t('tenders.searchPlaceholder') || 'Rechercher une soumission...'}
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
                                                {t('common.product')}
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
                                                {t('home.categories')}
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
                                                {t('common.service')}
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
                                                    {t('tenders.loadingCategories')}
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
                                                    {t('tenders.noCategoryAvailable')}
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
                                                {t('tenders.clearCategoryFilter')}
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
                                    borderColor: statusFilter === 'all' ? '#27F5CC' : '#e2e8f0',
                                    background: statusFilter === 'all' ? 'linear-gradient(135deg, #27F5CC, #00D4AA)' : 'white',
                                    color: statusFilter === 'all' ? 'white' : '#666',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: statusFilter === 'all' ? '0 4px 12px rgba(39, 245, 204, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    position: 'relative',
                                    zIndex: 100,
                                    pointerEvents: 'auto',
                                }}
                            >
                                {t('common.all')}
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
                                {t('common.active')}
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
                                {t('common.finished')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tender Cards Section */}
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
                                        <p style={{ marginTop: '15px', color: '#666' }}>{t('tenders.loading')}</p>
                                    </div>
                                ) : error ? (
                                    <div className="col-12 text-center py-5">
                                        <p style={{ color: '#ff5555' }}>{error}</p>
                                    </div>
                                ) : paginatedTenders && paginatedTenders.length > 0 ? (
                                    paginatedTenders.map((tender, index) => {
                                        const timer = timers[tender._id] || { days: "00", hours: "00", minutes: "00", seconds: "00", hasEnded: false };
                                        const hasTenderEnded = timer.hasEnded || false;

                                        // Determine the display name for the tender owner
                                        const ownerName = tender.owner?.firstName && tender.owner?.lastName
                                            ? `${tender.owner.firstName} ${tender.owner.lastName}`.trim()
                                            : tender.owner?.name;
                                        const displayName = ownerName || t('common.buyer');

                                        return (
                                            <div
                                                key={tender._id}
                                                className={`col-lg-${activeColumn === 2 ? '6' : '4'} col-md-6 item`}
                                            >
                                                <div
                                                    className="modern-tender-card tender-card"
                                                    style={{
                                                        background: hasTenderEnded ? '#f0f0f0' : 'white',
                                                        borderRadius: '20px',
                                                        overflow: 'hidden',
                                                        boxShadow: hasTenderEnded ? 'none' : '0 8px 25px rgba(0, 0, 0, 0.08)',
                                                        height: '100%',
                                                        maxWidth: '350px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        position: 'relative',
                                                        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                                                        border: hasTenderEnded ? '1px solid #d0d0d0' : '1px solid rgba(0, 0, 0, 0.05)',
                                                        cursor: hasTenderEnded ? 'not-allowed' : 'pointer',
                                                        opacity: hasTenderEnded ? 0.6 : 1,
                                                        pointerEvents: hasTenderEnded ? 'none' : 'auto',
                                                        margin: '0 auto',
                                                    }}
                                                    onClick={() => !hasTenderEnded && handleTenderCardClick(tender._id)}
                                                    onMouseEnter={(e) => {
                                                        if (!hasTenderEnded) {
                                                            e.currentTarget.style.transform = 'translateY(-10px)';
                                                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(39, 245, 204, 0.15)';
                                                            e.currentTarget.style.borderColor = 'rgba(39, 245, 204, 0.2)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!hasTenderEnded) {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08)';
                                                            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                                                        }
                                                    }}
                                                >
                                                    {/* Tender Image */}
                                                    <div
                                                        className="tender-image"
                                                        style={{
                                                            height: '240px',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <Link
                                                            href={hasTenderEnded ? "#" : `/tender-details/${tender._id}`}
                                                            scroll={false}
                                                            style={{ display: 'block', height: '100%', cursor: hasTenderEnded ? 'not-allowed' : 'pointer' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (hasTenderEnded) {
                                                                    e.preventDefault();
                                                                    return;
                                                                }
                                                                e.preventDefault();
                                                                navigateWithTop(`/tender-details/${tender._id}`);
                                                            }}
                                                        >
                                                            <img
                                                                src={(() => {
                                                                    let imageUrl = null;
                                                                    
                                                                    // Try different image sources in priority order
                                                                    if (tender.attachments && tender.attachments.length > 0 && tender.attachments[0].url) {
                                                                        imageUrl = tender.attachments[0].url;
                                                                    } else if (tender.attachments && tender.attachments.length > 0 && tender.attachments[0].path) {
                                                                        imageUrl = tender.attachments[0].path;
                                                                    } else if (tender.thumbs && tender.thumbs.length > 0 && tender.thumbs[0].url) {
                                                                        imageUrl = tender.thumbs[0].url;
                                                                    } else if (tender.images && tender.images.length > 0 && tender.images[0].url) {
                                                                        imageUrl = tender.images[0].url;
                                                                    } else if (tender.image) {
                                                                        imageUrl = tender.image;
                                                                    }
                                                                    
                                                                    if (imageUrl) {
                                                                        if (imageUrl.startsWith('http')) {
                                                                            return imageUrl;
                                                                        } else if (imageUrl.startsWith('/static/')) {
                                                                            const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                                                            return finalUrl;
                                                                        } else if (imageUrl.startsWith('/')) {
                                                                            const finalUrl = `${app.baseURL}${imageUrl.substring(1)}`;
                                                                            return finalUrl;
                                                                        } else {
                                                                            const finalUrl = `${app.baseURL}${imageUrl}`;
                                                                            return finalUrl;
                                                                        }
                                                                    }
                                                                    
                                                                    return DEFAULT_TENDER_IMAGE;
                                                                })()}
                                                                alt={tender.title || "Tender Item"}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    transition: 'transform 0.5s ease',
                                                                    filter: hasTenderEnded ? 'grayscale(100%)' : 'none',
                                                                }}
                                                                onError={(e) => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = DEFAULT_TENDER_IMAGE;
                                                                }}
                                                                crossOrigin="use-credentials"
                                                            />
                                                        </Link>

                                                        {/* Tender Type Badge */}
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
                                                            {tender.tenderType === 'PRODUCT' ? t('common.product') : t('common.service')}
                                                        </div>

                                                        {/* Countdown Timer */}
                                                        <div
                                                            className="countdown-overlay"
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '0',
                                                                left: '0',
                                                                right: '0',
                                                                background: hasTenderEnded ? 'rgba(0, 0, 0, 0.6)' : 'linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), transparent)',
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
                                                                    background: hasTenderEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)',
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {timer.days || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>j</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasTenderEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)',
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {timer.hours || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>h</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasTenderEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)',
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {timer.minutes || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>m</div>
                                                                </div>
                                                                <span style={{ opacity: 0.8 }}>:</span>
                                                                <div style={{
                                                                    background: hasTenderEnded ? 'rgba(100, 100, 100, 0.7)' : 'rgba(255, 255, 255, 0.2)',
                                                                    backdropFilter: 'blur(10px)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    minWidth: '35px',
                                                                    textAlign: 'center',
                                                                }}>
                                                                    {timer.seconds || "00"}
                                                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>s</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Tender Content */}
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
                                                            color: hasTenderEnded ? '#666' : '#333',
                                                            marginBottom: '12px',
                                                            lineHeight: '1.3',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            <Link
                                                                href={hasTenderEnded ? "#" : `/tender-details/${tender._id}`}
                                                                scroll={false}
                                                                style={{ color: 'inherit', textDecoration: 'none', cursor: hasTenderEnded ? 'not-allowed' : 'pointer' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (hasTenderEnded) {
                                                                        e.preventDefault();
                                                                        return;
                                                                    }
                                                                    e.preventDefault();
                                                                    navigateWithTop(`/tender-details/${tender._id}`);
                                                                }}
                                                            >
                                                                {tender.title || 'Tender Title'}
                                                            </Link>
                                                        </h3>

                                                        {/* Quantity and Location Info */}
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: tender?.tenderType === 'SERVICE' ? '1fr' : '1fr 1fr',
                                                            gap: '6px',
                                                            marginBottom: '8px',
                                                        }}>
                                                            {tender?.tenderType !== 'SERVICE' && (
                                                                <div style={{
                                                                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                                    borderRadius: '8px',
                                                                    padding: '4px 8px',
                                                                    border: '1px solid #e9ecef',
                                                                    borderLeft: '3px solid #27F5CC',
                                                                }}>
                                                                    <p style={{
                                                                        fontSize: '10px',
                                                                        color: hasTenderEnded ? '#888' : '#666',
                                                                        margin: '0 0 2px 0',
                                                                        fontWeight: '600',
                                                                    }}>
                                                                        📦 {t('common.quantity')}
                                                                    </p>
                                                                    <p style={{
                                                                        fontSize: '12px',
                                                                        color: hasTenderEnded ? '#888' : '#333',
                                                                        margin: 0,
                                                                        fontWeight: '500',
                                                                    }}>
                                                                        {tender.quantity || t('common.notSpecified')}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <div style={{
                                                                background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                                borderRadius: '8px',
                                                                padding: '4px 8px',
                                                                border: '1px solid #e9ecef',
                                                                borderLeft: '3px solid #27F5CC',
                                                            }}>
                                                                <p style={{
                                                                    fontSize: '10px',
                                                                    color: hasTenderEnded ? '#888' : '#666',
                                                                    margin: '0 0 2px 0',
                                                                    fontWeight: '600',
                                                                }}>
                                                                    📍 {t('common.location')}
                                                                </p>
                                                                <p style={{
                                                                    fontSize: '12px',
                                                                    color: hasTenderEnded ? '#888' : '#333',
                                                                    margin: 0,
                                                                    fontWeight: '500',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}>
                                                                    {(() => {
                                                                      const address = tender.address || '';
                                                                      const location = tender.location || '';
                                                                      const wilaya = tender.wilaya || '';
                                                                      const parts = [address, location, wilaya].filter(Boolean);
                                                                      return parts.length > 0 ? parts.join(', ') : t('common.notSpecified');
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Budget Info */}
                                                        <div style={{
                                                            background: hasTenderEnded ? '#f0f0f0' : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                            borderRadius: '8px',
                                                            padding: '4px 8px',
                                                            marginBottom: '8px',
                                                            border: hasTenderEnded ? '1px solid #e0e0e0' : '1px solid #e9ecef',
                                                            borderLeft: hasTenderEnded ? '3px solid #ccc' : '3px solid #27F5CC',
                                                        }}>
                                                            <p style={{
                                                                fontSize: '10px',
                                                                color: hasTenderEnded ? '#888' : '#666',
                                                                margin: '0 0 2px 0',
                                                                fontWeight: '600',
                                                            }}>
                                                                💰 {t('tenders.budget')}
                                                            </p>
                                                            <p style={{
                                                                fontSize: '12px',
                                                                color: hasTenderEnded ? '#888' : '#27F5CC',
                                                                margin: 0,
                                                                fontWeight: '600',
                                                            }}>
                                                                {Number(tender.maxBudget || tender.budget || 0).toLocaleString()} DA
                                                            </p>
                                                        </div>

                                                        {/* Participants Count */}
                                                        <div style={{
                                                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                                                            borderRadius: '8px',
                                                            padding: '6px 8px',
                                                            marginBottom: '8px',
                                                            border: '1px solid #e9ecef',
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px',
                                                            }}>
                                                                <div style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    background: hasTenderEnded ? '#ccc' : '#27F5CC',
                                                                    animation: hasTenderEnded ? 'none' : 'pulse 2s infinite',
                                                                }}></div>
                                                                <span style={{
                                                                    fontSize: '11px',
                                                                    fontWeight: '600',
                                                                    color: hasTenderEnded ? '#888' : '#27F5CC',
                                                                }}>
                                                                    {tender.participantsCount || 0} {t('tenders.participants')}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    color: hasTenderEnded ? '#888' : '#666',
                                                                }}>
                                                                    {t('tenders.haveSubmitted')}
                                                                </span>
                                                            </div>
                                                        </div>


                                                        {/* Owner Info */}
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            marginBottom: '16px',
                                                        }}>
                                                            <img
                                                                src={tender.owner?.photoURL || DEFAULT_PROFILE_IMAGE}
                                                                alt={displayName}
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    objectFit: 'cover',
                                                                    filter: hasTenderEnded ? 'grayscale(100%)' : 'none',
                                                                }}
                                                                onError={(e) => {
                                                                    const target = e.target;
                                                                    target.src = DEFAULT_PROFILE_IMAGE;
                                                                }}
                                                            />
                                                            <span style={{
                                                                fontSize: '14px',
                                                                color: hasTenderEnded ? '#888' : '#666',
                                                                fontWeight: '500',
                                                            }}>
                                                                {displayName}
                                                            </span>
                                                        </div>

                                                        {/* View Tender Button */}
                                                        <Link
                                                            href={hasTenderEnded ? "#" : `/tender-details/${tender._id}`}
                                                            scroll={false}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                width: '100%',
                                                                padding: '12px 20px',
                                                                background: hasTenderEnded ? '#cccccc' : 'linear-gradient(90deg, #27F5CC, #00D4AA)',
                                                                color: hasTenderEnded ? '#888' : 'white',
                                                                textDecoration: 'none',
                                                                borderRadius: '25px',
                                                                fontWeight: '600',
                                                                fontSize: '14px',
                                                                transition: 'all 0.3s ease',
                                                                boxShadow: hasTenderEnded ? 'none' : '0 4px 12px rgba(39, 245, 204, 0.3)',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!hasTenderEnded) {
                                                                    e.currentTarget.style.background = 'linear-gradient(90deg, #00D4AA, #27F5CC)';
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(39, 245, 204, 0.4)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!hasTenderEnded) {
                                                                    e.currentTarget.style.background = 'linear-gradient(90deg, #27F5CC, #00D4AA)';
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 245, 204, 0.3)';
                                                                }
                                                            }}
                                                            onClick={(event) => {
                                                                if (hasTenderEnded) {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    return;
                                                                }
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                navigateWithTop(`/tender-details/${tender._id}`);
                                                            }}
                                                        >
                                                            {hasTenderEnded ? t('common.finished') : t('tenders.viewDetails')}
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
                            <div className="text-center py-5">
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
                                                {t('tenders.noTendersFound')}
                                            </h3>
                                            <p style={{
                                                fontSize: '16px',
                                                color: '#999',
                                                margin: 0,
                                            }}>
                                                {t('tenders.modifyFiltersOrSearch')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pagination */}
                {filteredTenders && filteredTenders.length > 0 && totalPages > 1 && (
                    <div className="row">
                        <div className="col-lg-12 d-flex justify-content-center">
                            <div className="inner-pagination-area" style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                                <ul className="paginations" style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: 0,
                                    margin: 0,
                                    listStyle: 'none',
                                    flexWrap: 'wrap',
                                    alignItems: 'center'
                                }}>
                                    {/* Previous Button */}
                                    <li className="page-item paginations-button" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <a 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage > 1) {
                                                    setCurrentPage(currentPage - 1);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '45px',
                                                height: '45px',
                                                borderRadius: '50%',
                                                background: currentPage > 1 ? '#f5f5f5' : '#e0e0e0',
                                                color: currentPage > 1 ? '#333' : '#999',
                                                fontWeight: '600',
                                                textDecoration: 'none',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                cursor: currentPage > 1 ? 'pointer' : 'not-allowed',
                                                opacity: currentPage > 1 ? 1 : 0.5,
                                                transform: 'rotate(180deg)'
                                            }}
                                        >
                                            <svg width={16} height={13} viewBox="0 0 16 13" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M15.557 10.1026L1.34284 1.89603M15.557 10.1026C12.9386 8.59083 10.8853 3.68154 12.7282 0.489511M15.557 10.1026C12.9386 8.59083 7.66029 9.2674 5.81744 12.4593" strokeWidth="0.96" strokeLinecap="round" stroke={currentPage > 1 ? '#333' : '#999'} />
                                            </svg>
                                        </a>
                                    </li>

                                    {/* Page Numbers */}
                                    {(() => {
                                        const pages = [];
                                        const maxVisiblePages = 7;
                                        let startPage = 1;
                                        let endPage = totalPages;

                                        // Calculate which pages to show
                                        if (totalPages > maxVisiblePages) {
                                            if (currentPage <= 4) {
                                                // Show first pages
                                                startPage = 1;
                                                endPage = maxVisiblePages;
                                            } else if (currentPage >= totalPages - 3) {
                                                // Show last pages
                                                startPage = totalPages - maxVisiblePages + 1;
                                                endPage = totalPages;
                                            } else {
                                                // Show pages around current
                                                startPage = currentPage - 3;
                                                endPage = currentPage + 3;
                                            }
                                        }

                                        // Add first page and ellipsis if needed
                                        if (startPage > 1) {
                                            pages.push(
                                                <li key={1} className="page-item" style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <a 
                                                        href="#" 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentPage(1);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        style={{
                                                            display: 'flex',
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
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        1
                                                    </a>
                                                </li>
                                            );
                                            if (startPage > 2) {
                                                pages.push(
                                                    <li key="ellipsis-start" style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '0 8px',
                                                        color: '#666'
                                                    }}>
                                                        ...
                                                    </li>
                                                );
                                            }
                                        }

                                        // Add visible page numbers
                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(
                                                <li 
                                                    key={i} 
                                                    className={`page-item ${currentPage === i ? 'active' : ''}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <a 
                                                        href="#" 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentPage(i);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '45px',
                                                            height: '45px',
                                                            borderRadius: '50%',
                                                            background: currentPage === i 
                                                                ? 'linear-gradient(135deg, #0063b1, #00a3e0)' 
                                                                : '#f5f5f5',
                                                            color: currentPage === i ? 'white' : '#333',
                                                            fontWeight: currentPage === i ? '700' : '600',
                                                            textDecoration: 'none',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: currentPage === i 
                                                                ? '0 4px 15px rgba(0, 99, 177, 0.3)' 
                                                                : '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {i}
                                                    </a>
                                                </li>
                                            );
                                        }

                                        // Add last page and ellipsis if needed
                                        if (endPage < totalPages) {
                                            if (endPage < totalPages - 1) {
                                                pages.push(
                                                    <li key="ellipsis-end" style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '0 8px',
                                                        color: '#666'
                                                    }}>
                                                        ...
                                                    </li>
                                                );
                                            }
                                            pages.push(
                                                <li key={totalPages} className="page-item" style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <a 
                                                        href="#" 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentPage(totalPages);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        style={{
                                                            display: 'flex',
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
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {totalPages}
                                                    </a>
                                                </li>
                                            );
                                        }

                                        return pages;
                                    })()}

                                    {/* Next Button */}
                                    <li className="page-item paginations-button" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <a 
                                            href="#" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage < totalPages) {
                                                    setCurrentPage(currentPage + 1);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '45px',
                                                height: '45px',
                                                borderRadius: '50%',
                                                background: currentPage < totalPages ? '#f5f5f5' : '#e0e0e0',
                                                color: currentPage < totalPages ? '#333' : '#999',
                                                fontWeight: '600',
                                                textDecoration: 'none',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                cursor: currentPage < totalPages ? 'pointer' : 'not-allowed',
                                                opacity: currentPage < totalPages ? 1 : 0.5
                                            }}
                                        >
                                            <svg width={16} height={13} viewBox="0 0 16 13" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M15.557 10.1026L1.34284 1.89603M15.557 10.1026C12.9386 8.59083 10.8853 3.68154 12.7282 0.489511M15.557 10.1026C12.9386 8.59083 7.66029 9.2674 5.81744 12.4593" strokeWidth="0.96" strokeLinecap="round" stroke={currentPage < totalPages ? '#333' : '#999'} />
                                            </svg>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    )
}

export default MultipurposeTenderSidebar;