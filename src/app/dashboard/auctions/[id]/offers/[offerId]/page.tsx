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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { AuctionsAPI } from '@/services/auctions';
import { OffersAPI } from '@/services/offers';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { MdArrowBack, MdCheckCircle, MdCancel, MdAttachMoney, MdSchedule, MdPerson, MdGavel } from 'react-icons/md';
import { normalizeImageUrl } from '@/utils/url';

export default function AuctionOfferDetailPage() {
  const params = useParams();
  const auctionId = params?.id as string;
  const offerId = params?.offerId as string;
  const router = useRouter();
  const { auth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [auction, setAuction] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch auction details
      const auctionResponse = await AuctionsAPI.getAuctionById(auctionId);
      const auctionData = auctionResponse.data || auctionResponse;
      setAuction(auctionData);

      // Fetch all offers for this auction (participants)
      const offersResponse = await OffersAPI.getOffersByBidId(auctionId);
      const offersData = offersResponse.data || (Array.isArray(offersResponse) ? offersResponse : []);
      
      setParticipants(offersData);

      // Find the specific offer
      const specificOffer = offersData.find((o: any) => o._id === offerId);
      if (specificOffer) {
        setOffer(specificOffer);
      } else {
        // If not in the list (unlikely but possible if paginated or restricted), 
        // we'd ideally have a getOfferById, but we'll fallback to an error
        console.warn('Offer not found in participants list');
      }

    } catch (error) {
      console.error('Error fetching auction offer data:', error);
      enqueueSnackbar('Erreur lors du chargement des données', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [auctionId, offerId, enqueueSnackbar]);

  useEffect(() => {
    if (auctionId && offerId) {
      fetchData();
    }
  }, [auctionId, offerId, fetchData]);


  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!auction || !offer) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Alert severity="error">Offre ou Enchère introuvable.</Alert>
        <Button startIcon={<MdArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>
          Retour
        </Button>
      </Container>
    );
  }

  const isOwner = (auction.owner?._id || auction.owner) == auth?.user?._id;
  const isWinner = auction.winner?._id === offer.user?._id || auction.winner === offer.user?._id;
  const isClosed = auction.status === 'CLOSED' || auction.status === 'ACCEPTED';

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
      <Button 
        startIcon={<MdArrowBack />} 
        onClick={() => router.push(`/dashboard/auctions/${auctionId}`)}
        sx={{ mb: 3 }}
      >
        Retour à l'enchère
      </Button>

      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Détails de l'offre d'enchère
        </Typography>
        <Stack direction="row" spacing={1}>
          {isWinner && (
            <Chip 
              icon={<MdCheckCircle />}
              label="GAGNANT" 
              color="success" 
              variant="filled"
              sx={{ fontWeight: 'bold', borderRadius: '8px' }}
            />
          )}
          <Chip 
            label={isClosed ? 'CLÔTURÉE' : 'EN COURS'} 
            color={isClosed ? 'error' : 'info'} 
            variant="outlined"
            sx={{ fontWeight: 'bold', borderRadius: '8px' }}
          />
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card 
            sx={{ 
              p: 4, 
              mb: 3, 
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', 
              borderRadius: '16px'
            }}
          >
            <Typography variant="h6" gutterBottom color="text.secondary" fontWeight={600}>
                Montant de l'offre
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
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
              <MdGavel size={32} color={theme.palette.primary.main} />
              <Box ml={2}>
                <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase">
                  Offre proposée
                </Typography>
                <Typography variant="h3" color="primary" fontWeight="800">
                  {(offer.price || 0).toLocaleString()} <Typography component="span" variant="h5" color="text.secondary">DA</Typography>
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  borderRadius: '12px'
                }}
              >
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, mr: 2 }}>
                  <MdSchedule />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    DATE DE L'OFFRE
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {formatDate(offer.createdAt)}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Card>

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
              <MdPerson /> Enchérisseur
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Link href={`/profile/${offer?.user?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                <Avatar 
                  src={normalizeImageUrl(offer?.user?.photoURL || offer?.user?.avatar)} 
                  alt={offer?.user?.firstName}
                  sx={{ width: 56, height: 56 }}
                >
                  {offer?.user?.firstName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {offer?.user?.firstName} {offer?.user?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {offer?.user?.email}
                  </Typography>
                  {offer?.user?.phone && (
                    <Chip label={offer?.user?.phone} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }} />
                  )}
                </Box>
              </Stack>
            </Link>
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
            <Typography variant="h6" gutterBottom fontWeight={600}>Info Enchère</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>TITRE</Typography>
              <Typography variant="body1" fontWeight={500}>{auction.title}</Typography>
            </Box>
            <Box mb={3}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>PRIX ACTUEL</Typography>
              <Typography variant="h5" color="text.primary" fontWeight={700}>
                {(auction.currentPrice || auction.startingPrice || 0).toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">DA</Typography>
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={() => router.push(`/dashboard/auctions/${auctionId}`)}
            >
              Voir l'enchère complète
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Tous les participants ({participants.length})
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Participant</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Montant</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((p, idx) => {
                const isCurrent = p._id === offerId;
                const isWinnerP = auction.winner?._id === p.user?._id || auction.winner === p.user?._id;
                
                return (
                  <TableRow 
                    key={p._id || idx} 
                    hover
                    sx={isCurrent ? { bgcolor: alpha(theme.palette.primary.main, 0.05) } : {}}
                  >
                    <TableCell>
                      <Link 
                        href={`/profile/${p.user?._id}`} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ '&:hover': { opacity: 0.8, cursor: 'pointer' } }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                            {p.user?.firstName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                              {p.user?.firstName} {p.user?.lastName}
                              {isCurrent && <Chip label="Cette offre" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />}
                            </Typography>
                          </Box>
                        </Stack>
                      </Link>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                        {(p.price || p.bidAmount || 0).toLocaleString()} DA
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(p.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {isWinnerP ? (
                        <Chip label="Gagnant" size="small" color="success" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  );
}
