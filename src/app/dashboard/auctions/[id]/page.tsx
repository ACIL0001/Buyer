'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import { DashboardKeyframes, StatusBadge, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';

const ACCENT = '#0063b1';

enum BID_STATUS { OPEN = 'OPEN', CLOSED = 'CLOSED', ON_AUCTION = 'ACCEPTED', ARCHIVED = 'ARCHIVED' }
enum AUCTION_TYPE { CLASSIC = 'CLASSIC', EXPRESS = 'EXPRESS', AUTO_SUB_BID = 'AUTO_SUB_BID' }

function statusCfg(s: string) {
  const map: Record<string, any> = {
    OPEN:     { label: 'Ouvert',   color: '#0284c7', bg: '#e0f2fe', dot: true },
    ACCEPTED: { label: 'En cours', color: '#16a34a', bg: '#dcfce7', dot: true },
    CLOSED:   { label: 'Clôturé', color: '#dc2626', bg: '#fee2e2' },
    ARCHIVED: { label: 'Archivé', color: '#64748b', bg: '#f1f5f9' },
  };
  return map[s] || { label: s, color: '#64748b', bg: '#f1f5f9' };
}

function fmtDate(d: any) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtPrice(n: number) { return `${(n || 0).toLocaleString('fr-FR')} DA`; }

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 };

export default function AuctionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { auth, isLogged } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    if (!socket || !id) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['auction', id] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, id, queryClient]);

  const { data: auction, isLoading: loading } = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      const { AuctionsAPI } = await import('@/services/auctions');
      const r = await AuctionsAPI.getAuctionById(id);
      return r.data || r;
    },
    enabled: isLogged && !!id,
    staleTime: 60000,
  });

  if (loading) return <DetailPageSkeleton accentColor="#0063b1" />;

  if (!auction) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🏷️</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>Enchère non trouvée</p>
      <button onClick={() => router.push('/dashboard/auctions')} style={{ marginTop: 16, padding: '10px 22px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
    </div>
  );

  const auctionWinnerId = typeof auction.winner === 'object' ? auction.winner?._id : auction.winner;
  const isWinner = (u: any) => {
    const uId = typeof u === 'object' ? u?._id : u;
    return auctionWinnerId && uId && auctionWinnerId === uId;
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <DashboardKeyframes />
      {/* Winner Banner */}
      {auction.winner && typeof auction.winner === 'object' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderRadius: 14, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', color: '#fff', marginBottom: 20, boxShadow: '0 8px 24px rgba(245,158,11,0.3)' }}>
          <span style={{ fontSize: 36 }}>🏆</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.04em' }}>GAGNANT</div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{auction.winner.firstName} {auction.winner.lastName}</div>
            {auction.winner.phone && <div style={{ opacity: 0.85, fontSize: '0.875rem' }}>📞 {auction.winner.phone}</div>}
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`, borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: `0 8px 32px ${ACCENT}40`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push('/dashboard/auctions')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14 }}>← Retour aux enchères</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{auction.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: '6px 0 0' }}>🏷️ Détails de l'enchère</p>
            </div>
            <StatusBadge config={statusCfg(auction.status)} />
          </div>
        </div>
      </div>

      {/* Metric tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Prix de départ', value: fmtPrice(auction.startingPrice), color: '#64748b', icon: '💰' },
          { label: 'Prix actuel', value: fmtPrice(auction.currentPrice || auction.startingPrice), color: '#10b981', icon: '📈' },
          { label: 'Offres estimées', value: (auction as any).offersCount || (auction as any).offers?.length || 'N/A', color: ACCENT, icon: '👥' },
        ].map(t => (
          <div key={t.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${t.color}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${t.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.icon}</div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
        {/* Left: Description */}
        <div style={{ ...card, gridColumn: 'span 2' } as any}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📝 Description</h3>
          <p style={{ color: '#475569', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{auction.description || 'Aucune description fournie.'}</p>
        </div>

        {/* Info card */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>ℹ️ Informations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Type</div>
              <span style={{ padding: '3px 10px', borderRadius: 12, background: '#f1f5f9', color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>{auction.bidType === 'PRODUCT' ? '📦 Produit' : '🔧 Service'}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Mode</div>
              <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600, background: auction.auctionType === 'EXPRESS' ? '#fef3c7' : '#f1f5f9', color: auction.auctionType === 'EXPRESS' ? '#d97706' : '#475569' }}>
                {auction.auctionType === 'EXPRESS' ? '⚡ Express' : auction.auctionType === 'AUTO_SUB_BID' ? '🤖 Auto' : '🏛️ Classique'}
              </span>
            </div>
            {auction.contactNumber && (
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Contact</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>📞 {auction.contactNumber}</div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline card */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📅 Chronologie</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[{ label: 'Début', value: fmtDate(auction.startingAt) }, { label: 'Fin', value: fmtDate(auction.endingAt) }].map(r => (
              <div key={r.label}>
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
