'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import {
  StatusBadge, ActionBtn, tableStyles, DashboardKeyframes,
  SimplePagination, PillTabs, ListPageSkeleton,
} from '@/components/dashboard/dashboardHelpers';

interface Bid {
  _id: string; title: string; currentPrice: number;
  status: 'active' | 'pending' | 'expired' | 'completed';
  endDate: string; category?: string;
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

function offerStatusConfig(offer: Offer) {
  const isExpired = offer.bid?.endDate && new Date(offer.bid.endDate) < new Date();
  const s = offer.status;
  if (isExpired || s === 'DECLINED') return { label: 'Décliné', color: '#dc2626', bg: '#fee2e2' };
  if (s === 'ACCEPTED') return { label: 'Accepté', color: '#16a34a', bg: '#dcfce7' };
  return { label: 'En attente', color: '#d97706', bg: '#fef3c7', dot: true as boolean };
}

function formatDate(d: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatPrice(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(n);
}

export default function OffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, isLogged } = useAuth();
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

  const stats = [
    { label: 'Total', value: current.length, color: '#0063b1', icon: '📋' },
    { label: 'En attente', value: pending, color: '#f59e0b', icon: '⏳' },
    { label: 'Acceptées', value: accepted, color: '#10b981', icon: '✅' },
    { label: 'Déclinées', value: declined, color: '#ef4444', icon: '❌' },
  ];

  if (isQueryLoading && !offers.length) return <ListPageSkeleton accentColor="#0063b1" />;

  return (
    <>
      <DashboardKeyframes />
      <DashboardPageShell
        title={filterTab === 'received' ? 'Offres Reçues' : 'Mes Offres'}
        subtitle="Gestion des offres d'enchères"
        icon="💼"
        stats={stats}
        headerActions={
          <button onClick={() => refetch()} disabled={isLoading} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
            background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.85rem', border: '1.5px solid rgba(255,255,255,0.35)',
            cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
          }}>
            🔄 {isLoading ? 'Actualisation...' : 'Actualiser'}
          </button>
        }
      >
        {/* Tabs */}
        <div style={{ padding: '16px 20px 0' }}>
          <PillTabs
            value={filterTab}
            onChange={(v) => { setFilterTab(v as 'received' | 'my'); setPage(0); router.push(`/dashboard/offers?tab=${v}`); }}
            tabs={[
              { value: 'received', label: 'Offres Reçues', count: received.length },
              { value: 'my', label: 'Mes Offres', count: myOffers.length },
            ]}
          />
        </div>

        {/* Toolbar */}
        <div style={tableStyles.toolbar}>
          <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
            {filtered.length} offre{filtered.length !== 1 ? 's' : ''}
          </span>
          <div style={tableStyles.searchWrap}>
            <span style={tableStyles.searchIcon}>🔍</span>
            <input style={tableStyles.searchInput} placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
        </div>

        {error && (
          <div style={{ margin: '16px 20px', padding: '12px 16px', background: '#fee2e2', borderRadius: '10px', color: '#dc2626', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {(error as any)?.message || 'Erreur'}</span>
            <button onClick={() => refetch()} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}>Réessayer</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={tableStyles.emptyState}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>💼</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>Aucune offre trouvée</p>
            <p style={{ color: '#94a3b8', margin: 0 }}>{filterTab === 'received' ? "Vous n'avez pas encore reçu d'offres." : "Vous n'avez pas encore fait d'offres."}</p>
          </div>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                {['Utilisateur', 'Téléphone', 'Enchère', 'Montant', 'Statut', 'Date', ''].map(h => (
                  <th key={h} style={tableStyles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(row => {
                const { _id, user, price, createdAt, bid } = row;
                const displayName = user?.companyName || user?.entreprise || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'N/A');
                const initials = displayName.charAt(0).toUpperCase();
                return (
                  <tr key={_id} className="db-row" style={tableStyles.trHover}>
                    <td style={tableStyles.td}>
                      <Link href={`/profile/${user?._id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
                        <div style={tableStyles.avatar('#0063b1')}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{displayName}</div>
                          {user?.email && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{user.email}</div>}
                        </div>
                      </Link>
                    </td>
                    <td style={{ ...tableStyles.td, color: '#64748b' }}>{user?.phone || 'N/A'}</td>
                    <td style={tableStyles.td}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{bid?.title || 'N/A'}</div>
                      {bid?.category && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{bid.category}</div>}
                    </td>
                    <td style={tableStyles.td}>
                      <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>{formatPrice(price)}</span>
                    </td>
                    <td style={tableStyles.td}><StatusBadge config={offerStatusConfig(row)} /></td>
                    <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem' }}>{formatDate(createdAt)}</td>
                    <td style={{ ...tableStyles.td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {bid?._id && (
                          <ActionBtn
                            label="Voir"
                            icon="👁️"
                            href={filterTab === 'received' ? `/dashboard/auctions/${bid._id}/offers/${_id}` : `/dashboard/auctions/${bid._id}`}
                          />
                        )}
                        {filterTab === 'received' && (!row.status || row.status === 'PENDING') && (
                          <>
                            <ActionBtn label="Accepter" icon="✅" variant="success" onClick={() => handleAccept(_id)} disabled={isLoading} />
                            <ActionBtn label="Refuser" icon="❌" variant="danger" onClick={() => handleReject(_id)} disabled={isLoading} />
                          </>
                        )}
                        {filterTab === 'my' && (
                          <ActionBtn label="Supprimer" icon="🗑️" variant="danger" onClick={() => handleDelete(_id)} disabled={isLoading} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filtered.length > 0 && (
          <SimplePagination page={page} rowsPerPage={rowsPerPage} total={filtered.length} onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
        )}
      </DashboardPageShell>
    </>
  );
}
