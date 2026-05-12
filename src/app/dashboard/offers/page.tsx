'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';
import { ListPageSkeleton, DashboardKeyframes } from '@/components/dashboard/dashboardHelpers';
import './offers-styles.css';
import { 
  BsArrowLeft, BsDownload, BsClock, BsCheckCircle, BsXCircle, 
  BsThreeDotsVertical, BsChevronLeft, BsChevronRight, BsSearch, BsPlusLg
} from 'react-icons/bs';

interface Bid {
  _id: string; title: string; currentPrice: number;
  status: 'active' | 'pending' | 'expired' | 'completed';
  endDate: string; category?: string;
  thumbs?: any[];
}
interface User {
  _id: string; firstName: string; lastName: string; username?: string;
  email: string; phone: string; companyName?: string; entreprise?: string;
  avatar?: any;
}
interface Offer {
  _id: string; price: number; createdAt: string;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  bid: Bid; user: User;
}

function offerStatusConfig(offer: Offer) {
  const isExpired = offer.bid?.endDate && new Date(offer.bid.endDate) < new Date();
  const s = offer.status;
  if (isExpired || s === 'DECLINED') return { label: 'Rejeté', color: '#dc2626', bg: '#fee2e2' };
  if (s === 'ACCEPTED') return { label: 'Accepté', color: '#16a34a', bg: '#dcfce7' };
  return { label: 'En attente', color: '#d97706', bg: '#fef3c7', dot: true as boolean };
}

function formatDate(d: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function OffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, isLogged } = useAuth();
  const { t } = useTranslation();

  const [filterTab, setFilterTab] = useState<'received' | 'my'>('received');
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

  const pendingCount = current.filter(o => !o.status || o.status === 'PENDING').length;
  const acceptedCount = current.filter(o => o.status === 'ACCEPTED').length;
  const declinedCount = current.filter(o => o.status === 'DECLINED').length;

  const getImageUrl = (item: any) => {
    if (!item) return '/assets/img/logo.png';
    const url = item.fullUrl || item.url || (item.thumbs?.[0]?.url);
    return url || '/assets/img/logo.png';
  };

  const getAvatarInitials = (user: User) => {
    const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'U';
    return name.charAt(0).toUpperCase();
  };

  if (isQueryLoading && !offers.length) return <ListPageSkeleton accentColor="#0050CB" />;

  return (
    <div className="figma-offers-main">
      <DashboardKeyframes />
      
      {/* Header Section */}
      <div className="figma-offers-header">
        <div className="figma-offers-welcome">
          <h1>Bienvenue {auth?.user?.firstName || 'Utilisateur'}</h1>
          <p>Voici un aperçu de votre activité</p>
        </div>
        <button className="figma-offers-publish-btn" onClick={() => router.push('/dashboard/auctions/create')}>
          <BsPlusLg /> Publier une Enchère
        </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="figma-offers-stats-grid">
        <div className="figma-offers-stat-card">
          <div className="figma-offers-stat-icon-wrapper" style={{ background: '#EFF6FF', color: '#0050CB' }}>
            <BsDownload />
          </div>
          <div className="figma-offers-stat-info">
            <span className="figma-offers-stat-label">Reçues</span>
            <span className="figma-offers-stat-value">{current.length}</span>
          </div>
        </div>
        <div className="figma-offers-stat-card">
          <div className="figma-offers-stat-icon-wrapper" style={{ background: '#FFFBEB', color: '#D97706' }}>
            <BsClock />
          </div>
          <div className="figma-offers-stat-info">
            <span className="figma-offers-stat-label">En attente</span>
            <span className="figma-offers-stat-value">{pendingCount}</span>
          </div>
        </div>
        <div className="figma-offers-stat-card">
          <div className="figma-offers-stat-icon-wrapper" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <BsCheckCircle />
          </div>
          <div className="figma-offers-stat-info">
            <span className="figma-offers-stat-label">Acceptées</span>
            <span className="figma-offers-stat-value">{acceptedCount}</span>
          </div>
        </div>
        <div className="figma-offers-stat-card">
          <div className="figma-offers-stat-icon-wrapper" style={{ background: '#FEF2F2', color: '#EF4444' }}>
            <BsXCircle />
          </div>
          <div className="figma-offers-stat-info">
            <span className="figma-offers-stat-label">Rejetés</span>
            <span className="figma-offers-stat-value">{declinedCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs / Filter Section */}
      <div className="figma-offers-tabs-container">
        <button 
          className={`figma-offers-tab ${filterTab === 'received' ? 'active' : ''}`}
          onClick={() => { setFilterTab('received'); setPage(0); router.push('/dashboard/offers?tab=received'); }}
        >
          Offres Reçues
        </button>
        <button 
          className={`figma-offers-tab ${filterTab === 'my' ? 'active' : ''}`}
          onClick={() => { setFilterTab('my'); setPage(0); router.push('/dashboard/offers?tab=my'); }}
        >
          Mes Offres
        </button>
      </div>

      {/* Main Table Card */}
      <div className="figma-offers-table-card">
        <div className="figma-offers-table-header">
          <h2>{filterTab === 'received' ? 'Enchères reçues' : 'Mes Enchères'}</h2>
        </div>
        
        <table className="figma-offers-table">
          <thead>
            <tr>
              <th className="figma-offers-th">Produit</th>
              <th className="figma-offers-th">Utilisateur</th>
              <th className="figma-offers-th">Prix Actuel</th>
              <th className="figma-offers-th">Status</th>
              <th className="figma-offers-th" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
                  Aucune offre trouvée
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const { _id, user, price, bid } = row;
                const config = offerStatusConfig(row);
                const displayName = user.companyName || user.entreprise || `${user.firstName} ${user.lastName}`;
                
                return (
                  <tr key={_id} className="figma-offers-tr">
                    <td className="figma-offers-td">
                      <Link href={`/dashboard/auctions/${bid?._id}`} style={{ textDecoration: 'none' }}>
                        <div className="figma-offers-product-info">
                          <img src={getImageUrl(bid)} className="figma-offers-product-img" alt="" />
                          <div className="figma-offers-product-text">
                            <span className="figma-offers-product-name">{bid?.title || 'N/A'}</span>
                            <span className="figma-offers-product-cat">{bid?.category || 'Catégorie'}</span>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="figma-offers-td">
                      <div className="figma-offers-user-info">
                        <div className="figma-offers-user-avatar" style={{ background: 'linear-gradient(135deg, #0050CB, #002896)' }}>
                          {getAvatarInitials(user)}
                        </div>
                        <span className="figma-offers-user-name">{displayName}</span>
                      </div>
                    </td>
                    <td className="figma-offers-td">
                      <span className="figma-offers-price">{price.toLocaleString()} Da</span>
                    </td>
                    <td className="figma-offers-td">
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', 
                        padding: '4px 12px', borderRadius: '999px', width: 'fit-content',
                        background: config.bg, color: config.color, fontSize: '12px', fontWeight: 600
                      }}>
                        {config.dot && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.color }}></span>}
                        {config.label}
                      </div>
                    </td>
                    <td className="figma-offers-td" style={{ textAlign: 'right' }}>
                      <div className="figma-offers-actions">
                        <Link 
                          href={filterTab === 'received' ? `/dashboard/auctions/${bid?._id}/offers/${_id}` : `/dashboard/auctions/${bid?._id}`}
                          className="figma-offers-btn-details"
                        >
                          Détails
                        </Link>
                        {filterTab === 'received' && (!row.status || row.status === 'PENDING') && (
                          <>
                            <button className="figma-offers-btn-accept" onClick={() => handleAccept(_id)}>Accepter</button>
                            <button className="figma-offers-btn-reject" onClick={() => handleReject(_id)}>Rejeter</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filtered.length > rowsPerPage && (
          <div className="figma-offers-pagination">
            <button className="figma-offers-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <BsChevronLeft />
            </button>
            {[...Array(Math.ceil(filtered.length / rowsPerPage))].map((_, i) => (
              <button 
                key={i} 
                className={`figma-offers-page-btn ${page === i ? 'active' : ''}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button className="figma-offers-page-btn" disabled={(page + 1) * rowsPerPage >= filtered.length} onClick={() => setPage(page + 1)}>
              <BsChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
