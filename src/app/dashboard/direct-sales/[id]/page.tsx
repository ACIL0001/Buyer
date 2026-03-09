'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import { DashboardKeyframes, StatusBadge, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';

const ACCENT = 'var(--primary-ds-color)';
const ACCENT_80 = 'color-mix(in srgb, var(--primary-ds-color) 80%, transparent)'; // cc in hex
const ACCENT_25 = 'color-mix(in srgb, var(--primary-ds-color) 25%, transparent)'; // 40 in hex
const ACCENT_10 = 'color-mix(in srgb, var(--primary-ds-color) 10%, transparent)'; // 18 in hex

function saleStatusCfg(s: string) {
  const m: Record<string, any> = {
    ACTIVE: { label: 'Actif', color: '#16a34a', bg: '#dcfce7', dot: true },
    SOLD_OUT: { label: 'Épuisé', color: '#dc2626', bg: '#fee2e2' },
    INACTIVE: { label: 'Inactif', color: '#d97706', bg: '#fef3c7' },
    SOLD: { label: 'Vendu', color: '#0284c7', bg: '#e0f2fe' },
  };
  return m[s] || { label: s, color: '#64748b', bg: '#f1f5f9' };
}


function fmtDate(d: any) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 };

export default function DirectSaleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const { isLogged } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    if (!socket || !id) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['direct-sale', id] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, id, queryClient]);

  const { data: sale, isLoading: loading } = useQuery({
    queryKey: ['direct-sale', id],
    queryFn: async () => {
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      const r = await DirectSaleAPI.getDirectSaleById(id);
      return r.data || r;
    },
    enabled: isLogged && !!id,
    staleTime: 60000,
  });

  if (loading) return <DetailPageSkeleton accentColor="var(--primary-ds-color)" />;

  if (!sale) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🛍️</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>Vente directe non trouvée</p>
      <button onClick={() => router.push('/dashboard/direct-sales')} style={{ marginTop: 16, padding: '10px 22px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
    </div>
  );

  const category = typeof sale.productCategory === 'object' ? sale.productCategory?.name : sale.productCategory;
  const subCategory = typeof sale.productSubCategory === 'object' ? sale.productSubCategory?.name : sale.productSubCategory;
  const avail = sale.quantity === 0 ? '∞ Illimité' : Math.max(0, (sale.quantity || 0) - (sale.soldQuantity || 0));
  const stockPct = sale.quantity > 0 ? Math.round(((sale.soldQuantity || 0) / sale.quantity) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <DashboardKeyframes />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_80})`, borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: `0 8px 32px ${ACCENT_25}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push('/dashboard/direct-sales')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14 }}>← Retour aux ventes</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 800, margin: 0 }}>{sale.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: '6px 0 0' }}>🛍️ Vente directe</p>
            </div>
            <StatusBadge config={saleStatusCfg(sale.status)} />
          </div>
        </div>
      </div>

      {/* Metric tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Prix unitaire', value: `${(sale.price || 0).toLocaleString('fr-FR')} DA`, color: ACCENT, icon: '💰' },
          { label: 'Stock disponible', value: avail, color: sale.quantity > 0 && (avail as number) === 0 ? '#ef4444' : '#10b981', icon: '📦' },
          { label: 'Vendus', value: sale.soldQuantity || 0, color: '#0284c7', icon: '✅' },
        ].map(t => (
          <div key={t.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${t.color}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: t.color.startsWith('var(') ? ACCENT_10 : `${t.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.icon}</div>
            <div>
              <div style={{ fontSize: typeof t.value === 'number' ? '1.6rem' : '1rem', fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Description — full width */}
      <div style={card}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📝 Description</h3>
        <p style={{ color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{sale.description || 'Aucune description.'}</p>
        {sale.quantity > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
              <span>Stock vendu</span><span>{sale.soldQuantity || 0} / {sale.quantity}</span>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 8, background: stockPct >= 80 ? '#ef4444' : ACCENT, width: `${stockPct}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* Info cards — 3-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {/* Categories */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>🏷️ Catégories</h3>
          {[
            { label: 'Catégorie principale', value: category || 'N/A' },
            ...(subCategory ? [{ label: 'Sous-catégorie', value: subCategory }] : []),
            { label: 'Type vendeur', value: sale.isPro ? '🏢 Professionnel' : '👤 Particulier' },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{r.label}</div>
              <span style={{ padding: '3px 10px', borderRadius: 12, background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Location */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📍 Localisation</h3>
          {[
            { label: 'Wilaya', value: sale.wilaya },
            { label: 'Lieu', value: sale.place || sale.location || 'N/A' },
            ...(sale.contactNumber ? [{ label: 'Contact', value: sale.contactNumber }] : []),
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontWeight: 600, color: '#334155' }}>{r.value || 'N/A'}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📅 Chronologie</h3>
          {[{ label: 'Créé le', value: fmtDate(sale.createdAt) }, { label: 'Mis à jour', value: fmtDate(sale.updatedAt) }].map(r => (
            <div key={r.label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.88rem' }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
