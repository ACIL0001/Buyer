'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TendersAPI } from '@/services/tenders';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { DashboardKeyframes, StatusBadge, ActionBtn, tableStyles, ConfirmDialog, DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';

const ACCENT = 'var(--primary-tender-color)';
const ACCENT_80 = 'color-mix(in srgb, var(--primary-tender-color) 80%, transparent)'; // cc in hex
const ACCENT_25 = 'color-mix(in srgb, var(--primary-tender-color) 25%, transparent)'; // 40 in hex
const ACCENT_12 = 'color-mix(in srgb, var(--primary-tender-color) 12%, transparent)'; // 20 in hex
const ACCENT_05 = 'color-mix(in srgb, var(--primary-tender-color) 5%, transparent)'; // 08 in hex
const ACCENT_03 = 'color-mix(in srgb, var(--primary-tender-color) 3%, transparent)'; // 06 in hex
const ACCENT_18 = 'color-mix(in srgb, var(--primary-tender-color) 18%, transparent)'; // 30 in hex

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

const card: React.CSSProperties = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', padding: 24, marginBottom: 20 };

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

  const getAvatarUrl = (u: any) => {
    const p = u?.avatar?.path || u?.bidder?.avatar?.path;
    if (!p) return '';
    const { baseURL } = require('@/config').default || require('@/config');
    const base = baseURL?.endsWith('/') ? baseURL : `${baseURL}/`;
    return `${base}static/uploads/${p}`;
  };

  const handleAccept = async () => {
    setProcessing(true);
    try { await TendersAPI.acceptTenderBid(offerId); enqueueSnackbar('Offre acceptée', { variant: 'success' }); await refetch(); }
    catch { enqueueSnackbar('Erreur', { variant: 'error' }); }
    finally { setProcessing(false); setAcceptDialog(false); }
  };

  const handleReject = async () => {
    setProcessing(true);
    try { await TendersAPI.rejectTenderBid(offerId); enqueueSnackbar('Offre rejetée', { variant: 'info' }); await refetch(); }
    catch { enqueueSnackbar('Erreur', { variant: 'error' }); }
    finally { setProcessing(false); setRejectDialog(false); }
  };

  if (isLoading) return <DetailPageSkeleton accentColor="var(--primary-tender-color)" />;

  const tender = data?.tender;
  const offer = data?.offer;
  const allBids = data?.allBids || [];

  if (!tender || !offer) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}>Offre ou appel d'offres introuvable</p>
      <button onClick={() => router.back()} style={{ marginTop: 16, padding: '10px 22px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
    </div>
  );

  const evalType = tender.evaluationType || 'MOINS_DISANT';
  const tenderOwnerId = typeof tender.owner === 'object' ? tender.owner?._id : tender.owner;
  const isOwner = tenderOwnerId == auth?.user?._id;
  const bidder = offer.bidder || offer.user;
  const bidderId = typeof bidder === 'object' ? bidder?._id : bidder;
  const bidderName = bidder?.companyName || bidder?.entreprise || `${bidder?.firstName || ''} ${bidder?.lastName || ''}`.trim() || 'N/A';
  const budget = tender.maxBudget || tender.budget || tender.estimatedBudget || 0;
  const showActions = isOwner && offer.status === 'pending' && evalType !== 'MOINS_DISANT';

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <DashboardKeyframes />

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_80})`, borderRadius: 16, padding: '24px 28px', marginBottom: 24, boxShadow: `0 8px 32px ${ACCENT_25}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08), transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push(`/dashboard/tenders/${tenderId}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, marginBottom: 14 }}>← Retour à l'appel d'offres</button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.1rem, 3vw, 1.6rem)', fontWeight: 800, margin: 0 }}>Détails de la soumission</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: '6px 0 0' }}>📄 {tender.title}</p>
            </div>
            <StatusBadge config={offerStatusCfg(offer.status)} />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>
        <div>
          {/* Proposal / Amount */}
          <div style={card}>
            <h3 style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proposition</h3>
            <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: 20, paddingBottom: 12 }} />

            {evalType === 'MIEUX_DISANT' ? (
              <>
                {offer.proposal && offer.proposal.trim() && offer.proposal !== 'Aucune proposition textuelle fournie.' && (
                  <div style={{ padding: '16px 20px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', marginBottom: 16, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#334155' }}>
                    {offer.proposal}
                  </div>
                )}
                {(offer.proposalFile || (offer.proposalFiles && offer.proposalFiles.length > 0)) && (
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: 10 }}>📎 Documents joints</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {offer.proposalFile && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: '#e0f2fe18', border: '1.5px dashed #0284c740' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📄</div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                {offer.proposalFile.split('/').pop()?.split('-').slice(1).join('-') || 'Proposition technique'}
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Document PDF / Word</div>
                            </div>
                          </div>
                          <a href={offer.proposalFile} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', borderRadius: 8, background: ACCENT, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}>Voir</a>
                        </div>
                      )}
                      {Array.isArray(offer.proposalFiles) && offer.proposalFiles.map((file: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: '#e0f2fe18', border: '1.5px dashed #0284c740' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📎</div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                              {typeof file === 'string' ? file.split('/').pop() : (file.originalname || `Fichier ${idx + 1}`)}
                            </div>
                          </div>
                          <a href={typeof file === 'string' ? file : file.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', borderRadius: 8, background: ACCENT, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}>Voir</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!offer.proposal && !offer.proposalFile && (!offer.proposalFiles || offer.proposalFiles.length === 0) && (
                  <div style={{ padding: '32px', textAlign: 'center', borderRadius: 12, background: '#f8fafc', border: '1.5px dashed #e2e8f0', color: '#94a3b8' }}>Aucune proposition fournie</div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderRadius: 14, background: ACCENT_05, border: `1.5px solid ${ACCENT_12}` }}>
                <span style={{ fontSize: 40 }}>💰</span>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{(offer.price || offer.bidAmount || offer.amount || 0).toLocaleString('fr-FR')}</div>
                  <div style={{ color: '#64748b', fontWeight: 600, marginTop: 4 }}>DA proposé</div>
                </div>
              </div>
            )}

            {/* Submission date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9', marginTop: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📅</div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date de soumission</div>
                <div style={{ fontWeight: 700, color: '#334155', marginTop: 2 }}>{fmtDate(offer.createdAt || offer.date)}</div>
              </div>
            </div>
          </div>

          {/* Accept / Reject actions */}
          {showActions && (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <ActionBtn label="Refuser" icon="❌" variant="danger" size="md" onClick={() => setRejectDialog(true)} disabled={processing} />
              <ActionBtn label="Accepter" icon="✅" variant="success" size="md" onClick={() => setAcceptDialog(true)} disabled={processing} />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div>
          {/* Bidder card */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>👤 Soumissionnaire</h3>
            {bidder && bidderId ? (
              <Link href={`/dashboard/profile/${bidderId}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: ACCENT_12, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', border: `2px solid ${ACCENT_18}`, flexShrink: 0 }}>{bidderName.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{bidderName}</div>
                  {(bidder as any).email && <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 2 }}>{(bidder as any).email}</div>}
                  {((bidder as any).phone || offer.phone) && <div style={{ marginTop: 6 }}><span style={{ padding: '2px 8px', borderRadius: 8, background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>📞 {(bidder as any).phone || offer.phone}</span></div>}
                </div>
              </Link>
            ) : (
              <div style={{ color: '#94a3b8' }}>Infos non disponibles</div>
            )}
          </div>

          {/* Tender info card */}
          <div style={{ ...card, background: `linear-gradient(135deg, ${ACCENT_05}, #fff)` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📄 Info Appel d'offres</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Titre</div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>{tender.title}</div>
            </div>
            {evalType !== 'MIEUX_DISANT' && budget > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Budget</div>
                <div style={{ fontWeight: 800, color: ACCENT, fontSize: '1.1rem' }}>{budget.toLocaleString('fr-FR')} DA</div>
              </div>
            )}
            <button onClick={() => router.push(`/dashboard/tenders/${tenderId}`)} style={{ width: '100%', padding: 10, borderRadius: 10, border: `1.5px solid ${ACCENT}`, background: 'transparent', color: ACCENT, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              Voir l'appel d'offres →
            </button>
          </div>
        </div>
      </div>

      {/* All bids table */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>📑 Autres soumissions ({allBids.length})</h3>
        {allBids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Aucune autre soumission</div>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                {['Soumissionnaire', 'Annonce', evalType !== 'MIEUX_DISANT' ? 'Montant' : 'Proposition', 'Date', ...(isOwner && evalType !== 'MOINS_DISANT' ? [''] : [])].map(h => <th key={h} style={tableStyles.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {allBids.map((b: any, i: number) => {
                const bd = b.bidder || b.user;
                const bName = bd?.companyName || bd?.entreprise || `${bd?.firstName || ''} ${bd?.lastName || ''}`.trim() || 'N/A';
                const isCurrent = b._id === offerId;
                return (
                  <tr key={b._id || i} className="db-row" style={{ ...tableStyles.trHover, background: isCurrent ? ACCENT_03 : undefined }}>
                    <td style={tableStyles.td}>
                      <Link href={`/dashboard/profile/${bd?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: isCurrent ? ACCENT_12 : '#f1f5f9', color: isCurrent ? ACCENT : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>{bName.charAt(0).toUpperCase()}</div>
                        <div>
                          <span style={{ fontWeight: isCurrent ? 700 : 500, color: '#1e293b' }}>{bName}</span>
                          {isCurrent && <span style={{ marginLeft: 8, padding: '1px 7px', borderRadius: 8, background: ACCENT, color: '#fff', fontSize: '0.68rem', fontWeight: 700 }}>Cette offre</span>}
                          {bd?.email && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{bd.email}</div>}
                        </div>
                      </Link>
                    </td>
                    <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem', maxWidth: 180 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tender?.title}</div></td>
                    <td style={tableStyles.td}>
                      {evalType !== 'MIEUX_DISANT'
                        ? <span style={{ fontWeight: 700, color: '#10b981' }}>{(b.bidAmount || b.price || 0).toLocaleString('fr-FR')} DA</span>
                        : <span style={{ color: '#475569', fontSize: '0.82rem' }}>{b.proposal ? b.proposal.slice(0, 50) + '…' : '—'}</span>}
                    </td>
                    <td style={{ ...tableStyles.td, color: '#64748b', fontSize: '0.82rem' }}>{fmtDate(b.createdAt || b.date)}</td>
                    {isOwner && evalType !== 'MOINS_DISANT' && (
                      <td style={{ ...tableStyles.td, textAlign: 'right' }}>
                        {isCurrent && b.status === 'pending' && <ActionBtn label="Accepter" icon="✅" variant="success" onClick={() => setAcceptDialog(true)} />}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog open={acceptDialog} title="Accepter la soumission" message={`Accepter l'offre de "${bidderName}" ? Cette action attribuera l'appel d'offres.`} confirmLabel={processing ? '…' : 'Accepter'} onConfirm={handleAccept} onCancel={() => setAcceptDialog(false)} />
      <ConfirmDialog open={rejectDialog} title="Refuser la soumission" message={`Refuser l'offre de "${bidderName}" ?`} confirmLabel={processing ? '…' : 'Refuser'} danger onConfirm={handleReject} onCancel={() => setRejectDialog(false)} />
    </div>
  );
}
