'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import { Tender, TENDER_STATUS } from '@/types/tender';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { ListPageSkeleton } from '@/components/dashboard/dashboardHelpers';
import Link from 'next/link';
import { getAbsoluteUrl } from '@/utils/url';

// --- Icons ---
const PublishedIcon = () => (
  <div style={{ width: '35px', height: '35px', background: 'rgba(0, 40, 150, 0.1)', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H11L9 5H5C3.89543 5 3 5.89543 3 7Z" fill="#002896" />
    </svg>
  </div>
);

const ReceivedIcon = () => (
  <div style={{ width: '35px', height: '35px', background: 'rgba(239, 203, 110, 0.2)', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 11.5C21 15.6421 17.1944 19 12.5 19C10.9631 19 9.53597 18.6256 8.29369 17.971L4 19L5.10335 15.1383C4.40182 14.0544 4 12.8201 4 11.5C4 7.35786 7.80558 4 12.5 4C17.1944 4 21 7.35786 21 11.5Z" stroke="#EFCB6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

function formatDate(d: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

import { BsBell, BsEnvelope, BsPlusLg } from 'react-icons/bs';

export default function TendersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { auth, isLogged } = useAuth();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  useEffect(() => {
    if (!socket) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['tenders', 'my'] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, queryClient]);

  const { data: tenders = [], isLoading } = useQuery({
    queryKey: ['tenders', 'my'],
    queryFn: async () => {
      const { TendersAPI } = await import('@/services/tenders');
      const response = await TendersAPI.getTenders();
      const rawData = response.data || (Array.isArray(response) ? response : []);
      return rawData.map((item: any) => ({
        ...item,
        categoryName: typeof item.category === 'object' ? item.category?.name : item.category,
      }));
    },
    enabled: isLogged,
    staleTime: 30000,
    placeholderData: keepPreviousData,
  });

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return tenders;
    if (statusFilter === 'OPEN') return tenders.filter((t: Tender) => t.status === TENDER_STATUS.OPEN);
    if (statusFilter === 'CLOSED') return tenders.filter((t: Tender) => t.status === TENDER_STATUS.CLOSED || t.status === TENDER_STATUS.CANCELLED);
    return tenders;
  }, [tenders, statusFilter]);

  if (isLoading) return <ListPageSkeleton accentColor="var(--primary-tender-color)" />;

  return (
    <div className="dashboard-tenders-page" style={{
      position: 'relative',
      width: '100%',
      padding: '32px 40px',
      fontFamily: "'Inter', sans-serif",
      minHeight: '100vh',
      background: '#F8FAFC'
    }}>
      <style jsx global>{`
        @media (max-width: 768px) {
          /* Page-level overflow guard: stops any rogue child width from forcing horizontal scroll */
          .dashboard-tenders-page {
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
            padding: 14px 12px !important;
          }

          /* HEADER region */
          .dt-header {
            flex-wrap: wrap !important;
            gap: 10px;
            margin-bottom: 16px !important;
            justify-content: flex-start !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .dt-header > div {
            width: 100% !important;
            min-width: 0 !important;
            justify-content: space-between !important;
            flex-wrap: wrap;
          }
          .dt-header button {
            font-size: 12px !important;
            padding: 8px 12px !important;
          }

          /* STATS region: 2-column grid on mobile (was 245px fixed) */
          .dt-stats {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }
          .dt-stats > div {
            width: auto !important;
            max-width: 100% !important;
            min-width: 0 !important;
            height: auto !important;
            min-height: 110px;
            padding: 12px !important;
            box-sizing: border-box !important;
            overflow: hidden;
          }
          /* Numeric value (the last div in each card) */
          .dt-stats > div > div:last-child,
          .dt-stats > div > div:last-child > span:first-child {
            font-size: 22px !important;
            line-height: 28px !important;
            word-break: break-word;
          }
          /* Label text */
          .dt-stats > div > div:nth-child(2) > span {
            font-size: 11px !important;
            line-height: 14px !important;
            word-break: break-word;
          }

          /* MAIN table card */
          .dt-main {
            min-height: auto !important;
            border-radius: 8px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden;
          }
          .dt-main-header {
            padding: 14px !important;
            height: auto !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .dt-main-header h3 {
            width: auto !important;
            max-width: 100% !important;
            font-size: 16px !important;
            line-height: 20px !important;
            word-break: break-word;
          }
          .dt-main-header span {
            width: auto !important;
            max-width: 100% !important;
            font-size: 12px !important;
            word-break: break-word;
          }

          /* Tabs row */
          .dt-tabs {
            padding: 0 !important;
            height: auto !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .dt-tabs > div {
            padding: 0 14px !important;
            gap: 16px !important;
            height: 44px !important;
            width: max-content !important;
            min-width: 100%;
          }
          .dt-tabs > div > div {
            padding: 12px 0 !important;
            height: 44px !important;
            min-width: max-content !important;
          }
          .dt-tabs span {
            font-size: 13px !important;
            white-space: nowrap;
          }

          /* Table section wrapper: drop the fixed 367px height that traps stacked rows */
          .dt-table-section {
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }

          /* Hide column-header row */
          .dt-table-head {
            display: none !important;
          }

          /* Each table row stacks vertically */
          .dt-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            height: auto !important;
            padding: 12px !important;
            gap: 6px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          .dt-row > div {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            padding: 0 !important;
            justify-content: flex-start !important;
            box-sizing: border-box !important;
            word-break: break-word;
          }
          .dt-row > div:last-child {
            margin-top: 4px;
          }
          .dt-row button {
            font-size: 12px !important;
            padding: 6px 12px !important;
          }

          /* Footer */
          .dt-footer {
            padding: 14px !important;
            height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
      
      {/* --- HEADER --- */}
      <div className="dt-header" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.push('/dashboard/tenders/create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0050CB',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <BsPlusLg /> Publier une annonce
          </button>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #F1F5F9', color: '#64748B', cursor: 'pointer' }}>
            <BsBell size={18} />
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #F1F5F9', color: '#64748B', cursor: 'pointer' }}>
            <BsEnvelope size={18} />
          </div>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="dt-stats" style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        {/* Offres et services publiés */}
        <div style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '24px',
          gap: '4px',
          width: '245px',
          height: '167px',
          background: '#FFFFFF',
          border: '1px solid #F8FAFC',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
        }}>
          <PublishedIcon />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 0px 0px', width: '100%' }}>
            <span style={{ fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#64748B' }}>
              Offres et services publiés
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '30px', lineHeight: '36px', color: '#0F172A' }}>
            {tenders.length}
          </div>
        </div>

        {/* Demandes reçu */}
        <div style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '24px',
          gap: '4px',
          width: '245px',
          height: '167px',
          background: '#FFFFFF',
          border: '1px solid #F8FAFC',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
        }}>
          <ReceivedIcon />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 0px 0px', width: '100%' }}>
            <span style={{ fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#64748B' }}>
              Demandes reçu
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '30px', lineHeight: '36px', color: '#0F172A' }}>
              {tenders.reduce((acc, t) => acc + (t.participantsCount || 0), 0)}
            </span>
            <span style={{ fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#EFCB6E', cursor: 'pointer' }}>
              Voir tout
            </span>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTAINER --- */}
      <div className="dt-main" style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '8px 0px 0px',
        width: '100%',
        maxWidth: '1116px',
        minHeight: '602px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
      }}>

        {/* Header Section */}
        <div className="dt-main-header" style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          width: '100%',
          height: '101px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 0, height: '32px' }}>
              <h3 style={{ width: '254px', height: '32px', fontWeight: 600, fontSize: '24px', lineHeight: '31px', margin: 0, color: '#191B24', display: 'flex', alignItems: 'center', letterSpacing: '-0.24px' }}>
                Offres et services
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 0, height: '20px' }}>
              <span style={{ width: '308.11px', height: '20px', fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                Gérez vos Offres .
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="dt-tabs" style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px 24px',
          width: '100%',
          height: '55px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', padding: 0, gap: '32px', width: '100%', height: '54px' }}>
            {[
              { key: 'ALL', label: `Toutes (${tenders.length})` },
              { key: 'OPEN', label: `En ligne (${tenders.filter(t => t.status === 'OPEN').length})` },
              { key: 'CLOSED', label: `Conclus (${tenders.filter(t => t.status === 'CLOSED').length})` },
              { key: 'DEMANDES', label: 'Demandes' }
            ].map((tab) => (
              <div 
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '16px 0px',
                  height: '54px',
                  borderBottom: statusFilter === tab.key ? '2px solid #0050CB' : 'none',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  fontWeight: statusFilter === tab.key ? 600 : 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: statusFilter === tab.key ? '#0050CB' : '#64748B',
                  textAlign: 'center',
                }}>
                  {tab.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="dt-table-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 0, width: '100%', height: '367px', overflowY: 'auto' }}>
          {/* Table Header */}
          <div className="dt-table-head" style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '47px',
            background: 'rgba(248, 250, 252, 0.5)',
            borderBottom: '1px solid #F1F5F9',
          }}>
            {[
              { label: 'PRODUIT', width: '364.09px' },
              { label: 'TYPE', width: '156.28px' },
              { label: 'STATUT', width: '161.17px' },
              { label: 'DATE DE PUBLICATION', width: '243.08px' },
              { label: 'ACTIONS', width: '181.55px', align: 'right' }
            ].map((col, idx) => (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: col.align === 'right' ? 'flex-end' : 'flex-start',
                padding: '16px 24px',
                width: col.width,
                height: '46px',
                boxSizing: 'border-box'
              }}>
                <span style={{ fontWeight: 700, fontSize: '11px', lineHeight: '13px', letterSpacing: '0.55px', textTransform: 'uppercase', color: '#94A3B8' }}>
                  {col.label}
                </span>
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Aucun résultat trouvé</div>
            ) : (
              filtered.map((row: any) => (
                <div key={row._id} className="dt-row" style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  height: '81px',
                  borderBottom: '1px solid #F1F5F9',
                }}>
                  {/* Produit */}
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0 24px', gap: '16px', width: '364.09px', boxSizing: 'border-box' }}>
                    <div style={{ width: '32px', height: '32px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' }}>
                      <img 
                        src={getAbsoluteUrl(row.attachments?.[0]?.url || row.attachments?.[0]?.path || row.imageUrl, '/assets/images/Home.png')} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px', color: '#0F172A' }}>{row.title}</span>
                      <span style={{ fontWeight: 400, fontSize: '12px', lineHeight: '16px', color: '#64748B' }}>{row.categoryName}</span>
                    </div>
                  </div>

                  {/* Type */}
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', width: '156.28px', boxSizing: 'border-box' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px', color: '#0F172A' }}>Service freelance</span>
                  </div>

                  {/* Statut */}
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', width: '161.17px', boxSizing: 'border-box' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 12px',
                      background: row.status === 'OPEN' ? '#F0FDF4' : '#F1F5F9',
                      borderRadius: '9999px',
                      width: 'fit-content'
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '11px', lineHeight: '13px', letterSpacing: '-0.275px', textTransform: 'uppercase', color: row.status === 'OPEN' ? '#16A34A' : '#64748B' }}>
                        {row.status === 'OPEN' ? 'EN LIGNE' : 
                         row.status === 'AWARDED' ? 'ATTRIBUÉ' : 
                         row.status === 'CLOSED' ? 'FERMÉ' : row.status}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px', width: '243.08px', boxSizing: 'border-box' }}>
                    <span style={{ fontWeight: 400, fontSize: '14px', lineHeight: '20px', color: '#64748B' }}>{formatDate(row.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '0 24px', width: '181.55px', boxSizing: 'border-box' }}>
                    <button 
                      onClick={() => router.push(`/dashboard/tenders/${row._id}`)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '6px 12px',
                        background: '#EFF6FF',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#0050CB',
                        fontWeight: 600,
                        fontSize: '12px'
                      }}
                    >
                      Voir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="dt-footer" style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          width: '100%',
          height: '69px',
          borderTop: '1px solid #F1F5F9',
        }}>
          <Link href="/tenders" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', lineHeight: '20px', color: '#0050CB' }}>
              Voir toutes les Offres
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 6H11M11 6L6 1M11 6L6 11" stroke="#0050CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
