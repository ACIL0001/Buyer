"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  categories = [], 
  selectedCategories = [], 
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
  availability: parentAvailability = { inStock: false, recentlyPublished: false },
}) => {
  const [localCategories, setLocalCategories] = useState(selectedCategories);
  const [localPrice, setLocalPrice] = useState(priceRange);
  const [localWilaya, setLocalWilaya] = useState(selectedWilaya);
  const [localTypes, setLocalTypes] = useState(selectedTypes);
  const [localAvailability, setLocalAvailability] = useState(parentAvailability);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with parent when opened
  useEffect(() => {
    if (isOpen) {
      setLocalCategories(selectedCategories);
      setLocalPrice(priceRange);
      setLocalWilaya(selectedWilaya);
      setLocalTypes(selectedTypes);
      setLocalAvailability(parentAvailability);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleToggleCategory = (id) => {
    setLocalCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleToggleType = (type) => {
    setLocalTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleToggleAvailability = (key) => {
    setLocalAvailability(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClear = () => {
    setLocalCategories([]);
    setLocalPrice({ min: '', max: '' });
    setLocalWilaya('');
    setLocalTypes([]);
    setLocalAvailability({ inStock: false, recentlyPublished: false });
  };

  const handleApply = () => {
    onApply({
      categories: localCategories,
      priceRange: localPrice,
      wilaya: localWilaya,
      types: localTypes,
      availability: localAvailability
    });
  };

  const categoryPositions = [
    { left: 207, top: 307 },
    { left: 422, top: 307 },
    { left: 637, top: 307 },
    { left: 852, top: 307 },
    { left: 207, top: 388 },
    { left: 422, top: 388 },
    { left: 637, top: 388 },
    { left: 852, top: 388 },
  ];

  const typeOptions = [
    { label: 'Produit', value: 'PRODUCT' },
    { label: 'Service', value: 'SERVICE' },
  ];

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

  const displayWilayas = wilayas && wilayas.length > 0 ? wilayas : WILAYAS;

  const content = (
    <AnimatePresence>
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 9999, 
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(10px)',
          overflow: 'auto',
          display: 'flex',
          padding: '60px 40px'
        }} 
        onClick={onClose}
      >
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;700&family=Inter:wght@700&display=swap');
          
          .custom-checkbox {
            width: 35px;
            height: 35px;
            background: #FFFFFF;
            border: 2px solid #E0E0E0;
            border-radius: 10px;
            cursor: pointer;
            position: absolute;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .custom-checkbox.checked {
            background-color: #0096E3;
            border-color: #0096E3;
          }
          .custom-checkbox.checked::after {
            content: '✓';
            color: white;
            font-size: 20px;
            font-weight: 700;
          }

          .premium-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23727272' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 15px center;
            background-size: 20px;
          }
        `}</style>

        <div 
          style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '40px', 
            width: '1367px', 
            height: '1467px', 
            flexShrink: 0,
            position: 'relative',
            margin: 'auto',
            boxShadow: '0 50px 120px rgba(0,0,0,0.3)',
            fontFamily: "'Public Sans', sans-serif",
            overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ 
            position: 'absolute', width: '425px', height: '56px', left: '153px', top: '102px',
            fontSize: '48px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center'
          }}>
            Filtrer les produits
          </div>

          {/* Categories Title */}
          <div style={{ 
            position: 'absolute', width: '322px', height: '38px', left: '153px', top: '209px',
            fontSize: '32px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center'
          }}>
            Filtrer par catégories
          </div>

          {/* Categories Grid */}
          {categories.slice(0, 8).map((cat, index) => {
            const pos = categoryPositions[index];
            const isSelected = localCategories.includes(cat._id);
            return (
              <React.Fragment key={cat._id}>
                <div 
                  className={`custom-checkbox ${isSelected ? 'checked' : ''}`}
                  onClick={() => handleToggleCategory(cat._id)}
                  style={{ left: `${pos.left - 54}px`, top: `${pos.top - 3}px` }}
                />
                <div style={{ 
                  position: 'absolute', left: `${pos.left}px`, top: `${pos.top}px`,
                  fontSize: '24px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }} onClick={() => handleToggleCategory(cat._id)}>
                  {cat.name}
                </div>
              </React.Fragment>
            );
          })}

          {/* Price Section */}
          <div style={{ 
            position: 'absolute', width: '62px', height: '38px', left: '153px', top: '504px',
            fontSize: '32px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center'
          }}>
            Prix
          </div>

          <div style={{ 
            position: 'absolute', width: '86px', height: '24px', left: '358px', top: '561px',
            fontSize: '20px', fontWeight: '400', color: '#727272', display: 'flex', alignItems: 'center'
          }}>
            Minimum
          </div>
          <div style={{ 
            position: 'absolute', width: '92px', height: '24px', left: '645px', top: '561px',
            fontSize: '20px', fontWeight: '400', color: '#727272', display: 'flex', alignItems: 'center'
          }}>
            Maximum
          </div>

          <input 
            type="number"
            value={localPrice.min}
            onChange={e => setLocalPrice(prev => ({ ...prev, min: e.target.value }))}
            style={{ 
              boxSizing: 'border-box', position: 'absolute', width: '214px', height: '58px', left: '350px', top: '602px',
              background: '#FFFFFF', border: '1px solid #757575', borderRadius: '10px', padding: '0 15px', fontSize: '20px', outline: 'none'
            }}
          />
          <input 
            type="number"
            value={localPrice.max}
            onChange={e => setLocalPrice(prev => ({ ...prev, max: e.target.value }))}
            style={{ 
              boxSizing: 'border-box', position: 'absolute', width: '214px', height: '58px', left: '639px', top: '602px',
              background: '#FFFFFF', border: '1px solid #757575', borderRadius: '10px', padding: '0 15px', fontSize: '20px', outline: 'none'
            }}
          />

          <div style={{ 
            position: 'absolute', width: '193px', height: '38px', left: '145px', top: '753px',
            fontSize: '32px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center'
          }}>
            Disponibilité
          </div>

          <div 
            className={`custom-checkbox ${localAvailability.inStock ? 'checked' : ''}`}
            onClick={() => handleToggleAvailability('inStock')}
            style={{ left: '153px', top: '842px' }}
          />
          <div style={{ 
            position: 'absolute', width: '98px', height: '28px', left: '200px', top: '842px',
            fontSize: '24px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center', cursor: 'pointer'
          }} onClick={() => handleToggleAvailability('inStock')}>
            En stock
          </div>

          <div 
            className={`custom-checkbox ${localAvailability.recentlyPublished ? 'checked' : ''}`}
            onClick={() => handleToggleAvailability('recentlyPublished')}
            style={{ left: '391px', top: '842px' }}
          />
          <div style={{ 
            position: 'absolute', width: '210px', height: '28px', left: '438px', top: '842px',
            fontSize: '24px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center', cursor: 'pointer'
          }} onClick={() => handleToggleAvailability('recentlyPublished')}>
            Publié récemment
          </div>

          {/* Produit ou Service Section */}
          <div style={{ 
            position: 'absolute', width: '450px', height: '38px', left: '153px', top: '952px',
            fontSize: '32px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center'
          }}>
            Filtrer par produit ou service
          </div>

          <div 
            className={`custom-checkbox ${localTypes.includes('PRODUCT') ? 'checked' : ''}`}
            onClick={() => handleToggleType('PRODUCT')}
            style={{ left: '153px', top: '1040px' }}
          />
          <div style={{ 
            position: 'absolute', width: '120px', height: '28px', left: '200px', top: '1040px',
            fontSize: '24px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center', cursor: 'pointer'
          }} onClick={() => handleToggleType('PRODUCT')}>
            Produit
          </div>

          <div 
            className={`custom-checkbox ${localTypes.includes('SERVICE') ? 'checked' : ''}`}
            onClick={() => handleToggleType('SERVICE')}
            style={{ left: '391px', top: '1040px' }}
          />
          <div style={{ 
            position: 'absolute', width: '120px', height: '28px', left: '438px', top: '1040px',
            fontSize: '24px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center', cursor: 'pointer'
          }} onClick={() => handleToggleType('SERVICE')}>
            Service
          </div>

          {/* Wilaya Section */}
          <div style={{ 
            position: 'absolute', width: '322px', height: '38px', left: '153px', top: '1120px',
            fontSize: '32px', fontWeight: '700', color: '#727272', display: 'flex', alignItems: 'center'
          }}>
            Filtrer par wilaya
          </div>

          <select 
            value={localWilaya}
            onChange={e => setLocalWilaya(e.target.value)}
            className="premium-select"
            style={{ 
              boxSizing: 'border-box', position: 'absolute', width: '400px', height: '64px', left: '153px', top: '1180px',
              background: '#FFFFFF', border: '2px solid #E0E0E0', borderRadius: '15px', padding: '0 20px', fontSize: '20px', outline: 'none',
              color: '#333', fontWeight: '600', cursor: 'pointer'
            }}
          >
            <option value="">Toutes les wilayas</option>
            {displayWilayas.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <div 
            onClick={handleClear}
            style={{ 
              position: 'absolute', width: '140px', height: '28px', left: '421px', top: '1375px',
              fontSize: '24px', fontWeight: '700', color: '#0096E3', display: 'flex', alignItems: 'center', cursor: 'pointer'
            }}
          >
            Tout effacer
          </div>

          <div 
            onClick={handleApply}
            style={{ 
              boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
              padding: '0', gap: '10px', position: 'absolute', width: '280px', height: '80px',
              left: '649px', top: '1338px', background: '#0096E3', border: 'none', borderRadius: '20px', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: '700', color: '#FFFFFF',
              boxShadow: '0 10px 25px rgba(0, 150, 227, 0.3)'
            }}
          >
            Appliquer
          </div>

          <button 
            onClick={onClose}
            style={{ 
              position: 'absolute', top: '40px', right: '40px', background: '#F5F5F5', border: 'none', 
              cursor: 'pointer', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', 
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <i className="bi bi-x-lg" style={{ fontSize: '24px', color: '#727272' }}></i>
          </button>
        </div>
      </div>
    </AnimatePresence>
  );

  return createPortal(content, document.getElementById('filter-popup-root'));
};

export default FilterPopup;
