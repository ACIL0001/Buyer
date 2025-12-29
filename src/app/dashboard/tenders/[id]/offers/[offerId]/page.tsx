'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  Container,
  Grid,
  Typography,
  Stack,
  Chip,
  Button,
  Avatar,
  Paper,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { TendersAPI } from '@/services/tenders';
import { OffersAPI } from '@/services/offers';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { MdArrowBack, MdCheckCircle, MdCancel, MdAttachMoney, MdSchedule, MdPerson } from 'react-icons/md';

export default function OfferDetailPage() {
  const params = useParams();
  const tenderId = params?.id as string;
  const offerId = params?.offerId as string;
  const router = useRouter();
  const { auth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [tender, setTender] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching data for:', { tenderId, offerId });
      
      // Fetch tender first
      const tenderData = await TendersAPI.getTenderById(tenderId);
      console.log('Fetched Tender Data:', tenderData);
      setTender(tenderData);

      // Try to fetch specific bid
      let offerData;
      try {
        offerData = await TendersAPI.getTenderBidById(offerId);
        console.log('Fetched Offer Data (Direct):', offerData);
      } catch (err) {
        console.warn('Direct bid fetch failed, falling back to list:', err);
        // Fallback: fetch all bids for this tender and find the one we want
        // This is useful if the backend doesn't have a specific "get bid by id" endpoint exposed
        const allBids = await TendersAPI.getTenderBids(tenderId);
        if (Array.isArray(allBids)) {
            offerData = allBids.find((bid: any) => bid._id === offerId);
        }
        console.log('Fetched Offer Data (Fallback):', offerData);
      }
      
      if (offerData) {
        setOffer(Array.isArray(offerData) ? offerData[0] : offerData);
      } else {
        throw new Error("Offer not found");
      }

      console.log('Fetched Tender Data:', tenderData);
      console.log('Fetched Offer Data:', offerData);

      setTender(tenderData);
      // Ensure offerData is handled correctly if it returns an array
      setOffer(Array.isArray(offerData) ? offerData[0] : offerData);
    } catch (error) {
      console.error('Error fetching data:', error);
      enqueueSnackbar('Erreur lors du chargement des données', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [tenderId, offerId, enqueueSnackbar]);

  useEffect(() => {
    if (tenderId && offerId) {
      fetchData();
    } else {
        console.warn('Missing tenderId or offerId:', { tenderId, offerId });
    }
  }, [tenderId, offerId, fetchData]);

  const handleAcceptOffer = async () => {
    try {
      setProcessing(true);
      await OffersAPI.acceptOffer(offerId);
      enqueueSnackbar('Offre acceptée avec succès', { variant: 'success' });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error accepting offer:', error);
      enqueueSnackbar('Erreur lors de l\'acceptation de l\'offre', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOffer = async () => {
    try {
        setProcessing(true);
        await OffersAPI.rejectOffer(offerId);
        enqueueSnackbar('Offre rejetée', { variant: 'info' });
        fetchData();
    } catch (error) {
        console.error('Error rejecting offer:', error);
        enqueueSnackbar('Erreur lors du rejet de l\'offre', { variant: 'error' });
    } finally {
        setProcessing(false);
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!tender || !offer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Alert severity="error">Offre ou appel d'offres introuvable.</Alert>
        <Button startIcon={<MdArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>
          Retour
        </Button>
      </Container>
    );
  }

  const isOwner = (tender.owner?._id || tender.owner) == auth?.user?._id;
  const evaluationType = tender.evaluationType || 'MOINS_DISANT';

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
        <Button 
            startIcon={<MdArrowBack />} 
            onClick={() => router.push(`/dashboard/tenders/${tenderId}`)}
            sx={{ mb: 3 }}
        >
            Retour à l'appel d'offres
        </Button>

      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Détails de l'offre
        </Typography>
        <Chip 
            label={offer.status === 'pending' ? 'En attente' : offer.status === 'accepted' ? 'Acceptée' : 'Rejetée'} 
            color={offer.status === 'pending' ? 'warning' : offer.status === 'accepted' ? 'success' : 'error'} 
            variant="filled"
            sx={{ 
              fontWeight: 'bold',
              borderRadius: '8px',
              paddingX: 1,
              textTransform: 'uppercase'
            }}
        />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card 
            sx={{ 
              p: 4, 
              mb: 3, 
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', 
              borderRadius: '16px',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.1)' }
            }}
          >
            <Typography variant="h6" gutterBottom color="text.secondary" fontWeight={600}>
                Proposition
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            {evaluationType === 'MIEUX_DISANT' ? (
                 <Paper 
                    variant="outlined" 
                    sx={{ 
                        p: 3, 
                        bgcolor: 'background.default', 
                        whiteSpace: 'pre-wrap', 
                        minHeight: 150,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                 >
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>{offer.proposal || 'Aucune proposition textuelle fournie.'}</Typography>
                 </Paper>
            ) : (
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        p: 3, 
                        borderRadius: '12px', 
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1)
                    }}
                >
                    <MdAttachMoney size={32} color={theme.palette.primary.main} />
                    <Box ml={2}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase">
                            Montant proposé
                        </Typography>
                        <Typography variant="h3" color="primary" fontWeight="800">
                            {(offer.price || offer.bidAmount || offer.amount || 0).toLocaleString()} <Typography component="span" variant="h5" color="text.secondary">DA</Typography>
                        </Typography>
                    </Box>
                </Box>
            )}

            <Box sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Paper 
                            variant="outlined" 
                            sx={{ 
                                p: 2, 
                                display: 'flex', 
                                alignItems: 'center', 
                                borderRadius: '12px',
                                borderColor: 'divider'
                            }}
                        >
                            <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, mr: 2 }}>
                                <MdSchedule />
                            </Avatar>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    DATE DE SOUMISSION
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    {(offer.createdAt || offer.date) && !isNaN(new Date(offer.createdAt || offer.date).getTime()) 
                                        ? new Date(offer.createdAt || offer.date).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })
                                        : 'Date invalide'}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
          </Card>

          {isOwner && offer.status === 'pending' && (
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button 
                    variant="outlined" 
                    color="error"
                    size="large"
                    startIcon={<MdCancel />}
                    onClick={handleRejectOffer}
                    disabled={processing}
                    sx={{ px: 4, borderRadius: '8px' }}
                  >
                      Refuser
                  </Button>
                  <Button 
                    variant="contained" 
                    color="success"
                    size="large"
                    startIcon={<MdCheckCircle />}
                    onClick={handleAcceptOffer}
                    disabled={processing}
                    sx={{ px: 4, borderRadius: '8px', boxShadow: '0 4px 14px 0 rgba(0,167,111,0.39)' }}
                  >
                      Accepter
                  </Button>
              </Stack>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
            <Card 
                sx={{ 
                    p: 3, 
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', 
                    borderRadius: '16px'
                }}
            >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                    <MdPerson /> Soumissionnaire
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {offer?.user?._id ? (
                  <Link href={`/profile/${offer?.user?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                      <Avatar 
                        src={offer?.user?.avatar?.path ? `https://mazadclick-server.onrender.com/static/uploads/${offer.user.avatar.path}` : ''} 
                        alt={offer?.user?.firstName}
                        sx={{ width: 56, height: 56 }}
                      >
                        {offer?.user?.firstName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {offer?.user?.firstName} {offer?.user?.lastName}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                             {offer?.user?.email}
                          </Typography>
                          {offer?.user?.phone && (
                            <Chip label={offer.user.phone} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Link>
                ) : (
                  <Stack spacing={3} alignItems="center" textAlign="center">
                      <Avatar 
                          src={offer.user?.avatar?.url || offer.bidder?.avatar?.url} 
                          alt={offer.user?.firstName || offer.bidder?.firstName}
                          sx={{ width: 80, height: 80, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: `2px solid ${theme.palette.primary.light}` }}
                      >
                          {(offer.user?.firstName || offer.bidder?.firstName)?.[0]}
                      </Avatar>
                      <Box>
                          <Typography variant="h6" fontWeight="bold">
                              {offer.user?.firstName || offer.bidder?.firstName} {offer.user?.lastName || offer.bidder?.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {offer.user?.email || offer.bidder?.email}
                          </Typography>
                          <Chip 
                              label={offer.user?.phone || offer.bidder?.phone || offer.phone || 'Tél non disponible'} 
                              size="small" 
                              variant="outlined" 
                              sx={{ mt: 1 }} 
                          />
                      </Box>
                  </Stack>
                )}
            </Card>

            <Card 
                sx={{ 
                    p: 3, 
                    mt: 3, 
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', 
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
                }}
            >
                 <Typography variant="h6" gutterBottom fontWeight={600}>Info Appel d'offres</Typography>
                 <Divider sx={{ mb: 2 }} />
                 
                 <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>TITRE</Typography>
                    <Typography variant="body1" fontWeight={500} gutterBottom sx={{ lineHeight: 1.4 }}>{tender.title}</Typography>
                 </Box>
                 
                 <Box mb={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>BUDGET</Typography>
                    <Typography variant="h5" color="text.primary" fontWeight={700}>
                        {(tender.budget || tender.maxBudget || tender.estimatedBudget || tender.amount || 0).toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">DA</Typography>
                    </Typography>
                 </Box>

                 <Button 
                    variant="outlined" 
                    fullWidth 
                    color="primary"
                    sx={{ borderRadius: '8px' }}
                    onClick={() => router.push(`/dashboard/tenders/${tenderId}`)}
                >
                    Voir l'appel d'offres
                 </Button>
            </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
