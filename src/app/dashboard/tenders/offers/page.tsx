'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';
import { 
  BsHammer, 
  BsCheckCircle, 
  BsXCircle, 
  BsClock, 
  BsChevronLeft, 
  BsChevronRight,
  BsThreeDotsVertical,
  BsPlusLg,
  BsFileEarmarkText,
  BsSearch
} from 'react-icons/bs';
import { formatUserName } from '@/utils/user';
import DocxViewerModal from '@/components/shared/DocxViewerModal';
import './tender-bids-styles.css';

enum TenderBidStatus { PENDING = 'pending', ACCEPTED = 'accepted', DECLINED = 'declined' }
interface Bidder { _id: string; firstName: string; lastName: string; email: string; phone?: string; companyName?: string; entreprise?: string; }
interface Tender { _id: string; title: string; evaluationType?: 'MIEUX_DISANT' | 'MOINS_DISANT'; }
interface TenderBid {
  _id: string; bidder: Bidder; tender: Tender; bidAmount: number;
  deliveryTime?: number; createdAt: string; status: TenderBidStatus;
  proposal?: string; proposalFile?: string; type?: 'received' | 'my';
}

export default function TenderBidsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, isLogged } = useAuth();
  const user = auth?.user;
  const { t } = useTranslation();

  const [filterTab, setFilterTab] = useState<'received' | 'my'>('my');
  const [evalFilter, setEvalFilter] = useState<'all' | 'MIEUX_DISANT' | 'MOINS_DISANT'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isMutating, setIsMutating] = useState(false);
  const [viewDoc, setViewDoc] = useState<{ open: boolean; url: string; name: string }>({ open: false, url: '', name: '' });

  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'received' || tab === 'my') setFilterTab(tab as 'received' | 'my');
  }, [searchParams]);

  useEffect(() => {
    if (!socket) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['tender-bids', 'my'] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, queryClient]);

  const { data: bidsData = [], isLoading: isQueryLoading, error, refetch } = useQuery({
    queryKey: ['tender-bids', 'my'],
    queryFn: async () => {
      if (!auth?.user?._id) return [];
      const { TendersAPI } = await import('@/services/tenders');
      let received: any[] = [], mine: any[] = [];
      try { const r = await TendersAPI.getTenderBidsByOwner(auth.user._id); received = Array.isArray(r) ? r.map(b => ({ ...b, type: 'received' })) : []; } catch {}
      try { const r = await TendersAPI.getTenderBidsByBidder(auth.user._id); mine = Array.isArray(r) ? r.map(b => ({ ...b, type: 'my' })) : []; } catch {}
      return [...received, ...mine];
    },
    enabled: isLogged && !!auth?.user?._id,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const bids = bidsData as TenderBid[];
  const isLoading = isQueryLoading || isMutating;

  const handleAccept = async (id: string) => { setIsMutating(true); try { const { TendersAPI } = await import('@/services/tenders'); await TendersAPI.acceptTenderBid(id); await refetch(); } catch {} finally { setIsMutating(false); } };
  const handleReject = async (id: string) => { setIsMutating(true); try { const { TendersAPI } = await import('@/services/tenders'); await TendersAPI.rejectTenderBid(id); await refetch(); } catch {} finally { setIsMutating(false); } };

  const received = useMemo(() => bids.filter((b: any) => b.type === 'received'), [bids]);
  const myBids = useMemo(() => bids.filter((b: any) => b.type === 'my'), [bids]);
  const current = filterTab === 'received' ? received : myBids;

  const filtered = useMemo(() => {
    let list = evalFilter !== 'all' ? current.filter(b => b.tender?.evaluationType === evalFilter) : current;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(b =>
        b.bidder?.firstName?.toLowerCase().includes(s) ||
        b.bidder?.lastName?.toLowerCase().includes(s) ||
        b.bidder?.companyName?.toLowerCase().includes(s) ||
        b.tender?.title?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [current, evalFilter, search]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const pending = current.filter(b => b.status === TenderBidStatus.PENDING).length;
  const accepted = current.filter(b => b.status === TenderBidStatus.ACCEPTED).length;
  const declined = current.filter(b => b.status === TenderBidStatus.DECLINED).length;

  if (isQueryLoading && !bids.length) return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1116px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Bienvenue {(user as any)?.companyName || (user as any)?.entreprise || (user as any)?.firstName || 'Utilisateur'}
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Gestion de vos soumissions et appels d'offres</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => router.push('/dashboard/tenders/create/')}
              style={{ backgroundColor: '#0050CB', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BsPlusLg /> Nouvel Appel d'Offres
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '20px' }}>🔔</button>
              <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '20px' }}>✉️</button>
            </div>
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div className="figma-auc-summary-grid">
          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-blue">
              <BsFileEarmarkText size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Total</span>
              <span className="figma-auc-card-value">{current.length}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-orange">
              <BsClock size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">En attente</span>
              <span className="figma-auc-card-value">{pending}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-green">
              <BsCheckCircle size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Acceptées</span>
              <span className="figma-auc-card-value">{accepted}</span>
            </div>
          </div>

          <div className="figma-auc-card">
            <div className="figma-auc-icon-circle figma-auc-icon-red">
              <BsXCircle size={20} />
            </div>
            <div className="figma-auc-card-content">
              <span className="figma-auc-card-label">Rejetées</span>
              <span className="figma-auc-card-value">{declined}</span>
            </div>
          </div>
        </div>

        {/* Tabs - Segmented Control */}
        <div className="offers-tabs-wrapper">
          <div className="offers-segmented-control">
            <button 
              className={`offers-tab-item ${filterTab === 'received' ? 'active' : ''}`}
              onClick={() => { setFilterTab('received'); setPage(0); setEvalFilter('all'); router.push('/dashboard/tender-bids?tab=received'); }}
            >
              Reçues <span className="offers-tab-count">{received.length}</span>
            </button>
            <button 
              className={`offers-tab-item ${filterTab === 'my' ? 'active' : ''}`}
              onClick={() => { setFilterTab('my'); setPage(0); setEvalFilter('all'); router.push('/dashboard/tender-bids?tab=my'); }}
            >
              Mes soumissions <span className="offers-tab-count">{myBids.length}</span>
            </button>
          </div>
        </div>

        {/* Sub-filters and Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Filtrer par type :</span>
            {(['all', 'MIEUX_DISANT', 'MOINS_DISANT'] as const).map(val => (
              <button
                key={val}
                onClick={() => { setEvalFilter(val); setPage(0); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: evalFilter === val ? (val === 'MIEUX_DISANT' ? '#E0F2FE' : val === 'MOINS_DISANT' ? '#DCFCE7' : '#F1F5F9') : 'white',
                  borderColor: evalFilter === val ? (val === 'MIEUX_DISANT' ? '#0284C7' : val === 'MOINS_DISANT' ? '#16A34A' : '#E2E8F0') : '#E2E8F0',
                  color: evalFilter === val ? (val === 'MIEUX_DISANT' ? '#0284C7' : val === 'MOINS_DISANT' ? '#16A34A' : '#475569') : '#64748B'
                }}
              >
                {val === 'all' ? 'Tous' : val === 'MIEUX_DISANT' ? '✨ Mieux Disant' : '💰 Moins Disant'}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', width: '240px' }}
            />
          </div>
        </div>

        {/* Main Table Section */}
        <div className="figma-auc-section">
          <div className="figma-auc-header">
            <h3 className="figma-auc-title">
              {filterTab === 'received' ? 'Soumissions reçues' : 'Mes offres déposées'}
            </h3>
          </div>

          <table className="figma-auc-table">
            <thead className="figma-auc-thead">
              <tr>
                <th className="figma-auc-th">SOUMISSIONNAIRE</th>
                <th className="figma-auc-th">APPEL D'OFFRES</th>
                <th className="figma-auc-th">MONTANT / PROP.</th>
                <th className="figma-auc-th">STATUS</th>
                <th className="figma-auc-th" style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    Aucune soumission trouvée.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const { _id, bidder, tender, bidAmount, createdAt, status, proposal, proposalFile } = row;
                  const displayName = formatUserName(bidder);
                  const initials = displayName.charAt(0).toUpperCase();
                  
                  return (
                    <tr key={_id} className="figma-auc-tr" onClick={() => (tender as any)?._id && router.push(`/dashboard/tenders/${(tender as any)._id}/offers/${_id}`)}>
                      <td className="figma-auc-td">
                        <div className="figma-auc-user-cell">
                          <div className="figma-auc-avatar" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                            {initials}
                          </div>
                          <div className="figma-auc-product-info">
                            <span className="figma-auc-user-name">{displayName}</span>
                            <span className="figma-auc-product-cat">{bidder?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="figma-auc-td">
                        <div className="figma-auc-product-info">
                          <span className="figma-auc-product-name">{tender?.title || 'Appel d\'offres'}</span>
                          <span className="figma-auc-product-cat">
                            {tender?.evaluationType === 'MIEUX_DISANT' ? '✨ Mieux Disant' : '💰 Moins Disant'}
                          </span>
                        </div>
                      </td>
                      <td className="figma-auc-td">
                        {tender?.evaluationType === 'MIEUX_DISANT' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                             {proposalFile && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setViewDoc({ open: true, url: proposalFile, name: 'Proposition' }); }}
                                 style={{ padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}
                               >
                                 📄 DOCUMENT
                               </button>
                             )}
                             <span className="figma-auc-price" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                               {proposal || 'Voir détails'}
                             </span>
                          </div>
                        ) : (
                          <span className="figma-auc-price">{bidAmount?.toLocaleString('fr-FR')} DA</span>
                        )}
                      </td>
                      <td className="figma-auc-td">
                        <span className={`figma-auc-status-badge ${status === TenderBidStatus.DECLINED ? 'figma-auc-status-rejected' : status === TenderBidStatus.ACCEPTED ? 'figma-auc-status-accepted' : 'figma-auc-status-pending'}`}>
                          {status === TenderBidStatus.DECLINED ? 'REJETÉ' : status === TenderBidStatus.ACCEPTED ? 'ACCEPTÉ' : 'EN ATTENTE'}
                        </span>
                      </td>
                      <td className="figma-auc-td" style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div className="figma-auc-actions">
                          <button 
                            className="figma-auc-btn-details"
                            onClick={() => tender?._id && router.push(`/dashboard/tenders/${tender._id}/offers/${_id}`)}
                          >
                            Détails
                          </button>
                          {filterTab === 'received' && status === TenderBidStatus.PENDING && tender?.evaluationType === 'MIEUX_DISANT' && (
                            <>
                              <button className="figma-auc-btn-success" onClick={() => handleAccept(_id)}>Accepter</button>
                              <button className="figma-auc-btn-danger" onClick={() => handleReject(_id)}>Rejeter</button>
                            </>
                          )}
                          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                            <BsThreeDotsVertical />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="figma-auc-pagination">
            <button 
              className="figma-auc-pg-btn"
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0}
            >
              <BsChevronLeft />
            </button>
            {[...Array(Math.ceil(filtered.length / rowsPerPage))].map((_, i) => (
              <button 
                key={i}
                className={`figma-auc-pg-btn ${page === i ? 'active' : ''}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button 
              className="figma-auc-pg-btn"
              onClick={() => setPage(prev => Math.min(Math.ceil(filtered.length / rowsPerPage) - 1, prev + 1))}
              disabled={page >= Math.ceil(filtered.length / rowsPerPage) - 1}
            >
              <BsChevronRight />
            </button>
          </div>
        </div>
      </div>

      <DocxViewerModal 
        open={viewDoc.open} 
        onClose={() => setViewDoc({ ...viewDoc, open: false })}
        fileUrl={viewDoc.url}
        fileName={viewDoc.name}
      />
    </div>
  );
}
