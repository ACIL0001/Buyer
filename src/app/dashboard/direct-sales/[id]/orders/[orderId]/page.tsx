'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DirectSaleAPI } from '@/services/direct-sale';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { normalizeImageUrl } from '@/utils/url';
import { DashboardKeyframes, StatusBadge, tableStyles, ConfirmDialog, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';

const ACCENT = '#d97706';

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

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 };

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
    try { await DirectSaleAPI.confirmPurchase(orderId); enqueueSnackbar('Commande confirmée', { variant: 'success' }); await refetch(); }
    catch { enqueueSnackbar('Erreur', { variant: 'error' }); }
    finally { setProcessing(false); setConfirmDialog(false); }
  };

  if (loading) return <DetailPageSkeleton accentColor="#d97706" />;

  const sale = data?.sale;
  const order = data?.order;
  const allOrders = data?.allOrders || [];


  if (!sale || !order) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>Commande ou vente introuvable</p>
      <button onClick={() => router.back()} style={{ marginTop: 16, padding: '10px 22px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
    </div>
  );

  const saleOwnerId = typeof sale.owner === 'object' ? sale.owner?._id : sale.owner;
  const isOwner = saleOwnerId == auth?.user?._id;
  const isConfirmed = order.status === 'CONFIRMED' || order.status === 'COMPLETED';
  const counterparty = isOwner ? (order.buyer) : (order.seller || sale.owner);
  const cpId = typeof counterparty === 'object' ? counterparty?._id : counterparty;
  const cpName = counterparty?.companyName || counterparty?.entreprise || `${counterparty?.firstName || ''} ${counterparty?.lastName || ''}`.trim() || 'N/A';

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <DashboardKeyframes />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`, borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: `0 8px 32px ${ACCENT}40`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push('/dashboard/direct-sales/orders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14 }}>← Retour aux commandes</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.1rem, 3vw, 1.6rem)', fontWeight: 800, margin: 0 }}>Détails de la commande</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: '6px 0 0' }}>📦 {sale.title}</p>
            </div>
            <StatusBadge config={orderStatusCfg(order.status)} />
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${ACCENT}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${ACCENT}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📦</div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{order.quantity}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Quantité commandée</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#10b98118', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>💰</div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{(order.totalPrice || order.total || 0).toLocaleString('fr-FR')}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Total DA</div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
        <div>
          {/* Date & unit price */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📊 Récapitulatif</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Prix unitaire', value: `${(sale.price || 0).toLocaleString('fr-FR')} DA`, color: '#334155' },
                { label: 'Quantité', value: order.quantity, color: '#334155' },
                { label: 'Date de commande', value: fmtDate(order.createdAt), color: '#334155' },
                { label: 'Total', value: `${(order.totalPrice || order.total || 0).toLocaleString('fr-FR')} DA`, color: '#10b981' },
              ].map(r => (
                <div key={r.label} style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontWeight: 700, color: r.color }}>{r.value}</div>
                </div>
              ))}
            </div>

            {!isConfirmed && isOwner && (
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmDialog(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                  ✅ Confirmer la commande
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Counterparty */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>👤 {isOwner ? 'Acheteur' : 'Vendeur'}</h3>
            {counterparty && cpId ? (
              <Link href={`/profile/${cpId}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${ACCENT}20`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', border: `2px solid ${ACCENT}30`, flexShrink: 0 }}>{cpName.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{cpName}</div>
                  {(counterparty as any).email && <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 2 }}>{(counterparty as any).email}</div>}
                  {(counterparty as any).phone && <div style={{ marginTop: 6 }}><span style={{ padding: '2px 8px', borderRadius: 8, background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>📞 {(counterparty as any).phone}</span></div>}
                </div>
              </Link>
            ) : (
              <div style={{ color: '#94a3b8' }}>Informations non disponibles</div>
            )}
          </div>

          {/* Product info */}
          <div style={{ ...card, background: `linear-gradient(135deg, ${ACCENT}08, #fff)` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>🛍️ Produit</h3>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Nom du produit</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{sale.title}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Prix unitaire</div>
              <div style={{ fontWeight: 800, color: ACCENT, fontSize: '1.1rem' }}>{(sale.price || 0).toLocaleString('fr-FR')} DA</div>
            </div>
            <button onClick={() => router.push(`/dashboard/direct-sales/${directSaleId}`)} style={{ width: '100%', padding: 10, borderRadius: 10, border: `1.5px solid ${ACCENT}`, background: 'transparent', color: ACCENT, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              Voir la fiche produit →
            </button>
          </div>
        </div>
      </div>

      {/* All orders table */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📦 Toutes les commandes ({allOrders.length})</h3>
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Acheteur', 'Quantité', 'Total', 'Date', 'Statut'].map(h => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {allOrders.map((o: any, i: number) => {
              const isCurrent = o._id === orderId;
              const buyer = o.buyer;
              const bName = buyer?.companyName || `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim() || 'N/A';
              return (
                <tr key={o._id || i} className="db-row" style={{ ...tableStyles.trHover, background: isCurrent ? `${ACCENT}06` : undefined }}>
                  <td style={tableStyles.td}>
                    {buyer?._id ? (
                      <Link href={`/profile/${buyer._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: isCurrent ? `${ACCENT}20` : '#f1f5f9', color: isCurrent ? ACCENT : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{bName.charAt(0).toUpperCase()}</div>
                        <span style={{ fontWeight: isCurrent ? 700 : 500, color: '#1e293b' }}>
                          {bName}
                          {isCurrent && <span style={{ marginLeft: 8, padding: '1px 7px', borderRadius: 8, background: ACCENT, color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}>Cette commande</span>}
                        </span>
                      </Link>
                    ) : <span style={{ color: '#94a3b8' }}>Inconnu</span>}
                  </td>
                  <td style={{ ...tableStyles.td, textAlign: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#f1f5f9', fontWeight: 700, fontSize: '0.8rem' }}>{o.quantity}</span>
                  </td>
                  <td style={tableStyles.td}><span style={{ fontWeight: 700, color: ACCENT }}>{(o.totalPrice || o.total || 0).toLocaleString('fr-FR')} DA</span></td>
                  <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem' }}>{fmtDate(o.createdAt)}</td>
                  <td style={tableStyles.td}><StatusBadge config={orderStatusCfg(o.status)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
