'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import useAuth from '@/hooks/useAuth';
import { DashboardKeyframes, DetailPageSkeleton, ConfirmDialog } from '@/components/dashboard/dashboardHelpers';
import { 
  BsLaptop, 
  BsTag, 
  BsBoxSeam, 
  BsPencil, 
  BsTrash, 
  BsArrowLeft 
} from 'react-icons/bs';
import './direct-sale-details-styles.css';

export default function DirectSaleDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const { isLogged } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useCreateSocket() || {};

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!socket || !id) return;
    const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['direct-sale', id] });
    socket.on('newListingCreated', handleRefetch);
    socket.on('notification', handleRefetch);
    return () => {
      socket.off('newListingCreated', handleRefetch);
      socket.off('notification', handleRefetch);
    };
  }, [socket, id, queryClient]);

  const { data: sale, isLoading: loading } = useQuery({
    queryKey: ['direct-sale', id],
    queryFn: async () => {
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      const r = await DirectSaleAPI.getDirectSaleById(id);
      return r.data || r;
    },
    enabled: isLogged && !!id,
    staleTime: 60000,
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      await DirectSaleAPI.delete(id);
      router.push('/dashboard/direct-sales');
    } catch (e) { console.error(e); }
    finally { setDeleting(false); setDeleteDialogOpen(null as any); }
  };

  if (loading) return <DetailPageSkeleton accentColor="var(--primary-ds-color)" />;

  if (!sale) return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <p>Vente directe non trouvée</p>
      <button onClick={() => router.push('/dashboard/direct-sales')}>Retour</button>
    </div>
  );

  const category = typeof sale.productCategory === 'object' ? sale.productCategory?.name : sale.productCategory;
  const brand = sale.brand || 'Apple'; // Mocking brand as in design if missing
  const avail = sale.quantity === 0 ? 'Illimité' : `${Math.max(0, (sale.quantity || 0) - (sale.soldQuantity || 0))} disponible`;
  const views = sale.viewsCount || 45; // Mocking views as in design if missing

  return (
    <div className="figma-dsd-main">
      <DashboardKeyframes />
      
      {/* Header Area */}
      <header className="figma-dsd-header">
        <div className="figma-dsd-title-group">
          <button 
            onClick={() => router.push('/dashboard/direct-sales')}
            style={{ 
              background: 'none', border: 'none', color: '#64748B', display: 'flex', 
              alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px',
              padding: 0, fontSize: '14px'
            }}
          >
            <BsArrowLeft /> Retour aux ventes
          </button>
          <h1 className="figma-dsd-title">{sale.title}</h1>
          <div className="figma-dsd-status-badge">
            <span className="figma-dsd-status-dot"></span>
            En ligne
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="figma-dsd-columns">
        {/* Left Column */}
        <div className="figma-dsd-left-col">
          <div className="figma-dsd-hero-card">
            <img 
              src={sale.thumbs?.[0]?.url || '/assets/img/logo.png'} 
              alt={sale.title} 
              className="figma-dsd-hero-img" 
            />
          </div>

          <div className="figma-dsd-details-card">
            <h3 className="figma-dsd-section-title">Détails du produit</h3>
            
            <div className="figma-dsd-grid-info">
              <div className="figma-dsd-info-item">
                <span className="figma-dsd-info-label">CATÉGORIE</span>
                <div className="figma-dsd-info-value">
                  <BsLaptop color="#0050CB" />
                  {category || 'Informatique'}
                </div>
              </div>
              <div className="figma-dsd-info-item">
                <span className="figma-dsd-info-label">MARQUE</span>
                <div className="figma-dsd-info-value">{brand}</div>
              </div>
              <div className="figma-dsd-info-item">
                <span className="figma-dsd-info-label">STOCK</span>
                <div className="figma-dsd-info-value">{avail}</div>
              </div>
            </div>

            <div className="figma-dsd-divider"></div>

            <div className="figma-dsd-info-item" style={{ gap: '12px' }}>
              <span className="figma-dsd-info-label">DESCRIPTION</span>
              <p className="figma-dsd-description">
                {sale.description || "Lorem ipsum dolor sit amet consectetur. At auctor ullamcorper donec semper."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="figma-dsd-right-col">
          <div className="figma-dsd-info-card">
            <h3 className="figma-dsd-section-title">Informations de la vente</h3>
            
            <div className="figma-dsd-stats">
              <div className="figma-dsd-stat-row">
                <span className="figma-dsd-stat-label">Prix de vente</span>
                <span className="figma-dsd-stat-value">{(sale.price || 0).toLocaleString()} Da</span>
              </div>
              <div className="figma-dsd-stat-row">
                <span className="figma-dsd-stat-label">Statut</span>
                <span className="figma-dsd-stat-value figma-dsd-stat-value-green">En ligne</span>
              </div>
              <div className="figma-dsd-stat-row">
                <span className="figma-dsd-stat-label">Date de publication</span>
                <span className="figma-dsd-stat-value">
                  {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '12 Mai 2026'}
                </span>
              </div>
              <div className="figma-dsd-stat-row" style={{ borderBottom: 'none' }}>
                <span className="figma-dsd-stat-label">Vues</span>
                <span className="figma-dsd-stat-value">{views} personnes</span>
              </div>
            </div>

            <div className="figma-dsd-actions">
              <button 
                className="figma-dsd-btn-edit"
                onClick={() => router.push(`/dashboard/direct-sales/edit/${id}`)}
              >
                Modifier l'annonce
              </button>
              <button 
                className="figma-dsd-btn-delete"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Supprimer l'annonce
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Supprimer l'annonce"
        message="Êtes-vous sûr de vouloir supprimer cette vente directe ? Cette action est irréversible."
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer'}
        cancelLabel="Annuler"
        danger
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
