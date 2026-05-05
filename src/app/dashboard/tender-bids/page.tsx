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
  StatusBadge, ActionBtn, HeaderAddBtn, tableStyles, DashboardKeyframes,
  SimplePagination, PillTabs, PillChip, ListPageSkeleton,
} from '@/components/dashboard/dashboardHelpers';

enum TenderBidStatus { PENDING = 'pending', ACCEPTED = 'accepted', DECLINED = 'declined' }
interface Bidder { _id: string; firstName: string; lastName: string; email: string; phone?: string; companyName?: string; entreprise?: string; }
interface Tender { _id: string; title: string; evaluationType?: 'MIEUX_DISANT' | 'MOINS_DISANT'; }
interface TenderBid {
  _id: string; bidder: Bidder; tender: Tender; bidAmount: number;
  deliveryTime?: number; createdAt: string; status: TenderBidStatus;
  proposal?: string; proposalFile?: string; type?: 'received' | 'my';
}

function statusConfig(s: TenderBidStatus) {
  const map: Record<string, any> = {
    pending:  { label: 'En attente', color: '#d97706', bg: '#fef3c7', dot: true },
    accepted: { label: 'Accepté',    color: '#16a34a', bg: '#dcfce7' },
    declined: { label: 'Décliné',    color: '#dc2626', bg: '#fee2e2' },
  };
  return map[s] || { label: s, color: '#64748b', bg: '#f1f5f9' };
}

function evalChip(type?: string) {
  if (!type) return <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>N/A</span>;
  return (
    <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '0.76rem', fontWeight: 600, background: type === 'MIEUX_DISANT' ? '#e0f2fe' : '#dcfce7', color: type === 'MIEUX_DISANT' ? '#0284c7' : '#16a34a' }}>
      {type === 'MIEUX_DISANT' ? '✨ Mieux Disant' : '💰 Moins Disant'}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TenderBidsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, isLogged } = useAuth();

  const [filterTab, setFilterTab] = useState<'received' | 'my'>('my');
  const [evalFilter, setEvalFilter] = useState<'all' | 'MIEUX_DISANT' | 'MOINS_DISANT'>('all');
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
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['tender-bids', 'my'] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, queryClient]);

  const { data: bidsData = [], isLoading: isQueryLoading, error, refetch } = useQuery({
    queryKey: ['tender-bids', 'my'],
    queryFn: async () => {
      if (!auth?.user?._id) return [];
      const { TendersAPI } = await import('@/services/tenders');
      let received: any[] = [], mine: any[] = [];
      try { const r = await TendersAPI.getTenderBidsByOwner(auth.user._id); received = Array.isArray(r) ? r.map(b => ({ ...b, type: 'received' })) : []; } catch {}
      try { const r = await TendersAPI.getTenderBidsByBidder(auth.user._id); mine = Array.isArray(r) ? r.map(b => ({ ...b, type: 'my' })) : []; } catch {}
      return [...received, ...mine];
    },
    enabled: isLogged && !!auth?.user?._id,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const bids = bidsData as TenderBid[];
  const isLoading = isQueryLoading || isMutating;

  const handleAccept = async (id: string) => { setIsMutating(true); try { const { TendersAPI } = await import('@/services/tenders'); await TendersAPI.acceptTenderBid(id); await refetch(); } catch {} finally { setIsMutating(false); } };
  const handleReject = async (id: string) => { setIsMutating(true); try { const { TendersAPI } = await import('@/services/tenders'); await TendersAPI.rejectTenderBid(id); await refetch(); } catch {} finally { setIsMutating(false); } };

  const received = useMemo(() => bids.filter((b: any) => b.type === 'received'), [bids]);
  const myBids = useMemo(() => bids.filter((b: any) => b.type === 'my'), [bids]);
  const current = filterTab === 'received' ? received : myBids;

  const filtered = useMemo(() => {
    let list = evalFilter !== 'all' ? current.filter(b => b.tender?.evaluationType === evalFilter) : current;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(b =>
        b.bidder?.firstName?.toLowerCase().includes(s) ||
        b.bidder?.lastName?.toLowerCase().includes(s) ||
        b.bidder?.companyName?.toLowerCase().includes(s) ||
        b.tender?.title?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [current, evalFilter, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const pending = current.filter(b => b.status === TenderBidStatus.PENDING).length;
  const accepted = current.filter(b => b.status === TenderBidStatus.ACCEPTED).length;
  const declined = current.filter(b => b.status === TenderBidStatus.DECLINED).length;

  const stats = [
    { label: 'Total', value: current.length, color: 'var(--primary-tender-color)', icon: '📋' },
    { label: 'En attente', value: pending, color: '#f59e0b', icon: '⏳' },
    { label: 'Acceptées', value: accepted, color: '#10b981', icon: '✅' },
    { label: 'Déclinées', value: declined, color: '#ef4444', icon: '❌' },
  ];

  if (isQueryLoading && !bids.length) return <ListPageSkeleton accentColor="var(--primary-tender-color)" />;

  return (
    <>
      <DashboardKeyframes />
      <DashboardPageShell
        title={filterTab === 'received' ? 'Offres Reçues sur Appels d\'Offres' : 'Mes Soumissions'}
        subtitle="Gestion des offres de soumission"
        icon="📑"
        accentColor="var(--primary-tender-color)"
        stats={stats}
        headerActions={
          <HeaderAddBtn label="Nouvel appel d'offres" href="/dashboard/tenders/create" />
        }
      >
        {/* Tabs */}
        <div style={{ padding: '16px 20px 0' }}>
          <PillTabs
            value={filterTab}
            onChange={(v) => { setFilterTab(v as 'received' | 'my'); setPage(0); setEvalFilter('all'); router.push(`/dashboard/tender-bids?tab=${v}`); }}
            tabs={[
              { value: 'received', label: 'Reçues', count: received.length },
              { value: 'my', label: 'Mes soumissions', count: myBids.length },
            ]}
          />
        </div>

        {/* Sub-filter: Eval type */}
        <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type :</span>
          {(['all', 'MIEUX_DISANT', 'MOINS_DISANT'] as const).map(val => (
            <PillChip
              key={val}
              label={val === 'all' ? 'Tous' : val === 'MIEUX_DISANT' ? '✨ Mieux Disant' : '💰 Moins Disant'}
              active={evalFilter === val}
              onClick={() => { setEvalFilter(val); setPage(0); }}
              color={val === 'MIEUX_DISANT' ? '#0284c7' : val === 'MOINS_DISANT' ? '#10b981' : 'var(--primary-tender-color)'}
            />
          ))}
        </div>

        {/* Toolbar */}
        <div style={tableStyles.toolbar}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{filtered.length} offre{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={tableStyles.searchWrap}>
            <span style={tableStyles.searchIcon}>🔍</span>
            <input style={tableStyles.searchInput} placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
        </div>

        {error && (
          <div style={{ margin: '0 20px 16px', padding: '12px 16px', background: '#fee2e2', borderRadius: '10px', color: '#dc2626', fontSize: '0.875rem' }}>
            ⚠️ {(error as any)?.message || 'Erreur'}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={tableStyles.emptyState}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📑</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>Aucune soumission</p>
            <p style={{ color: '#94a3b8', margin: 0 }}>{filterTab === 'received' ? "Vous n'avez pas encore reçu de soumissions." : "Vous n'avez pas encore soumis d'offres."}</p>
          </div>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                {['Soumissionnaire', 'Appel d\'offres', 'Type', 'Montant / Proposition', 'Date', 'Statut', ''].map(h => (
                  <th key={h} style={tableStyles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(row => {
                const { _id, bidder, tender, bidAmount, createdAt, status, proposal, proposalFile } = row;
                const displayName = bidder?.companyName || bidder?.entreprise || `${bidder?.firstName || ''} ${bidder?.lastName || ''}`.trim() || 'N/A';
                return (
                  <tr key={_id} className="db-row" onClick={() => (row.tender as any)?._id && router.push(`/dashboard/tenders/${(row.tender as any)._id}/offers/${_id}`)} style={tableStyles.trHover}>
                    <td style={tableStyles.td}>
                      {(bidder as any)?._id ? (
                        <Link href={`/dashboard/profile/${(bidder as any)._id}`} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
                          <div style={tableStyles.avatar('var(--primary-tender-color)')}>{displayName.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{displayName}</div>
                            {bidder?.email && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{bidder.email}</div>}
                            {bidder?.phone && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{bidder.phone}</div>}
                          </div>
                        </Link>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={tableStyles.avatar()}>{displayName.charAt(0).toUpperCase()}</div>
                          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{displayName}</div>
                        </div>
                      )}
                    </td>
                    <td style={tableStyles.td}><span style={{ fontWeight: 600, color: '#1e293b' }}>{tender?.title || 'N/A'}</span></td>
                    <td style={tableStyles.td}>{evalChip(tender?.evaluationType)}</td>
                    <td style={tableStyles.td}>
                      {tender?.evaluationType === 'MIEUX_DISANT' ? (
                        <div>
                          {proposal && <div style={{ fontSize: '0.82rem', color: '#334155', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={proposal}>{proposal}</div>}
                          {proposalFile && (
                            <a href={proposalFile} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 600, marginTop: '4px' }}>
                              📎 {proposalFile.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Fichier'}
                            </a>
                          )}
                          {!proposal && !proposalFile && <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem' }}>Aucune proposition</span>}
                        </div>
                      ) : (
                        <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>{bidAmount?.toLocaleString('fr-FR')} DA</span>
                      )}
                    </td>
                    <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem' }}>{formatDate(createdAt)}</td>
                    <td style={tableStyles.td}><StatusBadge config={statusConfig(status)} /></td>
                    <td style={{ ...tableStyles.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <ActionBtn label="Détails" icon="👁️" onClick={() => tender?._id && router.push(`/dashboard/tenders/${tender._id}/offers/${_id}`)} />
                        {filterTab === 'received' && status === TenderBidStatus.PENDING && tender?.evaluationType === 'MIEUX_DISANT' && (
                          <>
                            <ActionBtn label="Accepter" icon="✅" variant="success" onClick={() => handleAccept(_id)} disabled={isLoading} />
                            <ActionBtn label="Refuser" icon="❌" variant="danger" onClick={() => handleReject(_id)} disabled={isLoading} />
                          </>
                        )}
                        {filterTab === 'received' && status === TenderBidStatus.PENDING && tender?.evaluationType !== 'MIEUX_DISANT' && (
                          <span style={{ padding: '3px 9px', borderRadius: '12px', background: '#e0f2fe', color: '#0284c7', fontSize: '0.72rem', fontWeight: 600 }}>🤖 Auto</span>
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
