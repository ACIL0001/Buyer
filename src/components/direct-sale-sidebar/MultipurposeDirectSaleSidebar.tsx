"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState, useCallback, useMemo } from 'react'
import { DirectSaleAPI } from '@/app/api/direct-sale'
import { CategoryAPI } from '@/app/api/category'
import { useTranslation } from 'react-i18next'
import useAuth from '@/hooks/useAuth'
import { normalizeImageUrl } from '@/utils/url'
import { useQuery } from '@tanstack/react-query'
import PageSkeleton from '@/components/skeletons/PageSkeleton'
import Header from '@/components/header/Header';
import Footer from '@/components/footer/FooterWithErrorBoundary';
import ShareButton from "@/components/common/ShareButton";

const DEFAULT_DIRECT_SALE_IMAGE = "/assets/images/logo-white.png";

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

const getDirectSaleImageUrl = (sale: any) => {
  if (sale.thumbs && sale.thumbs.length > 0 && sale.thumbs[0].url) return normalizeImageUrl(sale.thumbs[0].url);
  return DEFAULT_DIRECT_SALE_IMAGE;
};

const MultipurposeDirectSaleSidebar = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { auth } = useAuth();
  
  // States for Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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

  const { data: allDirectSalesResponse, isLoading } = useQuery({
    queryKey: ['direct-sales', 'all'],
    queryFn: () => DirectSaleAPI.getDirectSales(),
  });

  const allDirectSales = useMemo(() => {
    const data = (allDirectSalesResponse as any)?.data || (Array.isArray(allDirectSalesResponse) ? allDirectSalesResponse : []);
    let transformed = (Array.isArray(data) ? data : []).map((sale: any) => ({ ...sale, id: sale.id || sale._id }));
    const activeSales = transformed.filter((sale: any) => sale.status !== 'ARCHIVED' && sale.status !== 'INACTIVE');
    const isUserVerified = auth.user?.isVerified === true || auth.user?.isVerified === 1;
    
    // Auth & Basic Filter
    let filtered = activeSales.filter((sale: any) => sale.verifiedOnly === true ? isUserVerified : true);

    // Type Filter (Product/Service) - Corrected logic
    if (tenderType !== 'ALL') {
      filtered = filtered.filter(s => {
        const type = s.saleType || s.type || s.tenderType;
        return type?.toUpperCase() === tenderType;
      });
    }

    // Price Filter (Min/Max inputs)
    if (priceRange.min !== '') {
      filtered = filtered.filter(s => (s.price || 0) >= parseFloat(priceRange.min));
    }
    if (priceRange.max !== '') {
      filtered = filtered.filter(s => (s.price || 0) <= parseFloat(priceRange.max));
    }

    // Category Filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(s => selectedCategories.includes(s.categoryId || s.category?._id));
    }

    // Wilaya Filter
    if (selectedWilaya) {
      filtered = filtered.filter(s => s.wilaya === selectedWilaya);
    }

    // Search Filter
    if (searchQuery) {
      filtered = filtered.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sorting
    if (sortOrder === 'PRICE_ASC') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === 'PRICE_DESC') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOrder === 'OLDEST') {
      filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortOrder === 'NEWEST') {
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return filtered;
  }, [allDirectSalesResponse, auth.user, tenderType, priceRange, selectedCategories, selectedWilaya, searchQuery, sortOrder]);

  const itemsPerPage = 9;
  const totalPages = Math.max(1, Math.ceil(allDirectSales.length / itemsPerPage));
  const currentData = allDirectSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatPrice = useCallback((price: number) => `${Number(price).toLocaleString()} DA`, []);

  const toggleCategory = (id: string) => {
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
            color: '#86efac', 
            margin: '80px auto 0 auto', 
            letterSpacing: '0px'
          }}>
            Marchés et ventes en cours
          </h1>
        </div>

        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '40px' }}>
          
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
                  {categories.map((cat: any) => (
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 284px)', gap: '25px', rowGap: '40px', justifyContent: 'center' }}>
              {currentData.length > 0 ? currentData.map((sale: any, i) => {
                const companyName = sale.owner?.entreprise || sale.owner?.firstName || 'Nom entreprise';
                const type = (sale.type || sale.tenderType)?.toUpperCase();
                const isProd = type === 'PRODUCT';

                return (
                  <div 
                    key={sale.id || i}
                    style={{ 
                      width: '284px',
                      minWidth: '284px',
                      maxWidth: '284px',
                      height: '383px',
                      minHeight: '383px',
                      maxHeight: '383px',
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 1,
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      transition: 'transform 0.3s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-10px)'} 
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    onClick={() => sale.id && router.push(`/direct-sale/${sale.id}`)}
                  >
                    <div style={{ width: '284px', height: '295px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                        <ShareButton 
                          type="directSale" 
                          id={sale.id} 
                          title={sale.title} 
                          description={sale.description} 
                          imageUrl={getDirectSaleImageUrl(sale)} 
                        />
                      </div>
                      <img 
                        src={getDirectSaleImageUrl(sale)} 
                        alt={sale.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
                        onError={(e) => (e.currentTarget.src = DEFAULT_DIRECT_SALE_IMAGE)} 
                      />
                    </div>
                        <div style={{ 
                          padding: '12px 10px', 
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative'
                        }}>
                          <h4 style={{ 
                            width: '281px',
                            height: '23px',
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: '700', 
                            fontSize: '20px', 
                            lineHeight: '100%',
                            letterSpacing: '0px',
                            verticalAlign: 'middle',
                            color: '#002896', 
                            margin: '0 0 6px 0', 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            opacity: 1
                          }}>
                            {sale.title || 'Nom Produit'}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ 
                                width: 'auto',
                                height: '29px',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: '700', 
                                fontSize: '24px', 
                                lineHeight: '29px',
                                color: '#002896',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                               {Number(sale.price || 0).toLocaleString()}
                              </span>
                              <span style={{ 
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '14px', 
                                fontWeight: '700', 
                                color: '#002896',
                                marginLeft: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}>DA</span>
                            </div>
                            <span style={{ 
                              width: '101px',
                              height: '16px',
                              fontFamily: 'Roboto, sans-serif',
                              fontSize: '14px', 
                              fontWeight: '400', 
                              lineHeight: '16px',
                              color: '#002896', 
                              display: 'flex',
                              alignItems: 'center',
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              textAlign: 'right',
                              justifyContent: 'flex-end'
                            }}>
                              {companyName}
                            </span>
                          </div>
                        </div>
                  </div>
                );
              }) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px', color: '#666', fontWeight:'800' }}>Aucune vente directe disponible pour ces critères.</div>
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
}

export default MultipurposeDirectSaleSidebar;