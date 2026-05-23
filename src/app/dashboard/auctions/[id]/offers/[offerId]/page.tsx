'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuctionsAPI } from '@/services/auctions';
import { OffersAPI } from '@/services/offers';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { DashboardKeyframes, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';
import { formatUserName } from '@/utils/user';
import { normalizeImageUrl } from '@/utils/url';
import { BsArrowLeft, BsBarChart, BsClockHistory, BsChatSquareQuote, BsInfoCircle } from 'react-icons/bs';
import '../../auction-details-styles.css';

function fmtDate(d: any) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
      <p>Offre ou enchère introuvable</p>
      <button onClick={() => router.back()}>Retour</button>
    </div>
  );

  const auctionWinnerId = typeof auction.winner === 'object' ? auction.winner?._id : auction.winner;
  const offerUserId = typeof offer.user === 'object' ? offer.user?._id : offer.user;
  const isWinner = auctionWinnerId && offerUserId && auctionWinnerId === offerUserId;
  const isClosed = auction.status === 'CLOSED' || auction.status === 'ACCEPTED';
  const offerUser = offer.user || {};
  const displayName = formatUserName(offerUser);
  const views = auction.viewsCount || 0;

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
          onClick={() => router.push(`/dashboard/auctions/${auctionId}`)}
        >
          <BsArrowLeft /> Retour à l'enchère
        </button>

        {/* Header Title Section */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1 className="figma-ad-product-title" style={{ margin: 0, fontSize: '28px' }}>Détails de la mise</h1>
            <p style={{ margin: 0, color: '#64748B', fontWeight: 500 }}>🏷️ {auction.title}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isWinner && <span style={{ padding: '6px 16px', borderRadius: '99px', background: '#FEF3C7', color: '#D97706', fontSize: '13px', fontWeight: 700 }}>🏆 GAGNANT</span>}
            <span style={{ padding: '6px 16px', borderRadius: '99px', background: isClosed ? '#FEE2E2' : '#DCFCE7', color: isClosed ? '#DC2626' : '#16A34A', fontSize: '13px', fontWeight: 700 }}>
              {isClosed ? 'CLÔTURÉE' : 'EN COURS'}
            </span>
          </div>
        </header>

        <div className="figma-ad-grid" style={{ marginTop: '16px' }}>
          {/* Left Column */}
          <div className="figma-ad-left-col">
            
            {/* Product Card */}
            <div className="figma-ad-product-card">
              <div className="figma-ad-product-img-container">
                <img src={getImageUrl(auction.thumbs?.[0])} alt={auction.title} className="figma-ad-product-img" />
              </div>
              <div className="figma-ad-product-content">
                <h2 className="figma-ad-product-title">{auction.title}</h2>
                <span className="figma-ad-product-date">Publié le {auction.createdAt ? new Date(auction.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
              </div>
            </div>

            {/* Details Box */}
            <div className="figma-ad-details-box">
              <div className="figma-ad-proposal-header">
                <div className="figma-ad-proposal-amount-group">
                  <span className="figma-ad-label">MONTANT PROPOSÉ</span>
                  <span className="figma-ad-amount">{(offer.price || 0).toLocaleString('fr-FR')} Da</span>
                  <span className="figma-ad-proposal-date">Enchère reçue le {new Date(offer.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(offer.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="figma-ad-bidder-profile">
                  <span className="figma-ad-label">ENCHÉRISSEUR</span>
                  <div className="figma-ad-bidder-info" style={{ alignItems: 'center', display: 'flex', gap: '16px', flexWrap: 'wrap', height: 'auto', padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '180px' }}>
                      <BidderAvatar user={offerUser} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="figma-ad-bidder-name" style={{ fontSize: '15px' }}>{displayName}</span>
                        {offerUser.email && <span className="figma-ad-bidder-meta" style={{ fontSize: '12px' }}>✉️ {offerUser.email}</span>}
                        {offerUser.phone && <span className="figma-ad-bidder-meta" style={{ fontSize: '12px' }}>📞 {offerUser.phone}</span>}
                      </div>
                    </div>
                    {offerUser._id && (
                      <button 
                        onClick={() => router.push(`/dashboard/profile/${offerUser._id}`)} 
                        style={{ padding: '8px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#191B24', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                      >
                        Consulter le profil
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Description box */}
              <div className="figma-ad-comment-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BsChatSquareQuote color="#0050CB" />
                  <span className="figma-ad-bidder-name">Description de l'enchère</span>
                </div>
                <div className="figma-ad-comment-box" style={{ whiteSpace: 'pre-wrap', width: '100%' }}>
                  {auction.description || "Aucune description supplémentaire."}
                </div>
              </div>

              <div className="figma-ad-info-banner">
                <BsInfoCircle size={20} color="#0050CB" />
                <span>En participant à cette enchère, vous acceptez les conditions de vente de MazadClick.</span>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar Deck) */}
          <div className="figma-ad-right-col">
            <div className="figma-ad-side-card">
              <h3 className="figma-ad-side-title"><BsBarChart color="#0050CB" /> Statistiques de l'enchère</h3>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Prix de départ</span>
                <span className="figma-ad-stat-value">{(auction.startingPrice || 0).toLocaleString('fr-FR')} DA</span>
              </div>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Meilleure offre</span>
                <span className="figma-ad-stat-value figma-ad-stat-value-blue">
                  {((participants[0]?.price) || auction.startingPrice || 0).toLocaleString('fr-FR')} DA
                </span>
              </div>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Date limite</span>
                <span className="figma-ad-stat-value">{auction.endingAt ? new Date(auction.endingAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
              </div>
              <div className="figma-ad-stat-row" style={{ borderBottom: 'none' }}>
                <span className="figma-ad-stat-label">Vues</span>
                <span className="figma-ad-stat-value">{views}</span>
              </div>
            </div>

            <div className="figma-ad-side-card figma-ad-history-card-height">
              <h3 className="figma-ad-side-title"><BsClockHistory color="#0050CB" /> Historique ({participants.length})</h3>
              <div className="figma-ad-history-list">
                <div className="figma-ad-history-divider"></div>
                {participants.length > 0 ? (
                  participants.slice(0, 5).map((p: any, idx) => {
                    const isCurrent = p._id === offerId;
                    return (
                      <div key={p._id} className="figma-ad-history-item">
                        <div className={`figma-ad-history-dot ${isCurrent ? 'figma-ad-history-dot-active' : ''}`}></div>
                        <div className="figma-ad-history-header">
                          <span className="figma-ad-history-name" style={{ color: isCurrent ? '#002896' : '#475569', fontWeight: isCurrent ? 700 : 500 }}>
                            {getDisplayName(p.user)}
                          </span>
                          <span className="figma-ad-history-price" style={{ color: isCurrent ? '#002896' : '#64748B', fontWeight: 600 }}>
                            {(p.price || 0).toLocaleString('fr-FR')} Da
                          </span>
                        </div>
                        <span className="figma-ad-history-date">
                          {new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, {new Date(p.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '14px' }}>
                    Aucune offre enregistrée
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #F1F5F9', boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '12px', padding: '24px', width: '100%', marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#191B24' }}>Tous les participants ({participants.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['Participant', 'Montant', 'Date', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((p: any, i: number) => {
                  const isCurrent = p._id === offerId;
                  const pUserId = typeof p.user === 'object' ? p.user?._id : p.user;
                  const isWinnerP = auctionWinnerId && pUserId && auctionWinnerId === pUserId;
                  const pName = formatUserName(p.user);
                  return (
                    <tr key={p._id || i} style={{ background: isCurrent ? 'rgba(0, 80, 203, 0.04)' : undefined, borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px' }}>
                        <Link href={`/dashboard/profile/${p.user?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: isCurrent ? 'rgba(0, 80, 203, 0.1)' : '#F1F5F9', color: isCurrent ? '#0050CB' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>
                            {pName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: isCurrent ? 600 : 500, color: '#191B24', fontSize: '14px' }}>
                            {pName}
                            {isCurrent && <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 6, background: '#0050CB', color: '#fff', fontSize: '10px', fontWeight: 600 }}>Cette offre</span>}
                          </span>
                        </Link>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#0050CB', fontSize: '14px' }}>{(p.price || p.bidAmount || 0).toLocaleString('fr-FR')} DA</td>
                      <td style={{ padding: '12px', color: '#64748B', fontSize: '14px' }}>{fmtDate(p.createdAt)}</td>
                      <td style={{ padding: '12px' }}>
                        {isWinnerP ? (
                          <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#DCFCE7', color: '#16A34A', fontWeight: 600, fontSize: '12px' }}>🏆 Gagnant</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '14px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
