'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { DirectSale, SALE_STATUS } from '@/types/direct-sale';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import DashboardPageShell from '@/components/dashboard/DashboardPageShell';
import {
  StatusBadge, PillChip, ActionBtn, HeaderAddBtn, tableStyles,
  DashboardKeyframes, SimplePagination, ConfirmDialog, ListPageSkeleton,
} from '@/components/dashboard/dashboardHelpers';

function statusConfig(status: SALE_STATUS) {
  const map: Record<string, any> = {
    ACTIVE:       { label: 'Actif',       color: '#16a34a', bg: '#dcfce7', dot: true },
    SOLD:         { label: 'Vendu',        color: '#0284c7', bg: '#e0f2fe' },
    INACTIVE:     { label: 'Inactif',      color: '#d97706', bg: '#fef3c7' },
    OUT_OF_STOCK: { label: 'Rupture',      color: '#dc2626', bg: '#fee2e2' },
    PAUSED:       { label: 'Suspendu',     color: '#7c3aed', bg: '#ede9fe' },
    ARCHIVED:     { label: 'Archivé',      color: '#64748b', bg: '#f1f5f9' },
    SOLD_OUT:     { label: 'Épuisé',       color: '#dc2626', bg: '#fee2e2' },
  };
  return map[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
}

export default function DirectSalesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLogged } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      return rawData.map((item: any) => ({
        ...item,
        category: typeof item.category === 'object' ? item.category?.name : item.category,
        productCategory: typeof item.productCategory === 'object' ? item.productCategory?.name : item.productCategory,
      })) as DirectSale[];
    },
    enabled: isLogged,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const saleList = sales as DirectSale[];

  const filtered = useMemo(() => {
    let list = statusFilter === 'ALL' ? saleList : saleList.filter(s => s.status === statusFilter);
    if (search.trim()) list = list.filter(s => s.title?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [saleList, statusFilter, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      await DirectSaleAPI.delete(deleteTarget);
      queryClient.invalidateQueries({ queryKey: ['direct-sales', 'my'] });
    } catch (e) { console.error(e); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const active = saleList.filter(s => s.status === SALE_STATUS.ACTIVE);
  const outOfStock = saleList.filter(s => s.status === SALE_STATUS.OUT_OF_STOCK || (s as any).status === 'SOLD_OUT');
  const sold = saleList.filter(s => s.status === SALE_STATUS.SOLD);

  const stats = [
    { label: 'Total', value: saleList.length, color: '#0063b1', icon: '🛍️' },
    { label: 'Actifs', value: active.length, color: '#10b981', icon: '✅' },
    { label: 'Rupture de stock', value: outOfStock.length, color: '#ef4444', icon: '⚠️' },
    { label: 'Vendus', value: sold.length, color: '#0284c7', icon: '💰' },
  ];

  if (isLoading) return <ListPageSkeleton accentColor="#d97706" />;

  return (
    <>
      <DashboardKeyframes />
      <DashboardPageShell
        title={t('dashboard.list.myDirectSales', 'Mes Ventes Directes')}
        subtitle={`${saleList.length} vente${saleList.length !== 1 ? 's' : ''} au total`}
        icon="🛍️"
        accentColor="#d97706"
        stats={stats}
        headerActions={
          <HeaderAddBtn label={t('dashboard.list.newSale', 'Nouvelle vente')} href="/dashboard/direct-sales/create/" />
        }
      >
        {/* Toolbar */}
        <div style={tableStyles.toolbar}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <PillChip label="Tous" active={statusFilter === 'ALL'} onClick={() => { setStatusFilter('ALL'); setPage(0); }} count={saleList.length} />
            <PillChip label="Actifs" active={statusFilter === 'ACTIVE'} onClick={() => { setStatusFilter('ACTIVE'); setPage(0); }} count={active.length} color="#10b981" />
            <PillChip label="Inactifs" active={statusFilter === 'INACTIVE'} onClick={() => { setStatusFilter('INACTIVE'); setPage(0); }} count={saleList.filter(s => (s as any).status === 'INACTIVE').length} color="#d97706" />
            <PillChip label="Vendus" active={statusFilter === 'SOLD'} onClick={() => { setStatusFilter('SOLD'); setPage(0); }} count={sold.length} color="#0284c7" />
          </div>
          <div style={tableStyles.searchWrap}>
            <span style={tableStyles.searchIcon}>🔍</span>
            <input style={tableStyles.searchInput} placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={tableStyles.emptyState}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛍️</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>Aucune vente directe</p>
            <p style={{ color: '#94a3b8', margin: '0 0 24px' }}>Créez votre première vente directe</p>
            <a href="/dashboard/direct-sales/create/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: '#0063b1', color: '#fff', borderRadius: '10px', fontWeight: 700, textDecoration: 'none' }}>
              ＋ Nouvelle vente
            </a>
          </div>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                {['Titre', 'Catégorie', 'Prix unitaire', 'Stock', 'Commandes', 'Statut', ''].map(h => (
                  <th key={h} style={tableStyles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(row => {
                const { _id, title, productCategory, category, price, quantity, stock, ordersCount, status } = row;
                const catName = (typeof productCategory === 'object' ? (productCategory as any)?.name : productCategory) || (typeof category === 'object' ? (category as any)?.name : category);
                const displayStock = quantity !== undefined ? quantity : (stock || 0);
                const displayOrders = ordersCount || 0;
                return (
                  <tr key={_id} className="db-row" onClick={() => router.push(`/dashboard/direct-sales/${_id}`)} style={tableStyles.trHover}>
                    <td style={tableStyles.td}><span style={{ fontWeight: 600, color: '#1e293b' }}>{title}</span></td>
                    <td style={tableStyles.td}>
                      <span style={{ padding: '3px 9px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontSize: '0.76rem', fontWeight: 600 }}>{catName || 'N/A'}</span>
                    </td>
                    <td style={tableStyles.td}>
                      <span style={{ fontWeight: 700, color: '#0063b1' }}>{price?.toFixed(2)} DA</span>
                    </td>
                    <td style={tableStyles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: displayStock === 0 ? '#ef4444' : '#334155' }}>{displayStock}</span>
                        {displayStock === 0 && <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>Épuisé</span>}
                      </div>
                    </td>
                    <td style={tableStyles.td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '28px', height: '28px', borderRadius: '50%', background: displayOrders > 0 ? '#dcfce7' : '#f1f5f9', color: displayOrders > 0 ? '#16a34a' : '#94a3b8', fontWeight: 700, fontSize: '0.8rem', padding: '0 6px' }}>
                        {displayOrders}
                      </span>
                    </td>
                    <td style={tableStyles.td}><StatusBadge config={statusConfig(status)} /></td>
                    <td style={{ ...tableStyles.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <ActionBtn label="Voir" icon="👁️" href={`/dashboard/direct-sales/${_id}`} />
                        <ActionBtn label="Supprimer" icon="🗑️" variant="danger" onClick={() => setDeleteTarget(_id)} />
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer la vente directe"
        message="Êtes-vous sûr de vouloir supprimer cette vente directe ? Cette action est irréversible."
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer'}
        cancelLabel="Annuler"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
