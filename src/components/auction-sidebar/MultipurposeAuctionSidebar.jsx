"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AuctionsAPI } from '@/app/api/auctions'
import { CategoryAPI } from '@/app/api/category'
import { normalizeImageUrl } from '@/utils/url';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import PageSkeleton from '@/components/skeletons/PageSkeleton';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/FooterWithErrorBoundary';

const DEFAULT_AUCTION_IMAGE = "/assets/images/logo-white.png";

const WILAYAS = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar",
    "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou",
    "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba",
    "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
    "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdès", "El Tarf",
    "Tindouf", "Tissemsilt", "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila",
    "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun",
    "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam",
    "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
];

export function calculateTimeRemaining(endDate) {
  const total = Date.parse(endDate) - Date.now();
  if (total <= 0) return { days: "0", hours: "0", minutes: "0", seconds: "0", hasEnded: true };
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)).toString(),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24).toString(),
    minutes: Math.floor((total / 1000 / 60) % 60).toString(),
    hasEnded: false
  };
}

const getAuctionImageUrl = (auction) => {
  const possibleImageSources = [
    auction.thumbs?.[0]?.url, auction.thumbs?.[0]?.fullUrl, auction.images?.[0], 
    auction.image, auction.thumbnail, auction.photo, auction.picture
  ].filter(Boolean);
  if (possibleImageSources.length > 0) return normalizeImageUrl(possibleImageSources[0]);
  return DEFAULT_AUCTION_IMAGE;
};

const MultipurposeAuctionSidebar = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { auth } = useAuth();
  
  // States for Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [tenderType, setTenderType] = useState('ALL'); // 'ALL', 'PRODUCT', 'SERVICE'
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('NEWEST'); // 'NEWEST', 'OLDEST', 'PRICE_ASC', 'PRICE_DESC'

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => CategoryAPI.getCategories(),
  });
  const categories = useMemo(() => {
    if (categoriesData?.success && categoriesData.data) return categoriesData.data;
    if (Array.isArray(categoriesData)) return categoriesData;
    return [];
  }, [categoriesData]);

  const { data: allAuctionsResponse, isLoading } = useQuery({
    queryKey: ['auctions', 'all'],
    queryFn: () => AuctionsAPI.getAuctions(),
  });

  const allAuctions = useMemo(() => {
    const data = allAuctionsResponse?.data || (Array.isArray(allAuctionsResponse) ? allAuctionsResponse : []);
    let transformed = (Array.isArray(data) ? data : []).map(a => ({ ...a, id: a.id || a._id }));
    const nonProAuctions = transformed.filter(a => a.isPro !== true);
    const isUserVerified = auth.user?.isVerified === true || auth.user?.isVerified === 1;
    
    // Auth Filter
    let filtered = nonProAuctions.filter(a => a.verifiedOnly === true ? isUserVerified : true);

    // Type Filter (Tender Type used as Product/Service logic)
    if (tenderType !== 'ALL') {
      filtered = filtered.filter(a => {
        const type = a.bidType || a.tenderType || a.type;
        return type?.toUpperCase() === tenderType;
      });
    }

    // Price Filter (Min/Max inputs)
    if (priceRange.min !== '') {
      filtered = filtered.filter(a => (a.currentPrice || a.startingPrice || 0) >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(a => (a.currentPrice || a.startingPrice || 0) <= parseFloat(priceRange.max));
    }

    // Category Filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(a => selectedCategories.includes(a.categoryId || a.category?._id));
    }

    // Wilaya Filter
    if (selectedWilaya) {
      filtered = filtered.filter(a => a.wilaya === selectedWilaya);
    }

    // Search Filter
    if (searchQuery) {
      filtered = filtered.filter(a => a.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sorting Filter
    if (sortOrder === 'PRICE_ASC') {
      filtered.sort((a, b) => (a.currentPrice || a.startingPrice || 0) - (b.currentPrice || b.startingPrice || 0));
    } else if (sortOrder === 'PRICE_DESC') {
      filtered.sort((a, b) => (b.currentPrice || b.startingPrice || 0) - (a.currentPrice || a.startingPrice || 0));
    } else if (sortOrder === 'OLDEST') {
      filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortOrder === 'NEWEST') {
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return filtered;
  }, [allAuctionsResponse, auth.user, tenderType, priceRange, selectedCategories, selectedWilaya, searchQuery, sortOrder]);

  const [timers, setTimers] = useState({});
  useEffect(() => {
    if (allAuctions.length === 0) return;
    const updateTimers = () => {
      const newTimers = {};
      allAuctions.forEach(auction => {
        if (auction.id && auction.endingAt) newTimers[auction.id] = calculateTimeRemaining(auction.endingAt);
      });
      setTimers(newTimers);
    };
    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, [allAuctions]);

  const itemsPerPage = 9;
  const totalPages = Math.max(1, Math.ceil(allAuctions.length / itemsPerPage));
  const currentData = allAuctions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatPrice = useCallback((price) => `${Number(price).toLocaleString()} DA`, []);

  const toggleCategory = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <div style={{ background: '#ffffff', minHeight: '100vh', padding: '0 0 80px 0' }}>
        
        {/* Header Section */}
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', marginBottom: '40px', position: 'relative' }}>
          <h1 style={{ 
            fontFamily: '"DM Sans", sans-serif', 
            fontWeight: '700', 
            fontSize: '45px', 
            lineHeight: '46px', 
            textAlign: 'center', 
            color: '#b06363', 
            margin: '80px auto 0 auto', 
            letterSpacing: '0px'
          }}>
            Enchères à la une
          </h1>
        </div>

        {/* Global Filter Bar */}
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 40px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '20px' }}>
          <div /> {/* Left Spacer */}
          <div style={{ position: 'relative', width: '350px' }}>
             <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 20px', borderRadius: '50px', border: '1px solid #f1f5f9', background: '#f8f9fb', outline: 'none', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
             <span style={{ fontSize: '14px', color: '#666', fontWeight: '800' }}>Trier par:</span>
             <select 
               value={sortOrder} 
               onChange={(e) => setSortOrder(e.target.value)}
               style={{ padding: '10px 15px', borderRadius: '12px', border: 'none', background: '#f8f9fb', outline: 'none', fontSize: '13px', color: '#002896', fontWeight: '800', cursor: 'pointer', minWidth: '150px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
             >
               <option value="NEWEST">Nouveau</option>
               <option value="OLDEST">Ancien</option>
               <option value="PRICE_ASC">Prix croissant</option>
               <option value="PRICE_DESC">Prix décroissant</option>
             </select>
          </div>
        </div>

        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '60px' }}>
          
          {/* Sidebar Filter - Glassmorphism Restyle */}
          <aside style={{ width: '231px', flexShrink: 0 }}>
            <div style={{ 
              width: '231px',
              background: 'linear-gradient(127.45deg, rgba(230, 230, 230, 0.7) 2.15%, rgba(195, 201, 215, 0.14) 63.05%)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px', 
              padding: '24px', 
              boxShadow: '0px 20px 40px 0px #0000001A, 0px 4px 4px 0px #00000040', 
              position: 'sticky', 
              top: '140px',
              border: '1px solid',
              borderImageSource: 'linear-gradient(127.23deg, rgba(255, 255, 255, 0.42) 2.46%, rgba(255, 255, 255, 0.24) 97.36%)',
              opacity: 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <span style={{ fontSize: '16px', color: '#002896', fontWeight: '800' }}>Filtrer</span>
                <span onClick={() => {setSelectedCategories([]); setPriceRange({min:'', max:''}); setSearchQuery(''); setTenderType('ALL'); setSelectedWilaya(''); setSortOrder('NEWEST');}} style={{fontSize: '11px', color:'#002896', cursor:'pointer', fontWeight:'700'}}>Réinitialiser</span>
              </div>

              {/* Type Filter in Sidebar */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ fontSize: '14px', color: '#002896', fontWeight: '800', marginBottom: '15px' }}>Type</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['ALL', 'PRODUCT', 'SERVICE'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                      <input type="radio" name="tenderTypeSidebar" checked={tenderType === type} onChange={() => { setTenderType(type); setCurrentPage(1); }} style={{ accentColor: '#002896' }} />
                      {type === 'ALL' ? 'Tout' : type === 'PRODUCT' ? 'Produit' : 'Service'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter - Min/Max inputs */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ fontSize: '14px', color: '#002896', fontWeight: '800', marginBottom: '15px' }}>Prix (DA)</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={priceRange.min} 
                    onChange={(e) => setPriceRange(prev => ({...prev, min: e.target.value}))} 
                    style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.6)', fontSize: '12px', outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}
                  />
                  <span style={{color:'#666'}}>-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={priceRange.max} 
                    onChange={(e) => setPriceRange(prev => ({...prev, max: e.target.value}))} 
                    style={{ width: '100%', padding: '10px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.6)', fontSize: '12px', outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}
                  />
                </div>
              </div>

              {/* Wilaya Filter */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ fontSize: '14px', color: '#002896', fontWeight: '800', marginBottom: '15px' }}>Wilaya</h4>
                <select 
                  value={selectedWilaya} 
                  onChange={(e) => setSelectedWilaya(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.6)', color: '#666', fontSize: '13px', outline: 'none', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                >
                  <option value="">Toutes les wilayas</option>
                  {WILAYAS.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Categories Filter */}
              <div>
                <h4 style={{ fontSize: '14px', color: '#002896', fontWeight: '800', marginBottom: '15px' }}>Catégories</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                  {categories.map((cat) => (
                    <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedCategories.includes(cat._id)} onChange={() => toggleCategory(cat._id)} style={{ accentColor: '#002896' }} />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid Content */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', rowGap: '60px', justifyItems: 'center' }}>
              {currentData.length > 0 ? currentData.map((auction, i) => {
                const timer = timers[auction.id] || { days: "0", hours: "0", minutes: "0", hasEnded: false };
                const companyName = auction.owner?.entreprise || auction.owner?.firstName || 'Nom Entreprise';
                const type = (auction.type || auction.tenderType)?.toUpperCase();
                const isProd = type !== 'SERVICE';

                return (
                  <div key={auction.id || i} style={{ cursor: 'pointer', width: '295px', margin: '0 auto', transition: 'transform 0.3s' }} onClick={() => auction.id && router.push(`/auction-details/${auction.id}`)} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ 
                      borderRadius: '20px', 
                      overflow: 'hidden', 
                      width: '295px',
                      height: '295px', 
                      marginBottom: '20px',
                      boxShadow: '0px 10px 30px 0px #C34B4ECC', 
                      background: '#eee',
                      transition: 'all 0.3s',
                      opacity: 1
                    }}
                    >
                      <img src={getAuctionImageUrl(auction)} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.currentTarget.src = DEFAULT_AUCTION_IMAGE} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 5px' }}>
                      <h3 style={{ fontSize: '18px', color: '#002896', fontWeight: '900', margin: 0 }}>{auction.title || 'Nom Produit'}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '18px', color: '#002896', fontWeight: '900' }}>{formatPrice(auction.currentPrice || auction.startingPrice || 0)}</span>
                        <span style={{ fontSize: '11px', color: '#002896', fontWeight: '600' }}>{auction.participantsCount || 0} enchères</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent:'space-between', alignItems: 'center' }}>
                         <div style={{ fontSize: '11px', color: '#666', fontWeight: '500' }}>
                            Temps restant {timer.hasEnded ? 'Terminé' : `${timer.days}j${timer.hours}h`}
                         </div>
                         <span style={{ fontSize: '10px', color: '#666', fontWeight: '600' }}>{companyName}</span>
                      </div>
                      {auction.wilaya && <div style={{ fontSize: '11px', color: '#999', fontWeight: '600' }}>📍 {auction.wilaya}</div>}
                    </div>
                  </div>
                );
              }) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', color: '#666', fontWeight:'800' }}>Aucune enchère ne correspond à vos recherches.</div>
              )}
            </div>

            {/* Pagination Logic - Enhanced Green Style */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '100px', gap: '20px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ 
                    padding: '12px 30px', 
                    borderRadius: '50px', 
                    background: currentPage === 1 ? '#f1f5f9' : '#61d997', 
                    border: 'none', 
                    color: currentPage === 1 ? '#94a3b8' : 'white', 
                    fontWeight: '800', 
                    fontSize: '14px', 
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    boxShadow: '0 4px 10px rgba(97, 217, 151, 0.2)',
                    transition: '0.3s'
                  }}>
                  Précédent
                </button>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {Array.from({length: totalPages}, (_, i) => i + 1).map(num => {
                    // Show 1, totalPages, and 주변 pages
                    if (num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1)) {
                      return (
                        <div 
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          style={{ 
                            width: '42px', 
                            height: '42px', 
                            borderRadius: '12px', 
                            background: currentPage === num ? '#61d997' : '#fff', 
                            border: currentPage === num ? 'none' : '1px solid #e2e8f0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: currentPage === num ? '#fff' : '#64748b', 
                            fontWeight: '800', 
                            cursor:'pointer', 
                            boxShadow: currentPage === num ? '0 4px 12px rgba(97, 217, 151, 0.3)' : 'none',
                            transition: '0.3s'
                          }}>
                          {num}
                        </div>
                      );
                    } else if (num === 2 && currentPage > 3) {
                      return <span key="dots-start" style={{ color: '#cbd5e1', fontWeight: '800' }}>...</span>;
                    } else if (num === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key="dots-end" style={{ color: '#cbd5e1', fontWeight: '800' }}>...</span>;
                    }
                    return null;
                  })}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ 
                    padding: '12px 40px', 
                    borderRadius: '50px', 
                    background: currentPage === totalPages ? '#f1f5f9' : '#61d997', 
                    border: 'none', 
                    color: currentPage === totalPages ? '#94a3b8' : 'white', 
                    fontWeight: '800', 
                    fontSize: '14px', 
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    boxShadow: '0 4px 10px rgba(97, 217, 151, 0.2)',
                    transition: '0.3s'
                  }}>
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MultipurposeAuctionSidebar;