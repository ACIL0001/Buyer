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
  const accountDropdownRef = useRef(null);

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
      if (isAccountDropdownOpen && accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
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

  const navRow2 = [
    { name: t('navigation.home') || 'Accueil', path: '/', matchPaths: ['/'] },
    { name: t('navigation.howToBid') || 'Comment ça marche', path: '/how-to-bid', matchPaths: ['/how-to-bid'] },
    { name: 'Startup', path: '/startup', matchPaths: ['/startup'] },
    { name: 'International', path: '/international', matchPaths: ['/international'] },
    { name: 'Nos plans', path: '/plans', matchPaths: ['/plans'] },
    { name: 'A propos', path: '/about', matchPaths: ['/about'] },
  ];

  return (
    <header
      ref={headerRef}
      style={{
        width: '100%', position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 9999, backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        paddingTop: 'env(safe-area-inset-top, 0px)', boxSizing: 'border-box',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400
      }}
    >
      <div style={{ background: 'white', padding: isMobile ? '8px 16px' : '12px 24px', borderBottom: '1px solid #f0f2f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px', maxWidth: '1400px', margin: '0 auto' }}>
          
          <Link href={getFrontendUrl()} style={{ flexShrink: 0 }}>
            <img src={logoUrl || '/assets/img/logo.png'} alt="MazadClick" style={{ height: isMobile ? '44px' : '52px', objectFit: 'contain' }} />
          </Link>

          {/* ADVANCED SEARCH BAR PORTED FROM HOME1BANNER */}
          {!(isMobile && !isTablet) && (
            <div className="header-search-container" style={{ flex: 1, maxWidth: '650px', position: 'relative', zIndex: 100 }}>
              <form onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f4f5f9', borderRadius: '50px', padding: '0 6px 0 20px', height: '46px', border: '1px solid transparent', transition: 'box-shadow 0.3s', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)' }}>
                  
                  <input
                    ref={searchInputRef} type="text" placeholder={t('category.searchPlaceholder') || 'Rechercher un produit ...'}
                    value={searchQuery} onChange={handleSearchChange} onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14.5px', color: '#333' }}
                  />

                  {/* Filter Dropdown */}
                  <div ref={filterDropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '8px', height: '24px' }}>
                    <div onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#64748b', fontSize: '13px', fontWeight: '400', padding: '0 8px' }}>
                      {searchFilter === 'all' && 'Tous'}
                      {searchFilter === 'PRODUCT' && 'Produit'}
                      {searchFilter === 'SERVICE' && 'Service'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    {isFilterDropdownOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 15px)', right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '6px', minWidth: '120px', zIndex: 1000 }}>
                        {[{v: 'all', l: 'Tous'}, {v: 'PRODUCT', l: 'Produit'}, {v: 'SERVICE', l: 'Service'}].map(opt => (
                          <div key={opt.v} onClick={() => { setSearchFilter(opt.v); performSearch(searchQuery, opt.v); setIsFilterDropdownOpen(false); }}
                            style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', borderRadius: '6px', background: searchFilter === opt.v ? '#f0f7ff' : 'transparent', color: searchFilter === opt.v ? '#0063b1' : '#333' }}>
                            {opt.l}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search Button (Blue Icon) */}
                  <button type="submit" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', cursor: 'pointer', marginLeft: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#002896" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                </div>
              </form>

              {/* SEARCH RESULTS DROPDOWN */}
              {showSearchResults && searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '16px', marginTop: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', maxHeight: '350px', overflowY: 'auto', zIndex: 1000 }}>
                  {searchResults.map((item, idx) => (
                    <div key={idx} onClick={() => handleSearchSelect(item)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: idx < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: '12px' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {item.type === 'category' && <img src={getCategoryImageUrl(item)} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />}
                      {item.type === 'auction' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002896" strokeWidth="2"><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"/></svg>}
                      {item.type === 'tender' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9"/></svg>}
                      {item.type === 'directSale' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2"><path d="M20 4H4v2h16V4z"/></svg>}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: '400', color: '#1e293b' }}>{item.name || item.title || item.term}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{item.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* NOTIFY ME FALLBACK */}
              {(showNotifyMe || (showSearchResults && searchResults.length === 0 && searchQuery.length > 0 && !loadingSearch)) && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '16px', marginTop: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
                  <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#1e293b' }}>Aucun résultat pour "{searchQuery}"</h3>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#002896', fontWeight: '400', marginBottom: '10px' }}>Être notifié de la disponibilité</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="email" placeholder="Votre adresse email" value={notifyMeEmail} onChange={e => setNotifyMeEmail(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                      <button onClick={handleNotifyMe} style={{ background: '#002896', color: 'white', border: 'none', borderRadius: '8px', padding: '0 16px', fontSize: '13px', fontWeight: '400', cursor: 'pointer' }}>M'avertir</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px', marginLeft: 'auto' }}>
            {!isMobile && (
              <>
                <span style={{ fontSize: '14px', color: '#002896', cursor: 'pointer', fontWeight: 400 }}>Langue</span>
                <Link href="/contact" style={{ fontSize: '14px', color: '#002896', textDecoration: 'none', fontWeight: 400 }}>Nous contacter</Link>
              </>
            )}
            {isClient && isReady && isLogged && (
              <>
                <div style={{ color: '#002896' }}><NotificationBellStable variant="header" /></div>
                <div style={{ color: '#002896' }}><ChatNotifications variant="header" /></div>
              </>
            )}
            {isClient && isReady && (
              <div style={{ position: 'relative' }} ref={accountDropdownRef}>
                <button onClick={() => isLogged ? setIsAccountDropdownOpen(!isAccountDropdownOpen) : router.push('/auth/login')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#002896', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {!isLogged && <span style={{ fontSize: '14px', fontWeight: 400 }}>Connexion</span>}
                </button>
                {isAccountDropdownOpen && isLogged && (
                  <div style={{ 
                    position: 'absolute', top: 'calc(100% + 15px)', right: 0, 
                    background: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '20px', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12)', 
                    width: '240px', 
                    zIndex: 9999,
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    overflow: 'hidden',
                    padding: '8px'
                  }}>
                    {/* User Header */}
                    <div style={{ 
                      padding: '16px', 
                      borderBottom: '1px solid rgba(0,0,0,0.05)', 
                      background: 'rgba(0, 40, 150, 0.03)',
                      borderRadius: '14px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: 400, color: '#002896', marginBottom: '2px' }}>
                        {auth?.user?.entreprise || auth?.user?.firstName || 'Utilisateur'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {auth?.user?.email || ''}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link href="/profile" onClick={() => setIsAccountDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#1e293b', textDecoration: 'none', fontSize: '14px', fontWeight: 400, borderRadius: '12px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 40, 150, 0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Profil
                    </Link>

                    <Link href="/dashboard" onClick={() => setIsAccountDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#1e293b', textDecoration: 'none', fontSize: '14px', fontWeight: 400, borderRadius: '12px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 40, 150, 0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      Tableau de bord
                    </Link>

                    <Link href="/settings" onClick={() => setIsAccountDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#1e293b', textDecoration: 'none', fontSize: '14px', fontWeight: 400, borderRadius: '12px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 40, 150, 0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      Paramètres
                    </Link>

                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: 400, cursor: 'pointer', borderRadius: '12px', transition: 'all 0.2s', marginTop: '4px' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            )}
            {isClient && windowWidth <= 992 && (
              <button onClick={() => setMenuOpen(!isMenuOpen)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#002896" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {isClient && windowWidth > 992 && (
        <div style={{ background: 'white', padding: '0 24px 10px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '35px', maxWidth: '1400px', margin: '0 auto', paddingLeft: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#002896', cursor: 'pointer' }}>
              <CategoryMegaMenu item={{ name: 'Catégories', path: '/category', matchPaths: ['/category'] }} isActive={isNavActive(['/category'])} />
            </div>
            <nav>
              <ul style={{ display: 'flex', alignItems: 'center', gap: '25px', listStyle: 'none', margin: 0, padding: 0 }}>
                {navRow2.map((item, index) => (
                  <li key={index}><Link href={item.path} style={{ color: '#002896', fontWeight: 400, fontSize: '14.5px', textDecoration: 'none' }}>{item.name}</Link></li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;