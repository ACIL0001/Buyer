"use client";
import Link from "next/link";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard, FreeMode, Autoplay } from "swiper/modules";
import { CategoryAPI } from '@/app/api/category';
import { AuctionsAPI } from '@/app/api/auctions';
import { TendersAPI } from '@/app/api/tenders';
import { DirectSaleAPI } from '@/app/api/direct-sale';
import { useRouter } from 'next/navigation';
import app from '@/config';
import { FaShoppingBag, FaHandshake } from 'react-icons/fa';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Home1BannerProps = object;

const Home1Banner: React.FC<Home1BannerProps> = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [allAuctions, setAllAuctions] = useState<any[]>([]);
  const [allTenders, setAllTenders] = useState<any[]>([]);
  const [allDirectSales, setAllDirectSales] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await CategoryAPI.getCategories();
        if (response.success && response.data) {
          setAllCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Check screen size for search placeholder
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 480);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch auctions, tenders, and direct sales for search
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const [auctionsRes, tendersRes, directSalesRes] = await Promise.all([
          AuctionsAPI.getAuctions().catch(() => ({ data: [] })),
          TendersAPI.getActiveTenders().catch(() => []),
          DirectSaleAPI.getDirectSales().catch(() => [])
        ]);
        
        const auctions = auctionsRes?.data || auctionsRes || [];
        const tenders = tendersRes?.data || tendersRes || [];
        const directSales = Array.isArray(directSalesRes) ? directSalesRes : [];
        
        setAllAuctions(Array.isArray(auctions) ? auctions : []);
        setAllTenders(Array.isArray(tenders) ? tenders : []);
        setAllDirectSales(Array.isArray(directSales) ? directSales : []);
      } catch (error) {
        console.error('Error fetching search data:', error);
      }
    };
    
    fetchSearchData();
  }, []);

  // Search handler
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 0) {
      setLoadingSearch(true);
      try {
        const lowerQuery = query.toLowerCase();
        
        // Search categories
        const filteredCategories = allCategories.filter((category: any) => 
          category.name.toLowerCase().includes(lowerQuery)
        ).map(cat => ({ ...cat, type: 'category' }));
        
        // Search auctions
        const filteredAuctions = allAuctions.filter((auction: any) => 
          (auction.title || auction.name || '').toLowerCase().includes(lowerQuery)
        ).map(auction => ({ ...auction, type: 'auction' }));
        
        // Search tenders
        const filteredTenders = allTenders.filter((tender: any) => 
          (tender.title || tender.name || '').toLowerCase().includes(lowerQuery)
        ).map(tender => ({ ...tender, type: 'tender' }));
        
        // Search direct sales
        const filteredDirectSales = allDirectSales.filter((directSale: any) => 
          (directSale.title || directSale.name || '').toLowerCase().includes(lowerQuery)
        ).map(directSale => ({ ...directSale, type: 'directSale' }));
        
        // Combine all results
        const combinedResults = [
          ...filteredCategories,
          ...filteredAuctions,
          ...filteredTenders,
          ...filteredDirectSales
        ];
        
        setSearchResults(combinedResults);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const navigateWithTop = useCallback((url: string) => {
    router.push(url, { scroll: false });
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement?.scrollTo?.({ top: 0, behavior: "auto" });
    });
  }, [router]);

  const handleSearchSelect = (item: any) => {
    setSearchQuery(item.title || item.name || '');
    setShowSearchResults(false);
    
    // Navigate based on item type
    if (item.type === 'category') {
      const categoryId = item._id || item.id;
      const categoryName = item.name;
      const categoryUrl = `/category?category=${categoryId}&name=${encodeURIComponent(categoryName)}`;
      navigateWithTop(categoryUrl);
    } else if (item.type === 'auction') {
      const auctionId = item._id || item.id;
      navigateWithTop(`/auction-details/${auctionId}`);
    } else if (item.type === 'tender') {
      const tenderId = item._id || item.id;
      navigateWithTop(`/tender-details/${tenderId}`);
    } else if (item.type === 'directSale') {
      const directSaleId = item._id || item.id;
      navigateWithTop(`/direct-sale/${directSaleId}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSearchSelect(searchResults[0]);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSearchResults && 
          !target.closest('.search-container') && 
          !target.closest('.search-results')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  // Filter categories based on selected type
  const categories = useMemo(() => {
    if (filterType === 'ALL') {
      return allCategories;
    }
    return allCategories.filter(category => {
      const categoryType = category.type?.toUpperCase();
      return categoryType === filterType;
    });
  }, [allCategories, filterType]);

  const categoryCount = categories?.length ?? 0;

  const defaultSlidesPerView = useMemo(() => {
    if (categoryCount === 0) {
      return 1;
    }
    return Math.max(1, Math.min(categoryCount, 3));
  }, [categoryCount]);

  const swiperBreakpoints = useMemo(() => {
    const mobileSlides = Math.max(1, Math.min(categoryCount || 1, 3));
    const tabletSlides = Math.max(1, Math.min(categoryCount || 1, 4));
    const desktopSlides = Math.max(1, Math.min(categoryCount || 1, 4));

    return {
      0: {
        slidesPerView: mobileSlides,
        spaceBetween: 8,
      },
      360: {
        slidesPerView: mobileSlides,
        spaceBetween: 10,
      },
      480: {
        slidesPerView: mobileSlides,
        spaceBetween: 12,
      },
      640: {
        slidesPerView: tabletSlides,
        spaceBetween: 16,
      },
      768: {
        slidesPerView: tabletSlides,
        spaceBetween: 18,
      },
      1024: {
        slidesPerView: desktopSlides,
        spaceBetween: 20,
      },
      1280: {
        slidesPerView: desktopSlides,
        spaceBetween: 22,
      },
      1440: {
        slidesPerView: desktopSlides,
        spaceBetween: 24,
      },
    };
  }, [categoryCount]);

  const getCategoryImageUrl = (category: any): string => {
    // Check if category has thumb with url (matching working implementation)
    if (category.thumb && category.thumb.url) {
      const imageUrl = category.thumb.url;
      
      // If it's already a full URL, return it as-is
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // Replace localhost:3000 with current baseURL if needed
        if (imageUrl.includes('localhost:3000')) {
          return imageUrl.replace('http://localhost:3000', app.baseURL.replace(/\/$/, ''));
        }
        return imageUrl;
      }
      
      // Handle /static/ paths by removing leading slash and prepending baseURL
      if (imageUrl.startsWith('/static/')) {
        return `${app.baseURL}${imageUrl.substring(1)}`;
      }
      
      // Handle other paths starting with /
      if (imageUrl.startsWith('/')) {
        return `${app.baseURL}${imageUrl.substring(1)}`;
      }
      
      // Handle paths without leading slash
      return `${app.baseURL}${imageUrl}`;
    }
    
    // Fallback: try other possible fields
    const imageUrl = category.thumb?.fullUrl || 
                     category.image || 
                     category.thumbnail || 
                     category.photo || 
                     '';
    
    if (!imageUrl) {
      return '/assets/images/cat.avif'; // Fallback image
    }

    // If it's already a full URL, return it as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      if (imageUrl.includes('localhost:3000')) {
        return imageUrl.replace('http://localhost:3000', app.baseURL.replace(/\/$/, ''));
      }
      return imageUrl;
    }

    // Handle relative paths
    if (imageUrl.startsWith('/static/')) {
      return `${app.baseURL}${imageUrl.substring(1)}`;
    }
    
    if (imageUrl.startsWith('/')) {
      return `${app.baseURL}${imageUrl.substring(1)}`;
    }
    
    return `${app.baseURL}${imageUrl}`;
  };

  const navigateToCategory = (category: any, event: React.MouseEvent) => {
    // Prevent navigation if user was dragging the swiper
    if (isDragging || (swiperInstance && swiperInstance.touching)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    const categoryId = category._id || category.id;
    const categoryName = category.name;
    window.location.href = `/category?category=${categoryId}&name=${encodeURIComponent(categoryName)}`;
  };

  return (
    <>
      <style jsx>{`
        .categories-section {
          background: white;
          padding: 0 clamp(12px, 3vw, 24px) clamp(8px, 2vw, 16px) clamp(12px, 3vw, 24px);
          paddingTop: 0;
          margin: 0 auto clamp(8px, 2vw, 16px) auto;
          max-width: 1280px;
          border-radius: clamp(12px, 3vw, 24px);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: clamp(12px, 2vw, 20px);
          gap: clamp(12px, 2vw, 18px);
          flex-wrap: nowrap;
          position: relative;
          padding: 0 clamp(20px, 4vw, 40px);
        }

        .section-title {
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          font-weight: 900;
          background: linear-gradient(135deg, #1e293b 0%, #475569 30%, #64748b 50%, #475569 70%, #1e293b 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          margin: 0;
          letter-spacing: -0.5px;
          position: relative;
          padding: 0 clamp(20px, 4vw, 32px);
          animation: shimmer-text 4s ease-in-out infinite;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          line-height: 1.2;
        }

        @keyframes shimmer-text {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .section-title::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 70%;
          background: linear-gradient(180deg, transparent 0%, #cbd5e1 20%, #94a3b8 50%, #cbd5e1 80%, transparent 100%);
          border-radius: 3px;
          opacity: 0.6;
        }

        .section-title::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 70%;
          background: linear-gradient(180deg, transparent 0%, #cbd5e1 20%, #94a3b8 50%, #cbd5e1 80%, transparent 100%);
          border-radius: 3px;
          opacity: 0.6;
        }

        .filter-buttons {
          display: flex;
          gap: 0;
          align-items: center;
        }

        .filter-button {
          padding: clamp(8px, 1.5vw, 10px) clamp(20px, 3vw, 24px);
          border-radius: 30px;
          font-size: clamp(0.75rem, 1.2vw, 0.9rem);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          color: #495057;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 90px;
        }

        .filter-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .filter-button:hover::before {
          left: 100%;
        }

        .filter-button.product {
          background: linear-gradient(135deg, #0063b1 0%, #005299 50%, #004080 100%);
          background-size: 200% 200%;
          color: white;
          border-color: #0063b1;
          box-shadow: 0 6px 24px rgba(0, 99, 177, 0.35), 
                      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                      inset 0 1px 0 rgba(255, 255, 255, 0.25);
          animation: gradient-shift 3s ease infinite;
        }

        .filter-button.product:hover {
          background: linear-gradient(135deg, #005299 0%, #004080 50%, #003366 100%);
          border-color: #004080;
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 10px 32px rgba(0, 99, 177, 0.5), 
                      0 0 0 1px rgba(255, 255, 255, 0.15) inset,
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .filter-button.product.active {
          animation: pulse-blue 2s ease-in-out infinite, gradient-shift 3s ease infinite;
        }

        .filter-button.service {
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          background-size: 200% 200%;
          color: white;
          border-color: #10b981;
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.35), 
                      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                      inset 0 1px 0 rgba(255, 255, 255, 0.25);
          animation: gradient-shift 3s ease infinite;
        }

        .filter-button.service:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%);
          border-color: #047857;
          transform: translateY(-4px) scale(1.08);
          box-shadow: 0 10px 32px rgba(16, 185, 129, 0.5), 
                      0 0 0 1px rgba(255, 255, 255, 0.15) inset,
                      inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .filter-button.service.active {
          animation: pulse-green 2s ease-in-out infinite, gradient-shift 3s ease infinite;
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .filter-button:not(.product):not(.service):hover {
          background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
          border-color: #ced4da;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
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

        .categories-carousel {
          position: relative;
          padding: 10px clamp(20px, 3vw, 32px) clamp(8px, 1.5vw, 14px);
          border-radius: clamp(12px, 2.5vw, 20px);
          transition: background 0.3s ease;
          margin: clamp(8px, 2vw, 16px) 0;
          overflow: visible;
          /* Add z-index for stacking context */
          z-index: 0;
        }

        /* --- UPDATED STYLES FOR CONNECTING LINE --- */
        .categories-carousel::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          /* --- MODIFIED LINE --- */
          /* Positioned higher to align with card centers */
          top: 40%;
          transform: translateY(-50%);
          height: 96px; 
          /* Default 'ALL' filter color */
          background-color: #cbd5e1;
          /* Sits BEHIND the swiper slides */
          z-index: -1; 
          transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s ease;
        }

        .categories-carousel.filter-product::before {
          /* Blue color from the 'Produit' button */
          background-color: #0063b1;
        }

        .categories-carousel.filter-service::before {
          /* Green color from the 'Service' button */
          background-color: #10b981;
        }
        /* --- END OF UPDATED STYLES --- */

        .category-card-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(6px, 1.5vw, 10px);
          margin-bottom: clamp(6px, 2vw, 12px);
          height: 100%;
          position: relative;
          transform: scale(0.95);
        }

        .categories-swiper {
          overflow: visible !important;
        }

        .categories-swiper .swiper-wrapper {
          overflow: visible !important;
        }

        .categories-swiper .swiper-slide {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: visible !important;
        }

        .category-card {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: #f3f4f6;
        }
        

        .category-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          top: 0;
          left: 0;
        }

        .category-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, transparent 50%, transparent 100%);
        }

        .category-name {
          position: static;
          transform: none;
          color: #111827;
          font-size: clamp(0.75rem, 1.3vw, 0.9rem);
          font-weight: 700;
          text-shadow: none;
          z-index: auto;
          line-height: 1.3;
          opacity: 1;
          text-align: center;
          max-width: 95%;
          padding: clamp(4px, 1vw, 8px) clamp(10px, 2.5vw, 14px);
          word-wrap: break-word;
          overflow-wrap: anywhere;
          letter-spacing: 0.15px;
          background: rgba(255, 255, 255, 0.94);
          border-radius: clamp(8px, 2vw, 12px);
          display: inline-block;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          margin-top: clamp(4px, 1.2vw, 8px);
        }



        /* Pagination dots */
        .swiper-pagination {
          position: relative;
          margin-top: clamp(40px, 5vw, 50px) !important;
          bottom: auto !important;
        }

        .swiper-pagination-bullet {
          width: 6px !important;
          height: 6px !important;
          background: #cbd5e1 !important;
          opacity: 0.6 !important;
          transition: all 0.3s ease;
          margin: 0 3px !important;
        }

        .swiper-pagination-bullet-active {
          background: #0063b1 !important;
          opacity: 1 !important;
          width: 14px !important;
          border-radius: 5px !important;
        }

        .swiper-pagination-bullet-active-main {
          background: #0063b1;
        }

        .swiper-pagination-bullet-active-prev,
        .swiper-pagination-bullet-active-next {
          background: #94a3b8;
          opacity: 0.8;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px 20px;
          color: #6b7280;
          font-size: 1.1rem;
        }

        .empty-state {
            text-align: center;
          padding: 60px 20px;
          color: #6b7280;
          font-size: 1.1rem;
        }

        /* Extra Small Devices (phones, 320px-479px) */
        @media (max-width: 479px) {
          .categories-section {
            padding: 0 clamp(12px, 3vw, 16px) clamp(12px, 3vw, 20px) clamp(12px, 3vw, 16px);
            paddingTop: 0;
            margin-bottom: clamp(12px, 3vw, 20px);
            border-radius: clamp(12px, 3vw, 20px);
          }
          

          .section-header {
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: center;
            align-items: center;
            gap: clamp(6px, 2vw, 10px);
            margin-bottom: clamp(10px, 2vw, 16px);
            padding: 0 clamp(12px, 3vw, 18px);
          }

          .section-title {
            font-size: clamp(1.05rem, 3.8vw, 1.3rem);
            padding: 0 clamp(12px, 3vw, 16px);
            width: auto;
            margin: 0;
          }

          .filter-button {
            padding: clamp(8px, 2vw, 10px) clamp(14px, 4vw, 18px);
            font-size: clamp(0.75rem, 3vw, 0.85rem);
            min-width: auto;
            flex: 0 0 auto;
          }

          .categories-carousel {
            padding: 10px clamp(14px, 4vw, 18px);
          }
          
          /* --- MODIFICATION FOR MOBILE LINE THICKNESS --- */
          .categories-carousel::before {
            height: 64px; 
          }
          /* --- END OF MODIFICATION --- */


          .category-card {
            border-radius: clamp(12px, 3vw, 16px);
          }

          .category-card-wrapper {
            gap: clamp(6px, 2vw, 10px);
          }

          .category-name {
            font-size: clamp(0.75rem, 2.5vw, 0.95rem);
            padding: clamp(2px, 0.8vw, 6px) clamp(6px, 2vw, 10px) 0;
            max-width: 100%;
            letter-spacing: 0.15px;
          }

          .swiper-pagination {
            margin-top: clamp(50px, 12vw, 65px) !important;
            margin-bottom: 0.7px !important;
          }

          .swiper-pagination-bullet {
            width: clamp(4px, 1.6vw, 6px) !important;
            height: clamp(4px, 1.6vw, 6px) !important;
            margin: 0 clamp(1px, 0.5vw, 2px) !important;
          }

          .swiper-pagination-bullet-active {
            width: clamp(8px, 2.6vw, 12px) !important;
          }
        }

        /* Small Devices (phones, 480px-639px) */
        @media (min-width: 480px) and (max-width: 639px) {
          .categories-section {
            padding: 0 clamp(16px, 3.5vw, 24px) clamp(16px, 3.5vw, 24px) clamp(16px, 3.5vw, 24px);
            paddingTop: 0;
          }

          .section-header {
            gap: clamp(12px, 2.5vw, 18px);
            margin-bottom: clamp(12px, 2.5vw, 18px);
            padding: 0 clamp(16px, 3.5vw, 24px);
          }

          .section-title {
            font-size: clamp(1.4rem, 3.5vw, 1.8rem);
            padding: 0 clamp(20px, 4vw, 32px);
          }

          .filter-button {
            padding: clamp(10px, 2.5vw, 12px) clamp(20px, 4vw, 24px);
            font-size: clamp(0.8rem, 2vw, 0.95rem);
            min-width: 100px;
          }

          .categories-carousel {
            padding: 10px clamp(35px, 7vw, 45px);
          }
          
          /* --- MODIFICATION FOR MOBILE LINE THICKNESS --- */
          .categories-carousel::before {
            height: 80px; 
          }
          /* --- END OF MODIFICATION --- */


          .category-name {
            font-size: clamp(0.85rem, 2.5vw, 1rem);
            top: clamp(12px, 2vw, 16px);
          }
        }

        /* Medium Devices (tablets, 640px-767px) */
        @media (min-width: 640px) and (max-width: 767px) {
          .categories-section {
            padding: 0 clamp(20px, 3.5vw, 32px) clamp(20px, 3.5vw, 32px) clamp(20px, 3.5vw, 32px);
            paddingTop: 0;
          }

          .section-header {
            gap: clamp(20px, 3.5vw, 28px);
          }

          .section-title {
            font-size: clamp(1.6rem, 3.5vw, 2rem);
          }

          .filter-button {
            padding: clamp(11px, 2vw, 12px) clamp(24px, 4vw, 26px);
            font-size: clamp(0.85rem, 1.8vw, 0.95rem);
          }

          .categories-carousel {
            padding: 10px clamp(40px, 6vw, 50px);
          }
        }

        /* Large Devices (tablets, 768px-1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .categories-section {
            padding: 0 clamp(24px, 3.5vw, 36px) clamp(24px, 3.5vw, 36px) clamp(24px, 3.5vw, 36px);
            paddingTop: 0;
          }

          .section-header {
            gap: clamp(24px, 3.5vw, 30px);
          }

          .section-title {
            font-size: clamp(1.8rem, 3.5vw, 2.1rem);
          }

          .categories-carousel {
            padding: 10px 45px;
          }
        }

        /* Extra Large Devices (desktops, 1024px-1279px) */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .categories-section {
            padding: 0 clamp(28px, 3.5vw, 40px) clamp(28px, 3.5vw, 40px) clamp(28px, 3.5vw, 40px);
            paddingTop: 0;
          }

          .categories-carousel {
            padding: 10px 48px;
          }
        }

        /* XXL Devices (large desktops, 1280px+) */
        @media (min-width: 1280px) {
          .categories-section {
            padding: 0 clamp(32px, 3.5vw, 40px) clamp(32px, 3.5vw, 40px) clamp(32px, 3.5vw, 40px);
            paddingTop: 0;
          }

          .categories-carousel {
            padding: 10px 50px;
          }
        }

        /* Ultra Wide Screens (1440px+) */
        @media (min-width: 1440px) {
          .categories-section {
            max-width: 1600px;
          }
        }

        /* Landscape Orientation */
        @media (orientation: landscape) and (max-height: 500px) {
          .categories-section {
            padding: 0 clamp(16px, 3vw, 24px) clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px);
            paddingTop: 0;
          }

          .section-header {
            margin-bottom: clamp(12px, 2vw, 20px);
          }

          .categories-carousel {
            padding: 10px clamp(30px, 5vw, 40px);
          }
          
          .categories-carousel::before {
            height: 64px; 
          }
        }
      `}</style>
      {/* Global styles for Swiper navigation buttons - must be outside styled-jsx */}
      <style dangerouslySetInnerHTML={{__html: `
        .categories-swiper {
          overflow: visible !important;
        }
        
        .categories-swiper .swiper-wrapper {
          overflow: visible !important;
        }
        
        .categories-swiper .swiper-slide {
          overflow: visible !important;
        }
        
        .categories-swiper .swiper-button-next,
        .categories-swiper .swiper-button-prev {
          width: clamp(28px, 5vw, 38px) !important;
          height: clamp(28px, 5vw, 38px) !important;
          background: white !important;
          border-radius: 50% !important;
          color: #1e293b !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          transition: all 0.3s ease !important;
          border: none !important;
          margin-top: 0 !important;
          /* --- MODIFIED LINE --- */
          /* Positioned higher to align with card centers */
          top: 40% !important;
          transform: translateY(-50%) !important;
        }

        .categories-swiper .swiper-button-next:hover,
        .categories-swiper .swiper-button-prev:hover {
          background: white !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
          /* --- MODIFIED LINE --- */
          transform: translateY(-50%) scale(1.1) !important;
        }

        .categories-swiper .swiper-button-next::after,
        .categories-swiper .swiper-button-prev::after {
          font-family: none !important;
          font-size: 0 !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
          font-variant: normal !important;
          line-height: 1 !important;
          width: clamp(20px, 4vw, 28px) !important;
          height: clamp(20px, 4vw, 28px) !important;
          display: block !important;
          background: none !important;
          border: none !important;
          content: '' !important;
        }

        @media (max-width: 479px) {
          .categories-swiper .swiper-button-next,
          .categories-swiper .swiper-button-prev {
            width: 28px !important;
            height: 28px !important;
          }

          .categories-swiper .swiper-button-next::after,
          .categories-swiper .swiper-button-prev::after {
            width: 20px !important;
            height: 20px !important;
          }
        }

        @media (min-width: 480px) and (max-width: 767px) {
          .categories-swiper .swiper-button-next,
          .categories-swiper .swiper-button-prev {
            width: 32px !important;
            height: 32px !important;
          }

          .categories-swiper .swiper-button-next::after,
          .categories-swiper .swiper-button-prev::after {
            width: 24px !important;
            height: 24px !important;
          }
        }

        .categories-swiper .swiper-button-prev::after {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M15 12H9M9 12L12 9M9 12L12 15' stroke='%231e293b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E") !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
        }

        .categories-swiper .swiper-button-next::after {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M9 12H15M15 12L12 9M15 12L12 15' stroke='%231e293b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E") !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
        }

        .categories-swiper .swiper-button-next {
          right: 0 !important;
        }

        .categories-swiper .swiper-button-prev {
          left: 0 !important;
        }
      `}} />
      <div className="categories-section">
        {/* Search Bar - On top of categories */}
        <div 
          className="search-container"
          style={{
            position: 'relative',
            maxWidth: 'clamp(300px, 90vw, 600px)',
            margin: 'clamp(2px, 0.5vw, 4px) auto clamp(12px, 2.5vw, 20px) auto',
            width: '100%',
            padding: '0 clamp(12px, 3vw, 20px)',
            zIndex: 10,
          }}
        >
          <form onSubmit={handleSearchSubmit}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: 'clamp(30px, 8vw, 50px)',
              padding: 'clamp(2px, 1vw, 4px)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            }}>
              {/* Search Icon */}
              <div style={{
                padding: 'clamp(8px, 2vw, 12px) clamp(10px, 2.5vw, 16px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="clamp(18px, 4vw, 20px)" height="clamp(18px, 4vw, 20px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              
              {/* Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                placeholder={isSmallScreen ? t('home.searchPlaceholderShort') : t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#1e293b',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  padding: 'clamp(8px, 2vw, 12px) 0',
                  fontWeight: '500',
                  minWidth: 0,
                }}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
              />
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div 
              ref={searchResultsRef}
              className="search-results"
              style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                marginTop: '8px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((item: any, index: number) => {
                const itemName = item.name || item.title || '';
                const itemId = item._id || item.id || index;
                const isCategory = item.type === 'category';
                const isAuction = item.type === 'auction';
                const isTender = item.type === 'tender';
                const isDirectSale = item.type === 'directSale';
                
                return (
                  <div
                    key={`${item.type}-${itemId}`}
                    onClick={() => handleSearchSelect(item)}
                    style={{
                      padding: 'clamp(12px, 2.5vw, 16px) clamp(14px, 3vw, 20px)',
                      cursor: 'pointer',
                      borderBottom: index < searchResults.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                      transition: 'all 0.3s ease',
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(8px, 2vw, 12px)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.color = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#1e293b';
                    }}
                  >
                    {isCategory && (
                      item.thumb?.url || item.thumb?.fullUrl || item.image ? (
                        <img
                          src={getCategoryImageUrl(item)}
                          alt={item.name}
                          style={{
                            width: 'clamp(20px, 4vw, 24px)',
                            height: 'clamp(20px, 4vw, 24px)',
                            borderRadius: 'clamp(4px, 1vw, 6px)',
                            objectFit: 'cover',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/assets/images/cat.avif';
                          }}
                        />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                      )
                    )}
                    {isAuction && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM17 13H13V17H11V13H7V11H13V7H13V11H17V13Z"/>
                      </svg>
                    )}
                    {isTender && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.09 0 2.13.2 3.1.56"/>
                        <path d="M21 3l-6 6-4-4"/>
                      </svg>
                    )}
                    {isDirectSale && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
                      </svg>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '500' }}>{itemName}</span>
                      <span style={{ 
                        fontSize: '11px', 
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {isCategory && t('home.searchResultCategory')}
                        {isAuction && t('home.searchResultAuction')}
                        {isTender && t('home.searchResultTender')}
                        {isDirectSale && t('home.searchResultDirectSale')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results Message */}
          {showSearchResults && searchResults.length === 0 && searchQuery.length > 0 && !loadingSearch && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              right: '0',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '16px',
              marginTop: '8px',
              padding: '20px',
              textAlign: 'center',
              color: '#64748b',
              zIndex: 1000,
            }}>
              {t('home.searchNoResults')} "{searchQuery}"
            </div>
          )}
          
          {/* Loading Message */}
          {loadingSearch && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              right: '0',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '16px',
              marginTop: '8px',
              padding: '20px',
              textAlign: 'center',
              color: '#64748b',
              zIndex: 1000,
            }}>
              {t('home.searchLoading')}
            </div>
          )}
        </div>

        <div className="section-header">
          <button
            className={`filter-button product ${filterType === 'PRODUCT' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'PRODUCT' ? 'ALL' : 'PRODUCT')}
          >
            {t('common.product')}
          </button>
          <h2 className="section-title">{t('home.categories')}</h2>
          <button
            className={`filter-button service ${filterType === 'SERVICE' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'SERVICE' ? 'ALL' : 'SERVICE')}
          >
            {t('common.service')}
          </button>
                </div>
        {loading ? (
          <div className="loading-state">{t('home.loadingCategories')}</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">{t('home.noCategoriesAvailable')}</div>
        ) : (
          <div className={`categories-carousel filter-${filterType.toLowerCase()}`}>
            <Swiper
              modules={[Navigation, Pagination, Mousewheel, Keyboard, FreeMode, Autoplay]}
              navigation={true}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              autoplay={{
                delay: 1500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={categoryCount > defaultSlidesPerView}
              speed={500}
              mousewheel={{
                forceToAxis: true,
                sensitivity: 1,
                releaseOnEdges: true,
              }}
              keyboard={{
                enabled: true,
                onlyInViewport: true,
              }}
              freeMode={{
                enabled: true,
                sticky: false,
                momentumRatio: 0.5,
                momentumVelocityRatio: 0.5,
              }}
              grabCursor={true}
              spaceBetween={16}
              slidesPerView={defaultSlidesPerView}
              breakpoints={swiperBreakpoints}
              onSwiper={setSwiperInstance}
              onTouchStart={() => setIsDragging(false)}
              onTouchMove={() => setIsDragging(true)}
              onTouchEnd={() => {
                setTimeout(() => setIsDragging(false), 50);
              }}
              onSliderMove={() => setIsDragging(true)}
              onSlideChangeTransitionStart={() => setIsDragging(true)}
              onSlideChangeTransitionEnd={() => {
                setTimeout(() => setIsDragging(false), 100);
              }}
              className="categories-swiper"
            >
              {categories.map((category) => {
                const categoryType = category.type?.toUpperCase() || 'PRODUCT';
                const isProduct = categoryType === 'PRODUCT';
                const isService = categoryType === 'SERVICE';
                
                return (
                  <SwiperSlide key={category._id || category.id}>
                    <div className="category-card-wrapper">
                      <div 
                        className="category-card"
                        onClick={(e) => navigateToCategory(category, e)}
                      >
                      <img
                        src={getCategoryImageUrl(category)}
                        alt={category.name}
                        className="category-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/assets/images/cat.avif';
                        }}
                      />
                      <div className="category-overlay"></div>
                      </div>
                      <div className="category-name">{category.name}</div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
                    </div>
        )}
      </div>
    </>
  );
};

export default Home1Banner;