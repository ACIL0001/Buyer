'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuctionsAPI } from '@/services/auctions';
import { OffersAPI } from '@/services/offers';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { DashboardKeyframes, StatusBadge, tableStyles, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';

const ACCENT = 'var(--primary-auction-color)';

function fmtDate(d: any) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 };

export default function AuctionOfferDetailPage() {
  const params = useParams();
  const auctionId = params?.id as string;
  const offerId = params?.offerId as string;
  const router = useRouter();
  const { auth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    if (!socket || !auctionId) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['auction-offer', auctionId, offerId] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, auctionId, offerId, queryClient]);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['auction-offer', auctionId, offerId],
    queryFn: async () => {
      const [ar, offR] = await Promise.all([
        AuctionsAPI.getAuctionById(auctionId),
        OffersAPI.getOffersByBidId(auctionId),
      ]);
      const auctionData = ar.data || ar;
      const offersData = offR?.data && Array.isArray(offR.data) ? offR.data : Array.isArray(offR) ? offR : [];
      const participants = offersData.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
      const specific = offersData.find((o: any) => o._id === offerId);
      return { auction: auctionData, offer: specific, participants };
    },
    enabled: !!auctionId && !!offerId,
    staleTime: 60000,
  });

  if (loading) return <DetailPageSkeleton accentColor="var(--primary-auction-color)" />;

  const auction = data?.auction;
  const offer = data?.offer;
  const participants = data?.participants || [];

  if (!auction || !offer) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>Offre ou enchère introuvable</p>
      <button onClick={() => router.back()} style={{ marginTop: 16, padding: '10px 22px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
    </div>
  );

  const auctionWinnerId = typeof auction.winner === 'object' ? auction.winner?._id : auction.winner;
  const offerUserId = typeof offer.user === 'object' ? offer.user?._id : offer.user;
  const isWinner = auctionWinnerId && offerUserId && auctionWinnerId === offerUserId;
  const isClosed = auction.status === 'CLOSED' || auction.status === 'ACCEPTED';
  const offerUser = offer.user || {};
  const displayName = offerUser.companyName || offerUser.entreprise || `${offerUser.firstName || ''} ${offerUser.lastName || ''}`.trim() || 'N/A';

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <DashboardKeyframes />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`, borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: `0 8px 32px ${ACCENT}40`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push(`/dashboard/auctions/${auctionId}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14 }}>← Retour à l'enchère</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.1rem, 3vw, 1.6rem)', fontWeight: 800, margin: 0 }}>Détails de la mise</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: '6px 0 0' }}>🏷️ {auction.title}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {isWinner && <span style={{ padding: '4px 12px', borderRadius: 20, background: '#fbbf24', color: '#7c3300', fontSize: '0.78rem', fontWeight: 700 }}>🏆 GAGNANT</span>}
              <span style={{ padding: '4px 12px', borderRadius: 20, background: isClosed ? '#dc262620' : '#16a34a20', color: isClosed ? '#dc2626' : '#16a34a', fontSize: '0.78rem', fontWeight: 700, border: `1.5px solid ${isClosed ? '#dc262640' : '#16a34a40'}` }}>{isClosed ? 'CLÔTURÉE' : 'EN COURS'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 20, alignItems: 'start', marginBottom: 20 }}>
        {/* Left: Offer amount + date */}
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montant de la mise</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 14, background: `${ACCENT}08`, border: `1.5px solid ${ACCENT}20` }}>
              <span style={{ fontSize: 40 }}>🏷️</span>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{(offer.price || 0).toLocaleString('fr-FR')}</div>
                <div style={{ color: '#64748b', fontWeight: 600, marginTop: 4 }}>DA</div>
              </div>
            </div>
            {/* Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              {[
                { label: 'Prix de départ', value: `${(auction.startingPrice || 0).toLocaleString('fr-FR')} DA`, color: '#64748b' },
                { label: 'Prix actuel', value: `${(auction.currentPrice || auction.startingPrice || 0).toLocaleString('fr-FR')} DA`, color: '#10b981' },
              ].map(r => (
                <div key={r.label} style={{ padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</div>
                  <div style={{ fontWeight: 700, color: r.color, marginTop: 4 }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📅</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date de la mise</div>
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem', marginTop: 2 }}>{fmtDate(offer.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Right: Bidder + Auction info */}
        <div>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>👤 Enchérisseur</h3>
            <Link href={`/profile/${offerUser._id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${ACCENT}20`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', border: `2px solid ${ACCENT}30`, flexShrink: 0 }}>{displayName.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{displayName}</div>
                {offerUser.email && <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 2 }}>{offerUser.email}</div>}
                {offerUser.phone && <div style={{ marginTop: 4 }}><span style={{ padding: '2px 8px', borderRadius: 8, background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>📞 {offerUser.phone}</span></div>}
              </div>
            </Link>
          </div>

          <div style={{ ...card, background: `linear-gradient(135deg, ${ACCENT}08, #fff)` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>🏷️ Info Enchère</h3>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Titre</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{auction.title}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Prix actuel</div>
              <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>{(auction.currentPrice || auction.startingPrice || 0).toLocaleString('fr-FR')} DA</div>
            </div>
            <button onClick={() => router.push(`/dashboard/auctions/${auctionId}`)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1.5px solid ${ACCENT}`, background: 'transparent', color: ACCENT, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              Voir l'enchère complète →
            </button>
          </div>
        </div>
      </div>

      {/* Participants table */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>👥 Tous les participants ({participants.length})</h3>
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Participant', 'Montant', 'Date', 'Statut'].map(h => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {participants.map((p: any, i: number) => {
              const isCurrent = p._id === offerId;
              const pUserId = typeof p.user === 'object' ? p.user?._id : p.user;
              const isWinnerP = auctionWinnerId && pUserId && auctionWinnerId === pUserId;
              const pName = p.user?.companyName || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() || 'N/A';
              return (
                <tr key={p._id || i} className="db-row" style={{ ...tableStyles.trHover, background: isCurrent ? `${ACCENT}06` : undefined }}>
                  <td style={tableStyles.td}>
                    <Link href={`/profile/${p.user?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: isCurrent ? `${ACCENT}20` : '#f1f5f9', color: isCurrent ? ACCENT : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{pName.charAt(0).toUpperCase()}</div>
                      <div>
                        <span style={{ fontWeight: isCurrent ? 700 : 500, color: '#1e293b' }}>{pName}</span>
                        {isCurrent && <span style={{ marginLeft: 8, padding: '1px 7px', borderRadius: 8, background: ACCENT, color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}>Cette offre</span>}
                      </div>
                    </Link>
                  </td>
                  <td style={tableStyles.td}><span style={{ fontWeight: 700, color: '#10b981' }}>{(p.price || p.bidAmount || 0).toLocaleString('fr-FR')} DA</span></td>
                  <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem' }}>{fmtDate(p.createdAt)}</td>
                  <td style={tableStyles.td}>
                    {isWinnerP ? <span style={{ padding: '3px 10px', borderRadius: 12, background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.76rem' }}>🏆 Gagnant</span>
                      : <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
