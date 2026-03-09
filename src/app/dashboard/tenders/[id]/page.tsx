'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import { DashboardKeyframes, StatusBadge, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';

const ACCENT = 'var(--primary-tender-color)';
const ACCENT_80 = 'color-mix(in srgb, var(--primary-tender-color) 80%, transparent)'; // cc in hex
const ACCENT_25 = 'color-mix(in srgb, var(--primary-tender-color) 25%, transparent)'; // 40 in hex
const ACCENT_10 = 'color-mix(in srgb, var(--primary-tender-color) 10%, transparent)'; // 18 in hex

function statusCfg(s: string) {
  const map: Record<string, any> = {
    OPEN: { label: 'Ouvert', color: '#0284c7', bg: '#e0f2fe', dot: true },
    AWARDED: { label: 'Attribué', color: '#16a34a', bg: '#dcfce7' },
    CLOSED: { label: 'Clôturé', color: '#d97706', bg: '#fef3c7' },
    CANCELLED: { label: 'Annulé', color: '#dc2626', bg: '#fee2e2' },
    ARCHIVED: { label: 'Archivé', color: '#64748b', bg: '#f1f5f9' },
  };
  return map[s] || { label: s, color: '#64748b', bg: '#f1f5f9' };
}


function fmtDate(d: any) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeRemaining(endAt: string) {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return 'Terminé';
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}j ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 };

export default function TenderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();


  const { isLogged } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    if (!socket || !id) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['tender', id] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, id, queryClient]);

  const { data: tender, isLoading: loading } = useQuery({
    queryKey: ['tender', id],
    queryFn: async () => {
      const { TendersAPI } = await import('@/services/tenders');
      const r = await TendersAPI.getTenderById(id);
      return r.data || r;
    },
    enabled: isLogged && !!id,
    staleTime: 60000,
  });

  if (loading) return <DetailPageSkeleton accentColor="var(--primary-tender-color)" />;

  if (!tender) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>📄</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>Appel d'offres non trouvé</p>
      <button onClick={() => router.push('/dashboard/tenders')} style={{ marginTop: 16, padding: '10px 22px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
    </div>
  );

  const evalType = tender.evaluationType || 'MOINS_DISANT';
  const category = typeof tender.category === 'object' ? tender.category?.name : tender.category;
  const budget = tender.maxBudget || tender.budget || 0;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <DashboardKeyframes />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_80})`, borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: `0 8px 32px ${ACCENT_25}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push('/dashboard/tenders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14 }}>← Retour</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 800, margin: 0 }}>{tender.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: '6px 0 0' }}>📄 Détails de l'appel d'offres</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {tender.status === 'OPEN' && tender.endingAt && (
                <span style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)' }}>⏱ {timeRemaining(tender.endingAt)}</span>
              )}
              <StatusBadge config={statusCfg(tender.status)} />
            </div>
          </div>
        </div>
      </div>

      {/* Metric tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Budget max.', value: budget > 0 ? `${budget.toLocaleString('fr-FR')} DA` : 'N/A', color: '#0284c7', icon: '💰' },
          { label: 'Évaluation', value: evalType === 'MIEUX_DISANT' ? 'Mieux Disant' : 'Moins Disant', color: evalType === 'MIEUX_DISANT' ? '#0284c7' : ACCENT, icon: evalType === 'MIEUX_DISANT' ? '✨' : '💰' },
        ].map(t => (
          <div key={t.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${t.color}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: t.color === ACCENT ? ACCENT_10 : `${t.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.icon}</div>
            <div>
              <div style={{ fontSize: typeof t.value === 'number' ? '1.6rem' : '0.95rem', fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📝 Description</h3>
            <p style={{ color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{tender.description || (tender as any).about || 'Aucune description.'}</p>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📋 Détails</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Date de début', value: fmtDate(tender.startingAt) },
                { label: 'Date de fin', value: fmtDate(tender.endingAt) },
                { label: 'Localisation', value: [tender.place || tender.location, tender.wilaya].filter(Boolean).join(', ') || 'N/A' },
                { label: 'Catégorie', value: category || 'N/A' },
                ...(tender.contactNumber ? [{ label: 'Contact', value: tender.contactNumber }] : []),
              ].map(r => (
                <div key={r.label}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ ...card, borderLeft: `4px solid ${evalType === 'MIEUX_DISANT' ? '#0284c7' : ACCENT}` }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Type d'évaluation</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: evalType === 'MIEUX_DISANT' ? '#e0f2fe' : '#dcfce7' }}>
              <span style={{ fontSize: 28 }}>{evalType === 'MIEUX_DISANT' ? '✨' : '💰'}</span>
              <div>
                <div style={{ fontWeight: 700, color: evalType === 'MIEUX_DISANT' ? '#0284c7' : ACCENT }}>{evalType === 'MIEUX_DISANT' ? 'Mieux Disant' : 'Moins Disant'}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{evalType === 'MIEUX_DISANT' ? 'Sélection sur la qualité' : 'Sélection sur le prix'}</div>
              </div>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📅 Chronologie</h3>
            {[{ label: 'Début', value: fmtDate(tender.startingAt) }, { label: 'Fin', value: fmtDate(tender.endingAt) }].map(r => (
              <div key={r.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
