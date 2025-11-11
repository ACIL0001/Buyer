"use client";
import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard, FreeMode, Autoplay } from "swiper/modules";
import { CategoryAPI } from '@/app/api/category';
import app from '@/config';
import { FaShoppingBag, FaHandshake } from 'react-icons/fa';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Home1BannerProps = object;

const Home1Banner: React.FC<Home1BannerProps> = () => {
  const { t } = useTranslation();
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

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
    const desktopSlides = Math.max(1, Math.min(categoryCount || 1, 5));

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
        return imageUrl.replace('http://localhost:3000', app.baseURL.replace(/\/$/, ''));
      }
      return imageUrl;
    }

    // Clean the URL - remove leading slash if present
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    
    // Construct full URL from baseURL
    // Try multiple possible paths
    const baseURL = app.baseURL.replace(/\/$/, ''); // Remove trailing slash
    
    // First try: direct path with baseURL
    // If the URL contains 'static', use it as-is
    if (cleanUrl.includes('static/') || cleanUrl.startsWith('static/')) {
      return `${baseURL}/${cleanUrl}`;
    }
    
    // Try common paths
    const possiblePaths = [
      `${baseURL}/static/${cleanUrl}`,
      `${baseURL}/${cleanUrl}`,
      `${baseURL}/uploads/${cleanUrl}`,
      `${baseURL}/images/${cleanUrl}`,
      `${baseURL}/public/${cleanUrl}`,
    ];
    
    // Return the first path (most likely: /static/filename)
    return possiblePaths[0];
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
          padding: clamp(12px, 3vw, 24px) clamp(12px, 3vw, 24px);
          paddingTop: clamp(0px, 2vw, 10px);
          margin: 0 auto clamp(12px, 3vw, 24px) auto;
          max-width: 1280px;
          border-radius: clamp(16px, 4vw, 32px);
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: clamp(20px, 3vw, 32px);
          gap: clamp(16px, 3vw, 24px);
          flex-wrap: nowrap;
          position: relative;
          padding: 0 clamp(20px, 4vw, 40px);
        }

        .section-title {
          font-size: clamp(1.5rem, 3vw, 2.2rem);
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
          padding: 0 clamp(24px, 5vw, 40px);
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
          padding: 12px 28px;
          border-radius: 35px;
          font-size: clamp(0.85rem, 1.4vw, 1rem);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 3px solid transparent;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          color: #495057;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.95);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          min-width: 110px;
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
          padding: clamp(16px, 2.5vw, 24px) clamp(24px, 4vw, 36px) clamp(10px, 2vw, 18px);
          border-radius: clamp(16px, 3vw, 24px);
          transition: background 0.3s ease;
          margin: clamp(12px, 3vw, 20px) 0;
          overflow: visible;
        }

        .categories-carousel::before {
          content: '';
          position: absolute;
          top: 50%;
          left: clamp(12px, 3vw, 36px);
          right: clamp(12px, 3vw, 36px);
          transform: translateY(-50%);
          height: clamp(42px, 10vw, 82px);
          background:
            linear-gradient(180deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.15)),
            repeating-linear-gradient(180deg, rgba(59, 130, 246, 0.18) 0 14px, rgba(59, 130, 246, 0.05) 14px 28px);
          border-radius: clamp(24px, 6vw, 48px);
          opacity: 0.9;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
          pointer-events: none;
          z-index: 0;
        }

        .categories-carousel :global(.categories-swiper) {
          position: relative;
          z-index: 1;
        }

        .categories-carousel :global(.categories-swiper .swiper-wrapper) {
          overflow: visible;
        }

        .categories-carousel :global(.categories-swiper .swiper-slide) {
          overflow: visible;
        }

        .category-card-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 2vw, 14px);
          margin-bottom: clamp(10px, 3vw, 18px);
          height: 100%;
          position: relative;
          z-index: 2;
        }

        .category-card-wrapper::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          width: clamp(14px, 4vw, 36px);
          height: clamp(20px, 6vw, 44px);
          background:
            linear-gradient(180deg, rgba(148, 163, 184, 0.25), rgba(148, 163, 184, 0.25)),
            repeating-linear-gradient(180deg, rgba(59, 130, 246, 0.25) 0 12px, rgba(59, 130, 246, 0.08) 12px 24px);
          border-radius: clamp(10px, 3vw, 22px);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
          z-index: 1;
          pointer-events: none;
        }

        .categories-swiper .swiper-slide:last-child .category-card-wrapper::after {
          display: none;
        }

        [dir="rtl"] .category-card-wrapper::after {
          left: auto;
          right: 100%;
        }

        .categories-swiper .swiper-slide {
          display: flex;
          align-items: center;
          justify-content: center;
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
          z-index: 2;
        }
        
        .category-ribbon {
          position: absolute;
          top: 50%;
          right: clamp(-18px, -2.8vw, -12px);
          transform: translateY(-50%);
          width: clamp(6px, 1.2vw, 10px);
          height: clamp(56px, 14vw, 92px);
          border-radius: 9999px;
          background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
          pointer-events: none;
          opacity: 0.95;
        }

        .category-ribbon.product {
          background: linear-gradient(180deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%);
        }

        .category-ribbon.service {
          background: linear-gradient(180deg, #047857 0%, #10b981 45%, #34d399 100%);
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
          font-size: clamp(0.85rem, 1.5vw, 1.05rem);
          font-weight: 700;
          text-shadow: none;
          z-index: auto;
          line-height: 1.45;
          opacity: 1;
          text-align: center;
          max-width: 95%;
          padding: clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 18px);
          word-wrap: break-word;
          overflow-wrap: anywhere;
          letter-spacing: 0.2px;
          background: rgba(255, 255, 255, 0.94);
          border-radius: clamp(10px, 2.4vw, 16px);
          display: inline-block;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
          margin-top: clamp(6px, 1.8vw, 12px);
        }

        [dir="rtl"] .categories-section .category-ribbon {
          right: auto;
          left: clamp(-18px, -2.8vw, -12px);
        }


        /* Pagination dots */
        .swiper-pagination {
          position: relative;
          margin-top: clamp(56px, 7vw, 68px) !important;
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
            padding: clamp(12px, 3vw, 20px) clamp(12px, 3vw, 16px);
            paddingTop: clamp(0px, 1vw, 12px);
            margin-bottom: clamp(12px, 3vw, 20px);
            border-radius: clamp(12px, 3vw, 20px);
          }
          
          .categories-carousel::before {
            left: clamp(8px, 4vw, 18px);
            right: clamp(8px, 4vw, 18px);
            height: clamp(32px, 18vw, 56px);
            border-radius: clamp(18px, 8vw, 36px);
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
          }
          
          .category-ribbon {
            right: clamp(-12px, -4vw, -8px);
            height: clamp(44px, 24vw, 64px);
            width: clamp(4px, 1.8vw, 6px);
          }

          .section-header {
            flex-direction: row;
            flex-wrap: nowrap;
            justify-content: center;
            align-items: center;
            gap: clamp(8px, 3vw, 12px);
            margin-bottom: clamp(16px, 2.5vw, 24px);
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
            padding: clamp(14px, 3vw, 20px) clamp(14px, 4vw, 18px);
          }

          .category-card {
            border-radius: clamp(12px, 3vw, 16px);
          }

          .category-card-wrapper {
            gap: clamp(6px, 2vw, 10px);
          }

          .category-card-wrapper::after {
            width: clamp(10px, 5vw, 18px);
            height: clamp(16px, 10vw, 30px);
            border-radius: clamp(8px, 4vw, 14px);
          }

          .category-name {
            font-size: clamp(0.75rem, 2.5vw, 0.95rem);
            padding: clamp(2px, 0.8vw, 6px) clamp(6px, 2vw, 10px) 0;
            max-width: 100%;
            letter-spacing: 0.15px;
          }

          .swiper-pagination {
            margin-top: clamp(70px, 16vw, 88px) !important;
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
            padding: clamp(16px, 3.5vw, 24px) clamp(16px, 3.5vw, 24px);
            paddingTop: clamp(8px, 1.5vw, 16px);
          }

          .categories-carousel::before {
            left: clamp(10px, 4vw, 24px);
            right: clamp(10px, 4vw, 24px);
            height: clamp(36px, 14vw, 64px);
          }

          .section-header {
            gap: clamp(16px, 3vw, 24px);
            margin-bottom: clamp(20px, 3.5vw, 28px);
            padding: 0 clamp(16px, 3.5vw, 24px);
          }

          .section-title {
            font-size: clamp(1.4rem, 3.5vw, 1.8rem);
            padding: 0 clamp(20px, 4vw, 32px);
          }

          .filter-button {
            padding: clamp(10px, 2.5vw, 12px) clamp(20px, 4vw, 24px);
            font-size: clamp(0.8rem, 2vw, 0.9rem);
            min-width: 100px;
          }

          .categories-carousel {
            padding: clamp(18px, 2.8vw, 28px) clamp(35px, 7vw, 45px);
          }

          .category-card-wrapper::after {
            width: clamp(12px, 4vw, 24px);
            height: clamp(18px, 8vw, 34px);
          }

          .category-ribbon {
            right: clamp(-16px, -3.8vw, -10px);
            height: clamp(52px, 18vw, 78px);
            width: clamp(5px, 1.4vw, 8px);
          }

          .category-name {
            font-size: clamp(0.85rem, 2.5vw, 1rem);
            top: clamp(12px, 2vw, 16px);
          }
        }

        /* Medium Devices (tablets, 640px-767px) */
        @media (min-width: 640px) and (max-width: 767px) {
          .categories-section {
            padding: clamp(20px, 3.5vw, 32px) clamp(20px, 3.5vw, 32px);
          }

          .categories-carousel::before {
            height: clamp(38px, 11vw, 70px);
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
            padding: clamp(20px, 3vw, 30px) clamp(40px, 6vw, 50px);
          }

          .category-card-wrapper::after {
            width: clamp(18px, 3vw, 32px);
            height: clamp(22px, 7vw, 38px);
          }
        }

        /* Large Devices (tablets, 768px-1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .categories-section {
            padding: clamp(24px, 3.5vw, 36px) clamp(24px, 3.5vw, 36px);
          }

          .section-header {
            gap: clamp(24px, 3.5vw, 30px);
          }

          .section-title {
            font-size: clamp(1.8rem, 3.5vw, 2.1rem);
          }

          .categories-carousel {
            padding: clamp(22px, 3vw, 32px) 45px;
          }

          .category-card-wrapper::after {
            width: clamp(20px, 3vw, 36px);
            height: clamp(24px, 6vw, 42px);
          }
        }

        /* Extra Large Devices (desktops, 1024px-1279px) */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .categories-section {
            padding: clamp(28px, 3.5vw, 40px) clamp(28px, 3.5vw, 40px);
          }

          .categories-carousel {
            padding: clamp(24px, 3.5vw, 36px) 48px;
          }

          .category-card-wrapper::after {
            width: clamp(20px, 2.8vw, 40px);
            height: clamp(26px, 5vw, 44px);
          }
        }

        /* XXL Devices (large desktops, 1280px+) */
        @media (min-width: 1280px) {
          .categories-section {
            padding: clamp(32px, 3.5vw, 40px) clamp(32px, 3.5vw, 40px);
          }

          .categories-carousel {
            padding: clamp(24px, 3.5vw, 36px) 50px;
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
            padding: clamp(12px, 2vw, 20px) clamp(16px, 3vw, 24px);
          }

          .section-header {
            margin-bottom: clamp(12px, 2vw, 20px);
          }

          .categories-carousel {
            padding: clamp(16px, 2.5vw, 24px) clamp(30px, 5vw, 40px);
          }
        }
      `}</style>
      {/* Global styles for Swiper navigation buttons - must be outside styled-jsx */}
      <style dangerouslySetInnerHTML={{__html: `
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
          top: 50% !important;
          transform: translateY(-50%) !important;
        }

        .categories-swiper .swiper-button-next:hover,
        .categories-swiper .swiper-button-prev:hover {
          background: white !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
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
        <div className="section-header">
          <button
            className={`filter-button product ${filterType === 'PRODUCT' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'PRODUCT' ? 'ALL' : 'PRODUCT')}
          >
            Produit
          </button>
          <h2 className="section-title">Categories</h2>
          <button
            className={`filter-button service ${filterType === 'SERVICE' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'SERVICE' ? 'ALL' : 'SERVICE')}
          >
            Service
          </button>
                </div>
        {loading ? (
          <div className="loading-state">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">No categories available at the moment</div>
        ) : (
          <div className="categories-carousel">
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
                      <div
                        className={`category-ribbon ${isProduct ? 'product' : isService ? 'service' : ''}`}
                        aria-hidden="true"
                      />
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