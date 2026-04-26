"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {any[]} props.categories
 * @param {string[]} props.selectedCategories
 * @param {(id: string) => void} props.onToggleCategory
 * @param {{ min: string, max: string }} props.priceRange
 * @param {(key: string, val: string) => void} props.onPriceChange
 * @param {string[]} [props.wilayas]
 * @param {string} props.selectedWilaya
 * @param {(val: string) => void} props.onWilayaChange
 * @param {string[]} [props.selectedTypes]
 * @param {(type: string) => void} props.onToggleType
 * @param {() => void} props.onClear
 * @param {() => void} props.onApply
 * @param {{ inStock: boolean, recentlyPublished: boolean }} [props.availability]
 * @param {(key: string) => void} [props.onToggleAvailability]
 * @param {number | null} [props.rating]
 * @param {(r: number) => void} [props.onToggleRating]
 */
const FilterPopup = ({ 
  isOpen, 
  onClose, 
  categories, 
  selectedCategories, 
  onToggleCategory,
  priceRange,
  onPriceChange,
  wilayas = [],
  selectedWilaya,
  onWilayaChange,
  selectedTypes = [],
  onToggleType,
  onClear,
  onApply,
  availability = { inStock: false, recentlyPublished: false },
  onToggleAvailability = () => {},
  rating = null,
  onToggleRating = () => {}
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(2px)'
        }} 
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '12px', 
            padding: '60px', 
            width: '95%', 
            maxWidth: '1000px', 
            maxHeight: '95vh', 
            overflowY: 'auto',
            boxShadow: '0 4px 40px rgba(0,0,0,0.06)',
            position: 'relative',
            fontFamily: '"Inter", "DM Sans", sans-serif'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button Cross */}
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '30px', right: '30px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px', color: '#ccc' }}
          >
            <i className="bi bi-x"></i>
          </button>

          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#777', marginBottom: '40px', letterSpacing: '-0.5px' }}>Filtrer les produits</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
            <div>
              {/* Category Filter */}
              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#777', marginBottom: '25px' }}>Filtrer par catégories</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 10px' }}>
                  {categories.slice(0, 10).map(cat => (
                    <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#777', cursor: 'pointer', fontWeight: '600' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat._id)} 
                        onChange={() => onToggleCategory(cat._id)} 
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#00a3e0', border: '1.5px solid #ddd', borderRadius: '4px' }}
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#777', marginBottom: '25px' }}>Type d'annonce</h4>
                <div style={{ display: 'flex', gap: '40px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#777', cursor: 'pointer', fontWeight: '600' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedTypes.includes('PRODUCT')} 
                      onChange={() => onToggleType('PRODUCT')} 
                      style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#00a3e0' }} 
                    />
                    Produit
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#777', cursor: 'pointer', fontWeight: '600' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedTypes.includes('SERVICE')} 
                      onChange={() => onToggleType('SERVICE')} 
                      style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#00a3e0' }} 
                    />
                    Service
                  </label>
                </div>
              </div>
            </div>

            <div>
              {/* Wilaya Filter */}
              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#777', marginBottom: '25px' }}>Wilaya</h4>
                <select 
                  value={selectedWilaya} 
                  onChange={(e) => onWilayaChange(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', color: '#777', fontWeight: '600', background: '#fff' }}
                >
                  <option value="">Toutes les wilayas</option>
                  {wilayas.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#777', marginBottom: '25px' }}>Prix</h4>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#888', marginBottom: '8px', display: 'block', textAlign: 'center', fontWeight: '600' }}>Minimum</span>
                    <input 
                      type="number" 
                      value={priceRange.min} 
                      onChange={e => onPriceChange('min', e.target.value)} 
                      style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#888', marginBottom: '8px', display: 'block', textAlign: 'center', fontWeight: '600' }}>Maximum</span>
                    <input 
                      type="number" 
                      value={priceRange.max} 
                      onChange={e => onPriceChange('max', e.target.value)} 
                      style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Availability Filter */}
              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#777', marginBottom: '25px' }}>Disponibilité</h4>
                <div style={{ display: 'flex', gap: '40px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#777', cursor: 'pointer', fontWeight: '600' }}>
                    <input 
                      type="checkbox" 
                      checked={availability.inStock} 
                      onChange={() => onToggleAvailability('inStock')} 
                      style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#00a3e0' }} 
                    />
                    En stock
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#777', cursor: 'pointer', fontWeight: '600' }}>
                    <input 
                      type="checkbox" 
                      checked={availability.recentlyPublished} 
                      onChange={() => onToggleAvailability('recentlyPublished')} 
                      style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#00a3e0' }} 
                    />
                    Publié récemment
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Stars Filter */}
          <div style={{ marginBottom: '60px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#777', marginBottom: '25px' }}>Nombre d'étoiles</h4>
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map(stars => (
                <label key={stars} style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>{stars} {stars > 1 ? 'étoiles' : 'étoile'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      checked={rating === stars} 
                      onChange={() => onToggleRating(stars)} 
                      style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#00a3e0' }} 
                    />
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(stars)].map((_, i) => (
                        <i key={i} className="bi bi-star-fill" style={{ color: '#F8D14E', fontSize: '18px' }}></i>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '60px' }}>
            <button 
              onClick={onClear}
              style={{ background: 'none', border: 'none', color: '#00a3e0', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}
            >
              Tout effacer
            </button>
            <button 
              onClick={onApply}
              style={{ background: '#00adef', border: 'none', color: '#fff', fontWeight: '700', fontSize: '18px', cursor: 'pointer', padding: '18px 80px', borderRadius: '12px' }}
            >
              Appliquer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FilterPopup;
