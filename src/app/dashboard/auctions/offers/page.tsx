'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';
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
import './offers-styles.css';

interface Bid {
  _id: string; title: string; currentPrice: number;
  status: 'active' | 'pending' | 'expired' | 'completed';
  endDate: string; category?: any; thumbs?: any[];
}
interface User {
  _id: string; firstName: string; lastName: string; username?: string;
  email: string; phone: string; companyName?: string; entreprise?: string;
}
interface Offer {
  _id: string; price: number; createdAt: string;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  bid: Bid; user: User;
}

export default function OffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, isLogged } = useAuth();
  const user = auth?.user;
  const { t } = useTranslation();

  const [filterTab, setFilterTab] = useState<'received' | 'my'>('my');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isMutating, setIsMutating] = useState(false);

  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'received' || tab === 'my') setFilterTab(tab as 'received' | 'my');
  }, [searchParams]);

  useEffect(() => {
    if (!socket) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['offers', 'my'] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, queryClient]);

  const { data: offersData = [], isLoading: isQueryLoading, error, refetch } = useQuery({
    queryKey: ['offers', 'my'],
    queryFn: async () => {
      if (!auth?.user?._id) return [];
      const { OffersAPI } = await import('@/services/offers');
      const res = await OffersAPI.getOffers({ data: { _id: auth.user._id } });
      let data: Offer[] = res?.data && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      return data;
    },
    enabled: isLogged && !!auth?.user?._id,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const offers = offersData as Offer[];
  const isLoading = isQueryLoading || isMutating;

  const handleAccept = async (id: string) => {
    setIsMutating(true);
    try { const { OffersAPI } = await import('@/services/offers'); await OffersAPI.acceptOffer(id); await refetch(); }
    catch {} finally { setIsMutating(false); }
  };
  const handleReject = async (id: string) => {
    setIsMutating(true);
    try { const { OffersAPI } = await import('@/services/offers'); await OffersAPI.rejectOffer(id); await refetch(); }
    catch {} finally { setIsMutating(false); }
  };
  const handleDelete = async (id: string) => {
    setIsMutating(true);
    try { const { OffersAPI } = await import('@/services/offers'); await OffersAPI.deleteOffer(id); await refetch(); }
    catch {} finally { setIsMutating(false); }
  };

  const userId = auth?.user?._id;
  const received = useMemo(() => offers.filter(o => o.user._id !== userId), [offers, userId]);
  const myOffers = useMemo(() => offers.filter(o => o.user._id === userId), [offers, userId]);
  const current = filterTab === 'received' ? received : myOffers;

  const filtered = useMemo(() => {
    if (!search.trim()) return current;
    const s = search.toLowerCase();
    return current.filter(o =>
      o.user.firstName?.toLowerCase().includes(s) ||
      o.user.lastName?.toLowerCase().includes(s) ||
      o.user.companyName?.toLowerCase().includes(s) ||
      o.bid?.title?.toLowerCase().includes(s)
    );
  }, [current, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const pending = current.filter(o => !o.status || o.status === 'PENDING').length;
  const accepted = current.filter(o => o.status === 'ACCEPTED').length;
  const declined = current.filter(o => o.status === 'DECLINED').length;

  if (isQueryLoading && !offers.length) return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1116px', margin: '0 auto' }}>
        
        {/* Header - High Fidelity */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Bienvenue {(user as any)?.companyName || (user as any)?.entreprise || (user as any)?.firstName || 'Utilisateur'}
            </h1>
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
              <span className="figma-auc-card-label">Reçues</span>
              <span className="figma-auc-card-value">{current.length}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-orange">
              <BsClock size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">En attente</span>
              <span className="figma-auc-card-value">{pending}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-green">
              <BsCheckCircle size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Acceptées</span>
              <span className="figma-auc-card-value">{accepted}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-red">
              <BsXCircle size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Rejetées</span>
              <span className="figma-auc-card-value">{declined}</span>
            </div>
          </div>
        </div>

        {/* Tabs - Improved UX/UI */}
        <div className="offers-tabs-wrapper">
          <div className="offers-segmented-control">
            <button 
              className={`offers-tab-item ${filterTab === 'received' ? 'active' : ''}`}
              onClick={() => { setFilterTab('received'); setPage(0); router.push('/dashboard/offers?tab=received'); }}
            >
              Offres Reçues <span className="offers-tab-count">{received.length}</span>
            </button>
            <button 
              className={`offers-tab-item ${filterTab === 'my' ? 'active' : ''}`}
              onClick={() => { setFilterTab('my'); setPage(0); router.push('/dashboard/offers?tab=my'); }}
            >
              Mes Offres <span className="offers-tab-count">{myOffers.length}</span>
            </button>
          </div>
        </div>

        {/* Detailed List Section */}
        <div className="figma-auc-section">
          <div className="figma-auc-header">
            <h3 className="figma-auc-title">
              {filterTab === 'received' ? 'Enchères reçues' : 'Mes offres envoyées'}
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <input 
                 type="text" 
                 placeholder="Rechercher..." 
                 value={search} 
                 onChange={e => setSearch(e.target.value)}
                 style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px' }}
               />
            </div>
          </div>

          <table className="figma-auc-table">
            <thead className="figma-auc-thead">
              <tr>
                <th className="figma-auc-th">PRODUIT</th>
                <th className="figma-auc-th">UTILISATEUR</th>
                <th className="figma-auc-th">PRIX ACTUEL</th>
                <th className="figma-auc-th">STATUS</th>
                <th className="figma-auc-th" style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    Aucune offre trouvée.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const { _id, user: offerUser, price, createdAt, bid } = row;
                  const displayName = offerUser?.companyName || offerUser?.entreprise || (offerUser?.firstName && offerUser?.lastName ? `${offerUser.firstName} ${offerUser.lastName}` : offerUser?.username || 'N/A');
                  const initials = displayName.charAt(0).toUpperCase();
                  
                  return (
                    <tr key={_id} className="figma-auc-tr">
                      <td className="figma-auc-td">
                        <div className="figma-auc-product-cell">
                          <img 
                            src={bid?.thumbs?.[0]?.url || '/assets/img/logo.png'} 
                            alt={bid?.title} 
                            className="figma-auc-product-img" 
                          />
                          <div className="figma-auc-product-info">
                            <span className="figma-auc-product-name">{bid?.title || 'Produit'}</span>
                            <span className="figma-auc-product-cat">{bid?.category?.name || 'Catégorie'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="figma-auc-td">
                        <div className="figma-auc-user-cell">
                          <div className="figma-auc-avatar" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                            {initials}
                          </div>
                          <span className="figma-auc-user-name">{displayName}</span>
                        </div>
                      </td>
                      <td className="figma-auc-td">
                        <span className="figma-auc-price">{price.toLocaleString()} Da</span>
                      </td>
                      <td className="figma-auc-td">
                        <span className={`figma-auc-status-badge ${row.status === 'DECLINED' ? 'figma-auc-status-rejected' : row.status === 'ACCEPTED' ? 'figma-auc-status-accepted' : 'figma-auc-status-pending'}`}>
                          {row.status === 'DECLINED' ? 'REJETÉ' : row.status === 'ACCEPTED' ? 'ACCEPTÉ' : 'EN ATTENTE'}
                        </span>
                      </td>
                      <td className="figma-auc-td" style={{ textAlign: 'right' }}>
                        <div className="figma-auc-actions">
                          {filterTab === 'received' && (!row.status || row.status === 'PENDING') ? (
                            <>
                              <button className="figma-auc-btn-success" onClick={() => handleAccept(_id)}>Accepter</button>
                              <button className="figma-auc-btn-danger" onClick={() => handleReject(_id)}>Rejeter</button>
                            </>
                          ) : (
                            <Link href={`/dashboard/auctions/${bid?._id}`} className="figma-auc-btn-details">
                              Voir détails
                            </Link>
                          )}
                          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                            <BsThreeDotsVertical />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="figma-auc-pagination">
            <button 
              className="figma-auc-pg-btn"
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0}
            >
              <BsChevronLeft />
            </button>
            {[...Array(Math.ceil(filtered.length / rowsPerPage))].map((_, i) => (
              <button 
                key={i}
                className={`figma-auc-pg-btn ${page === i ? 'active' : ''}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button 
              className="figma-auc-pg-btn"
              onClick={() => setPage(prev => Math.min(Math.ceil(filtered.length / rowsPerPage) - 1, prev + 1))}
              disabled={page >= Math.ceil(filtered.length / rowsPerPage) - 1}
            >
              <BsChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
