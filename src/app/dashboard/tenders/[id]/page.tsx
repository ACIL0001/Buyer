'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import { DetailPageSkeleton } from '@/components/dashboard/dashboardHelpers';
import { getAbsoluteUrl } from '@/utils/url';

function fmtDate(d: any) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

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
      <button onClick={() => router.push('/dashboard/tenders')} style={{ marginTop: 16, padding: '10px 22px', background: 'var(--primary-tender-color)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour</button>
    </div>
  );

  const category = typeof tender.category === 'object' ? tender.category?.name : tender.category;

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '1150px', 
      fontFamily: "'Inter', sans-serif",
      background: '#F8FAFC'
    }}>
      
      {/* --- Breadcrumb / Header Area --- */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '0px',
        position: 'absolute',
        width: '976px',
        height: '100px',
        left: '31px',
        top: '20px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0px', gap: '8px', width: '347.14px' }}>
          <h1 style={{ width: '100%', fontWeight: 700, fontSize: '36px', lineHeight: '44px', margin: 0, color: '#191B24', letterSpacing: '-0.72px', display: 'flex', alignItems: 'center' }}>
            {tender.title}
          </h1>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '2px 0px 0px', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '4px 12px', background: '#DCFCE7', borderRadius: '9999px', height: '22px', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', background: '#15803D', borderRadius: '50%' }} />
              <span style={{ fontWeight: 600, fontSize: '12px', lineHeight: '12px', color: '#15803D', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                {tender.status === 'OPEN' ? 'En ligne' : 
                 tender.status === 'AWARDED' ? 'Attribué' : 
                 tender.status === 'CLOSED' ? 'Fermé' : tender.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Left Column: Product Visuals --- */}
      <div style={{
        position: 'absolute',
        width: '559.33px',
        height: '400px',
        left: '31px',
        top: '160px',
        background: '#FFFFFF',
        boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <img 
          src={getAbsoluteUrl(tender.attachments?.[0]?.url || tender.attachments?.[0]?.path || tender.imageUrl, '/assets/images/Home.png')} 
          alt={tender.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </div>

      {/* --- Right Column: Sidebar Info & Actions --- */}
      <div style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '24px',
        gap: '24px',
        position: 'absolute',
        width: '392.67px',
        height: 'auto', // Adjusted after removing buttons
        left: '614px',
        top: '160px',
        background: '#FFFFFF',
        border: '1px solid #F1F5F9',
        boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
      }}>
        <h3 style={{ width: '342.67px', height: '28px', fontWeight: 600, fontSize: '20px', lineHeight: '28px', margin: 0, color: '#191B24', letterSpacing: '-0.2px', marginBottom: '8px' }}>
          Informations sur l’offre
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', width: '342.67px', gap: '12px' }}>
          {/* Demandes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '52px', borderBottom: '1px solid #F8FAFC', padding: '8px 0' }}>
            <span style={{ fontWeight: 400, fontSize: '16px', color: '#505F76' }}>Demandes</span>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#191B24' }}>{tender.participantsCount || 0}</span>
          </div>
          {/* Budget */}
          {tender.maxBudget && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '52px', borderBottom: '1px solid #F8FAFC', padding: '8px 0' }}>
              <span style={{ fontWeight: 400, fontSize: '16px', color: '#505F76' }}>Budget</span>
              <span style={{ fontWeight: 700, fontSize: '16px', color: '#0050CB' }}>{tender.maxBudget.toLocaleString()} DA</span>
            </div>
          )}
          {/* Quantité */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '52px', borderBottom: '1px solid #F8FAFC', padding: '8px 0' }}>
            <span style={{ fontWeight: 400, fontSize: '16px', color: '#505F76' }}>Quantité</span>
            <span style={{ fontWeight: 400, fontSize: '16px', color: '#191B24' }}>{tender.quantity || 'N/A'}</span>
          </div>
          {/* Statut */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '52px', borderBottom: '1px solid #F8FAFC', padding: '8px 0' }}>
            <span style={{ fontWeight: 400, fontSize: '16px', color: '#505F76' }}>Statut</span>
            <span style={{ fontWeight: 500, fontSize: '16px', color: '#16A34A' }}>
              {tender.status === 'OPEN' ? 'En ligne' : 
               tender.status === 'AWARDED' ? 'Attribué' : 
               tender.status === 'CLOSED' ? 'Fermé' : tender.status}
            </span>
          </div>
          {/* Date de publication */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '52px', borderBottom: '1px solid #F8FAFC', padding: '8px 0' }}>
            <span style={{ fontWeight: 400, fontSize: '16px', color: '#505F76' }}>Date de publication</span>
            <span style={{ fontWeight: 400, fontSize: '16px', color: '#191B24' }}>{fmtDate(tender.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* --- Details Card --- */}
      <div style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '32px 24px',
        gap: '24px',
        position: 'absolute',
        width: '559.33px',
        minHeight: '431px',
        left: '31px',
        top: '584px',
        background: '#FFFFFF',
        border: '1px solid #F1F5F9',
        boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
      }}>
        <h3 style={{ width: '100%', fontWeight: 700, fontSize: '24px', lineHeight: '32px', color: '#191B24', margin: 0, letterSpacing: '-0.2px' }}>
          {tender.title}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '12px', color: '#64748B', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            CATÉGORIE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0050CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <span style={{ fontWeight: 500, fontSize: '18px', color: '#191B24' }}>{category || 'N/A'}</span>
          </div>
        </div>

        <div style={{ width: '100%', height: '1px', background: '#F1F5F9' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <span style={{ fontWeight: 600, fontSize: '12px', color: '#64748B', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            DESCRIPTION
          </span>
          <div style={{ fontWeight: 400, fontSize: '16px', lineHeight: '28px', color: '#505F76', whiteSpace: 'pre-wrap' }}>
            {tender.description || 'Aucune description fournie pour cet appel d\'offres.'}
          </div>
        </div>
      </div>
    </div>
  );
}
