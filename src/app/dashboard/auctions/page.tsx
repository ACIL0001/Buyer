'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { 
  BsHammer, 
  BsCheckCircle, 
  BsXCircle, 
  BsClock, 
  BsChevronLeft, 
  BsChevronRight,
  BsThreeDotsVertical,
  BsPlusLg
} from 'react-icons/bs';
import './auctions-styles.css';

enum BID_STATUS {
  OPEN = 'OPEN',
  ON_AUCTION = 'ON_AUCTION',
  CLOSED = 'CLOSED',
}

export default function AuctionsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLogged } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { socket } = useCreateSocket() || {};
  useEffect(() => {
    if (!socket) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['my-auctions'] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, queryClient]);

  const { data: auctionsData = [], isLoading } = useQuery({
    queryKey: ['my-auctions'],
    queryFn: async () => {
      const { AuctionsAPI } = await import('@/services/auctions');
      const res = await AuctionsAPI.getAuctions();
      return Array.isArray(res) ? res : (res?.data || []);
    },
    enabled: isLogged,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const auctions = auctionsData as any[];
  
  const receivedCount = auctions.length;
  const pendingCount = auctions.filter(row => row.status !== 'CLOSED' && row.status !== 'ON_AUCTION').length;
  const acceptedCount = auctions.filter(row => row.status === 'ON_AUCTION').length;
  const rejectedCount = auctions.filter(row => row.status === 'CLOSED').length;

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1116px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Bienvenue {(user as any)?.companyName || (user as any)?.entreprise || (user as any)?.firstName || 'Anis'}</h1>
            <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Voici un aperçu de votre activité</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => router.push('/dashboard/auctions/create/')}
              style={{ backgroundColor: '#0050CB', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BsPlusLg /> Publier une Enchère
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '20px' }}>🔔</button>
              <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '20px' }}>✉️</button>
            </div>
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div className="figma-auc-summary-grid">
          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-blue">
              <BsHammer size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Total</span>
              <span className="figma-auc-card-value">{receivedCount}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-orange">
              <BsClock size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">En attente</span>
              <span className="figma-auc-card-value">{pendingCount}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-green">
              <BsCheckCircle size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Acceptées</span>
              <span className="figma-auc-card-value">{acceptedCount}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-red">
              <BsXCircle size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Rejetés</span>
              <span className="figma-auc-card-value">{rejectedCount}</span>
            </div>
          </div>
        </div>

        {/* Detailed List Section */}
        <div className="figma-auc-section">
          <div className="figma-auc-header">
            <h3 className="figma-auc-title">Mes enchères</h3>
          </div>

          <table className="figma-auc-table">
            <thead className="figma-auc-thead">
              <tr>
                <th className="figma-auc-th">PRODUIT</th>
                <th className="figma-auc-th">PRIX ACTUEL</th>
                <th className="figma-auc-th">STATUS</th>
                <th className="figma-auc-th">DATE</th>
                <th className="figma-auc-th" style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {auctions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Aucune enchère publiée pour le moment.</td>
                </tr>
              ) : (
                auctions.map((row) => (
                  <tr key={row._id} className="figma-auc-tr" onClick={() => router.push(`/dashboard/auctions/${row._id}`)} style={{ cursor: 'pointer' }}>
                    <td className="figma-auc-td">
                      <div className="figma-auc-product-cell">
                        <img 
                          src={row.thumbs?.[0]?.url || '/assets/img/logo.png'} 
                          alt={row.title} 
                          className="figma-auc-product-img" 
                        />
                        <div className="figma-auc-product-info">
                          <span className="figma-auc-product-name">{row.title}</span>
                          <span className="figma-auc-product-cat">{row.category?.name || 'Catégorie'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="figma-auc-td">
                      <span className="figma-auc-price">{(row.currentPrice || row.startingPrice || 0).toLocaleString()} Da</span>
                    </td>
                    <td className="figma-auc-td">
                      <span className={`figma-auc-status-badge ${row.status === 'CLOSED' ? 'figma-auc-status-rejected' : row.status === 'ON_AUCTION' ? 'figma-auc-status-accepted' : 'figma-auc-status-pending'}`}>
                        {row.status === 'CLOSED' ? 'REJETÉ' : row.status === 'ON_AUCTION' ? 'ACCEPTÉ' : 'EN ATTENTE'}
                      </span>
                    </td>
                    <td className="figma-auc-td" style={{ color: '#64748B', fontSize: '13px', fontWeight: 500 }}>
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="figma-auc-td" style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div className="figma-auc-actions">
                        <button 
                          className="figma-auc-btn-details"
                          onClick={() => router.push(`/dashboard/auctions/${row._id}`)}
                        >
                          Voir détails
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="figma-auc-pagination">
            <button className="figma-auc-pg-btn"><BsChevronLeft /></button>
            <button className="figma-auc-pg-btn active">1</button>
            <button className="figma-auc-pg-btn">2</button>
            <button className="figma-auc-pg-btn"><BsChevronRight /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
