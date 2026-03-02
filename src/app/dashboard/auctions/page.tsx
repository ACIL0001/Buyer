'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import {
  StatusBadge, PillChip, ActionBtn, HeaderAddBtn, tableStyles,
  DashboardKeyframes, SimplePagination, ConfirmDialog, ListPageSkeleton,
} from '@/components/dashboard/dashboardHelpers';

enum AUCTION_TYPE {
  CLASSIC = 'CLASSIC',
  EXPRESS = 'EXPRESS',
  AUTO_SUB_BID = 'AUTO_SUB_BID',
}
enum BID_STATUS {
  OPEN = 'OPEN',
  ON_AUCTION = 'ON_AUCTION',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}
interface Auction {
  _id: string;
  title: string;
  description: string;
  bidType: string;
  auctionType: AUCTION_TYPE;
  startingPrice: number;
  currentPrice: number;
  endingAt: string;
  startingAt: string;
  status: BID_STATUS;
  place?: string;
  quantity?: string;
  wilaya?: string;
}

function statusConfig(status: BID_STATUS) {
  const map: Record<string, { label: string; color: string; bg: string; dot?: boolean }> = {
    OPEN:       { label: 'Ouvert',     color: '#0284c7', bg: '#e0f2fe', dot: true },
    ON_AUCTION: { label: 'En cours',   color: '#16a34a', bg: '#dcfce7', dot: true },
    CLOSED:     { label: 'Fermé',      color: '#dc2626', bg: '#fee2e2' },
    ARCHIVED:   { label: 'Archivé',    color: '#64748b', bg: '#f1f5f9' },
  };
  return map[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
}

function auctionTypeLabel(type: AUCTION_TYPE) {
  const map: Record<string, string> = {
    CLASSIC: 'Classique', EXPRESS: 'Express', AUTO_SUB_BID: 'Auto',
  };
  return map[type] || type;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPrice(n: number) {
  return n?.toLocaleString('fr-FR') + ' DA';
}

function isFinished(a: Auction) {
  return new Date(a.endingAt) <= new Date() || a.status === BID_STATUS.CLOSED;
}

export default function AuctionsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLogged } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [relaunchTarget, setRelaunchTarget] = useState<string | null>(null);

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
      if (Array.isArray(res)) return res;
      if (res?.data && Array.isArray(res.data)) return res.data;
      return [];
    },
    enabled: isLogged,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const auctions = auctionsData as Auction[];
  const active = useMemo(() => auctions.filter(a => !isFinished(a)), [auctions]);
  const finished = useMemo(() => auctions.filter(a => isFinished(a)), [auctions]);

  const filtered = useMemo(() => {
    let list = statusFilter === 'ACTIVE' ? active : statusFilter === 'FINISHED' ? finished : auctions;
    if (search.trim()) list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [auctions, active, finished, statusFilter, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const stats = [
    { label: 'Total', value: auctions.length, color: '#0063b1', icon: '📋' },
    { label: 'Actives', value: active.length, color: '#10b981', icon: '✅' },
    { label: 'Terminées', value: finished.length, color: '#f59e0b', icon: '⏳' },
    { label: 'Archivées', value: auctions.filter(a => a.status === BID_STATUS.ARCHIVED).length, color: '#64748b', icon: '🗄️' },
  ];

  if (isLoading) return <ListPageSkeleton accentColor="#0063b1" />;

  return (
    <>
      <DashboardKeyframes />
      <DashboardPageShell
        title={t('dashboard.list.myAuctions', 'Mes Enchères')}
        subtitle={`${auctions.length} enchère${auctions.length !== 1 ? 's' : ''} au total`}
        icon="🏷️"
        stats={stats}
        headerActions={
          <HeaderAddBtn label={t('dashboard.list.newAuction', 'Nouvelle enchère')} href="/dashboard/auctions/create/" />
        }
      >
        {/* Toolbar */}
        <div style={tableStyles.toolbar}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <PillChip label="Toutes" active={statusFilter === 'ALL'} onClick={() => { setStatusFilter('ALL'); setPage(0); }} count={auctions.length} />
            <PillChip label="Actives" active={statusFilter === 'ACTIVE'} onClick={() => { setStatusFilter('ACTIVE'); setPage(0); }} count={active.length} color="#10b981" />
            <PillChip label="Terminées" active={statusFilter === 'FINISHED'} onClick={() => { setStatusFilter('FINISHED'); setPage(0); }} count={finished.length} color="#f59e0b" />
          </div>
          <div style={tableStyles.searchWrap}>
            <span style={tableStyles.searchIcon}>🔍</span>
            <input
              style={tableStyles.searchInput}
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={tableStyles.emptyState}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🏷️</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>Aucune enchère trouvée</p>
            <p style={{ color: '#94a3b8', margin: '0 0 24px' }}>Créez votre première enchère pour commencer</p>
            <a href="/dashboard/auctions/create/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: '#0063b1', color: '#fff', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
              ＋ Nouvelle enchère
            </a>
          </div>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                {['Titre', 'Type', 'Mode', 'Prix de départ', 'Prix actuel', 'Fin', 'Statut', ''].map(h => (
                  <th key={h} style={tableStyles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(row => (
                <tr
                  key={row._id}
                  className="db-row"
                  onClick={() => router.push(`/dashboard/auctions/${row._id}`)}
                  style={tableStyles.trHover}
                >
                  <td style={tableStyles.td}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{row.title}</span>
                  </td>
                  <td style={tableStyles.td}>
                    <span style={{ padding: '3px 9px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontSize: '0.76rem', fontWeight: 600 }}>
                      {row.bidType === 'PRODUCT' ? '📦 Produit' : '🔧 Service'}
                    </span>
                  </td>
                  <td style={tableStyles.td}>
                    <span style={{
                      padding: '3px 9px', borderRadius: '12px', fontSize: '0.76rem', fontWeight: 600,
                      background: row.auctionType === 'EXPRESS' ? '#fef3c7' : row.auctionType === 'AUTO_SUB_BID' ? '#e0f2fe' : '#f1f5f9',
                      color: row.auctionType === 'EXPRESS' ? '#d97706' : row.auctionType === 'AUTO_SUB_BID' ? '#0284c7' : '#475569',
                    }}>
                      {row.auctionType === 'EXPRESS' ? '⚡' : row.auctionType === 'AUTO_SUB_BID' ? '🤖' : '🏛️'} {auctionTypeLabel(row.auctionType)}
                    </span>
                  </td>
                  <td style={tableStyles.td}>{formatPrice(row.startingPrice)}</td>
                  <td style={tableStyles.td}>
                    <span style={{ fontWeight: 700, color: row.currentPrice > row.startingPrice ? '#10b981' : '#334155' }}>
                      {formatPrice(row.currentPrice)}
                    </span>
                  </td>
                  <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem' }}>{formatDate(row.endingAt)}</td>
                  <td style={tableStyles.td}>
                    <StatusBadge config={statusConfig(row.status)} />
                  </td>
                  <td style={{ ...tableStyles.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <ActionBtn label="Voir" icon="👁️" href={`/dashboard/auctions/${row._id}`} />
                      {isFinished(row) && (
                        <ActionBtn
                          label="Relancer"
                          icon="🔄"
                          variant="success"
                          onClick={() => setRelaunchTarget(row._id)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > 0 && (
          <SimplePagination
            page={page}
            rowsPerPage={rowsPerPage}
            total={filtered.length}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        )}
      </DashboardPageShell>

      <ConfirmDialog
        open={!!relaunchTarget}
        title="Relancer l'enchère"
        message="Voulez-vous vraiment relancer cette enchère ? Une nouvelle session commencera."
        confirmLabel="Relancer"
        cancelLabel="Annuler"
        onCancel={() => setRelaunchTarget(null)}
        onConfirm={() => {
          queryClient.invalidateQueries({ queryKey: ['my-auctions'] });
          setRelaunchTarget(null);
        }}
      />
    </>
  );
}
