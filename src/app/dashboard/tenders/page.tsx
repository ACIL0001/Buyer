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

export default function TendersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLogged } = useAuth();
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
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '920px', // Calculated: Top (308) + Height (602) + small buffer
      fontFamily: "'Inter', sans-serif",
    }}>
      
      {/* --- STATS CARDS --- */}
      {/* Offres et services publiés */}
      <div style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '24px 24px 25px',
        gap: '4px',
        position: 'absolute',
        width: '245px',
        height: '167px',
        left: '33px', // 313 (viewport) - 280 (sidebar)
        top: '20px',  // Relative to content start
        background: '#FFFFFF',
        border: '1px solid #F8FAFC',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
      }}>
        <PublishedIcon />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 0px 0px', width: '188px', height: '32px' }}>
          <span style={{ width: '188px', height: '20px', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#64748B' }}>
            Offres et services publiés
          </span>
        </div>
        <div style={{ width: '188px', height: '36px', fontWeight: 700, fontSize: '30px', lineHeight: '36px', color: '#0F172A' }}>
          {tenders.length}
        </div>
      </div>

      {/* Demandes reçu */}
      <div style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '24px 24px 25px',
        gap: '4px',
        position: 'absolute',
        width: '245px',
        height: '167px',
        left: '308px', // 588 (viewport) - 280 (sidebar)
        top: '20px',  // Relative to content start
        background: '#FFFFFF',
        border: '1px solid #F8FAFC',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
      }}>
        <ReceivedIcon />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 0px 0px', width: '188px', height: '32px' }}>
          <span style={{ width: '188px', height: '20px', fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#64748B' }}>
            Demandes reçu
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '188px', height: '36px' }}>
          <span style={{ fontWeight: 700, fontSize: '30px', lineHeight: '36px', color: '#0F172A' }}>
            {tenders.reduce((acc, t) => acc + (t.participantsCount || 0), 0)}
          </span>
          <span style={{ fontWeight: 500, fontSize: '14px', lineHeight: '20px', color: '#EFCB6E', cursor: 'pointer' }}>
            Voir tout
          </span>
        </div>
      </div>

      {/* --- MAIN CONTAINER --- */}
      <div style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '8px 0px 0px',
        position: 'absolute',
        width: '1116px',
        height: '602px',
        left: '26px', // 306 (viewport) - 280 (sidebar)
        top: '230px', // 308 (viewport) - 196 (header) + buffer
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        borderRadius: '12px',
      }}>
        
        {/* Header Section */}
        <div style={{
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
        <div style={{
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 0, width: '100%', height: '367px', overflowY: 'auto' }}>
          {/* Table Header */}
          <div style={{
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
                <div key={row._id} style={{
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
        <div style={{
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
