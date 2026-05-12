'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { DirectSale, SALE_STATUS } from '@/types/direct-sale';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { 
  BsBag, 
  BsCheckCircle, 
  BsSend, 
  BsEye, 
  BsArrowRightShort,
  BsPlusLg
} from 'react-icons/bs';
import './direct-sales-styles.css';

export default function DirectSalesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLogged } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { socket } = useCreateSocket() || {};
  useEffect(() => {
    if (!socket) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['direct-sales', 'my'] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, queryClient]);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['direct-sales', 'my'],
    queryFn: async () => {
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      const response = await DirectSaleAPI.getMyDirectSales();
      const rawData = response.data || (Array.isArray(response) ? response : []);
      return rawData as DirectSale[];
    },
    enabled: isLogged,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const saleList = sales as DirectSale[];

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return saleList;
    if (statusFilter === 'ACTIVE') return saleList.filter(s => s.status === SALE_STATUS.ACTIVE);
    if (statusFilter === 'SOLD') return saleList.filter(s => s.status === SALE_STATUS.SOLD);
    return saleList;
  }, [saleList, statusFilter]);

  const activeCount = saleList.filter(s => s.status === SALE_STATUS.ACTIVE).length;
  const soldCount = saleList.filter(s => s.status === SALE_STATUS.SOLD).length;
  const requestsCount = 3; // Placeholder as in design
  const viewsCount = 156; // Placeholder as in design

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '0 20px' }}>
      <div style={{ maxWidth: '1116px', margin: '0 auto', padding: '40px 0 220px' }}>
        {/* Summary Cards */}
        <div className="figma-ds-summary-container">
          <div className="figma-ds-card">
            <div className="figma-ds-icon-circle figma-ds-icon-blue">
              <BsBag size={18} />
            </div>
            <span className="figma-ds-card-label">Ventes directes actives</span>
            <span className="figma-ds-card-value">{activeCount}</span>
          </div>

          <div className="figma-ds-card">
            <div className="figma-ds-icon-circle figma-ds-icon-green">
              <BsCheckCircle size={18} />
            </div>
            <span className="figma-ds-card-label">Totale vendu</span>
            <span className="figma-ds-card-value">{soldCount}</span>
          </div>

          <div className="figma-ds-card">
            <div className="figma-ds-icon-circle figma-ds-icon-gray">
              <BsSend size={18} />
            </div>
            <span className="figma-ds-card-label">Demandes d’achat</span>
            <span className="figma-ds-card-value">{requestsCount}</span>
            <a className="figma-ds-card-link">Voir tout</a>
          </div>

          <div className="figma-ds-card">
            <div className="figma-ds-icon-circle figma-ds-icon-orange">
              <BsEye size={18} />
            </div>
            <span className="figma-ds-card-label">Vues sur les annonces</span>
            <span className="figma-ds-card-value">{viewsCount}</span>
          </div>
        </div>

        {/* Main Section */}
        <div className="figma-ds-main-section">
          <div className="figma-ds-section-header">
            <div className="figma-ds-title-group">
              <h2 className="figma-ds-title">Ventes directes</h2>
              <p className="figma-ds-subtitle">Gérez vos produits en vente directe à prix fixe.</p>
            </div>
            <button 
              onClick={() => router.push('/dashboard/direct-sales/create/')}
              style={{ 
                backgroundColor: '#0050CB', 
                color: '#fff', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <BsPlusLg /> Nouvelle vente
            </button>
          </div>

          {/* Tabs */}
          <div className="figma-ds-tabs">
            <div className="figma-ds-tabs-container">
              <button className={`figma-ds-tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`} onClick={() => setStatusFilter('ALL')}>
                <span>Toutes ({saleList.length})</span>
              </button>
              <button className={`figma-ds-tab-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`} onClick={() => setStatusFilter('ACTIVE')}>
                <span>En ligne ({activeCount})</span>
              </button>
              <button className={`figma-ds-tab-btn ${statusFilter === 'SOLD' ? 'active' : ''}`} onClick={() => setStatusFilter('SOLD')}>
                <span>Vendues ({soldCount})</span>
              </button>
              <button className="figma-ds-tab-btn">
                <span>Demandes d'achat</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <table className="figma-ds-table">
            <thead className="figma-ds-thead">
              <tr>
                <th className="figma-ds-th">PRODUIT</th>
                <th className="figma-ds-th">PRIX</th>
                <th className="figma-ds-th">STATUT</th>
                <th className="figma-ds-th">DATE DE PUBLICATION</th>
                <th className="figma-ds-th" style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody className="figma-ds-tbody">
              {filtered.map((sale) => (
                <tr key={sale._id} className="figma-ds-tr">
                  <td className="figma-ds-td">
                    <div className="figma-ds-product-cell">
                      <img 
                        src={sale.thumbs?.[0]?.url || '/assets/img/logo.png'} 
                        alt={sale.title} 
                        className="figma-ds-product-img" 
                      />
                      <div className="figma-ds-product-info">
                        <span className="figma-ds-product-name">{sale.title}</span>
                        <span className="figma-ds-product-cat">{typeof sale.category === 'string' ? sale.category : (sale.category as any)?.name || 'Informatique'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="figma-ds-td">
                    <span className="figma-ds-price">{sale.price?.toLocaleString()}</span>
                  </td>
                  <td className="figma-ds-td">
                    <span className={`figma-ds-status-badge ${sale.status === SALE_STATUS.ACTIVE ? 'figma-ds-status-online' : 'figma-ds-status-sold'}`}>
                      {sale.status === SALE_STATUS.ACTIVE ? 'EN LIGNE' : 'VENDU'}
                    </span>
                  </td>
                  <td className="figma-ds-td">
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '12 Oct. 2026'}
                  </td>
                  <td className="figma-ds-td" style={{ textAlign: 'right' }}>
                    <button className="figma-ds-action-btn" onClick={() => router.push(`/dashboard/direct-sales/${sale._id}`)}>Voir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="figma-ds-footer">
            <a href="#" className="figma-ds-view-all">
              Voir toutes les ventes directes <BsArrowRightShort size={20} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
