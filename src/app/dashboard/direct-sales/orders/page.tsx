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
  SimplePagination, PillTabs, ConfirmDialog, ListPageSkeleton,
} from '@/components/dashboard/dashboardHelpers';

interface Order {
  _id: string;
  directSale?: { _id: string; title: string; owner?: { firstName?: string; lastName?: string; email?: string; phone?: string; companyName?: string; entreprise?: string; }; } | null;
  buyer?: { _id?: string; firstName: string; lastName: string; email?: string; phone?: string; companyName?: string; entreprise?: string; } | null;
  seller?: { _id?: string; firstName: string; lastName: string; email?: string; phone?: string; companyName?: string; entreprise?: string; } | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

function statusConfig(s: string) {
  const map: Record<string, any> = {
    CONFIRMED: { label: 'Confirmé',  color: '#16a34a', bg: '#dcfce7' },
    PENDING:   { label: 'En attente', color: '#d97706', bg: '#fef3c7', dot: true },
    CANCELLED: { label: 'Annulé',     color: '#dc2626', bg: '#fee2e2' },
    COMPLETED: { label: 'Complété',   color: '#0284c7', bg: '#e0f2fe' },
  };
  return map[s] || { label: s, color: '#64748b', bg: '#f1f5f9' };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const { isLogged } = useAuth();

  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmTarget, setConfirmTarget] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);

  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'received') setTabValue(0);
    else if (tab === 'made' || tab === 'my') setTabValue(1);
  }, [searchParams]);

  useEffect(() => { setPage(0); setSearch(''); }, [tabValue]);

  useEffect(() => {
    if (!socket) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, queryClient]);

  const { data, isLoading: isQueryLoading, refetch } = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      const [ordersData, purchasesData] = await Promise.all([DirectSaleAPI.getMyOrders(), DirectSaleAPI.getMyPurchases()]);
      const o = Array.isArray(ordersData) ? ordersData.filter((o: any) => o.directSale) : [];
      const p = Array.isArray(purchasesData) ? purchasesData.filter((p: any) => p.directSale) : [];
      return { orders: o, purchases: p };
    },
    enabled: isLogged,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const orders = data?.orders || [];
  const purchases = data?.purchases || [];
  const isLoading = isQueryLoading || confirming;

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setConfirming(true);
    try {
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      await DirectSaleAPI.confirmPurchase(confirmTarget._id);
      setConfirmTarget(null);
      await refetch();
    } catch (e) { console.error(e); }
    finally { setConfirming(false); }
  };

  const current = tabValue === 0 ? orders : purchases;
  const isPurchase = tabValue === 1;

  const filtered = useMemo(() => {
    if (!search.trim()) return current;
    const s = search.toLowerCase();
    return current.filter(o =>
      o.directSale?.title?.toLowerCase().includes(s) ||
      (isPurchase ? o.seller?.firstName : o.buyer?.firstName)?.toLowerCase().includes(s) ||
      (isPurchase ? o.seller?.lastName : o.buyer?.lastName)?.toLowerCase().includes(s)
    );
  }, [current, search, isPurchase]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const pending = current.filter(o => o.status === 'PENDING').length;
  const confirmed = current.filter(o => o.status === 'CONFIRMED').length;
  const cancelled = current.filter(o => o.status === 'CANCELLED').length;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalPrice : 0), 0);

  const stats = [
    { label: 'Total commandes', value: current.length, color: '#0063b1', icon: '📦' },
    { label: 'En attente', value: pending, color: '#f59e0b', icon: '⏳' },
    { label: 'Confirmées', value: confirmed, color: '#10b981', icon: '✅' },
    { label: 'Annulées', value: cancelled, color: '#ef4444', icon: '❌' },
  ];

  if (isQueryLoading && (!orders.length && !purchases.length)) return <ListPageSkeleton accentColor="#d97706" />;

  return (
    <>
      <DashboardKeyframes />
      <DashboardPageShell
        title={t('dashboard.orders.title', 'Gestion des commandes')}
        subtitle={t('dashboard.orders.subtitle', 'Suivez toutes vos commandes')}
        icon="📦"
        accentColor="#d97706"
        stats={stats}
        headerActions={
          <button onClick={() => refetch()} disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', border: '1.5px solid rgba(255,255,255,0.35)', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
            🔄 Actualiser
          </button>
        }
      >
        {/* Tabs */}
        <div style={{ padding: '16px 20px 0' }}>
          <PillTabs
            value={tabValue === 0 ? 'received' : 'made'}
            onChange={(v) => { setTabValue(v === 'received' ? 0 : 1); router.push(`/dashboard/direct-sales/orders?tab=${v}`); }}
            tabs={[
              { value: 'received', label: t('dashboard.orders.tabs.received', 'Commandes reçues'), count: orders.length },
              { value: 'made', label: t('dashboard.orders.tabs.made', 'Mes achats'), count: purchases.length },
            ]}
          />
        </div>

        {/* Toolbar */}
        <div style={tableStyles.toolbar}>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{filtered.length} commande{filtered.length !== 1 ? 's' : ''}</span>
          <div style={tableStyles.searchWrap}>
            <span style={tableStyles.searchIcon}>🔍</span>
            <input style={tableStyles.searchInput} placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={tableStyles.emptyState}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📦</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>Aucune commande</p>
            <p style={{ color: '#94a3b8', margin: 0 }}>{isPurchase ? "Vous n'avez pas encore passé de commandes." : "Vous n'avez pas encore reçu de commandes."}</p>
          </div>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                {['Produit', isPurchase ? 'Vendeur' : 'Acheteur', 'Qté', 'Prix unitaire', 'Total', 'Statut', 'Date', ''].map(h => (
                  <th key={h} style={tableStyles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(order => {
                const counterparty = isPurchase ? (order.seller || order.directSale?.owner) : order.buyer;
                const displayName = counterparty
                  ? (counterparty.companyName || counterparty.entreprise || `${counterparty.firstName || ''} ${counterparty.lastName || ''}`.trim())
                  : (isPurchase ? 'Vendeur inconnu' : 'Acheteur inconnu');
                const initials = displayName?.charAt(0).toUpperCase() || '?';
                const profileId = (counterparty as any)?._id;

                return (
                  <tr key={order._id} className="db-row" style={tableStyles.trHover}>
                    <td style={tableStyles.td}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{order.directSale?.title || 'Produit inconnu'}</span>
                    </td>
                    <td style={tableStyles.td}>
                      {profileId ? (
                        <Link href={`/profile/${profileId}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
                          <div style={tableStyles.avatar(isPurchase ? '#0063b1' : '#7c3aed')}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{displayName}</div>
                            {counterparty?.phone && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{counterparty.phone}</div>}
                          </div>
                        </Link>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={tableStyles.avatar()}>{initials}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{displayName}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ ...tableStyles.td, textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '0.8rem' }}>{order.quantity}</span>
                    </td>
                    <td style={tableStyles.td}>{order.unitPrice?.toLocaleString(i18n.language)} DA</td>
                    <td style={tableStyles.td}>
                      <span style={{ fontWeight: 700, color: '#0063b1', fontSize: '0.95rem' }}>{order.totalPrice?.toLocaleString(i18n.language)} DA</span>
                    </td>
                    <td style={tableStyles.td}><StatusBadge config={statusConfig(order.status)} /></td>
                    <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem' }}>{formatDate(order.createdAt)}</td>
                    <td style={{ ...tableStyles.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <ActionBtn
                          label="Détails"
                          icon="👁️"
                          onClick={() => {
                            if (order.directSale?._id && order._id)
                              router.push(`/dashboard/direct-sales/${order.directSale._id}/orders/${order._id}`);
                          }}
                        />
                        {!isPurchase && order.status === 'PENDING' && (
                          <ActionBtn label="Confirmer" icon="✅" variant="success" onClick={() => setConfirmTarget(order)} />
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

      <ConfirmDialog
        open={!!confirmTarget}
        title="Confirmer la commande"
        message={`Confirmer la commande de "${confirmTarget?.directSale?.title || 'ce produit'}" pour ${confirmTarget?.buyer ? `${confirmTarget.buyer.firstName} ${confirmTarget.buyer.lastName}` : 'cet acheteur'} ? Total : ${confirmTarget?.totalPrice?.toLocaleString() || 0} DA`}
        confirmLabel={confirming ? 'Confirmation...' : 'Confirmer'}
        cancelLabel="Annuler"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
