'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import { DashboardKeyframes, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';
import { 
  BsChatSquareQuote, 
  BsInfoCircle, 
  BsCheckCircle, 
  BsXCircle, 
  BsBarChart, 
  BsClockHistory,
  BsArrowLeft
} from 'react-icons/bs';
import './auction-details-styles.css';
import { normalizeImageUrl } from '@/utils/url';

export default function AuctionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isLogged } = useAuth();
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

  if (loading) return <DetailPageSkeleton accentColor="var(--primary-auction-color)" />;

  if (!auction) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <p>Enchère non trouvée</p>
      <button onClick={() => router.push('/dashboard/auctions')}>Retour</button>
    </div>
  );

  const offers = auction.offers || [];
  const latestBid = offers[0];
  const views = auction.viewsCount || 0;

  const getDisplayName = (user: any) => {
    if (user?.companyName || user?.entreprise) {
      return user.companyName || user.entreprise;
    }
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.name || 'Utilisateur';
  };

  const getInitials = (user: any): string => {
    const name = getDisplayName(user);
    if (!name || name === 'Utilisateur') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Renders avatar image with initials fallback — never shows product image
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

  // Use the app's existing normalizeImageUrl utility — same as profile page
  const getImageUrl = (item: any): string => {
    if (!item) return '/assets/img/logo.png';
    const url = item.fullUrl || item.url;
    return normalizeImageUrl(url) || '/assets/img/logo.png';
  };

  const getAvatar = (user: any): string => {
    if (!user) return '/assets/img/logo.png';
    // Server now provides fullUrl after transformAttachment; fall back through other fields
    const url = user.avatar?.fullUrl || user.avatar?.url || user.profileImage?.url || user.photoURL;
    return normalizeImageUrl(url) || '/assets/img/logo.png';
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <DashboardKeyframes />
      <div className="figma-ad-main">
        {/* Left Column */}
        <div className="figma-ad-left-col">
          <button 
            onClick={() => router.push('/dashboard/auctions')}
            style={{ 
              background: 'none', border: 'none', color: '#64748B', display: 'flex', 
              alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '-8px',
              padding: 0, fontSize: '14px'
            }}
          >
            <BsArrowLeft /> Retour aux enchères
          </button>
          
          <div className="figma-ad-product-card">
            <div className="figma-ad-product-img-container">
              <img src={getImageUrl(auction.thumbs?.[0])} alt={auction.title} className="figma-ad-product-img" />
            </div>
            <div className="figma-ad-product-content">
              <h2 className="figma-ad-product-title">{auction.title}</h2>
              <span className="figma-ad-product-date">Publié le {auction.createdAt ? new Date(auction.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
            </div>
          </div>

          <div className="figma-ad-details-box">
            {latestBid ? (
              <div className="figma-ad-proposal-header">
                <div className="figma-ad-proposal-amount-group">
                  <span className="figma-ad-label">MONTANT PROPOSÉ</span>
                  <span className="figma-ad-amount">{latestBid.price.toLocaleString()} Da</span>
                  <span className="figma-ad-proposal-date">Enchère reçue le {new Date(latestBid.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(latestBid.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="figma-ad-bidder-profile">
                  <span className="figma-ad-label">PROFIL DE L’ENCHÉRISSEUR</span>
                  <div className="figma-ad-bidder-info">
                    <BidderAvatar user={latestBid.user} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="figma-ad-bidder-name">{getDisplayName(latestBid.user)}</span>
                      <span className="figma-ad-bidder-meta">Dernière activité : {new Date(latestBid.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="figma-ad-proposal-header" style={{ justifyContent: 'center', padding: '40px 0' }}>
                <span className="figma-ad-label">Aucune offre pour le moment</span>
              </div>
            )}

            <div className="figma-ad-comment-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BsChatSquareQuote />
                <span className="figma-ad-bidder-name">Détails de l'annonce</span>
              </div>
              <div className="figma-ad-comment-box" style={{ whiteSpace: 'pre-wrap' }}>
                {auction.description || "Aucune description supplémentaire."}
              </div>
            </div>

            <div className="figma-ad-info-banner">
              <BsInfoCircle size={20} color="#0050CB" />
              <span>{auction.status === 'OPEN' ? 'Cette enchère est actuellement en cours. Vous recevrez une notification à la fin de la période.' : 'Cette enchère est terminée.'}</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="figma-ad-right-col">
          <div className="figma-ad-side-card">
            <h3 className="figma-ad-side-title"><BsBarChart color="#0050CB" /> Statistiques de l’annonce</h3>
            <div className="figma-ad-stat-row">
              <span className="figma-ad-stat-label">Prix de départ</span>
              <span className="figma-ad-stat-value">{auction.startingPrice.toLocaleString()} Da</span>
            </div>
            <div className="figma-ad-stat-row">
              <span className="figma-ad-stat-label">Meilleure offre actuelle</span>
              <span className="figma-ad-stat-value figma-ad-stat-value-blue">{(auction.currentPrice || auction.startingPrice).toLocaleString()} Da</span>
            </div>
            <div className="figma-ad-stat-row">
              <span className="figma-ad-stat-label">Date de fin</span>
              <span className="figma-ad-stat-value">{new Date(auction.endingAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="figma-ad-stat-row" style={{ borderBottom: 'none' }}>
              <span className="figma-ad-stat-label">Vues</span>
              <span className="figma-ad-stat-value">{views}</span>
            </div>
          </div>

          <div className="figma-ad-side-card">
            <h3 className="figma-ad-side-title"><BsClockHistory color="#0050CB" /> Historique des offres ({offers.length})</h3>
            <div className="figma-ad-history-list">
              <div className="figma-ad-history-divider"></div>
              {offers.length > 0 ? (
                offers.map((offer, idx) => (
                  <div key={offer._id} className="figma-ad-history-item">
                    <div className={`figma-ad-history-dot ${idx === 0 ? 'figma-ad-history-dot-active' : ''}`}></div>
                    <div className="figma-ad-history-header">
                      <span className="figma-ad-history-name" style={{ color: idx === 0 ? '#002896' : '#475569', fontWeight: idx === 0 ? 700 : 500 }}>
                        {getDisplayName(offer.user)}
                      </span>
                      <span className="figma-ad-history-price" style={{ color: idx === 0 ? '#002896' : '#64748B', fontWeight: 600 }}>
                        {offer.price.toLocaleString()} Da
                      </span>
                    </div>
                    <span className="figma-ad-history-date">
                      {new Date(offer.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, {new Date(offer.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '14px' }}>
                  Aucune offre enregistrée
                </div>
              )}
            </div>
            <div className="figma-ad-view-more">Voir tout l'historique</div>
          </div>
        </div>
      </div>
    </div>
  );
}
