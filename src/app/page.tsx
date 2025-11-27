"use client";

import Header from "@/components/header/Header"
import Home1Banner from "@/components/banner/Home1Banner";
import Home1LiveAuction from "@/components/live-auction/Home1LiveAuction";
import Home1LiveTenders from "@/components/live-tenders/Home1LiveTenders";
import Home1LiveDirectSales from "@/components/live-direct-sales/Home1LiveDirectSales";
// import Home1Category from "@/components/category/Home1Category"; // Commented out - not needed
import Footer from "@/components/footer/FooterWithErrorBoundary";
import RequestProvider from "@/contexts/RequestContext";

import { useEffect, useState, useRef, useCallback } from "react";
import { SnackbarProvider, useSnackbar } from 'notistack';
import useAuth from '@/hooks/useAuth';
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import './style.css'
import SocketProvider from "@/contexts/socket";
import { useCreateSocket } from '@/contexts/socket';
import { getSellerUrl } from '@/config';
import app from '@/config';
import { CategoryAPI } from '@/app/api/category';
import { AuctionsAPI } from '@/app/api/auctions';
import { TendersAPI } from '@/app/api/tenders';
import { useRouter } from 'next/navigation';
import ResponsiveTest from '@/components/common/ResponsiveTest';
import { FaGavel } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const { initializeAuth, isLogged, auth } = useAuth();
  const router = useRouter();
  const [animatedSections, setAnimatedSections] = useState({
    banner: false,
    category: false,
    auction: false
  });
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(112); // Default desktop height
  
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      const small = width < 480;
      setIsMobile(mobile);
      setIsSmallScreen(small);
      
      // Calculate header height based on screen size
      // Header structure: padding (8px mobile, 16px desktop) + height (56-80px) + safe area
      let calculatedHeight = 112; // Default desktop
      if (width <= 375) {
        // Small mobile: 16px padding + 56px height = 72px
        calculatedHeight = 72;
      } else if (width <= 768) {
        // Mobile: 16px padding + 60px height = 76px
        calculatedHeight = 76;
      } else if (width <= 1024) {
        // Tablet: 32px padding + 70px height = 102px
        calculatedHeight = 102;
      } else {
        // Desktop: 32px padding + 80px height = 112px
        calculatedHeight = 112;
      }
      
      // Add safe area inset top if available
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0', 10) || 0;
      const totalHeight = calculatedHeight + safeAreaTop;
      setHeaderHeight(totalHeight);
      
      // Set CSS variable for use in other components
      document.documentElement.style.setProperty('--header-height', `${totalHeight}px`);
      
      // On mobile, immediately show all sections without animations
      if (mobile) {
        setAnimatedSections({
          banner: true,
          category: true,
          auction: true
        });
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // State for dropdown menus
  const [auctionDropdownOpen, setAuctionDropdownOpen] = useState(false);
  const [tenderDropdownOpen, setTenderDropdownOpen] = useState(false);
  const [venteDirectDropdownOpen, setVenteDirectDropdownOpen] = useState(false);

  // State for search (categories, auctions, tenders)
  const [categories, setCategories] = useState<any[]>([]);
  const [allAuctions, setAllAuctions] = useState<any[]>([]);
  const [allTenders, setAllTenders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Scroll functions
  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const handleAuctionViewAll = () => {
    setAuctionDropdownOpen(false);
    scrollToSection('auction');
  };

  const handleTenderViewAll = () => {
    setTenderDropdownOpen(false);
    scrollToSection('tenders');
  };

  const handleVenteDirectViewAll = () => {
    setVenteDirectDropdownOpen(false);
    scrollToSection('direct-sales');
  };

  const handleCreateAuction = () => {
    setAuctionDropdownOpen(false);
    window.location.href = `${getSellerUrl()}dashboard/auctions/create`;
  };

  const handleCreateTender = () => {
    setTenderDropdownOpen(false);
    window.location.href = `${getSellerUrl()}dashboard/tenders/create`;
  };

  const handleCreateVenteDirect = () => {
    setVenteDirectDropdownOpen(false);
    window.location.href = `${getSellerUrl()}dashboard/direct-sales/create`;
  };

  // Helper function to get category image URL
  const getCategoryImageUrl = (category: any): string => {
    // Try to get image from thumb.url, thumb.fullUrl, or other possible fields
    const imageUrl = category.thumb?.url || 
                     category.thumb?.fullUrl || 
                     category.image || 
                     category.thumbnail || 
                     category.photo || 
                     '';
    
    if (!imageUrl) {
      return '/assets/images/cat.avif'; // Fallback image
    }

    // If it's already a full URL, return it as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Replace localhost:3000 with current baseURL if needed
      if (imageUrl.includes('localhost:3000')) {
        const baseURL = app.baseURL || 'http://localhost:3000/';
        return imageUrl.replace('http://localhost:3000', baseURL.replace(/\/$/, ''));
      }
      return imageUrl;
    }

    // Clean the URL - remove leading slash if present
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    
    // Construct full URL from baseURL
    const baseURL = (app.baseURL || 'http://localhost:3000/').replace(/\/$/, ''); // Remove trailing slash
    
    // First try: direct path with baseURL
    // If the URL contains 'static', use it as-is
    if (cleanUrl.includes('static/') || cleanUrl.startsWith('static/')) {
      return `${baseURL}/${cleanUrl}`;
    }
    
    // Try common paths - most likely: /static/filename
    return `${baseURL}/static/${cleanUrl}`;
  };

  // Category search functions
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await CategoryAPI.getCategories();
      console.log('Categories API response:', response);
      if (response.success && response.data) {
        setCategories(response.data);
        console.log('Categories loaded:', response.data.length);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 0) {
      setLoadingSearch(true);
      try {
        const lowerQuery = query.toLowerCase();
        
        // Search categories
        const filteredCategories = categories.filter((category: any) => 
          category.name.toLowerCase().includes(lowerQuery)
        ).map(cat => ({ ...cat, type: 'category' }));
        
        // Search auctions by name/title
        const filteredAuctions = allAuctions.filter((auction: any) => 
          (auction.title || auction.name || '').toLowerCase().includes(lowerQuery)
        ).map(auction => ({ ...auction, type: 'auction' }));
        
        // Search tenders by name/title
        const filteredTenders = allTenders.filter((tender: any) => 
          (tender.title || tender.name || '').toLowerCase().includes(lowerQuery)
        ).map(tender => ({ ...tender, type: 'tender' }));
        
        // Combine all results
        const combinedResults = [
          ...filteredCategories,
          ...filteredAuctions,
          ...filteredTenders
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
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSearchSelect(searchResults[0]);
    }
  };

  // Fetch auctions and tenders on component mount for search
  useEffect(() => {
    const fetchAuctionsAndTenders = async () => {
      try {
        const [auctionsRes, tendersRes] = await Promise.all([
          AuctionsAPI.getAuctions().catch(() => ({ data: [] })),
          TendersAPI.getActiveTenders().catch(() => [])
        ]);
        
        // Handle different response structures
        const auctions = auctionsRes?.data || auctionsRes || [];
        const tenders = tendersRes?.data || tendersRes || [];
        
        setAllAuctions(Array.isArray(auctions) ? auctions : []);
        setAllTenders(Array.isArray(tenders) ? tenders : []);
      } catch (error) {
        console.error('Error fetching auctions and tenders for search:', error);
      }
    };
    
    fetchAuctionsAndTenders();
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Close dropdowns and search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside dropdown containers
      if (!target.closest('.dropdown-container')) {
        setAuctionDropdownOpen(false);
        setTenderDropdownOpen(false);
        setVenteDirectDropdownOpen(false);
      }
      
      // Check if click is outside search results
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

  // Refs for scroll animations
  const bannerRef = useRef(null);
  const categoryRef = useRef(null);
  const auctionRef = useRef(null);



  // Snackbar for socket errors
  const { enqueueSnackbar } = useSnackbar();
  const socketContext = useCreateSocket();
  const socketError = socketContext?.socketError;
  const setSocketError = socketContext?.setSocketError;

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);



  useEffect(() => {
    if (socketError) {
      enqueueSnackbar(socketError, { variant: 'error' });
      if (setSocketError) {
        setSocketError(null);
      }
    }
  }, [socketError, enqueueSnackbar, setSocketError]);

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId) {
            setAnimatedSections(prev => ({
              ...prev,
              [sectionId]: true
            }));
          }
        }
      });
    }, observerOptions);

    // Observe sections
    if (bannerRef.current) observer.observe(bannerRef.current);
    if (categoryRef.current) observer.observe(categoryRef.current);
    if (auctionRef.current) observer.observe(auctionRef.current);

    // Fallback: Force visibility after 2 seconds if still not visible
    const fallbackTimer = setTimeout(() => {
      console.log('⏰ Fallback timer triggered, forcing section visibility');
      setAnimatedSections(prev => ({
        banner: prev.banner || true,
        category: prev.category || true,
        auction: prev.auction || true
      }));
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        /* Global styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Hero Banner Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }

        .hero-banner-section {
          position: relative;
          overflow: visible;
          min-height: 700px;
        }

        .hero-content {
          padding-bottom: 150px;
        }

        .hero-background {
          transition: transform 0.1s ease-out;
        }

        .floating-card {
          animation: float 6s ease-in-out infinite;
        }

        .floating-card:nth-child(2) {
          animation-delay: -3s;
        }

        /* Mouse tracking effect */
        .hero-background:hover {
          transform: scale(1.05) translate(var(--mouse-x, 0px), var(--mouse-y, 0px));
        }
        
        :root {
          --primary-color: #1e40af;
          --primary-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 12%, #334155 24%, #1e3a8a 36%, #1e40af 48%, #2563eb 60%, #3b82f6 72%, #60a5fa 84%, #93c5fd 96%, #dbeafe 100%);
          --secondary-color: #0ea5e9;
          --accent-gradient: linear-gradient(135deg, #1e40af 0%, #2563eb 20%, #3b82f6 40%, #60a5fa 60%, #93c5fd 80%, #dbeafe 100%);
          --tertiary-gradient: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 25%, rgba(59, 130, 246, 0.6) 50%, rgba(147, 197, 253, 0.4) 75%, rgba(219, 234, 254, 0.2) 100%);
          --text-color: #1f2937;
          --bg-color: #ffffff;
          --accent-color: #f8fafc;
          --shadow-sm: 0 2px 8px rgba(30, 64, 175, 0.08);
          --shadow-md: 0 4px 20px rgba(30, 64, 175, 0.12);
          --shadow-lg: 0 8px 30px rgba(30, 64, 175, 0.16);
          --shadow-xl: 0 12px 40px rgba(30, 64, 175, 0.2);
          --transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --transition-fast: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --border-radius: 16px;
          --border-radius-lg: 24px;
          --border-radius-xl: 32px;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: var(--text-color);
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          overflow-x: hidden;
          scroll-behavior: smooth;
          width: 100%;
          max-width: 100vw;
          margin: 0;
          padding: 0;
        }
        
        .container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          overflow-x: hidden;
        }
        
        /* Enhanced Animation Keyframes */
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes morphBlob {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: rotate(0deg) scale(1);
          }
          25% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: rotate(90deg) scale(1.1);
          }
          50% {
            border-radius: 50% 40% 60% 30% / 70% 50% 40% 60%;
            transform: rotate(180deg) scale(0.9);
          }
          75% {
            border-radius: 40% 70% 50% 60% / 30% 40% 60% 50%;
            transform: rotate(270deg) scale(1.05);
          }
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes smoothGradient {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 200%;
          }
        }
        
        @keyframes gentleFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes animatedGradient {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          100% {
            background-position: 0% 0%;
          }
        }

        @keyframes magneticPull {
          0% {
            transform: translate(0, 0) scale(1);
          }
          100% {
            transform: translate(var(--mouse-pull-x, 0), var(--mouse-pull-y, 0)) scale(1.05);
          }
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(0, 99, 177, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(0, 99, 177, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(0, 99, 177, 0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -468px 0;
          }
          100% {
            background-position: 468px 0;
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes rotateIn {
          from {
            opacity: 0;
            transform: rotate(-200deg);
          }
          to {
            opacity: 1;
            transform: rotate(0);
          }
        }
        
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes flipInX {
          from {
            opacity: 0;
            transform: perspective(400px) rotateX(90deg);
          }
          40% {
            transform: perspective(400px) rotateX(-20deg);
          }
          60% {
            transform: perspective(400px) rotateX(10deg);
          }
          80% {
            transform: perspective(400px) rotateX(-5deg);
          }
          to {
            opacity: 1;
            transform: perspective(400px) rotateX(0deg);
          }
        }
        
        @keyframes lightSpeedIn {
          from {
            opacity: 0;
            transform: translate3d(100%, 0, 0) skewX(-30deg);
          }
          60% {
            opacity: 1;
            transform: translate3d(-20%, 0, 0) skewX(30deg);
          }
          80% {
            transform: translate3d(0%, 0, 0) skewX(-15deg);
          }
          to {
            opacity: 1;
            transform: translate3d(0%, 0, 0) skewX(0deg);
          }
        }
        
        /* Enhanced Utility classes */
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-slide-left {
          animation: slideInLeft 0.8s ease-out;
        }
        
        .animate-slide-right {
          animation: slideInRight 0.8s ease-out;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-bounce-in {
          animation: bounceIn 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slideInUp 0.8s ease-out;
        }
        
        .animate-rotate-in {
          animation: rotateIn 0.8s ease-out;
        }
        
        .animate-zoom-in {
          animation: zoomIn 0.8s ease-out;
        }
        
        .animate-flip-in {
          animation: flipInX 0.8s ease-out;
        }
        
        .animate-light-speed {
          animation: lightSpeedIn 0.8s ease-out;
        }
        
        .section-spacing {
          margin-bottom: 0;
          position: relative;
        }
        
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 99, 177, 0.1), transparent);
          margin: 40px 0;
        }
        
        .text-gradient {
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 600;
          transition: var(--transition);
          cursor: pointer;
          border: none;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .btn:hover::before {
          left: 100%;
        }
        
        .btn:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }
        
        .btn-primary {
          background: var(--primary-gradient);
          background-size: 200% 200%;
          color: white;
          box-shadow: var(--shadow-md);
          position: relative;
          overflow: hidden;
          animation: gradientShift 3s ease infinite;
        }
        
        .btn-primary:hover {
          box-shadow: var(--shadow-xl);
          transform: translateY(-4px) scale(1.02);
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transition: left 0.5s ease;
        }

        .btn-primary:hover::after {
          left: 100%;
        }
        
        .btn-light {
          background: white;
          color: var(--text-color);
          box-shadow: var(--shadow-sm);
        }
        
        .card {
          background: white;
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-5px);
          border-color: rgba(0, 99, 177, 0.1);
        }
        
        /* Loading skeleton */
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        /* Scroll animations */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.6s ease;
        }
        
        .scroll-reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Staggered animations */
        .stagger-item {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
        }
        
        .stagger-item.animate {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Enhanced responsive design */
        /* Extra Small Devices (320px-479px) */
        @media (max-width: 479px) {
          .container {
            padding: 0 clamp(12px, 3vw, 16px);
          }
          
          .section-spacing {
            margin-bottom: clamp(24px, 5vw, 32px);
            padding: clamp(20px, 4vw, 32px) clamp(12px, 3vw, 20px);
          }

          .hero-banner-section {
            padding: clamp(12px, 3vw, 20px) clamp(12px, 3vw, 16px) !important;
            paddingTop: clamp(12px, 3vw, 20px) !important;
            paddingBottom: clamp(50px, 12vw, 110px) !important;
            min-height: 520px !important;
            overflow: visible !important;
          }

          .hero-content {
            padding-bottom: 50px !important;
          }

          .hero-content {
            max-width: 100% !important;
            padding: 0 clamp(8px, 2vw, 12px) !important;
            padding-bottom: 50px !important;
          }

          .search-container {
            max-width: 100% !important;
            padding: 0 clamp(8px, 2vw, 12px) !important;
          }

          .hero-cta-buttons {
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: stretch !important;
            justify-content: center !important;
            gap: clamp(8px, 3vw, 12px) !important;
            marginTop: clamp(16px, 4vw, 24px) !important;
          }

          .dropdown-container {
            flex: 1 1 calc(33.333% - clamp(8px, 3vw, 12px)) !important;
            max-width: calc(33.333% - clamp(8px, 3vw, 12px)) !important;
            min-width: 0 !important;
          }

          .dropdown-menu {
            position: static !important;
            min-width: 100% !important;
            transform: none !important;
          }

          .dropdown-button {
            padding: clamp(12px, 3vw, 14px) clamp(12px, 4vw, 16px) !important;
            font-size: clamp(0.75rem, 3vw, 0.85rem) !important;
            border-radius: clamp(14px, 4vw, 18px) !important;
          }

          .dropdown-item {
            padding: 12px 16px !important;
            font-size: 14px !important;
          }

          .search-results {
            max-height: clamp(200px, 50vh, 250px) !important;
          }

          .search-result-description {
            display: none !important;
          }

          .categories-section .category-ribbon {
            right: clamp(-12px, -4vw, -8px);
            height: clamp(44px, 24vw, 64px);
            width: clamp(4px, 1.8vw, 6px);
          }
        }

        /* Small Devices (480px-639px) */
        @media (min-width: 480px) and (max-width: 639px) {
          .container {
            padding: 0 clamp(14px, 2.5vw, 18px);
          }

          .hero-banner-section {
            padding: clamp(16px, 3vw, 24px) clamp(16px, 3vw, 20px) !important;
            paddingTop: clamp(16px, 3vw, 24px) !important;
            paddingBottom: clamp(60px, 14vw, 120px) !important;
            min-height: 560px !important;
            overflow: visible !important;
          }

          .hero-content {
            padding-bottom: 60px !important;
          }

          .hero-cta-buttons {
            gap: clamp(16px, 3.5vw, 22px) !important;
            marginTop: clamp(32px, 5.5vw, 44px) !important;
            flex-wrap: nowrap !important;
            justify-content: center !important;
          }

          .dropdown-container {
            flex: 1 1 calc(33.333% - clamp(10px, 3vw, 14px)) !important;
            max-width: calc(33.333% - clamp(10px, 3vw, 14px)) !important;
            min-width: 0 !important;
          }

          .search-result-description {
            display: block !important;
            max-width: clamp(80px, 20vw, 150px) !important;
          }

          .categories-section .category-ribbon {
            right: clamp(-16px, -3.8vw, -10px);
            height: clamp(52px, 18vw, 78px);
            width: clamp(5px, 1.4vw, 8px);
          }
        }

        /* Medium Devices (640px-767px) */
        @media (min-width: 640px) and (max-width: 767px) {
          .container {
            padding: 0 clamp(16px, 2.5vw, 20px);
          }

          .hero-banner-section {
            padding: clamp(20px, 3.5vw, 32px) clamp(20px, 3.5vw, 28px) !important;
            paddingTop: clamp(20px, 3.5vw, 32px) !important;
            paddingBottom: clamp(70px, 14vw, 130px) !important;
            min-height: 600px !important;
            overflow: visible !important;
          }

          .hero-content {
            padding-bottom: 70px !important;
          }

          .hero-cta-buttons {
            gap: clamp(18px, 3.5vw, 24px) !important;
            marginTop: clamp(36px, 5.5vw, 48px) !important;
            flex-wrap: nowrap !important;
            justify-content: center !important;
          }

          .dropdown-container {
            flex: 1 1 calc(33.333% - clamp(12px, 3vw, 16px)) !important;
            max-width: calc(33.333% - clamp(12px, 3vw, 16px)) !important;
            min-width: 0 !important;
          }

          .search-result-description {
            display: block !important;
            max-width: clamp(120px, 22vw, 180px) !important;
          }
        }

        /* Large Devices (768px-1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .container {
            padding: 0 clamp(18px, 2.5vw, 22px);
          }
          
          .section-spacing {
            margin-bottom: clamp(32px, 4vw, 48px);
          }
          
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: clamp(32px, 4vw, 48px) !important;
          }
          
          .hero-trust-indicators {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: clamp(16px, 2.5vw, 24px) !important;
          }
          
          .hero-cta-buttons {
            gap: clamp(18px, 3.5vw, 24px) !important;
            marginTop: clamp(40px, 6vw, 52px) !important;
          }

          .dropdown-container {
            max-width: clamp(240px, 45vw, 280px) !important;
          }

          .search-result-description {
            display: block !important;
            max-width: clamp(140px, 22vw, 190px) !important;
          }
        }

        /* Extra Large Devices (1024px-1279px) */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .container {
            padding: 0 clamp(20px, 2.5vw, 24px);
          }

          .hero-trust-indicators {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: clamp(20px, 3vw, 32px) !important;
          }

          .search-result-description {
            display: block !important;
            max-width: clamp(150px, 20vw, 200px) !important;
          }
        }

        /* XXL Devices (1280px-1439px) */
        @media (min-width: 1280px) and (max-width: 1439px) {
          .container {
            padding: 0 clamp(20px, 2vw, 24px);
          }
        }

        /* Ultra Wide Screens (1440px+) */
        @media (min-width: 1440px) {
          .container {
            max-width: 1600px;
            padding: 0 clamp(24px, 2vw, 32px);
          }

          .hero-content {
            max-width: 1600px !important;
          }
        }

        /* Landscape Orientation */
        @media (orientation: landscape) and (max-height: 500px) {
          .hero-banner-section {
            padding: clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px) !important;
            paddingTop: clamp(12px, 2vw, 20px) !important;
            paddingBottom: clamp(60px, 12vw, 120px) !important;
            min-height: 500px !important;
            overflow: visible !important;
          }

          .hero-content {
            padding-bottom: 50px !important;
          }

          .hero-cta-buttons {
            marginTop: clamp(16px, 3vw, 24px) !important;
            flex-direction: row !important;
          }
        }
        
        @media (max-width: 1024px) {
          .hero-floating-elements {
            display: none;
          }
          
          .hero-banner-section {
            overflow: visible !important;
          }
        }
        
        /* Modern scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: var(--primary-gradient);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #004a8c, #007bb8);
        }
        
        /* Page transition effects */
        .page-transition {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        /* Improved focus styles */
        *:focus {
          outline: 2px solid rgba(0, 99, 177, 0.5);
          outline-offset: 2px;
        }
        
        /* Modern section backgrounds */
        .section-bg-1 {
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        }
        
        .section-bg-2 {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        
        .section-bg-3 {
          background: linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%);
        }
        
        /* Animation delays for staggered effects */
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
        
        /* Parallax effect */
        .parallax-bg {
          background-attachment: fixed;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }
        
        /* Glow effects */
        .glow-effect {
          position: relative;
        }
        
        .glow-effect::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #0063b1, #00a3e0, #0063b1);
          border-radius: inherit;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .glow-effect:hover::before {
          opacity: 1;
        }

        /* Simple Interactive Effects */

        .glass-morphism {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .gradient-text {
          background: var(--primary-gradient);
          background-size: 200% 200%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientShift 4s ease infinite;
        }

        .floating-particle {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          animation: particleFloat 8s ease-in-out infinite;
        }

        .morphing-blob {
          animation: morphBlob 20s ease-in-out infinite;
          background: var(--accent-gradient);
          opacity: 0.7;
          filter: blur(1px);
        }

        .interactive-card {
          transition: var(--transition);
        }

        .interactive-card:hover {
          transform: translateY(-4px) scale(1.02);
        }

        /* Animated Gradient Background */
        .animated-gradient {
          background-size: 400% 400%;
          animation: gradientShift 8s ease infinite;
        }

        .hero-overlay {
          animation: animatedGradient 12s ease infinite reverse;
        }

        /* Dropdown Menu Styles */
        /* Enhanced Dropdown Menu Styles */
        .dropdown-container {
          position: static;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          max-width: clamp(220px, 42vw, 320px);
        }

        .dropdown-menu {
          position: static;
          margin-top: clamp(12px, 3vw, 18px);
          transform: none;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.96) 100%);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(147, 197, 253, 0.25);
          border-radius: 20px;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35),
                      0 0 0 1px rgba(147, 197, 253, 0.08) inset;
          z-index: 10;
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
          visibility: hidden;
          min-width: 100%;
        }

        .dropdown-menu::before {
          content: none;
        }

        .dropdown-menu.open {
          opacity: 1;
          transform: none;
          pointer-events: all;
          visibility: visible;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 20px;
          color: white;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 1px solid rgba(147, 197, 253, 0.08);
          position: relative;
          overflow: hidden;
          font-weight: 700;
          font-size: 15px;
          text-align: center;
        }

        .dropdown-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #0063b1, #00a3e0);
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }

        .dropdown-item:hover::before {
          transform: scaleY(1);
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item:hover {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%);
          color: #93c5fd;
          padding-left: 28px;
          transform: translateX(4px);
        }

        .dropdown-item svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .dropdown-item:hover svg {
          transform: scale(1.15) rotate(5deg);
        }

        .dropdown-arrow {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .dropdown-button.open .dropdown-arrow {
          transform: rotate(180deg);
        }

        /* CTA Button Enhancements */
        .dropdown-button {
          position: relative;
          overflow: hidden;
          width: 100%;
        }

        .dropdown-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transition: left 0.6s ease;
        }

        .dropdown-button:not(.disabled):hover::before {
          left: 100%;
        }

        .dropdown-button:not(.disabled):active {
          transform: scale(0.98) !important;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 6px 20px rgba(0, 99, 177, 0.3);
          }
          50% {
            box-shadow: 0 8px 28px rgba(0, 99, 177, 0.5);
          }
        }

        @keyframes pulse-glow-green {
          0%, 100% {
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
          }
          50% {
            box-shadow: 0 8px 28px rgba(16, 185, 129, 0.5);
          }
        }

        /* Enhanced floating elements for gradient background */
        .hero-banner-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
           background: radial-gradient(
             circle at 30% 20%, 
             rgba(255, 255, 255, 0.08) 0%,
             rgba(219, 234, 254, 0.06) 15%,
             rgba(147, 197, 253, 0.04) 30%,
             rgba(96, 165, 250, 0.02) 45%,
             transparent 60%
           );
          animation: gentleFloat 25s ease-in-out infinite;
          z-index: 0;
        }

        .hero-banner-section::after {
          content: '';
          position: absolute;
          bottom: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
           background: radial-gradient(
             circle at 70% 80%, 
             rgba(30, 58, 138, 0.04) 0%,
             rgba(59, 130, 246, 0.03) 20%,
             rgba(96, 165, 250, 0.02) 40%,
             rgba(147, 197, 253, 0.01) 60%,
             transparent 80%
           );
          animation: gentleFloat 30s ease-in-out infinite reverse;
          z-index: 0;
        }

        /* Performance optimizations for animations */
        .hero-background,
        .hero-overlay,
        .floating-blob,
        .floating-card,
        .floating-particle {
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Enhanced Responsive Design */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Mobile Section Visibility Fix */
        @media (max-width: 768px) {
          .section-spacing {
            padding: 40px 16px !important;
            margin: 0 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          
          .modern-auctions-section,
          .modern-tenders-section {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            padding: 40px 16px !important;
            transform: none !important;
            transition: none !important;
          }
          
          .container-responsive {
            padding: 0 16px !important;
            max-width: 100% !important;
          }
          
          /* Force all sections to be visible on mobile */
          section[data-section] {
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            transform: none !important;
            transition: none !important;
          }
        }
        
        /* Mobile performance optimizations */
        @media (max-width: 768px) {
          .hero-background {
            animation: none !important;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #1e40af 50%, #3b82f6 75%, #60a5fa 100%) !important;
          }
          
          .hero-overlay {
            animation: none !important;
          }
          
          .floating-blob,
          .floating-card,
          .floating-particle {
            animation: none !important;
          }
          
          .floating-elements {
            display: none !important;
          }
          
          .hero-banner-section::before,
          .hero-banner-section::after {
            animation: none !important;
            opacity: 0.3 !important;
          }
          
          .gradient-text {
            animation: none !important;
            background: none !important;
            color: white !important;
            -webkit-text-fill-color: white !important;
          }
        }
        
        /* Small mobile devices - further reduce animations */
        @media (max-width: 480px) {
          * {
            animation: none !important;
            transition: none !important;
          }
          
          .hero-background,
          .hero-overlay,
          .floating-blob,
          .floating-card,
          .floating-particle {
            animation: none !important;
            transition: none !important;
          }
        }
        
        .categories-section .category-card-wrapper {
          justify-content: center;
          position: relative;
        }

        .categories-section .category-ribbon {
          position: absolute;
          top: 50%;
          right: clamp(-18px, -2.8vw, -12px);
          transform: translateY(-50%) scale(0.9);
          width: clamp(6px, 1.2vw, 10px);
          height: clamp(56px, 14vw, 92px);
          border-radius: 9999px;
          background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
          pointer-events: none;
          opacity: 0.95;
        }

        .categories-section .category-ribbon.product {
          background: linear-gradient(180deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%);
        }

        .categories-section .category-ribbon.service {
          background: linear-gradient(180deg, #047857 0%, #10b981 45%, #34d399 100%);
        }

        [dir="rtl"] .categories-section .category-ribbon {
          right: auto;
          left: clamp(-18px, -2.8vw, -12px);
        }

        .categories-section .category-name {
          background: rgba(255, 255, 255, 0.95);
          padding: clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 18px);
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
          margin-top: clamp(6px, 1.8vw, 12px);
          display: inline-block;
        }

        .categories-swiper .swiper-button-next,
        .categories-swiper .swiper-button-prev {
          top: 50% !important;
        }

        /* Search input placeholder styles */
        input[placeholder="Rechercher par catégorie..."]::placeholder {
          color: white !important;
          opacity: 0.8;
        }
        
        input[placeholder="Rechercher par catégorie..."]::-webkit-input-placeholder {
          color: white !important;
          opacity: 0.8;
        }
        
        input[placeholder="Rechercher par catégorie..."]::-moz-placeholder {
          color: white !important;
          opacity: 0.8;
        }
        
        input[placeholder="Rechercher par catégorie..."]:-ms-input-placeholder {
          color: white !important;
          opacity: 0.8;
        }
      `}</style>
      
      <SocketProvider >
        <div>
          {/* {show && <Chat setShow={setShow} check={check} setCheck={setCheck}/>} */}
          <SnackbarProvider 
            maxSnack={3} 
            autoHideDuration={4000}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            style={{ borderRadius: '10px' }}
          >
            <RequestProvider>
              <AxiosInterceptor>
                <Header />
                <main style={{ 
                  minHeight: '100vh', 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  position: 'relative',
                  width: '100%',
                  maxWidth: '100vw',
                  overflowX: 'hidden',
                  overflowY: 'visible',
                  paddingTop: `${headerHeight}px`,
                  paddingBottom: 'env(safe-area-inset-bottom)',
                }}>
                  {/* Hero Banner Section */}
                  <section 
                    ref={bannerRef}
                    data-section="banner"
                    className="hero-banner-section"
                    style={{ 
                      position: 'relative',
                      overflow: 'visible',
                      padding: 'clamp(20px, 4vw, 40px) clamp(20px, 4vw, 40px)',
                      paddingTop: 'clamp(20px, 4vw, 40px)',
                  paddingBottom: 'clamp(40px, 8vw, 120px)',
                      width: '100%',
                      maxWidth: '100vw',
                      background: 'white',
                      minHeight: '520px',
                    }}
                  >
                    {/* Main Content */}
                    <div className="hero-content" style={{
                      position: 'relative',
                      zIndex: 3,
                      maxWidth: '1400px',
                      margin: '0 auto',
                      padding: '0',
                      paddingBottom: '40px',
                      textAlign: 'center',
                      width: '100%',
                      overflowX: 'hidden',
                      overflowY: 'visible',
                    }}>
                      {/* Category Carousel Banner */}
                      <Home1Banner />

                      {/* CTA Buttons - Order: Auctions, Vente Direct, Tenders */}
                      <div 
                        className="hero-cta-buttons"
                        style={{
                          display: 'flex',
                          gap: 'clamp(12px, 3vw, 20px)',
                          marginTop: 'clamp(20px, 4vw, 36px)',
                          marginBottom: 'clamp(12px, 3vw, 24px)',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          padding: '0 clamp(12px, 3vw, 20px)',
                          width: '100%',
                          position: 'relative',
                          zIndex: 10,
                        }}
                      >
                        {/* 1. AUCTIONS - Blue with Hammer Icon */}
                        <div className="dropdown-container">
                          <button
                            onClick={() => {
                              console.log('Auction button clicked, current state:', auctionDropdownOpen);
                              setAuctionDropdownOpen(!auctionDropdownOpen);
                            }}
                            className={`dropdown-button auction-cta ${auctionDropdownOpen ? 'open' : ''}`}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 'clamp(6px, 2vw, 10px)',
                              background: '#ffffff',
                              color: '#004c8c',
                              padding: 'clamp(22px, 5vw, 36px) clamp(26px, 7vw, 40px)',
                              borderRadius: 'clamp(22px, 5vw, 30px)',
                              border: '3px solid #0063b1',
                              fontSize: 'clamp(15px, 3.8vw, 19px)',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 14px 30px rgba(0, 99, 177, 0.28)',
                              transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                              position: 'relative',
                              overflow: 'hidden',
                              textTransform: 'none',
                              letterSpacing: '0.3px',
                              height: '100%',
                              width: '100%',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-6px) scale(1.04)';
                              e.currentTarget.style.boxShadow = '0 22px 42px rgba(0, 99, 177, 0.38)';
                              e.currentTarget.style.borderColor = '#005299';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 14px 30px rgba(0, 99, 177, 0.28)';
                              e.currentTarget.style.borderColor = '#0063b1';
                            }}
                          >
                            <div style={{
                              background: 'rgba(0, 99, 177, 0.2)',
                              padding: 'clamp(12px, 2.8vw, 16px)',
                              borderRadius: '55%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            }}>
                              {/* Gavel/Hammer Icon for Auctions */}
                              <FaGavel 
                                style={{ 
                                  fontSize: 'clamp(32px, 5.6vw, 42px)',
                                  color: '#004c8c'
                                }} 
                              />
                            </div>
                            <span style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              color: '#004c8c',
                              fontSize: 'clamp(11px, 2.8vw, 14px)',
                              fontWeight: 800,
                              textAlign: 'center',
                              lineHeight: 1.25,
                              textTransform: 'none',
                              width: '100%',
                            }}>
                              <span style={{ whiteSpace: 'nowrap' }}>{t('common.auctions')}</span>
                            </span>
                            <svg className="dropdown-arrow" width="clamp(14px, 3vw, 18px)" height="clamp(14px, 3vw, 18px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>

                          <div 
                            className={`dropdown-menu ${auctionDropdownOpen ? 'open' : ''}`}
                            style={{
                              zIndex: 9999,
                              display: auctionDropdownOpen ? 'block' : 'none',
                            }}
                          >
                            <button className="dropdown-item" onClick={handleAuctionViewAll}>
                              {/* Eye Icon for View */}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              {t('common.view')}
                            </button>
                            <button className="dropdown-item" onClick={handleCreateAuction}>
                              {/* Plus Icon for Create */}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              {t('common.create') || 'Créer'}
                            </button>
                          </div>
                        </div>

                        {/* 2. VENTE DIRECT - Orange/Amber with Store Icon */}
                        <div className="dropdown-container">
                          <button
                            onClick={() => {
                              console.log('Vente Direct button clicked, current state:', venteDirectDropdownOpen);
                              setVenteDirectDropdownOpen(!venteDirectDropdownOpen);
                            }}
                            className={`dropdown-button vente-direct-cta ${venteDirectDropdownOpen ? 'open' : ''}`}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 'clamp(6px, 2vw, 10px)',
                              background: '#ffffff',
                              color: '#d97706',
                              padding: 'clamp(22px, 5vw, 36px) clamp(26px, 7vw, 40px)',
                              borderRadius: 'clamp(22px, 5vw, 30px)',
                              border: '3px solid #f59e0b',
                              fontSize: 'clamp(15px, 3.8vw, 19px)',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 14px 30px rgba(245, 158, 11, 0.26)',
                              transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                              position: 'relative',
                              overflow: 'hidden',
                              textTransform: 'none',
                              letterSpacing: '0.3px',
                              height: '100%',
                              width: '100%',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-8px) scale(1.07)';
                              e.currentTarget.style.boxShadow = '0 22px 42px rgba(245, 158, 11, 0.34)';
                              e.currentTarget.style.borderColor = '#d97706';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 14px 30px rgba(245, 158, 11, 0.26)';
                              e.currentTarget.style.borderColor = '#f59e0b';
                            }}
                          >
                            <div style={{
                              background: 'rgba(245, 158, 11, 0.12)',
                              padding: 'clamp(12px, 2.8vw, 16px)',
                              borderRadius: '55%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            }}>
                              {/* Store Icon for Vente Direct */}
                              <svg width="clamp(32px, 5.6vw, 40px)" height="clamp(32px, 5.6vw, 40px)" viewBox="0 0 24 24" fill="#d97706">
                                <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
                              </svg>
                            </div>
                            <span style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              color: '#d97706',
                              fontSize: 'clamp(11px, 2.8vw, 14px)',
                              fontWeight: 800,
                              textAlign: 'center',
                              lineHeight: 1.25,
                              textTransform: 'none',
                              width: '100%',
                            }}>
                              <span style={{ whiteSpace: 'nowrap' }}>{t('common.directSales') || 'Vente Direct'}</span>
                            </span>
                            <svg className="dropdown-arrow" width="clamp(14px, 3vw, 18px)" height="clamp(14px, 3vw, 18px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                          
                          <div 
                            className={`dropdown-menu ${venteDirectDropdownOpen ? 'open' : ''}`}
                            style={{
                              zIndex: 9999,
                              display: venteDirectDropdownOpen ? 'block' : 'none',
                            }}
                          >
                            <button className="dropdown-item" onClick={handleVenteDirectViewAll}>
                              {/* Eye Icon for View */}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              {t('common.view')}
                            </button>
                            <button className="dropdown-item" onClick={handleCreateVenteDirect}>
                              {/* Plus Icon for Create */}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              {t('common.create') || 'Créer'}
                            </button>
                          </div>
                        </div>

                        {/* 3. TENDERS - Green with Envelope Icon */}
                        <div className="dropdown-container">
                          <button
                            onClick={() => {
                              console.log('Tender button clicked, current state:', tenderDropdownOpen);
                              setTenderDropdownOpen(!tenderDropdownOpen);
                            }}
                            className={`dropdown-button tender-cta ${tenderDropdownOpen ? 'open' : ''}`}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 'clamp(6px, 2vw, 10px)',
                              background: '#ffffff',
                              color: '#047857',
                              padding: 'clamp(22px, 5vw, 36px) clamp(26px, 7vw, 40px)',
                              borderRadius: 'clamp(22px, 5vw, 30px)',
                              border: '3px solid #10b981',
                              fontSize: 'clamp(15px, 3.8vw, 19px)',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 14px 30px rgba(16, 185, 129, 0.26)',
                              transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                              position: 'relative',
                              overflow: 'hidden',
                              textTransform: 'none',
                              letterSpacing: '0.3px',
                              height: '100%',
                              width: '100%',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-8px) scale(1.07)';
                              e.currentTarget.style.boxShadow = '0 22px 42px rgba(16, 185, 129, 0.34)';
                              e.currentTarget.style.borderColor = '#0f9f6b';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 14px 30px rgba(16, 185, 129, 0.26)';
                              e.currentTarget.style.borderColor = '#10b981';
                            }}
                          >
                            <div style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              padding: 'clamp(12px, 2.8vw, 16px)',
                              borderRadius: '55%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            }}>
                              {/* Envelope Icon for Tenders */}
                              <svg width="clamp(32px, 5.6vw, 40px)" height="clamp(32px, 5.6vw, 40px)" viewBox="0 0 24 24" fill="#047857">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                              </svg>
                            </div>
                            <span style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              color: '#047857',
                              fontSize: 'clamp(11px, 2.8vw, 14px)',
                              fontWeight: 800,
                              textAlign: 'center',
                              lineHeight: 1.25,
                              textTransform: 'none',
                              width: '100%',
                            }}>
                              <span style={{ whiteSpace: 'nowrap' }}>{t('common.tenders') || 'Tenders'}</span>
                            </span>
                            <svg className="dropdown-arrow" width="clamp(14px, 3vw, 18px)" height="clamp(14px, 3vw, 18px)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                          
                          <div 
                            className={`dropdown-menu ${tenderDropdownOpen ? 'open' : ''}`}
                            style={{
                              zIndex: 9999,
                              display: tenderDropdownOpen ? 'block' : 'none',
                            }}
                          >
                            <button className="dropdown-item" onClick={handleTenderViewAll}>
                              {/* Eye Icon for View */}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                              {t('common.view')}
                            </button>
                            <button className="dropdown-item" onClick={handleCreateTender}>
                              {/* Plus Icon for Create */}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              {t('common.create') || 'Créer'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Trust Indicators */}
                      {/* <div 
                        className="hero-trust-indicators"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '32px',
                          maxWidth: '1000px',
                          margin: '0 auto',
                          marginTop: '48px',
                          padding: '0 20px',
                        }}
                      >
                        {[
                          {
                            icon: 'M12 1L15.09 8.26L23 9L17 14.74L18.18 22.5L12 19.77L5.82 22.5L7 14.74L1 9L8.91 8.26L12 1Z',
                            title: 'Premium Assets',
                            description: 'Access exclusive business assets and investments'
                          },
                          {
                            icon: 'M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.09 0 2.13.2 3.1.56',
                            title: 'Secure Platform',
                            description: 'Enterprise-grade security and verification'
                          },
                          {
                            icon: 'M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.5 2.54l2.6 1.53c.56-1.24.9-2.62.9-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z',
                            title: '24/7 Support',
                            description: 'Professional assistance whenever you need it'
                          }
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="trust-indicator glass-morphism"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '20px',
                              padding: '24px',
                              borderRadius: '20px',
                              transition: 'var(--transition)',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                              e.currentTarget.style.boxShadow = '0 16px 40px rgba(59, 130, 246, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(147, 197, 253, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                          >
                            <div style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '20px',
                              background: 'var(--accent-gradient)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: 'var(--shadow-md)',
                              animation: 'pulse 3s ease infinite',
                            }}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                <path d={item.icon}/>
                              </svg>
                            </div>
                            <div>
                              <h3 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: 'white',
                                marginBottom: '4px',
                              }}>
                                {item.title}
                              </h3>
                              <p style={{
                                fontSize: '14px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                lineHeight: '1.4',
                              }}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div> */}
                    </div>
                  </section>
                  
                  {/* Live Auctions Section - Always visible on mobile */}
                  <section 
                    ref={auctionRef}
                    data-section="auction"
                    className={`section-spacing section-bg-3 ${animatedSections.auction ? 'animate-slide-right' : ''}`}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      opacity: isMobile ? 1 : (animatedSections.auction ? 1 : 0),
                      transform: isMobile ? 'none' : (animatedSections.auction ? 'translateX(0)' : 'translateX(50px)'),
                      transition: isMobile ? 'none' : 'all 0.8s ease-out',
                      display: isMobile ? 'block' : 'block',
                      visibility: isMobile ? 'visible' : 'visible',
                      minHeight: isMobile ? '300px' : 'auto',
                    }}
                  >
                    <Home1LiveAuction />
                  </section>
                  
                  {/* Live Direct Sales Section - Always visible on mobile */}
                  <section 
                    data-section="direct-sales"
                    className="section-spacing section-bg-1"
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      opacity: isMobile ? 1 : 1,
                      transform: isMobile ? 'none' : 'none',
                      transition: isMobile ? 'none' : 'none',
                      display: isMobile ? 'block' : 'block',
                      visibility: isMobile ? 'visible' : 'visible',
                      minHeight: isMobile ? '300px' : 'auto',
                    }}
                  >
                    <Home1LiveDirectSales />
                  </section>
                  
                  {/* Live Tenders Section - Always visible on mobile */}
                  <section 
                    data-section="tenders"
                    className="section-spacing section-bg-1"
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      opacity: isMobile ? 1 : 1,
                      transform: isMobile ? 'none' : 'none',
                      transition: isMobile ? 'none' : 'none',
                      display: isMobile ? 'block' : 'block',
                      visibility: isMobile ? 'visible' : 'visible',
                      minHeight: isMobile ? '300px' : 'auto',
                    }}
                  >
                    <Home1LiveTenders />
                  </section>
                  
                  {/* Enhanced Decorative Elements */}
                  <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '10%',
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(0, 99, 177, 0.05) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    animation: 'float 6s ease-in-out infinite',
                    opacity: animatedSections.banner ? 1 : 0,
                    transition: 'opacity 1s ease-out 0.5s',
                  }}></div>
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '5%',
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(0, 163, 224, 0.05) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    animation: 'float 8s ease-in-out infinite reverse',
                    opacity: animatedSections.category ? 1 : 0,
                    transition: 'opacity 1s ease-out 0.8s',
                  }}></div>
                  
                  {/* Additional floating elements */}
                  <div style={{
                    position: 'absolute',
                    top: '60%',
                    right: '5%',
                    width: '100px',
                    height: '100px',
                    background: 'radial-gradient(circle, rgba(255, 165, 0, 0.05) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    animation: 'float 10s ease-in-out infinite',
                    opacity: animatedSections.auction ? 1 : 0,
                    transition: 'opacity 1s ease-out 1s',
                  }}></div>
                  
                  <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '15%',
                    width: '80px',
                    height: '80px',
                    background: 'radial-gradient(circle, rgba(0, 99, 177, 0.03) 0%, transparent 70%)',
                    borderRadius: '50%',
                    zIndex: 0,
                    animation: 'float 7s ease-in-out infinite reverse',
                    opacity: animatedSections.banner ? 1 : 0,
                    transition: 'opacity 1s ease-out 0.7s',
                  }}></div>
                </main>
                <Footer />
                <ResponsiveTest />
              </AxiosInterceptor>
            </RequestProvider>
          </SnackbarProvider>
        </div>
      </SocketProvider>
    </>
  );
}