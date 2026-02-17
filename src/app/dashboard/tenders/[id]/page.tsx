'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  Container,
  Grid,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TendersAPI } from '@/services/tenders';
import { OffersAPI } from '@/services/offers';
import useAuth from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { MdExpandMore, MdDelete, MdCheckCircle, MdInfo, MdTimer } from 'react-icons/md';

enum TENDER_STATUS {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    AWARDED = 'AWARDED',
    ARCHIVED = 'ARCHIVED'
}

export default function TenderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { auth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [tender, setTender] = useState<any>(null);
  const [tenderBids, setTenderBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [showBidDetailsDialog, setShowBidDetailsDialog] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(true);

  const fetchTenderDetails = useCallback(async () => {
    try {
      const response = await TendersAPI.getTenderById(id);
      console.log('📞 Tender response:', response);
      if (response && response.data) {
          console.log('📞 Contact Number:', response.data.contactNumber);
          setTender(response.data);
      }
    } catch (error) {
      console.error('Error fetching tender details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTenderBids = useCallback(async () => {
    if (!tender) return;

    try {
      const response = await TendersAPI.getTenderBids(id);
      let bidsArray: any[] = [];
      
      if (response && response.data && Array.isArray(response.data)) {
          bidsArray = response.data;
      } else if (Array.isArray(response)) {
        bidsArray = response;
      }
      
      const isOwner = (tender.owner?._id || tender.owner) == auth?.user?._id;

      if (isOwner) {
         // Show all bids for owner
         setTenderBids(bidsArray);
      } else if (auth?.user?._id && bidsArray.length > 0) {
        // Filter to show only the current user's bids
        const currentUserId = auth.user._id;
        const userBids = bidsArray.filter((bid: any) => {
          const bidderId = bid.bidder?._id || bid.bidder || bid.user?._id || bid.user;
          return String(bidderId) === String(currentUserId);
        });
        setTenderBids(userBids);
      } else {
        setTenderBids([]);
      }
    } catch (error) {
      console.error('Error fetching tender bids:', error);
      setTenderBids([]);
    }
  }, [id, auth?.user?._id, tender]);

  useEffect(() => {
    if (id) {
      fetchTenderDetails();
    }
  }, [id, fetchTenderDetails]);

  useEffect(() => {
    if (tender) {
        fetchTenderBids();
    }
  }, [tender, fetchTenderBids]);

  const handleAcceptBid = async (bid: any) => {
      try {
          await OffersAPI.acceptOffer(bid._id);
          enqueueSnackbar('Offre acceptée avec succès', { variant: 'success' });
          fetchTenderBids(); // Refresh list
      } catch (error) {
          console.error('Error accepting bid:', error);
          enqueueSnackbar('Erreur lors de l\'acceptation de l\'offre', { variant: 'error' });
      }
  };

  const calculateTimeRemaining = () => {
    if (!tender) return null;
    const now = new Date().getTime();
    const endTime = new Date(tender.endingAt).getTime();
    const timeLeft = endTime - now;

    if (timeLeft <= 0) return 'Terminé';

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
         <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!tender) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Appel d'offres non trouvé
          </Typography>
          <Button onClick={() => router.push('/dashboard/tenders')} sx={{ mt: 2 }}>
            Retour à la liste
          </Button>
        </Box>
      </Container>
    );
  }

  const evaluationType = tender.evaluationType || 'MOINS_DISANT';
  const timeRemaining = calculateTimeRemaining();
  const isOwner = (tender.owner?._id || tender.owner) == auth?.user?._id;

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
      <Stack mb={3}>
        <Typography variant="h4">{tender.title}</Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              {tender.status === TENDER_STATUS.OPEN && (
                <Chip icon={<MdTimer />} label={`Temps restant: ${timeRemaining}`} color="warning" variant="outlined" />
              )}
            </Stack>
            <Typography variant="body1" paragraph>
              {tender.description}
            </Typography>
          </Card>

          <Card sx={{ p: 3, mb: 3 }}>
            <Accordion 
                expanded={expandedDetails} 
                onChange={(e, isExpanded) => setExpandedDetails(isExpanded)}
                sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}
            >
                <AccordionSummary expandIcon={<MdExpandMore />}>
                    <Typography variant="h6">Détails de l'appel d'offres</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">Date de début</Typography>
                            <Typography variant="body1">{formatDate(tender.startingAt)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary">Date de fin</Typography>
                            <Typography variant="body1">{formatDate(tender.endingAt)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">Localisation</Typography>
                            <Typography variant="body1">{tender.place || tender.location}, {tender.wilaya}</Typography>
                        </Grid>
                        {tender.category && (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body2" color="text.secondary">Catégorie</Typography>
                                <Typography variant="body1">{typeof tender.category === 'object' ? tender.category.name : tender.category}</Typography>
                            </Grid>
                        )}
                        {tender.contactNumber && (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body2" color="text.secondary">Numéro de contact</Typography>
                                <Typography variant="body1">{tender.contactNumber}</Typography>
                            </Grid>
                        )}
                    </Grid>
                </AccordionDetails>
            </Accordion>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
            <Alert 
              severity={evaluationType === 'MIEUX_DISANT' ? 'info' : 'success'}
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle2">
                Type: {evaluationType === 'MIEUX_DISANT' ? 'Mieux Disant (Qualité)' : 'Moins Disant (Prix)'}
              </Typography>
            </Alert>
        </Grid>
      </Grid>
    </Container>
  );
}
