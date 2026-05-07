"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useReducer, useState, useEffect, useRef, useMemo, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import { authStore } from "@/contexts/authStore";
import ChatNotifications from '@/components/chat/ChatNotifications';
import NotificationBellStable from '@/components/NotificationBellStable';
import { useCreateSocket } from '@/contexts/socket';
import { useTranslation } from 'react-i18next';
import { getSellerUrl, getFrontendUrl } from '@/config';
import app from '@/config';
import CategoryMegaMenu from './CategoryMegaMenu';
import { useSettingsStore } from "@/contexts/settingsStore";
import { FaRegBell } from 'react-icons/fa';
import { normalizeImageUrl } from '@/utils/url';
import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';

// API Imports for Search
import { CategoryAPI } from '@/app/api/category';
import { AuctionsAPI } from '@/app/api/auctions';
import { TendersAPI } from '@/app/api/tenders';
import { DirectSaleAPI } from '@/app/api/direct-sale';

const initialState = {
  activeMenu: "",
  activeSubMenu: "",
  isSidebarOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_MENU":
      return {
        ...state,
        activeMenu: state.activeMenu === action.menu ? "" : action.menu,
        activeSubMenu: state.activeMenu === action.menu ? state.activeSubMenu : "",
      };
    case "TOGGLE_SUB_MENU":
      return {
        ...state,
        activeSubMenu: state.activeSubMenu === action.subMenu ? "" : action.subMenu,
      };
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    default:
      return state;
  }
}

export const Header = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);
  const pathName = usePathname();
  const { isLogged, isReady, initializeAuth, auth } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [switchAccount, setSwitchAccount] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const { logoUrl } = useSettingsStore();

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isSmallMobile = windowWidth <= 375;
  // Render the compact mobile header for everything that can't fit the 1100px+ desktop layout
  const showMobileHeader = windowWidth <= 1024;
  // When on dashboard pages, route the hamburger to the dashboard sidebar instead of the public nav drawer
  const isDashboard = pathName?.startsWith('/dashboard');
  const socketContext = useCreateSocket();
  const windowRef = useRef(null);
  const headerRef = useRef(null);

  // --- SEARCH STATE & REFS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showNotifyMe, setShowNotifyMe] = useState(false);
  const [notifyMeEmail, setNotifyMeEmail] = useState('');
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const mobileAccountDropdownRef = useRef(null);
  const desktopAccountDropdownRef = useRef(null);

  // --- DATA FETCHING FOR SEARCH ---
  const { data: categoriesData } = useQuery({ queryKey: ['categories', 'all'], queryFn: () => CategoryAPI.getCategories() });
  const { data: auctionsData } = useQuery({ queryKey: ['auctions', 'all'], queryFn: () => AuctionsAPI.getAuctions() });
  const { data: tendersData } = useQuery({ queryKey: ['tenders', 'active'], queryFn: () => TendersAPI.getActiveTenders() });
  const { data: directSalesData } = useQuery({ queryKey: ['direct-sales', 'all'], queryFn: () => DirectSaleAPI.getDirectSales() });

  const allCategories = useMemo(() => categoriesData?.success ? categoriesData.data : [], [categoriesData]);
  const allAuctions = useMemo(() => auctionsData?.data || (Array.isArray(auctionsData) ? auctionsData : []), [auctionsData]);
  const allTenders = useMemo(() => Array.isArray(tendersData?.data || tendersData) ? (tendersData?.data || tendersData) : [], [tendersData]);
  const allDirectSales = useMemo(() => Array.isArray(directSalesData?.data || directSalesData) ? (directSalesData?.data || directSalesData) : [], [directSalesData]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    setWindowWidth(window.innerWidth);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => { setIsClient(true); }, []);

  // Handle Clicks Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
      if (showSearchResults && !event.target.closest('.header-search-container')) {
        setShowSearchResults(false);
      }
      if (isAccountDropdownOpen) {
        const insideMobile = mobileAccountDropdownRef.current && mobileAccountDropdownRef.current.contains(event.target);
        const insideDesktop = desktopAccountDropdownRef.current && desktopAccountDropdownRef.current.contains(event.target);
        if (!insideMobile && !insideDesktop) {
          setIsAccountDropdownOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchResults, isAccountDropdownOpen]);

  // --- SEARCH LOGIC ---
  const performSearch = async (query, filter) => {
    setSearchQuery(query);
    setSearchFilter(filter);
    
    if (query.length > 0) {
      setLoadingSearch(true);
      setShowNotifyMe(false);
      try {
        const filteredCategories = filter === 'all' ? allCategories : allCategories.filter(c => c.type?.toUpperCase() === filter);
        const filteredAuctions = filter === 'all' ? allAuctions : allAuctions.filter(a => a.bidType?.toUpperCase() === filter);
        const filteredTenders = filter === 'all' ? allTenders : allTenders.filter(t => t.bidType?.toUpperCase() === filter);
        const filteredDirectSales = filter === 'all' ? allDirectSales : allDirectSales.filter(d => d.bidType?.toUpperCase() === filter);

        const categoryFuse = new Fuse(filteredCategories, { keys: ['name'], threshold: 0.6, distance: 100, minMatchCharLength: 2, includeScore: true });
        const auctionFuse = new Fuse(filteredAuctions, { keys: ['title', 'name', 'description'], threshold: 0.5, distance: 100, minMatchCharLength: 3, includeScore: true });
        const tenderFuse = new Fuse(filteredTenders, { keys: ['title', 'name', 'description'], threshold: 0.5, distance: 100, minMatchCharLength: 3, includeScore: true });
        const directSaleFuse = new Fuse(filteredDirectSales, { keys: ['title', 'name', 'description'], threshold: 0.5, distance: 100, minMatchCharLength: 3, includeScore: true });

        const combinedResults = [
          ...categoryFuse.search(query).map(r => ({ ...r.item, type: 'category', score: r.score })),
          ...auctionFuse.search(query).map(r => ({ ...r.item, type: 'auction', score: r.score })),
          ...tenderFuse.search(query).map(r => ({ ...r.item, type: 'tender', score: r.score })),
          ...directSaleFuse.search(query).map(r => ({ ...r.item, type: 'directSale', score: r.score }))
        ].sort((a, b) => (a.score || 0) - (b.score || 0));
        
        if (combinedResults.length === 0) {
          try {
            const fallbackResponse = await fetch(`${app.baseURL}search/fallback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, limit: 3, minProbability: 50 })
            });
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData.success && fallbackData.hasResults) {
              setSearchResults(fallbackData.results.map(r => ({ ...r, type: r.type || 'suggestion', isFallback: true, name: r.term })));
              setShowSearchResults(true);
              setShowNotifyMe(false);
            } else {
              setSearchResults([]);
              setShowSearchResults(true);
              setShowNotifyMe(true);
            }
          } catch (e) {
            setSearchResults([]);
            setShowSearchResults(true);
            setShowNotifyMe(true);
          }
        } else {
          setSearchResults(combinedResults);
          setShowSearchResults(true);
          setShowNotifyMe(false);
        }
      } catch (error) {
        setSearchResults([]);
        setShowNotifyMe(true);
      } finally {
        setLoadingSearch(false);
      }
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setShowNotifyMe(false);
    }
  };

  const handleSearchChange = async (e) => await performSearch(e.target.value, searchFilter);

  const navigateWithTop = useCallback((url) => {
    router.push(url, { scroll: false });
    requestAnimationFrame(() => { window.scrollTo({ top: 0, behavior: "auto" }); });
  }, [router]);

  const handleSearchSelect = async (item) => {
    setSearchQuery(item.title || item.name || item.term || '');
    setShowSearchResults(false);
    
    if (item.isFallback && item.termId) {
      try {
        const typeMapping = { 'suggestion': 'category', 'product': 'category', 'category': 'category', 'auction': 'auction', 'tender': 'tender', 'directSale': 'directSale' };
        await fetch(`${app.baseURL}search/update-edge-weight`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchQuery, selectedTermId: item.termId, selectedType: typeMapping[item.type] || 'category', selectedId: item.categoryId || item._id || item.id || item.termId })
        });
      } catch (e) {}
    }
    
    if (item.type === 'category' || item.type === 'suggestion') {
      const catId = item.categoryId || item._id || item.id;
      if (catId) navigateWithTop(`/category?category=${catId}&name=${encodeURIComponent(item.name || item.term)}`);
    } else if (item.type === 'auction') navigateWithTop(`/auction-details/${item._id || item.id}`);
    else if (item.type === 'tender') navigateWithTop(`/tender-details/${item._id || item.id}`);
    else if (item.type === 'directSale') navigateWithTop(`/direct-sale/${item._id || item.id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) handleSearchSelect(searchResults[0]);
  };

  const handleNotifyMe = async () => {
    if (!notifyMeEmail.trim()) return alert('Please enter a valid email address');
    try {
      const res = await fetch(`${app.baseURL}search/notify-me`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ searchQuery, email: notifyMeEmail })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ ' + data.message);
        setShowNotifyMe(false);
        setNotifyMeEmail('');
        setShowSearchResults(false);
      } else alert('❌ Failed to submit request.');
    } catch (e) { alert('❌ Error occurred.'); }
  };

  const getCategoryImageUrl = (cat) => normalizeImageUrl(cat.thumb?.url || cat.thumb?.fullUrl || cat.image || '') || '/assets/images/cat.avif';

  const handleLogout = () => {
    authStore.getState().clear();
    router.push('/auth/login');
  };

  const getAvatarUrl = () => {
    if (!auth?.user) return '';
    return normalizeImageUrl(auth.user?.photoURL || auth.user?.avatar?.url || auth.user?.avatar?.fullUrl || '');
  };

  const isNavActive = (matchPaths) => matchPaths.some(mp => pathName === mp || pathName.startsWith(mp + '/'));

  // Mobile nav links — used in the mobile drawer below md
  const mobileNavLinks = [
    { name: t('navigation.home') || 'Accueil', path: '/' },
    { name: 'Catégories', path: '/category' },
    { name: t('navigation.howToBid') || 'Comment ça marche', path: '/how-to-bid' },
    { name: 'Startup', path: '/startup' },
    { name: 'International', path: '/international' },
    { name: 'Nos plans', path: '/plans' },
    { name: 'A propos', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header
      ref={headerRef}
      style={{
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#ffffff',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxSizing: 'border-box',
        fontFamily: "'DM Sans', 'Inter', sans-serif",
      }}
    >
      {/* --- MOBILE HEADER (below md / 768px) --- */}
      {isClient && showMobileHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            width: '100%',
            height: 'clamp(56px, 14vw, 64px)',
            padding: '0 clamp(12px, 4vw, 20px)',
            background: '#FFFFFF',
            borderBottom: '1px solid #f0f2f5',
          }}
        >
          {/* Hamburger — routes to dashboard sidebar on /dashboard/*, public nav drawer otherwise */}
          <button
            type="button"
            onClick={() => {
              if (isDashboard) {
                window.dispatchEvent(new CustomEvent('toggle-dashboard-sidebar'));
              } else {
                setMenuOpen((prev) => !prev);
              }
            }}
            aria-label="Ouvrir le menu"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: 'transparent',
              color: '#002896',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              {!isDashboard && isMenuOpen ? (
                <>
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </>
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>

          {/* Logo (centered) */}
          <Link href={getFrontendUrl()} style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center', textDecoration: 'none', minWidth: 0 }}>
            <img
              src={logoUrl || '/assets/img/logo.png'}
              alt="MazadClick"
              style={{ height: 'clamp(28px, 8vw, 36px)', maxWidth: '60%', objectFit: 'contain' }}
            />
          </Link>

          {/* Right cluster: messages + notifications + profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {isClient && isLogged && (
              <>
                <ChatNotifications variant="header" />
                <NotificationBellStable />
                <div ref={mobileAccountDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                    aria-label="Mon compte"
                    aria-haspopup="menu"
                    aria-expanded={isAccountDropdownOpen}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#F5F5FA',
                      color: '#002896',
                      flexShrink: 0,
                      border: '1px solid #E6E6E6',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {getAvatarUrl() ? (
                      <img src={getAvatarUrl()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </button>
                  {isAccountDropdownOpen && (
                    <div
                      role="menu"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: 220,
                        background: '#FFFFFF',
                        borderRadius: 16,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
                        border: '1px solid #f0f2f5',
                        padding: 8,
                        zIndex: 9999,
                      }}
                    >
                      <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid #f0f2f5', marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#002896', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {auth?.user?.firstName || 'Utilisateur'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {auth?.user?.email}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsAccountDropdownOpen(false); router.push('/dashboard/profile'); }}
                        role="menuitem"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#1e293b', textAlign: 'left', fontSize: 14, fontWeight: 500, borderRadius: 10, minHeight: 44, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Profil
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAccountDropdownOpen(false); router.push('/dashboard'); }}
                        role="menuitem"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#1e293b', textAlign: 'left', fontSize: 14, fontWeight: 500, borderRadius: 10, minHeight: 44, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                        Tableau de bord
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAccountDropdownOpen(false); router.push('/settings'); }}
                        role="menuitem"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#1e293b', textAlign: 'left', fontSize: 14, fontWeight: 500, borderRadius: 10, minHeight: 44, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        Paramètres
                      </button>
                      <div style={{ height: 1, background: '#f0f2f5', margin: '6px 0' }} />
                      <button
                        type="button"
                        onClick={() => { setIsAccountDropdownOpen(false); handleLogout(); }}
                        role="menuitem"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 10, textAlign: 'left', minHeight: 44 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {isClient && !isLogged && (
              <Link
                href="/auth/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 18,
                  background: '#002896',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}

      {/* --- MOBILE DRAWER (public nav only — dashboard pages use the dashboard sidebar instead) --- */}
      {isClient && showMobileHeader && !isDashboard && isMenuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 9998,
            }}
          />
          <nav
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(320px, 85vw)',
              background: '#FFFFFF',
              zIndex: 9999,
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f2f5' }}>
              <img src={logoUrl || '/assets/img/logo.png'} alt="MazadClick" style={{ height: 32, objectFit: 'contain' }} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: '#002896', cursor: 'pointer' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile search */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(e); setMenuOpen(false); }}
              style={{ marginBottom: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F5F5FA', borderRadius: 14 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7878AB" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder={t('category.searchPlaceholder') || 'Rechercher un produit ...'}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#002896', minWidth: 0 }}
                />
              </div>
            </form>

            {/* Nav links */}
            {mobileNavLinks.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 12,
                  color: isNavActive([item.path]) ? '#002896' : '#3a4a6b',
                  background: isNavActive([item.path]) ? 'rgba(0, 40, 150, 0.08)' : 'transparent',
                  fontSize: 15,
                  fontWeight: isNavActive([item.path]) ? 700 : 500,
                  textDecoration: 'none',
                  minHeight: 44,
                }}
              >
                {item.name}
              </Link>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f0f2f5' }}>
              {isClient && isLogged ? (
                <>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); router.push('/dashboard/profile'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 12, background: 'transparent', border: 'none', color: '#002896', textAlign: 'left', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Mon profil
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); router.push('/dashboard'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 12, background: 'transparent', border: 'none', color: '#002896', textAlign: 'left', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Tableau de bord
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', borderRadius: 12, background: 'transparent', color: '#EB4545', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: 12, background: '#002896', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}
                >
                  Connexion
                </Link>
              )}
            </div>
          </nav>
        </>
      )}

      <div
        className="header-content-wrapper"
        style={{
          width: '100%',
          maxWidth: '1440px',
          height: '196px',
          position: 'relative',
          background: '#FFFFFF',
          opacity: 1,
          margin: '0 auto',
          display: isClient && showMobileHeader ? 'none' : 'block',
        }}
      >
        {/* --- LOGO --- */}
        <Link 
          href={getFrontendUrl()} 
          style={{ 
            position: 'absolute',
            top: '52px',
            left: '0px',
            width: '193px',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none'
          }}
        >
          <img 
            src={logoUrl || '/assets/img/logo.png'} 
            alt="MazadClick" 
            style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
          />
        </Link>

        {/* --- SEARCH BAR --- */}
        <div 
          className="header-search-container"
          style={{ 
            position: 'absolute',
            top: '42px',
            left: '261px',
            width: '776px',
            height: '65px',
            opacity: 1,
            borderRadius: '24px',
            background: '#F0F1F5',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0px 20px 40px 0px #0000001A, 0px 4px 4px 0px #00000040',
            border: '1px solid transparent',
            borderImageSource: 'linear-gradient(127.23deg, rgba(255, 255, 255, 0.42) 2.46%, rgba(255, 255, 255, 0.24) 97.36%)',
            borderImageSlice: 1,
            overflow: 'visible'
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ margin: 0, width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 24px' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('category.searchPlaceholder') || 'Rechrcher un produit ...'}
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
                style={{ 
                  flex: 1, border: 'none', background: 'transparent', outline: 'none', 
                  fontSize: '16px', color: '#002896', opacity: 0.6 
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  position: 'absolute',
                  top: '12px',
                  left: '715px',
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '32px', 
                  background: '#F5F5FA', 
                  border: 'none',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  boxShadow: '-5px -5px 10px 0px #FFFFFF, 5px 5px 10px 0px #AAAACC80', 
                  cursor: 'pointer',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  zIndex: 2,
                  padding: 0
                }}
              >
                {/* Search Inner Wrapper (24x24) */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '24px',
                  height: '24px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Union (The SVG) */}
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#7878AB" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ 
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      opacity: 1,
                      transform: 'rotate(0deg)'
                    }}
                  >
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
              </button>
            </div>
          </form>

          {/* Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div style={{ 
              position: 'absolute', top: 'calc(100% + 10px)', left: 0, right: 0, 
              background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
              maxHeight: '400px', overflowY: 'auto', zIndex: 1000, border: '1px solid #f1f5f9', padding: '10px'
            }}>
              {searchResults.map((item, idx) => (
                <div key={idx} onClick={() => handleSearchSelect(item)} style={{ padding: '12px 16px', cursor: 'pointer', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '15px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.type === 'category' ? <img src={getCategoryImageUrl(item)} alt="" style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }} /> : 
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002896" strokeWidth="2"><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', color: '#002896' }}>{item.name || item.title || item.term}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

          {/* Right Links & Auth */}
          {!isMobile && (
            <>
              <span 
                style={{ 
                  position: 'absolute',
                  width: '84px',
                  height: '18px',
                  top: '72px',
                  left: '1050px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: '400',
                  fontSize: '16px',
                  lineHeight: '18px',
                  textAlign: 'center',
                  color: '#002896',
                  cursor: 'pointer'
                }}
              >
                Langue
              </span>
              <Link 
                href="/contact" 
                style={{ 
                  position: 'absolute',
                  width: '133px',
                  height: '18px',
                  top: '73px',
                  left: '1126px',
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: '400',
                  fontSize: '16px',
                  lineHeight: '18px',
                  textAlign: 'center',
                  color: '#002896',
                  textDecoration: 'none'
                }}
              >
                Nous contacter
              </Link>
            </>
          )}

        {/* --- AUTH / LOGIN --- */}
        {isClient && isReady && (
          <div ref={desktopAccountDropdownRef}>
            {isLogged ? (
              <>
                <NotificationBellStable 
                  variant="header" 
                  customIcon={
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="#002896"/>
                    </svg>
                  }
                  customButtonStyles={{ position: 'absolute', width: '30px', height: '30px', left: '1272px', top: '68px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', zIndex: 100, pointerEvents: 'auto' }}
                />
                <ChatNotifications 
                  variant="header" 
                  customIcon={
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="3" width="20" height="18" stroke="#002896" strokeWidth="2" strokeLinejoin="miter"/>
                      <path d="M2 6L12 13L22 6" stroke="#002896" strokeWidth="2" strokeLinejoin="miter"/>
                    </svg>
                  }
                  customButtonStyles={{ position: 'absolute', width: '26px', height: '26px', left: '1325px', top: '70px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', zIndex: 100, pointerEvents: 'auto' }}
                />
                <div style={{ position: 'absolute', width: '32px', height: '32px', left: '1373px', top: '67px', zIndex: 100, pointerEvents: 'auto' }}>
                  <button 
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="#002896"/>
                    </svg>
                  </button>

                {isAccountDropdownOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 15px)', right: 0, background: 'white', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', width: '260px', zIndex: 9999, border: '1px solid #f0f2f5', overflow: 'hidden', padding: '10px' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#002896' }}>{auth?.user?.firstName || 'Utilisateur'}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{auth?.user?.email}</div>
                    </div>
                    <Link href="/dashboard/profile" onClick={() => setIsAccountDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#1e293b', textDecoration: 'none', fontSize: '14px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Profil</Link>
                    <Link href="/dashboard" onClick={() => setIsAccountDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#1e293b', textDecoration: 'none', fontSize: '14px', borderRadius: '12px' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Tableau de bord</Link>
                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer', borderRadius: '12px', marginTop: '4px' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Déconnexion</button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <button 
                onClick={() => router.push('/auth/login')}
                style={{ 
                  position: 'absolute', 
                  top: '54px', 
                  left: '1289px', 
                  width: '118px', 
                  height: '65px', 
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#062C90',
                  borderRadius: '36.55px', 
                  background: '#FFFFFF', 
                  boxShadow: '1px 1px 4px 0px #0000004D', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  gap: '10px',
                  padding: '24px 36px',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ 
                  height: '23px', 
                  fontFamily: '"DM Sans", sans-serif', 
                  fontWeight: '600', 
                  fontSize: '18px', 
                  lineHeight: '100%',
                  textAlign: 'center',
                  color: '#062C90', 
                  opacity: 1,
                  transform: 'rotate(0deg)',
                  transition: 'color 0.2s',
                  display: 'block'
                }}>
                  Connexion
                </span>
              </button>
            )}
          </div>
        )}

        {/* --- BOTTOM NAVIGATION --- */}
        {isClient && windowWidth > 992 && (
          <>
            {/* Categories */}
            <div style={{ position: 'absolute', top: '143px', left: '273px', width: '125px', height: '36px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <CategoryMegaMenu 
                item={{ name: 'Catégories', path: '/category', matchPaths: ['/category'] }} 
                isActive={isNavActive(['/category'])} 
                triggerStyle={{
                  width: '125px', 
                  height: '36px', 
                  fontFamily: '"DM Sans", sans-serif', 
                  fontWeight: '400', 
                  fontSize: '16px', 
                  lineHeight: '16px', 
                  color: '#062C90', 
                  padding: '0 10px', 
                  gap: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: 'transparent',
                  opacity: 1,
                  transform: 'rotate(0deg)'
                }}
                chevronStyle={{ 
                  width: '24px', 
                  height: '24px', 
                  stroke: '#062C90',
                  opacity: 1,
                  transform: 'rotate(0deg)'
                }}
              />
            </div>

            {/* Nav Links */}
            <nav>
              {[
                { name: t('navigation.home') || 'Accueil', path: '/', left: '449px' },
                { name: t('navigation.howToBid') || 'Comment ça marche', path: '/how-to-bid', left: '519px' },
                { name: 'Startup', path: '/startup', left: '691px' },
                { name: 'International', path: '/international', left: '763px' },
                { name: 'Nos plans', path: '/plans', left: '873px' },
                { name: 'A propos', path: '/about', left: '963px' },
              ].map((item, index) => (
                <Link 
                  key={index} href={item.path} 
                  style={{ 
                    position: 'absolute', 
                    top: '152px', 
                    left: item.left, 
                    width: 'auto', 
                    height: 'auto', 
                    whiteSpace: 'nowrap',
                    opacity: 1,
                    transform: 'rotate(0deg)',
                    fontFamily: '"Inter", sans-serif', 
                    fontWeight: 400, 
                    fontSize: '16px', 
                    lineHeight: '18px', 
                    textAlign: 'center', 
                    color: '#062C90', 
                    textDecoration: 'none', 
                    transition: 'opacity 0.2s' 
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = 0.7}
                  onMouseOut={e => e.currentTarget.style.opacity = 1}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;