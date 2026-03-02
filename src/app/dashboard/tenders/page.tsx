'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { Tender, TENDER_STATUS } from '@/types/tender';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import {
  StatusBadge, PillChip, ActionBtn, HeaderAddBtn, tableStyles,
  DashboardKeyframes, SimplePagination, ListPageSkeleton,
} from '@/components/dashboard/dashboardHelpers';

function statusConfig(status: TENDER_STATUS) {
  const map: Record<string, { label: string; color: string; bg: string; dot?: boolean }> = {
    OPEN:      { label: 'Ouvert',    color: '#0284c7', bg: '#e0f2fe', dot: true },
    AWARDED:   { label: 'Attribué', color: '#16a34a', bg: '#dcfce7' },
    CLOSED:    { label: 'Clôturé',  color: '#d97706', bg: '#fef3c7' },
    CANCELLED: { label: 'Annulé',   color: '#dc2626', bg: '#fee2e2' },
  };
  return map[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
}

function evalChip(type?: string) {
  if (!type) return <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>N/A</span>;
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '12px', fontSize: '0.76rem', fontWeight: 600,
      background: type === 'MIEUX_DISANT' ? '#e0f2fe' : '#dcfce7',
      color: type === 'MIEUX_DISANT' ? '#0284c7' : '#16a34a',
    }}>
      {type === 'MIEUX_DISANT' ? '✨ Mieux Disant' : '💰 Moins Disant'}
    </span>
  );
}

function formatDate(d: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TendersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLogged } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    if (!socket) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['tenders', 'my'] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, queryClient]);

  const { data: tenders = [], isLoading } = useQuery({
    queryKey: ['tenders', 'my'],
    queryFn: async () => {
      const { TendersAPI } = await import('@/services/tenders');
      const response = await TendersAPI.getTenders();
      const rawData = response.data || (Array.isArray(response) ? response : []);
      return rawData.map((item: any) => ({
        ...item,
        category: typeof item.category === 'object' ? item.category?.name : item.category,
      }));
    },
    enabled: isLogged,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(() => {
    let list = statusFilter === 'ALL' ? tenders : tenders.filter((t: Tender) => t.status === statusFilter);
    if (search.trim()) list = list.filter((t: Tender) => t.title?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [tenders, statusFilter, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const stats = [
    { label: 'Total', value: tenders.length, color: '#0063b1', icon: '📋' },
    { label: 'Ouverts', value: tenders.filter((t: Tender) => t.status === TENDER_STATUS.OPEN).length, color: '#0284c7', icon: '🟢' },
    { label: 'Attribués', value: tenders.filter((t: Tender) => t.status === TENDER_STATUS.AWARDED).length, color: '#10b981', icon: '✅' },
    { label: 'Clôturés', value: tenders.filter((t: Tender) => t.status === TENDER_STATUS.CLOSED || t.status === TENDER_STATUS.CANCELLED).length, color: '#f59e0b', icon: '🔒' },
  ];

  if (isLoading) return <ListPageSkeleton accentColor="#059669" />;

  return (
    <>
      <DashboardKeyframes />
      <DashboardPageShell
        title={t('dashboard.list.myTenders', 'Mes Appels d\'Offres')}
        subtitle={`${tenders.length} appel${tenders.length !== 1 ? 's' : ''} d'offres`}
        icon="📄"
        accentColor="#059669"
        stats={stats}
        headerActions={
          <HeaderAddBtn label={t('dashboard.list.newTender', 'Nouvel appel d\'offres')} href="/dashboard/tenders/create/" />
        }
      >
        {/* Toolbar */}
        <div style={tableStyles.toolbar}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL',      label: 'Tous',        count: tenders.length },
              { key: 'OPEN',     label: 'Ouverts',     count: tenders.filter((t: Tender) => t.status === TENDER_STATUS.OPEN).length,      color: '#0284c7' },
              { key: 'AWARDED',  label: 'Attribués',   count: tenders.filter((t: Tender) => t.status === TENDER_STATUS.AWARDED).length,   color: '#10b981' },
              { key: 'CLOSED',   label: 'Clôturés',    count: tenders.filter((t: Tender) => t.status === TENDER_STATUS.CLOSED).length,    color: '#f59e0b' },
            ].map(f => (
              <PillChip key={f.key} label={f.label} active={statusFilter === f.key} onClick={() => { setStatusFilter(f.key); setPage(0); }} count={f.count} color={f.color} />
            ))}
          </div>
          <div style={tableStyles.searchWrap}>
            <span style={tableStyles.searchIcon}>🔍</span>
            <input style={tableStyles.searchInput} placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={tableStyles.emptyState}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📄</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>Aucun appel d'offres</p>
            <p style={{ color: '#94a3b8', margin: '0 0 24px' }}>Créez votre premier appel d'offres</p>
            <a href="/dashboard/tenders/create/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: '#0063b1', color: '#fff', borderRadius: '10px', fontWeight: 700, textDecoration: 'none' }}>
              ＋ Nouvel appel d'offres
            </a>
          </div>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                {['Titre', 'Catégorie', 'Type évaluation', 'Budget max.', 'Délai', 'Offres reçues', 'Statut', ''].map(h => (
                  <th key={h} style={tableStyles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row: any) => {
                const displayBudget = row.maxBudget || row.budget || 0;
                const displayDate = row.endingAt || row.deadline;
                const displayBidsCount = row.bidsCount || row.bids?.length || 0;
                return (
                  <tr key={row._id} className="db-row" onClick={() => router.push(`/dashboard/tenders/${row._id}`)} style={tableStyles.trHover}>
                    <td style={tableStyles.td}><span style={{ fontWeight: 600, color: '#1e293b' }}>{row.title}</span></td>
                    <td style={tableStyles.td}>
                      <span style={{ padding: '3px 9px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontSize: '0.76rem', fontWeight: 600 }}>
                        {row.category || 'N/A'}
                      </span>
                    </td>
                    <td style={tableStyles.td}>{evalChip(row.evaluationType)}</td>
                    <td style={tableStyles.td}>
                      {displayBudget > 0
                        ? <span style={{ fontWeight: 700, color: '#0063b1' }}>{displayBudget.toLocaleString('fr-FR')} DA</span>
                        : <span style={{ color: '#94a3b8' }}>N/A</span>}
                    </td>
                    <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem' }}>{displayDate ? formatDate(displayDate) : 'N/A'}</td>
                    <td style={tableStyles.td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', fontWeight: 700, fontSize: '0.8rem' }}>
                        {displayBidsCount}
                      </span>
                    </td>
                    <td style={tableStyles.td}><StatusBadge config={statusConfig(row.status)} /></td>
                    <td style={{ ...tableStyles.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <ActionBtn label="Voir" icon="👁️" href={`/dashboard/tenders/${row._id}`} />
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
