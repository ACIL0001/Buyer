'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TendersAPI } from '@/services/tenders';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { DashboardKeyframes, ConfirmDialog, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';
import DocxViewerModal from '@/components/shared/DocxViewerModal';
import { formatUserName } from '@/utils/user';
import { normalizeImageUrl } from '@/utils/url';
import { BsArrowLeft, BsFileEarmarkText, BsInfoCircle, BsBarChart, BsClockHistory, BsCheckCircle, BsXCircle, BsDownload } from 'react-icons/bs';
import '../../../../auctions/[id]/auction-details-styles.css';

function offerStatusCfg(s: string) {
  const m: Record<string, any> = {
    pending:  { label: 'En attente', color: '#d97706', bg: '#fef3c7', dot: true },
    accepted: { label: 'Acceptée',   color: '#16a34a', bg: '#dcfce7' },
    declined: { label: 'Rejetée',    color: '#dc2626', bg: '#fee2e2' },
  };
  return m[s?.toLowerCase()] || { label: s, color: '#64748b', bg: '#f1f5f9' };
}

function fmtDate(d: any) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TenderOfferDetailPage() {
  const params = useParams();
  const tenderId = params?.id as string;
  const offerId = params?.offerId as string;
  const router = useRouter();
  const { auth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [processing, setProcessing] = useState(false);
  const [acceptDialog, setAcceptDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [viewDoc, setViewDoc] = useState<{ open: boolean; url: string; name: string }>({ open: false, url: '', name: '' });

  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    if (!socket || !tenderId) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['tender-offer', tenderId, offerId] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, tenderId, offerId, queryClient]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tender-offer', tenderId, offerId],
    queryFn: async () => {
      const tr = await TendersAPI.getTenderById(tenderId);
      const tenderData = (tr as any).data || tr;
      const br = await TendersAPI.getTenderBids(tenderId);
      const allBidsArr = br?.data && Array.isArray(br.data) ? br.data : Array.isArray(br) ? br : [];
      let offerData: any;
      try {
        const or = await TendersAPI.getTenderBidById(offerId);
        offerData = (or as any).data || or;
      } catch {
        offerData = allBidsArr.find((b: any) => b._id === offerId);
      }
      return { tender: tenderData, offer: Array.isArray(offerData) ? offerData[0] : offerData, allBids: allBidsArr };
    },
    enabled: !!tenderId && !!offerId,
    staleTime: 60000,
  });

  const handleAccept = async () => {
    setProcessing(true);
    try { 
      await TendersAPI.acceptTenderBid(offerId); 
      enqueueSnackbar('Offre acceptée', { variant: 'success' }); 
      await refetch(); 
    } catch { 
      enqueueSnackbar('Erreur lors de l\'acceptation', { variant: 'error' }); 
    } finally { 
      setProcessing(false); 
      setAcceptDialog(false); 
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try { 
      await TendersAPI.rejectTenderBid(offerId); 
      enqueueSnackbar('Offre rejetée', { variant: 'info' }); 
      await refetch(); 
    } catch { 
      enqueueSnackbar('Erreur lors du rejet', { variant: 'error' }); 
    } finally { 
      setProcessing(false); 
      setRejectDialog(false); 
    }
  };

  if (isLoading) return <DetailPageSkeleton accentColor="var(--primary-tender-color)" />;

  const tender = data?.tender;
  const offer = data?.offer;
  const allBids = data?.allBids || [];

  if (!tender || !offer) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <p>Offre ou appel d'offres introuvable</p>
      <button onClick={() => router.back()}>Retour</button>
    </div>
  );

  const evalType = tender.evaluationType || 'MOINS_DISANT';
  const tenderOwnerId = typeof tender.owner === 'object' ? tender.owner?._id : tender.owner;
  const isOwner = tenderOwnerId == auth?.user?._id;
  const bidder = offer.bidder || offer.user || {};
  const bidderId = typeof bidder === 'object' ? bidder?._id : bidder;
  const bidderName = formatUserName(bidder);
  const budget = tender.maxBudget || tender.budget || tender.estimatedBudget || 0;
  const showActions = isOwner && offer.status === 'pending' && evalType !== 'MOINS_DISANT';
  const stCfg = offerStatusCfg(offer.status);

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

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '80px' }}>
      <DashboardKeyframes />
      <div className="figma-ad-main">
        
        <button 
          className="figma-ad-back-btn"
          onClick={() => router.push(`/dashboard/tenders/${tenderId}`)}
        >
          <BsArrowLeft /> Retour à l'appel d'offres
        </button>

        {/* Header Title Section */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1 className="figma-ad-product-title" style={{ margin: 0, fontSize: '28px' }}>Détails de la soumission</h1>
            <p style={{ margin: 0, color: '#64748B', fontWeight: 500 }}>🏷️ {tender.title}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ padding: '6px 16px', borderRadius: '99px', background: stCfg.bg, color: stCfg.color, fontSize: '13px', fontWeight: 700 }}>
              {stCfg.label.toUpperCase()}
            </span>
          </div>
        </header>

        <div className="figma-ad-grid" style={{ marginTop: '16px' }}>
          {/* Left Column */}
          <div className="figma-ad-left-col">
            
            {/* Tender Card */}
            <div className="figma-ad-product-card">
              <div className="figma-ad-product-img-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0, 80, 203, 0.05)', color: '#0050CB' }}>
                <BsFileEarmarkText size={44} />
              </div>
              <div className="figma-ad-product-content">
                <h2 className="figma-ad-product-title">{tender.title}</h2>
                <span className="figma-ad-product-date">Publié le {tender.createdAt ? new Date(tender.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
              </div>
            </div>

            {/* Details Box */}
            <div className="figma-ad-details-box">
              <div className="figma-ad-proposal-header">
                <div className="figma-ad-proposal-amount-group">
                  {evalType !== 'MIEUX_DISANT' ? (
                    <>
                      <span className="figma-ad-label">MONTANT PROPOSÉ</span>
                      <span className="figma-ad-amount">{(offer.price || offer.bidAmount || 0).toLocaleString('fr-FR')} Da</span>
                    </>
                  ) : (
                    <>
                      <span className="figma-ad-label">PROPOSITION SOUMISE</span>
                      <span className="figma-ad-amount" style={{ fontSize: '28px', color: '#1E293B', fontWeight: 700, margin: '8px 0' }}>Dossier Technique</span>
                    </>
                  )}
                  <span className="figma-ad-proposal-date">Soumission reçue le {new Date(offer.createdAt || offer.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(offer.createdAt || offer.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="figma-ad-bidder-profile">
                  <span className="figma-ad-label">SOUMISSIONNAIRE</span>
                  <div className="figma-ad-bidder-info" style={{ alignItems: 'center', display: 'flex', gap: '16px', flexWrap: 'wrap', height: 'auto', padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '180px' }}>
                      <BidderAvatar user={bidder} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="figma-ad-bidder-name" style={{ fontSize: '15px' }}>{bidderName}</span>
                        {bidder?.email && <span className="figma-ad-bidder-meta" style={{ fontSize: '12px' }}>✉️ {bidder.email}</span>}
                        {(bidder?.phone || offer.phone) && <span className="figma-ad-bidder-meta" style={{ fontSize: '12px' }}>📞 {bidder.phone || offer.phone}</span>}
                      </div>
                    </div>
                    {bidderId && (
                      <button 
                        onClick={() => router.push(`/dashboard/profile/${bidderId}`)} 
                        style={{ padding: '8px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#191B24', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                      >
                        Consulter le profil
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Proposal Text & Documents */}
              <div className="figma-ad-comment-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BsFileEarmarkText color="#0050CB" />
                  <span className="figma-ad-bidder-name">Détails de la proposition</span>
                </div>
                
                {evalType === 'MIEUX_DISANT' ? (
                  <>
                    {offer.proposal && offer.proposal.trim() && offer.proposal !== 'Aucune proposition textuelle fournie.' && (
                      <div className="figma-ad-comment-box" style={{ whiteSpace: 'pre-wrap', width: '100%' }}>
                        {offer.proposal}
                      </div>
                    )}
                    
                    {(offer.proposalFile || (offer.proposalFiles && offer.proposalFiles.length > 0)) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px' }}>
                        <span className="figma-ad-label" style={{ fontSize: '11px', color: '#64748B' }}>DOCUMENTS ATTACHÉS</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', width: '100%' }}>
                          
                          {offer.proposalFile && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 80, 203, 0.1)', color: '#0050CB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                  <BsFileEarmarkText />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#191B24', fontSize: '14px' }}>
                                    {offer.proposalFile.split('/').pop()?.split('-').slice(1).join('-') || 'Proposition technique'}
                                  </div>
                                  <div style={{ color: '#64748B', fontSize: '12px' }}>Document joint</div>
                                </div>
                              </div>
                              {(() => {
                                const isDoc = offer.proposalFile.toLowerCase().endsWith('.docx') || offer.proposalFile.toLowerCase().endsWith('.doc');
                                const fileName = offer.proposalFile.split('/').pop()?.split('-').slice(1).join('-') || 'Proposition technique';
                                
                                if (isDoc) {
                                  return (
                                    <button 
                                      onClick={() => setViewDoc({ open: true, url: offer.proposalFile, name: fileName })} 
                                      style={{ padding: '6px 14px', borderRadius: '8px', background: '#0050CB', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                                    >
                                      Voir
                                    </button>
                                  );
                                }
                                return (
                                  <a 
                                    href={offer.proposalFile} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ padding: '6px 14px', borderRadius: '8px', background: '#0050CB', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}
                                  >
                                    Ouvrir
                                  </a>
                                );
                              })()}
                            </div>
                          )}
                          
                          {Array.isArray(offer.proposalFiles) && offer.proposalFiles.map((file: any, idx: number) => {
                            const fileUrl = typeof file === 'string' ? file : file.url;
                            const isDoc = fileUrl?.toLowerCase().endsWith('.docx') || fileUrl?.toLowerCase().endsWith('.doc');
                            const fileName = typeof file === 'string' ? file.split('/').pop() : (file.originalname || `Fichier ${idx + 1}`);
                            
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 80, 203, 0.1)', color: '#0050CB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                    <BsFileEarmarkText />
                                  </div>
                                  <div style={{ fontWeight: 600, color: '#191B24', fontSize: '14px' }}>{fileName}</div>
                                </div>
                                {isDoc ? (
                                  <button 
                                    onClick={() => setViewDoc({ open: true, url: fileUrl, name: fileName })} 
                                    style={{ padding: '6px 14px', borderRadius: '8px', background: '#0050CB', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                                  >
                                    Voir
                                  </button>
                                ) : (
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ padding: '6px 14px', borderRadius: '8px', background: '#0050CB', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}
                                  >
                                    Ouvrir
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {!offer.proposal && !offer.proposalFile && (!offer.proposalFiles || offer.proposalFiles.length === 0) && (
                      <div style={{ padding: '32px', textAlign: 'center', width: '100%', borderRadius: '12px', background: '#F8FAFC', border: '1px dashed #E2E8F0', color: '#64748B' }}>
                        Aucune proposition textuelle ou document fourni.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="figma-ad-comment-box" style={{ fontStyle: 'normal', width: '100%' }}>
                    <span>Cette soumission est basée uniquement sur le critère du prix. Le montant proposé est de <strong>{(offer.price || offer.bidAmount || 0).toLocaleString('fr-FR')} DA</strong>.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons inside Footer Actions */}
              {showActions && (
                <div className="figma-ad-footer-actions" style={{ borderTop: '1px solid #F1F5F9', paddingTop: '24px', width: '100%' }}>
                  <button 
                    disabled={processing} 
                    className="figma-ad-btn-reject" 
                    onClick={() => setRejectDialog(true)}
                  >
                    <BsXCircle /> Refuser la soumission
                  </button>
                  <button 
                    disabled={processing} 
                    className="figma-ad-btn-accept" 
                    onClick={() => setAcceptDialog(true)}
                  >
                    <BsCheckCircle /> Accepter la soumission
                  </button>
                </div>
              )}

              <div className="figma-ad-info-banner">
                <BsInfoCircle size={20} color="#0050CB" />
                <span>En acceptant cette proposition, vous attribuez définitivement l'appel d'offres à ce soumissionnaire.</span>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar Deck) */}
          <div className="figma-ad-right-col">
            <div className="figma-ad-side-card">
              <h3 className="figma-ad-side-title"><BsBarChart color="#0050CB" /> Statistiques de l'appel</h3>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Budget estimé</span>
                <span className="figma-ad-stat-value">{budget > 0 ? `${budget.toLocaleString('fr-FR')} DA` : 'N/A'}</span>
              </div>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Critère de choix</span>
                <span className="figma-ad-stat-value figma-ad-stat-value-blue">
                  {evalType === 'MIEUX_DISANT' ? 'Mieux-disant' : 'Moins-disant'}
                </span>
              </div>
              <div className="figma-ad-stat-row">
                <span className="figma-ad-stat-label">Date limite</span>
                <span className="figma-ad-stat-value">{tender.endingAt ? new Date(tender.endingAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
              </div>
              <div className="figma-ad-stat-row" style={{ borderBottom: 'none' }}>
                <span className="figma-ad-stat-label">Total soumissions</span>
                <span className="figma-ad-stat-value">{allBids.length}</span>
              </div>
            </div>

            <div className="figma-ad-side-card figma-ad-history-card-height">
              <h3 className="figma-ad-side-title"><BsClockHistory color="#0050CB" /> Historique ({allBids.length})</h3>
              <div className="figma-ad-history-list">
                <div className="figma-ad-history-divider"></div>
                {allBids.length > 0 ? (
                  allBids.map((b: any, idx) => {
                    const bd = b.bidder || b.user;
                    const isCurrent = b._id === offerId;
                    return (
                      <div key={b._id} className="figma-ad-history-item">
                        <div className={`figma-ad-history-dot ${isCurrent ? 'figma-ad-history-dot-active' : ''}`}></div>
                        <div className="figma-ad-history-header">
                          <span className="figma-ad-history-name" style={{ color: isCurrent ? '#002896' : '#475569', fontWeight: isCurrent ? 700 : 500 }}>
                            {getDisplayName(bd)}
                          </span>
                          <span className="figma-ad-history-price" style={{ color: isCurrent ? '#002896' : '#64748B', fontWeight: 600 }}>
                            {evalType !== 'MIEUX_DISANT' ? `${(b.bidAmount || b.price || 0).toLocaleString('fr-FR')} DA` : 'Dossier'}
                          </span>
                        </div>
                        <span className="figma-ad-history-date">
                          {new Date(b.createdAt || b.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, {new Date(b.createdAt || b.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '14px' }}>
                    Aucune soumission enregistrée
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #F1F5F9', boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '12px', padding: '24px', width: '100%', marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: '#191B24' }}>Autres soumissions ({allBids.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['Soumissionnaire', 'Appel d\'offres', evalType !== 'MIEUX_DISANT' ? 'Montant' : 'Proposition', 'Date', ...(isOwner && evalType !== 'MOINS_DISANT' ? ['Action'] : [])].map((h, i) => (
                    <th key={i} style={{ padding: '12px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allBids.map((b: any, i: number) => {
                  const bd = b.bidder || b.user;
                  const bName = formatUserName(bd);
                  const isCurrent = b._id === offerId;
                  return (
                    <tr key={b._id || i} style={{ background: isCurrent ? 'rgba(0, 80, 203, 0.04)' : undefined, borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px' }}>
                        {bd?._id ? (
                          <Link href={`/dashboard/profile/${bd._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isCurrent ? 'rgba(0, 80, 203, 0.1)' : '#F1F5F9', color: isCurrent ? '#0050CB' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>
                              {bName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: isCurrent ? 600 : 500, color: '#191B24', fontSize: '14px' }}>
                              {bName}
                              {isCurrent && <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 6, background: '#0050CB', color: '#fff', fontSize: '10px', fontWeight: 600 }}>Cette offre</span>}
                            </span>
                          </Link>
                        ) : <span style={{ color: '#94a3b8' }}>Inconnu</span>}
                      </td>
                      <td style={{ padding: '12px', color: '#64748B', fontSize: '14px', maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tender?.title}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {evalType !== 'MIEUX_DISANT' ? (
                          <span style={{ fontWeight: 600, color: '#0050CB', fontSize: '14px' }}>{(b.bidAmount || b.price || 0).toLocaleString('fr-FR')} DA</span>
                        ) : (
                          <span style={{ color: '#64748B', fontSize: '14px' }}>{b.proposal ? b.proposal.slice(0, 40) + '…' : '—'}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', color: '#64748B', fontSize: '14px' }}>{fmtDate(b.createdAt || b.date)}</td>
                      {isOwner && evalType !== 'MOINS_DISANT' && (
                        <td style={{ padding: '12px' }}>
                          {isCurrent && b.status === 'pending' && (
                            <button 
                              onClick={() => setAcceptDialog(true)} 
                              style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
                            >
                              Accepter
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog open={acceptDialog} title="Accepter la soumission" message={`Accepter l'offre de "${bidderName}" ? Cette action attribuera l'appel d'offres.`} confirmLabel={processing ? '…' : 'Accepter'} onConfirm={handleAccept} onCancel={() => setAcceptDialog(false)} />
      <ConfirmDialog open={rejectDialog} title="Refuser la soumission" message={`Refuser l'offre de "${bidderName}" ?`} confirmLabel={processing ? '…' : 'Refuser'} danger onConfirm={handleReject} onCancel={() => setRejectDialog(false)} />
      
      <DocxViewerModal 
        open={viewDoc.open} 
        onClose={() => setViewDoc({ ...viewDoc, open: false })}
        fileUrl={viewDoc.url}
        fileName={viewDoc.name}
      />
    </div>
  );
}
