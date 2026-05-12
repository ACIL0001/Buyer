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
  BsPlusLg,
  BsBoxSeam,
  BsSearch
} from 'react-icons/bs';
import { formatUserName } from '@/utils/user';
import { ConfirmDialog } from '@/components/dashboard/dashboardHelpers';
import './orders-styles.css';

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

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const { auth, isLogged } = useAuth();
  const user = auth?.user;

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

  if (isQueryLoading && (!orders.length && !purchases.length)) return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1116px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Bienvenue {(user as any)?.companyName || (user as any)?.entreprise || (user as any)?.firstName || 'Utilisateur'}
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Suivez toutes vos commandes et achats directs</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => router.push('/dashboard/direct-sales/create/')}
              style={{ backgroundColor: '#0050CB', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BsPlusLg /> Créer une Vente Directe
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
              <BsBoxSeam size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Commandes</span>
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
              <span className="figma-auc-card-label">Confirmées</span>
              <span className="figma-auc-card-value">{confirmed}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-red">
              <BsXCircle size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Annulées</span>
              <span className="figma-auc-card-value">{cancelled}</span>
            </div>
          </div>
        </div>

        {/* Tabs - Segmented Control */}
        <div className="offers-tabs-wrapper">
          <div className="offers-segmented-control">
            <button 
              className={`offers-tab-item ${tabValue === 0 ? 'active' : ''}`}
              onClick={() => { setTabValue(0); router.push('/dashboard/direct-sales/orders?tab=received'); }}
            >
              Commandes reçues <span className="offers-tab-count">{orders.length}</span>
            </button>
            <button 
              className={`offers-tab-item ${tabValue === 1 ? 'active' : ''}`}
              onClick={() => { setTabValue(1); router.push('/dashboard/direct-sales/orders?tab=made'); }}
            >
              Mes achats <span className="offers-tab-count">{purchases.length}</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 24px' }}>
          <div style={{ fontSize: '14px', color: '#64748B' }}>
            {filtered.length} commande{filtered.length !== 1 ? 's' : ''}
          </div>
          <div style={{ position: 'relative' }}>
            <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', width: '240px' }}
            />
          </div>
        </div>

        {/* Main Table Section */}
        <div className="figma-auc-section">
          <div className="figma-auc-header">
            <h3 className="figma-auc-title">
              {isPurchase ? 'Historique de mes achats' : 'Commandes à traiter'}
            </h3>
          </div>

          <table className="figma-auc-table">
            <thead className="figma-auc-thead">
              <tr>
                <th className="figma-auc-th">PRODUIT</th>
                <th className="figma-auc-th">{isPurchase ? 'VENDEUR' : 'ACHETEUR'}</th>
                <th className="figma-auc-th">QTÉ</th>
                <th className="figma-auc-th">TOTAL</th>
                <th className="figma-auc-th">STATUS</th>
                <th className="figma-auc-th" style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    Aucune commande trouvée.
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const counterparty = isPurchase ? (order.seller || order.directSale?.owner) : order.buyer;
                  const displayName = formatUserName(counterparty);
                  const initials = displayName?.charAt(0).toUpperCase() || '?';
                  
                  return (
                    <tr key={order._id} className="figma-auc-tr">
                      <td className="figma-auc-td">
                        <div className="figma-auc-product-info">
                          <span className="figma-auc-product-name">{order.directSale?.title || 'Produit inconnu'}</span>
                          <span className="figma-auc-product-cat">ID: {order._id.slice(-6).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="figma-auc-td">
                        <div className="figma-auc-user-cell">
                          <div className="figma-auc-avatar" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                            {initials}
                          </div>
                          <div className="figma-auc-product-info">
                            <span className="figma-auc-user-name">{displayName}</span>
                            <span className="figma-auc-product-cat">{counterparty?.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="figma-auc-td">
                         <span style={{ fontWeight: 600, color: '#475569' }}>x{order.quantity}</span>
                      </td>
                      <td className="figma-auc-td">
                        <span className="figma-auc-price">{order.totalPrice?.toLocaleString(i18n.language)} DA</span>
                      </td>
                      <td className="figma-auc-td">
                        <span className={`figma-auc-status-badge ${
                          order.status === 'CANCELLED' ? 'figma-auc-status-rejected' : 
                          order.status === 'CONFIRMED' ? 'figma-auc-status-accepted' : 
                          order.status === 'COMPLETED' ? 'figma-auc-status-completed' : 
                          'figma-auc-status-pending'
                        }`}>
                          {order.status === 'CONFIRMED' ? 'CONFIRMÉ' : 
                           order.status === 'CANCELLED' ? 'ANNULÉ' : 
                           order.status === 'COMPLETED' ? 'COMPLÉTÉ' : 
                           'EN ATTENTE'}
                        </span>
                      </td>
                      <td className="figma-auc-td" style={{ textAlign: 'right' }}>
                        <div className="figma-auc-actions">
                          <button 
                            className="figma-auc-btn-details"
                            onClick={() => {
                              if (order.directSale?._id && order._id)
                                router.push(`/dashboard/direct-sales/${order.directSale._id}/orders/${order._id}`);
                            }}
                          >
                            Détails
                          </button>
                          {!isPurchase && order.status === 'PENDING' && (
                            <button className="figma-auc-btn-success" onClick={() => setConfirmTarget(order)}>Confirmer</button>
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

      <ConfirmDialog
        open={!!confirmTarget}
        title="Confirmer la commande"
        message={`Confirmer la commande de "${confirmTarget?.directSale?.title || 'ce produit'}" pour ${formatUserName(confirmTarget?.buyer)} ? Total : ${confirmTarget?.totalPrice?.toLocaleString() || 0} DA`}
        confirmLabel={confirming ? 'Confirmation...' : 'Confirmer'}
        cancelLabel="Annuler"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
