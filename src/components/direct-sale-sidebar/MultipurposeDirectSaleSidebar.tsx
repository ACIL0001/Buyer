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
import { motion } from 'framer-motion';
import FilterPopup from '../common/FilterPopup';

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

const getDirectSaleImageUrl = (directSale: any, index: number = 0) => {
  const images = directSale.thumbs || directSale.images || [];
  if (images.length > 0 && images[index]) {
    const imgObj = images[index];
    const url = typeof imgObj === 'string' ? imgObj : (imgObj.url || imgObj.fullUrl || imgObj);
    return normalizeImageUrl(url);
  }
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
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]); // Added multi-type state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('NEWEST'); // 'NEWEST', 'OLDEST', 'PRICE_ASC', 'PRICE_DESC'
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [cardImageIndexes, setCardImageIndexes] = useState<{ [key: string]: number }>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availability, setAvailability] = useState({ inStock: false, recentlyPublished: false });
  const [rating, setRating] = useState<number | null>(null);

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

    // Type Filter (Product/Service)
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(s => {
        const type = (s.saleType || s.type || s.tenderType || '').toUpperCase();
        return selectedTypes.includes(type);
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
  }, [allDirectSalesResponse, auth.user, selectedTypes, priceRange, selectedCategories, selectedWilaya, searchQuery, sortOrder]);

  const itemsPerPage = 12;
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

        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => setIsFilterOpen(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px 25px', 
              borderRadius: '12px', 
              border: 'none', 
              background: '#f8f9fb', 
              color: '#002896', 
              fontWeight: '800', 
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <i className="bi bi-funnel-fill"></i>
            Filtre
          </button>
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

        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(12px, 3vw, 20px)', display: 'flex', justifyContent: 'center' }}>

          {/* Grid Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', columnGap: 'clamp(12px, 2vw, 25px)', rowGap: 'clamp(20px, 3vw, 40px)', width: '100%', maxWidth: '1232px', margin: '0 auto' }}>
              {currentData.length > 0 ? currentData.map((sale: any, i) => {
                const companyName = sale.owner?.entreprise || sale.owner?.firstName || 'Nom entreprise';
                const type = (sale.type || sale.tenderType)?.toUpperCase();
                const isProd = type === 'PRODUCT';

                return (
                  <motion.div 
                    key={sale.id || i}
                    initial={false}
                    animate={{ rotateY: flippedId === sale.id ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    style={{
                      width: '100%',
                      maxWidth: '320px',
                      aspectRatio: '284 / 464',
                      margin: '0 auto',
                      position: 'relative',
                      zIndex: 1,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    {/* FRONT SIDE */}
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        border: 'none'
                      }}
                      onClick={() => !flippedId && router.push(`/direct-sale/${sale.id}`)}
                    >
                    <div style={{ width: '100%', aspectRatio: '284 / 280', borderRadius: '20px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 20 }}>
                        <ShareButton 
                          type="directSale" 
                          id={sale.id} 
                          title={sale.title} 
                          description={sale.description} 
                          imageUrl={getDirectSaleImageUrl(sale, cardImageIndexes[sale.id] || 0)} 
                        />
                      </div>
                      <img 
                        src={getDirectSaleImageUrl(sale, cardImageIndexes[sale.id] || 0)} 
                        alt={sale.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'fill' }} 
                        onError={(e) => (e.currentTarget.src = DEFAULT_DIRECT_SALE_IMAGE)} 
                      />

                      {/* Image Navigation Arrows */}
                      {(sale.thumbs?.length > 1 || sale.images?.length > 1) && (
                        <>
                          <div 
                            className="image-nav-arrow"
                            style={{
                              position: 'absolute',
                              top: '45%',
                              left: '8px',
                              transform: 'translateY(-50%)',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 25,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              border: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const total = (sale.thumbs?.length || sale.images?.length || 1);
                              const current = cardImageIndexes[sale.id] || 0;
                              setCardImageIndexes({ ...cardImageIndexes, [sale.id]: (current - 1 + total) % total });
                            }}
                          >
                            <i className="bi bi-chevron-left" style={{ color: '#002896', fontSize: '12px' }}></i>
                          </div>
                          <div 
                            className="image-nav-arrow"
                            style={{
                              position: 'absolute',
                              top: '45%',
                              right: '8px',
                              transform: 'translateY(-50%)',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 25,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              border: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const total = (sale.thumbs?.length || sale.images?.length || 1);
                              const currentIdx = cardImageIndexes[sale.id] || 0;
                              setCardImageIndexes({ ...cardImageIndexes, [sale.id]: (currentIdx + 1) % total });
                            }}
                          >
                            <i className="bi bi-chevron-right" style={{ color: '#002896', fontSize: '12px' }}></i>
                          </div>
                          
                          {/* Dots indicator */}
                          <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '4px',
                            zIndex: 25
                          }}>
                            {(sale.thumbs || sale.images).map((_: any, i: number) => (
                              <div key={i} style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: (cardImageIndexes[sale.id] || 0) === i ? '#002896' : 'rgba(255,255,255,0.6)',
                                transition: 'all 0.3s ease'
                              }} />
                            ))}
                          </div>
                        </>
                      )}
                      
                      <div 
                        style={{ 
                          position: 'absolute', 
                          bottom: '10px', 
                          right: '10px', 
                          zIndex: 30,
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          padding: '3px 8px',
                          borderRadius: '15px',
                          boxShadow: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.3s ease',
                          border: 'none'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlippedId(flippedId === sale.id ? null : sale.id);
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '600', 
                          color: '#002896',
                          fontFamily: 'Inter, sans-serif'
                        }}>Plus de détails</span>
                        <i className="bi bi-info-circle" style={{ color: '#002896', fontSize: '12px' }}></i>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '10px 10px', 
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{
                          width: '100%',
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: '700',
                          fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
                          lineHeight: 1.15,
                          letterSpacing: '0px',
                          color: '#002896',
                          margin: '0 0 6px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          opacity: 1
                        }}>
                          {sale.title || 'Nom Produit'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                            <span style={{ 
                              width: 'auto',
                              height: '29px',
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: '700', 
                              fontSize: Number(sale.price || 0).toLocaleString().length > 10 ? '16px' : 
                                        Number(sale.price || 0).toLocaleString().length > 8 ? '20px' : '24px', 
                              lineHeight: '29px',
                              color: '#002896',
                              transition: 'font-size 0.2s ease'
                            }}>
                             {Number(sale.price || 0).toLocaleString()}
                            </span>
                            <span style={{ 
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px', 
                              fontWeight: '700', 
                              color: '#002896',
                              marginLeft: '1px'
                            }}>DA</span>
                          </div>
                          <span style={{
                            maxWidth: '120px',
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
                            fontWeight: '400',
                            lineHeight: 1.2,
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

                        <button
                          style={{
                            width: '100%',
                            minHeight: '44px',
                            backgroundColor: '#EB4545',
                            borderRadius: '10px',
                            padding: '10px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            gap: '10px',
                            marginTop: '12px',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/direct-sale/${sale.id}`);
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.filter = 'brightness(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.filter = 'brightness(1)';
                          }}
                        >
                          <span style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: '500',
                            fontSize: '16px',
                            lineHeight: '100%',
                            color: '#FFFFFF',
                            textAlign: 'center'
                          }}>
                            Acheter rapide
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                    {/* BACK SIDE */}
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        backgroundColor: 'transparent',
                        color: '#333',
                        transform: 'rotateY(180deg)',
                        padding: '18px',
                        boxSizing: 'border-box',
                        border: 'none',
                        boxShadow: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', fontFamily: 'Roboto, sans-serif', color: '#002896', textTransform: 'uppercase' }}>Fiche Technique</h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFlippedId(null);
                          }}
                          style={{ backgroundColor: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <i className="bi bi-x-lg" style={{ fontSize: '16px' }}></i>
                        </button>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                        {/* Databook rows */}
                         {[
                          { label: 'Désignation', value: sale.title },
                          { label: 'Prix Unitaire', value: `${Number(sale.price || 0).toLocaleString()} DA` },
                          { label: 'Disponible', value: sale.quantity > 0 ? (sale.quantity - (sale.soldQuantity || 0)) : 'Illimité' },
                          { label: 'Type', value: (sale.bidType === 'SERVICE' || sale.saleType === 'SERVICE') ? '🛠️ Service' : '📦 Produit' },
                          { label: 'Catégorie', value: sale.category?.name || sale.productSubCategory?.name || sale.productCategory?.name || sale.categoryName || 'Général' },
                          { label: 'Localisation', value: `${sale.wilaya || ''}${sale.place ? ', ' + sale.place : ''}` || 'Algérie' },
                          { label: 'Vendeur', value: companyName },
                        ].map((row, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '1px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#888', flexShrink: 0 }}>{row.label}</span>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#333', textAlign: 'right', marginLeft: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{row.value}</span>
                          </div>
                        ))}

                        <div style={{ marginTop: '5px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '600', color: '#888', margin: '0 0 3px 0' }}>Description</p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: '#555', 
                            margin: 0, 
                            lineHeight: '1.4', 
                            fontFamily: 'Inter, sans-serif',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {sale.description || 'Aucune description disponible.'}
                          </p>
                        </div>
                      </div>

                      <button 
                        style={{
                          width: '100%',
                          height: '40px',
                          backgroundColor: '#EB4545',
                          color: '#fff',
                          borderRadius: '8px',
                          border: 'none',
                          marginTop: '12px',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => router.push(`/direct-sale/${sale.id}`)}
                      >
                        Consulter le produit
                      </button>
                    </div>
                  </motion.div>
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

        <FilterPopup 
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={(id: string) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])}
          priceRange={priceRange}
          onPriceChange={(key: string, val: string) => setPriceRange(prev => ({ ...prev, [key]: val }))}
          wilayas={WILAYAS}
          selectedWilaya={selectedWilaya}
          onWilayaChange={setSelectedWilaya}
          selectedTypes={selectedTypes}
          onToggleType={(type: string) => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
          availability={availability}
          onToggleAvailability={(key: string) => { const k = key as 'inStock' | 'recentlyPublished'; setAvailability(prev => ({ ...prev, [k]: !prev[k] })); }}
          rating={rating}
          onToggleRating={(r: number) => setRating(prev => prev === r ? null : r)}
          onClear={() => {
            setPriceRange({ min: '', max: '' });
            setSelectedCategories([]);
            setSelectedWilaya('');
            setSelectedTypes([]);
            setAvailability({ inStock: false, recentlyPublished: false });
            setRating(null);
          }}
          onApply={() => {
            setIsFilterOpen(false);
            setCurrentPage(1);
          }}
        />
      </div>
    </>
  );
}

export default MultipurposeDirectSaleSidebar;