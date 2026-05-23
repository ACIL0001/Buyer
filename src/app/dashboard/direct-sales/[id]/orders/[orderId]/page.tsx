'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DirectSaleAPI } from '@/services/direct-sale';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { DashboardKeyframes, ConfirmDialog, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';
import { formatUserName } from '@/utils/user';
import { normalizeImageUrl } from '@/utils/url';
import { BsArrowLeft, BsBarChart, BsClockHistory, BsBoxSeam, BsInfoCircle } from 'react-icons/bs';
import '../../../../auctions/[id]/auction-details-styles.css';

const ACCENT = 'var(--primary-ds-color)';

function orderStatusCfg(s: string) {
  const m: Record<string, any> = {
    CONFIRMED: { label: 'Confirmé',   color: '#16a34a', bg: '#dcfce7' },
    PENDING:   { label: 'En attente', color: '#d97706', bg: '#fef3c7', dot: true },
    CANCELLED: { label: 'Annulé',     color: '#dc2626', bg: '#fee2e2' },
    COMPLETED: { label: 'Complété',   color: '#0284c7', bg: '#e0f2fe' },
  };
  return m[s] || { label: s, color: '#64748b', bg: '#f1f5f9' };
}

function fmtDate(d: any) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DirectSaleOrderDetailPage() {
  const params = useParams();
  const directSaleId = params?.id as string;
  const orderId = params?.orderId as string;
  const router = useRouter();
  const { auth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [confirmDialog, setConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    if (!socket || !directSaleId) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['direct-sale-order', directSaleId, orderId] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, directSaleId, orderId, queryClient]);

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['direct-sale-order', directSaleId, orderId],
    queryFn: async () => {
      const [sr, or] = await Promise.all([
        DirectSaleAPI.getDirectSaleById(directSaleId),
        DirectSaleAPI.getPurchasesByDirectSale(directSaleId),
      ]);
      const saleData = sr.data || sr;
      const orders = or?.data && Array.isArray(or.data) ? or.data : Array.isArray(or) ? or : [];
      const specific = orders.find((o: any) => o._id === orderId);
      return { sale: saleData, allOrders: orders, order: specific };
    },
    enabled: !!directSaleId && !!orderId,
    staleTime: 60000,
  });

  const handleConfirm = async () => {
    setProcessing(true);
    try { 
      await DirectSaleAPI.confirmPurchase(orderId); 
      enqueueSnackbar('Commande confirmée', { variant: 'success' }); 
      await refetch(); 
    } catch { 
      enqueueSnackbar('Erreur lors de la confirmation', { variant: 'error' }); 
    } finally { 
      setProcessing(false); 
      setConfirmDialog(false); 
    }
  };

  if (loading) return <DetailPageSkeleton accentColor="var(--primary-ds-color)" />;

  const sale = data?.sale;
  const order = data?.order;
  const allOrders = data?.allOrders || [];

  if (!sale || !order) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <p>Commande ou vente introuvable</p>
      <button onClick={() => router.back()}>Retour</button>
    </div>
  );

  const saleOwnerId = typeof sale.owner === 'object' ? sale.owner?._id : sale.owner;
  const isOwner = saleOwnerId == auth?.user?._id;
  const isConfirmed = order.status === 'CONFIRMED' || order.status === 'COMPLETED';
  const counterparty = isOwner ? (order.buyer) : (order.seller || sale.owner);
  const cpId = typeof counterparty === 'object' ? counterparty?._id : counterparty;
  const cpName = formatUserName(counterparty);
  const statusCfg = orderStatusCfg(order.status);

  const getDisplayName = (user: any) => {
    if (user?.companyName || user?.entreprise) return user.companyName || user.entreprise;
    if (user?.firstName || user?.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user?.name || 'Utilisateur';
  };

  const getInitials = (user: any): string => {
    const name = getDisplayName(user);
    if (!name || name === 'Utilisateur') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const BidderAvatar = ({ user }: { user: any }) => {
    const avatarUrl = user?.avatar?.fullUrl || user?.avatar?.url || user?.profileImage?.url || user?.photoURL;
    const resolvedUrl = avatarUrl ? normalizeImageUrl(avatarUrl) : null;
    const initials = getInitials(user);
    const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
    const colorIndex = initials.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    if (!resolvedUrl) {
      return (
        <div className="figma-ad-bidder-avatar" style={{ backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 700, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
          {initials}
        </div>
      );
    }

    return (
      <img
        src={resolvedUrl}
        alt={getDisplayName(user)}
        className="figma-ad-bidder-avatar"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.avatar-fallback')) {
            const fallback = document.createElement('div');
            fallback.className = 'avatar-fallback figma-ad-bidder-avatar';
            fallback.textContent = initials;
            fallback.style.cssText = `background-color:${bgColor};display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700;font-family:Inter,sans-serif;flex-shrink:0;`;
            parent.insertBefore(fallback, target.nextSibling);
          }
        }}
      />
    );
  };

  const getImageUrl = (item: any): string => {
    if (!item) return '/assets/img/logo.png';
    const url = item.fullUrl || item.url;
    return normalizeImageUrl(url) || '/assets/img/logo.png';
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '80px' }}>
      <DashboardKeyframes />
      <div className="figma-ad-main">
        
        <button 
          className="figma-ad-back-btn"
          onClick={() => router.push('/dashboard/direct-sales/orders')}
        >
          <BsArrowLeft /> Retour aux commandes
        </button>

        {/* Header Title Section */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1 className="figma-ad-product-title" style={{ margin: 0, fontSize: '28px' }}>Détails de la commande</h1>
            <p style={{ margin: 0, color: '#64748B', fontWeight: 500 }}>🏷️ {sale.title}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ padding: '6px 16px', borderRadius: '99px', background: statusCfg.bg, color: statusCfg.color, fontSize: '13px', fontWeight: 700 }}>
              {statusCfg.label.toUpperCase()}
            </span>
          </div>
        </header>

        <div className="figma-ad-grid" style={{ marginTop: '16px' }}>
          {/* Left Column */}
          <div className="figma-ad-left-col">
            
            {/* Product Card */}
            <div className="figma-ad-product-card">
              <div className="figma-ad-product-img-container">
                <img src={getImageUrl(sale.thumbs?.[0])} alt={sale.title} className="figma-ad-product-img" />
              </div>
              <div className="figma-ad-product-content">
                <h2 className="figma-ad-product-title">{sale.title}</h2>
                <span className="figma-ad-product-date">Publié le {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
              </div>
            </div>

            {/* Details Box */}
            <div className="figma-ad-details-box">
              <div className="figma-ad-proposal-header">
                <div className="figma-ad-proposal-amount-group">
                  <span className="figma-ad-label">TOTAL À PAYER</span>
                  <span className="figma-ad-amount">{(order.totalPrice || order.total || 0).toLocaleString('fr-FR')} Da</span>
                  <span className="figma-ad-proposal-date">Commande reçue le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="figma-ad-bidder-profile">
                  <span className="figma-ad-label">PROFIL DU {isOwner ? 'CLIENT' : 'VENDEUR'}</span>
                  <div className="figma-ad-bidder-info" style={{ alignItems: 'center', display: 'flex', gap: '16px', flexWrap: 'wrap', height: 'auto', padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '180px' }}>
                      <BidderAvatar user={counterparty} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="figma-ad-bidder-name" style={{ fontSize: '15px' }}>{cpName}</span>
                        {counterparty?.email && <span className="figma-ad-bidder-meta" style={{ fontSize: '12px' }}>✉️ {counterparty.email}</span>}
                        {counterparty?.phone && <span className="figma-ad-bidder-meta" style={{ fontSize: '12px' }}>📞 {counterparty.phone}</span>}
                      </div>
                    </div>
                    {cpId && (
                      <button 
                        onClick={() => router.push(`/dashboard/profile/${cpId}`)} 
                        style={{ padding: '8px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#191B24', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                      >
                        Consulter le profil
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Recap */}
              <div className="figma-ad-comment-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BsBoxSeam color="#0050CB" />
                  <span className="figma-ad-bidder-name">Détails de l'achat</span>
                </div>
                <div className="figma-ad-comment-box" style={{ fontStyle: 'normal' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>
                    <div>
                      <span className="figma-ad-label" style={{ fontSize: '11px', color: '#64748B' }}>PRIX UNITAIRE</span>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: '#191B24', display: 'block', marginTop: '4px' }}>{(sale.price || 0).toLocaleString('fr-FR')} DA</span>
                    </div>
                    <div>
                      <span className="figma-ad-label" style={{ fontSize: '11px', color: '#64748B' }}>QUANTITÉ COMMANDÉE</span>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: ACCENT, display: 'block', marginTop: '4px' }}>{order.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons if Pending */}
              {!isConfirmed && isOwner && (
                <div className="figma-ad-footer-actions" style={{ borderTop: '1px solid #F1F5F9', paddingTop: '24px', width: '100%' }}>
                  <button 
                    className="figma-ad-btn-accept" 
                    onClick={() => setConfirmDialog(true)}
                    style={{ background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                  >
                    Confirmer la commande
                  </button>
                </div>
              )}

              <div className="figma-ad-info-banner">
                <BsInfoCircle size={20} color="#0050CB" />
                <span>Cette commande est soumise aux conditions de vente directe de MazadClick.</span>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar Deck) */}
          <div className="figma-ad-right-col">
            <div className="figma-ad-side-card">
              <h3 className="figma-ad-side-title"><BsBarChart color="#0050CB" /> Statistiques de la vente</h3>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Prix de l'article</span>
                <span className="figma-ad-stat-value">{(sale.price || 0).toLocaleString('fr-FR')} DA</span>
              </div>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Stock disponible</span>
                <span className="figma-ad-stat-value figma-ad-stat-value-blue">{sale.quantity || 0}</span>
              </div>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Commandes reçues</span>
                <span className="figma-ad-stat-value">{allOrders.length}</span>
              </div>
              <div className="figma-ad-stat-row" style={{ borderBottom: 'none' }}>
                <span className="figma-ad-stat-label">Statut global</span>
                <span className="figma-ad-stat-value" style={{ color: sale.status === 'ACTIVE' ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                  {sale.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="figma-ad-side-card figma-ad-history-card-height">
              <h3 className="figma-ad-side-title"><BsClockHistory color="#0050CB" /> Historique ({allOrders.length})</h3>
              <div className="figma-ad-history-list">
                <div className="figma-ad-history-divider"></div>
                {allOrders.length > 0 ? (
                  allOrders.map((o: any, idx) => {
                    const isCurrent = o._id === orderId;
                    return (
                      <div key={o._id} className="figma-ad-history-item">
                        <div className={`figma-ad-history-dot ${isCurrent ? 'figma-ad-history-dot-active' : ''}`}></div>
                        <div className="figma-ad-history-header">
                          <span className="figma-ad-history-name" style={{ color: isCurrent ? '#002896' : '#475569', fontWeight: isCurrent ? 700 : 500 }}>
                            {getDisplayName(o.buyer)}
                          </span>
                          <span className="figma-ad-history-price" style={{ color: isCurrent ? '#002896' : '#64748B', fontWeight: 600 }}>
                            {(o.totalPrice || o.total || 0).toLocaleString('fr-FR')} Da
                          </span>
                        </div>
                        <span className="figma-ad-history-date">
                          {new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '14px' }}>
                    Aucune commande enregistrée
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #F1F5F9', boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '12px', padding: '24px', width: '100%', marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#191B24' }}>Toutes les commandes ({allOrders.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['Client', 'Quantité', 'Total', 'Date', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allOrders.map((o: any, i: number) => {
                  const isCurrent = o._id === orderId;
                  const buyer = o.buyer;
                  const bName = formatUserName(buyer);
                  const stCfg = orderStatusCfg(o.status);
                  return (
                    <tr key={o._id || i} style={{ background: isCurrent ? 'rgba(0, 80, 203, 0.04)' : undefined, borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px' }}>
                        {buyer?._id ? (
                          <Link href={`/dashboard/profile/${buyer._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isCurrent ? 'rgba(0, 80, 203, 0.1)' : '#F1F5F9', color: isCurrent ? '#0050CB' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>
                              {bName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: isCurrent ? 600 : 500, color: '#191B24', fontSize: '14px' }}>
                              {bName}
                              {isCurrent && <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 6, background: '#0050CB', color: '#fff', fontSize: '10px', fontWeight: 600 }}>Cette commande</span>}
                            </span>
                          </Link>
                        ) : <span style={{ color: '#94a3b8' }}>Inconnu</span>}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 500, color: '#191B24', fontSize: '14px' }}>{o.quantity}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#0050CB', fontSize: '14px' }}>{(o.totalPrice || o.total || 0).toLocaleString('fr-FR')} DA</td>
                      <td style={{ padding: '12px', color: '#64748B', fontSize: '14px' }}>{fmtDate(o.createdAt)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '6px', background: stCfg.bg, color: stCfg.color, fontSize: '12px', fontWeight: 600 }}>{stCfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog}
        title="Confirmer la commande"
        message={`Confirmer la commande de "${cpName}" pour un total de ${(order.totalPrice || order.total || 0).toLocaleString('fr-FR')} DA ?`}
        confirmLabel={processing ? '…' : 'Confirmer'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog(false)}
      />
    </div>
  );
}
