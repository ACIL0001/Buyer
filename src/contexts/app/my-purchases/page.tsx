"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { DirectSaleAPI } from "@/app/api/direct-sale";
import useAuth from "@/hooks/useAuth";
import { AxiosInterceptor } from '@/app/api/AxiosInterceptor';
import { SnackbarProvider } from 'notistack';
import RequestProvider from "@/contexts/RequestContext";
import Chat from "@/chat/Chat";

interface Purchase {
  _id: string;
  directSale: {
    _id: string;
    title: string;
    thumbs?: Array<{ url: string }>;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  seller?: {
    firstName: string;
    lastName: string;
  };
}

export default function MyPurchasesPage() {
  const router = useRouter();
  const { initializeAuth, isLogged } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
    if (isLogged) {
      fetchPurchases();
    }
  }, [initializeAuth, isLogged]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await DirectSaleAPI.getMyPurchases();
      setPurchases(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching purchases:", err);
      setError("Impossible de charger vos achats");
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'CANCELLED':
        return '#dc3545';
      case 'COMPLETED':
        return '#0063b1';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmé';
      case 'PENDING':
        return 'En attente';
      case 'CANCELLED':
        return 'Annulé';
      case 'COMPLETED':
        return 'Terminé';
      default:
        return status;
    }
  };

  const getImageUrl = (purchase: Purchase): string => {
    if (purchase.directSale?.thumbs && purchase.directSale.thumbs.length > 0 && purchase.directSale.thumbs[0].url) {
      return purchase.directSale.thumbs[0].url;
    }
    return "/assets/images/logo-dark.png";
  };

  if (!isLogged) {
    return (
      <>
        <AxiosInterceptor>
          <RequestProvider>
            <SnackbarProvider maxSnack={3}>
              <Header />
              <main style={{ minHeight: '80vh', paddingTop: '100px', paddingBottom: '50px' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: '#333' }}>
                    Connexion requise
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
                    Veuillez vous connecter pour voir vos achats
                  </p>
                  <button
                    onClick={() => router.push('/auth/login')}
                    style={{
                      padding: '12px 24px',
                      background: '#0063b1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    Se connecter
                  </button>
                </div>
              </main>
              <Footer />
              <Chat />
            </SnackbarProvider>
          </RequestProvider>
        </AxiosInterceptor>
      </>
    );
  }

  return (
    <>
      <AxiosInterceptor>
        <RequestProvider>
          <SnackbarProvider maxSnack={3}>
            <Header />
            <main style={{ minHeight: '80vh', paddingTop: '100px', paddingBottom: '50px' }}>
              <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0063b1', marginBottom: '15px' }}>
                    Mes Achats
                  </h1>
                  <p style={{ fontSize: '1.1rem', color: '#666' }}>
                    Historique de vos commandes de ventes directes
                  </p>
                </div>

                {/* Loading State */}
                {loading && (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{
                      display: 'inline-block',
                      width: '50px',
                      height: '50px',
                      border: '4px solid #f3f3f3',
                      borderTop: '4px solid #0063b1',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ marginTop: '20px', color: '#666' }}>Chargement de vos achats...</p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <p style={{ color: '#dc3545', fontSize: '1.1rem', marginBottom: '20px' }}>{error}</p>
                    <button
                      onClick={fetchPurchases}
                      style={{
                        padding: '12px 24px',
                        background: '#0063b1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      Réessayer
                    </button>
                  </div>
                )}

                {/* Purchases List */}
                {!loading && !error && (
                  <>
                    {purchases.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }}></i>
                        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
                          Vous n'avez effectué aucun achat pour le moment
                        </p>
                        <button
                          onClick={() => router.push('/direct-sale')}
                          style={{
                            padding: '12px 24px',
                            background: '#0063b1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '600'
                          }}
                        >
                          Parcourir les ventes directes
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {purchases.map((purchase) => (
                          <div
                            key={purchase._id}
                            style={{
                              background: 'white',
                              borderRadius: '12px',
                              padding: '25px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              border: '1px solid #e0e0e0',
                              display: 'flex',
                              gap: '20px',
                              alignItems: 'center'
                            }}
                          >
                            {/* Image */}
                            <div
                              onClick={() => router.push(`/direct-sale/${purchase.directSale._id}`)}
                              style={{
                                width: '120px',
                                height: '120px',
                                background: '#f5f5f5',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              <img
                                src={getImageUrl(purchase)}
                                alt={purchase.directSale.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/images/logo-dark.png';
                                }}
                              />
                            </div>

                            {/* Details */}
                            <div style={{ flex: 1 }}>
                              <h3
                                onClick={() => router.push(`/direct-sale/${purchase.directSale._id}`)}
                                style={{
                                  fontSize: '1.3rem',
                                  fontWeight: '600',
                                  marginBottom: '10px',
                                  color: '#333',
                                  cursor: 'pointer',
                                  transition: 'color 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#0063b1'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
                              >
                                {purchase.directSale.title}
                              </h3>
                              <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>
                                  <strong>Quantité:</strong> {purchase.quantity}
                                </p>
                                <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>
                                  <strong>Prix unitaire:</strong> {purchase.unitPrice.toLocaleString()} DA
                                </p>
                                {purchase.seller && (
                                  <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>
                                    <strong>Vendeur:</strong> {purchase.seller.firstName} {purchase.seller.lastName}
                                  </p>
                                )}
                              </div>
                              <p style={{ fontSize: '0.85rem', color: '#999', margin: 0 }}>
                                Commandé le {new Date(purchase.createdAt).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>

                            {/* Status and Total */}
                            <div style={{ textAlign: 'right', minWidth: '150px' }}>
                              <div
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 15px',
                                  background: getStatusColor(purchase.status),
                                  color: 'white',
                                  borderRadius: '20px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  marginBottom: '15px'
                                }}
                              >
                                {getStatusLabel(purchase.status)}
                              </div>
                              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0063b1', margin: 0 }}>
                                {purchase.totalPrice.toLocaleString()} DA
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
            <Footer />
            <Chat />
            <style jsx global>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </SnackbarProvider>
        </RequestProvider>
      </AxiosInterceptor>
    </>
  );
}

