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
import { TendersAPI } from '@/services/tenders';
import { OffersAPI } from '@/services/offers';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { MdArrowBack, MdCheckCircle, MdCancel, MdAttachMoney, MdSchedule, MdPerson, MdVisibility } from 'react-icons/md';
import app from '@/config';

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
  const [tenderBids, setTenderBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchTenderBids = useCallback(async () => {
    try {
      const response = await TendersAPI.getTenderBids(tenderId);
      let bidsArray: any[] = [];
      
      if (response && response.data && Array.isArray(response.data)) {
          bidsArray = response.data;
      } else if (Array.isArray(response)) {
        bidsArray = response;
      }
      
      // For participants table, we usually show all or user's own depending on role
      // But looking at the requirement, we'll follow the same logic as the main tender page
      // which shows all if owner, or just own if not? Actually the main page logic was:
      // if owner -> all, else -> only own.
      // Let's check tender owner
      const tenderResponse = await TendersAPI.getTenderById(tenderId);
      const tenderData = (tenderResponse as any).data || tenderResponse;
      const isOwner = (tenderData.owner?._id || tenderData.owner) == auth?.user?._id;

      if (isOwner) {
         setTenderBids(bidsArray);
      } else if (auth?.user?._id && bidsArray.length > 0) {
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
    }
  }, [tenderId, auth?.user?._id]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching data for:', { tenderId, offerId });
      
      // Fetch tender first
      const tenderResponse = await TendersAPI.getTenderById(tenderId);
      const tenderData = (tenderResponse as any).data || tenderResponse;
      console.log('Fetched Tender Data:', tenderData);
      setTender(tenderData);

      // Fetch all bids for context
      await fetchTenderBids();

      // Try to fetch specific bid
      let offerData;
      try {
        const bidResponse = await TendersAPI.getTenderBidById(offerId);
        offerData = (bidResponse as any).data || bidResponse;
        console.log('Fetched Offer Data (Direct):', offerData);
      } catch (err) {
        console.warn('Direct bid fetch failed, falling back to list:', err);
        const allBidsResponse = await TendersAPI.getTenderBids(tenderId);
        const allBids = (allBidsResponse as any).data || allBidsResponse;
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
  }, [tenderId, offerId, enqueueSnackbar, fetchTenderBids]);

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
      await TendersAPI.acceptTenderBid(offerId);
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
        await TendersAPI.rejectTenderBid(offerId);
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

  // Helper function to get avatar URL
  const getAvatarUrl = () => {
    const avatarPath = offer?.user?.avatar?.path || offer?.bidder?.avatar?.path;
    if (!avatarPath) return '';
    const baseURL = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`;
    return `${baseURL}static/uploads/${avatarPath}`;
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
                 <>
                   {offer.proposal && offer.proposal.trim() !== '' && offer.proposal !== 'Aucune proposition textuelle fournie.' && (
                     <Paper 
                        variant="outlined" 
                        sx={{ 
                            p: 3, 
                            bgcolor: 'background.default', 
                            whiteSpace: 'pre-wrap', 
                            minHeight: 100,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'divider',
                            mb: (offer.proposalFile || offer.proposalFiles) ? 3 : 0
                        }}
                     >
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>{offer.proposal}</Typography>
                     </Paper>
                   )}

                   {(offer.proposalFile || (offer.proposalFiles && offer.proposalFiles.length > 0)) && (
                     <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary" fontWeight={600}>
                            Document(s) de proposition
                        </Typography>
                        <Stack spacing={2}>
                            {/* Record based file */}
                            {offer.proposalFile && (
                                <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                        p: 2, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        borderRadius: '12px',
                                        bgcolor: alpha(theme.palette.info.main, 0.03),
                                        border: '1px dashed',
                                        borderColor: alpha(theme.palette.info.main, 0.3)
                                    }}
                                >
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                                            <MdCheckCircle />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                {offer.proposalFile.split('/').pop()?.split('-').slice(1).join('-') || 'Proposition technique'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Document PDF / Word</Typography>
                                        </Box>
                                    </Stack>
                                    <Button 
                                        variant="contained" 
                                        size="small" 
                                        startIcon={<MdVisibility />}
                                        href={offer.proposalFile} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        Voir
                                    </Button>
                                </Paper>
                            )}
                            
                            {/* Array based files (for future proofing or if data came this way) */}
                            {Array.isArray(offer.proposalFiles) && offer.proposalFiles.map((file: any, index: number) => (
                                <Paper 
                                    key={index}
                                    variant="outlined" 
                                    sx={{ 
                                        p: 2, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        borderRadius: '12px',
                                        bgcolor: alpha(theme.palette.info.main, 0.03),
                                        border: '1px dashed',
                                        borderColor: alpha(theme.palette.info.main, 0.3)
                                    }}
                                >
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                                            <MdCheckCircle />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={600}>
                                                {typeof file === 'string' ? file.split('/').pop()?.split('-').slice(1).join('-') : (file.originalname || `Fichier ${index + 1}`)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">Document joint</Typography>
                                        </Box>
                                    </Stack>
                                    <Button 
                                        variant="contained" 
                                        size="small" 
                                        startIcon={<MdVisibility />}
                                        href={typeof file === 'string' ? file : file.url} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        Voir
                                    </Button>
                                </Paper>
                            ))}
                        </Stack>
                     </Box>
                   )}

                   {!offer.proposal && !offer.proposalFile && (!offer.proposalFiles || offer.proposalFiles.length === 0) && (
                     <Box sx={{ py: 4, textAlign: 'center', bgcolor: alpha(theme.palette.grey[500], 0.04), borderRadius: '12px', border: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary">Aucune proposition détaillée fournie.</Typography>
                     </Box>
                   )}
                 </>
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
                                    {offer.createdAt || offer.date || offer.updatedAt
                                        ? formatDate(offer.createdAt || offer.date || offer.updatedAt)
                                        : 'Date non disponible'}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
          </Card>

          {isOwner && offer.status === 'pending' && evaluationType !== 'MOINS_DISANT' && (
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
                {(offer?.user?._id || offer?.bidder?._id) ? (
                  <Link href={`/profile/${offer?.user?._id || offer?.bidder?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                      <Avatar 
                        src={getAvatarUrl()} 
                        alt={offer?.user?.firstName || offer?.bidder?.firstName}
                        sx={{ width: 56, height: 56 }}
                      >
                        {(offer?.user?.firstName || offer?.bidder?.firstName)?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {offer?.user?.firstName || offer?.bidder?.firstName} {offer?.user?.lastName || offer?.bidder?.lastName}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                             {offer?.user?.email || offer?.bidder?.email}
                          </Typography>
                          {(offer?.user?.phone || offer?.bidder?.phone) && (
                            <Chip label={offer?.user?.phone || offer?.bidder?.phone} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
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
                 
                 {evaluationType !== 'MIEUX_DISANT' && (
                   <Box mb={3}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>BUDGET</Typography>
                      <Typography variant="h5" color="text.primary" fontWeight={700}>
                          {(tender.budget || tender.maxBudget || tender.estimatedBudget || tender.amount || 0).toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">DA</Typography>
                      </Typography>
                   </Box>
                 )}

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

      {/* ─── Soumissionnaires / Participants Table ─── */}
      <Card sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Autres offres reçues ({tenderBids.length})
        </Typography>
        {tenderBids.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1">Aucune autre offre pour le moment</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Soumissionnaire</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Annonce</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Quantité</TableCell>
                  {evaluationType !== 'MIEUX_DISANT' && <TableCell sx={{ fontWeight: 700 }} align="right">Prix proposé</TableCell>}
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  {isOwner && evaluationType !== 'MOINS_DISANT' && <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {tenderBids.map((bid, idx) => {
                  const bidder = bid.bidder || bid.user;
                  const bidderName = bidder
                    ? (bidder.companyName || bidder.entreprise || `${bidder.firstName || ''} ${bidder.lastName || ''}`.trim() || bidder.email || 'N/A')
                    : 'N/A';
                  const initials = bidderName.charAt(0).toUpperCase();
                  const profileId = bidder?._id || bidder;
                  const isCurrentOffer = bid._id === offerId;
                  
                  return (
                    <TableRow 
                        key={bid._id || idx} 
                        hover
                        sx={isCurrentOffer ? { bgcolor: alpha(theme.palette.primary.main, 0.08) } : {}}
                    >
                      <TableCell>
                        {typeof profileId === 'string' && profileId.length > 5 ? (
                          <Tooltip title="Voir le profil" arrow>
                            <Link href={`/profile/${profileId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
                              <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem', bgcolor: isCurrentOffer ? 'primary.main' : 'grey.400' }}>{initials}</Avatar>
                              <Stack>
                                <Typography variant="subtitle2" sx={{ '&:hover': { textDecoration: 'underline' }, fontWeight: isCurrentOffer ? 700 : 500 }}>
                                    {bidderName}
                                    {isCurrentOffer && <Chip label="Cette offre" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                                </Typography>
                                {bidder?.email && <Typography variant="caption" color="text.secondary">{bidder.email}</Typography>}
                              </Stack>
                            </Link>
                          </Tooltip>
                        ) : (
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem' }}>{initials}</Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: isCurrentOffer ? 700 : 500 }}>{bidderName}</Typography>
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {tender?.title || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{tender?.quantity || 1}</Typography>
                      </TableCell>
                       {evaluationType !== 'MIEUX_DISANT' && (
                        <TableCell align="right">
                          <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                            {(bid.bidAmount || bid.price || 0).toLocaleString('fr-FR')} DA
                          </Typography>
                        </TableCell>
                       )}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(bid.createdAt || bid.date)}
                        </Typography>
                      </TableCell>
                      {isOwner && evaluationType !== 'MOINS_DISANT' && (
                        <TableCell align="center">
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<MdCheckCircle />}
                            onClick={() => {
                                if (isCurrentOffer) {
                                    handleAcceptOffer();
                                } else {
                                    // Normally we would accept foreign bid here
                                    // but let's keep it simple for now as per main page logic
                                    enqueueSnackbar('Fonctionnalité disponible dans la page principale de l\'annonce', { variant: 'info' });
                                }
                            }}
                            disabled={tender.status !== 'OPEN' || processing}
                          >
                            Accepter
                          </Button>
                        </TableCell>
                       )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Container>
  );
}
