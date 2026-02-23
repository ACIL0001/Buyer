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
  Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { DirectSaleAPI } from '@/services/direct-sale';
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { MdArrowBack, MdCheckCircle, MdSchedule, MdPerson, MdShoppingBag } from 'react-icons/md';
import { normalizeImageUrl } from '@/utils/url';

export default function DirectSaleOrderDetailPage() {
  const params = useParams();
  const directSaleId = params?.id as string;
  const orderId = params?.orderId as string;
  const router = useRouter();
  const { auth } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [directSale, setDirectSale] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch direct sale details
      const response = await DirectSaleAPI.getDirectSaleById(directSaleId);
      const saleData = response.data || response;
      setDirectSale(saleData);

      // Fetch all purchases for this direct sale (participants)
      const purchasesResponse = await DirectSaleAPI.getPurchasesByDirectSale(directSaleId);
      const purchasesData = purchasesResponse.data || (Array.isArray(purchasesResponse) ? purchasesResponse : []);
      
      setParticipants(purchasesData);

      // Find the specific order
      const specificOrder = purchasesData.find((o: any) => o._id === orderId);
      if (specificOrder) {
        setOrder(specificOrder);
      } else {
        // Fallback: try to find in general orders if not found in this specific sale list
        console.warn('Order not found in participants list');
      }

    } catch (error) {
      console.error('Error fetching direct sale order data:', error);
      enqueueSnackbar('Erreur lors du chargement des données', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [directSaleId, orderId, enqueueSnackbar]);

  useEffect(() => {
    if (directSaleId && orderId) {
      fetchData();
    }
  }, [directSaleId, orderId, fetchData]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!directSale || !order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Alert severity="error">Commande ou Vente introuvable.</Alert>
        <Button startIcon={<MdArrowBack />} onClick={() => router.back()} sx={{ mt: 2 }}>
          Retour
        </Button>
      </Container>
    );
  }

  const isOwner = (directSale.owner?._id || directSale.owner) == auth?.user?._id;
  const isConfirmed = order.status === 'CONFIRMED' || order.status === 'COMPLETED';

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
        onClick={() => router.push(`/dashboard/direct-sales/orders`)}
        sx={{ mb: 3 }}
      >
        Retour aux commandes
      </Button>

      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Détails de la commande
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip 
            label={order.status} 
            color={isConfirmed ? 'success' : 'warning'} 
            variant="filled"
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
              Récapitulatif de la transaction
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box 
                  sx={{ 
                    p: 3, 
                    borderRadius: '12px', 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1)
                  }}
                >
                  <MdShoppingBag size={32} color={theme.palette.primary.main} />
                  <Box mt={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase">
                      Quantité
                    </Typography>
                    <Typography variant="h4" fontWeight="800">
                      {order.quantity}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box 
                  sx={{ 
                    p: 3, 
                    borderRadius: '12px', 
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.1)
                  }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase">
                    Total Payé
                  </Typography>
                  <Typography variant="h4" color="success.main" fontWeight="800">
                    {(order.totalPrice || order.total || 0).toLocaleString()} <Typography component="span" variant="h6" color="text.secondary">DA</Typography>
                  </Typography>
                </Box>
              </Grid>
            </Grid>

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
                    DATE DE COMMANDE
                  </Typography>
                   <Typography variant="subtitle1" fontWeight={700}>
                    {formatDate(order.createdAt)}
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
              <MdPerson /> {isOwner ? 'Acheteur' : 'Vendeur'}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {/* Show user details depending on who is viewing */}
            {(() => {
              const counterparty = isOwner ? order.buyer : (order.seller || directSale.owner);
              if (!counterparty) return <Typography color="text.secondary">Infos non disponibles</Typography>;
              
              return (
                <Link href={`/profile/${counterparty._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                    <Avatar 
                      src={normalizeImageUrl(counterparty.photoURL || counterparty.avatar)} 
                      alt={counterparty.firstName}
                      sx={{ width: 56, height: 56 }}
                    >
                      {counterparty.firstName?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {counterparty.firstName} {counterparty.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {counterparty.email}
                      </Typography>
                      {counterparty.phone && (
                        <Chip label={counterparty.phone} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }} />
                      )}
                    </Box>
                  </Stack>
                </Link>
              );
            })()}
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
            <Typography variant="h6" gutterBottom fontWeight={600}>Info Produit</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>NOM DU PRODUIT</Typography>
              <Typography variant="body1" fontWeight={500}>{directSale.title}</Typography>
            </Box>
            <Box mb={3}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>PRIX UNITAIRE</Typography>
              <Typography variant="h5" color="text.primary" fontWeight={700}>
                {(directSale.price || 0).toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">DA</Typography>
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={() => router.push(`/dashboard/direct-sales/${directSaleId}`)}
            >
              Voir la fiche produit
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Autres participants ({participants.length})
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Acheteur</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Quantité</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Total</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((p, idx) => {
                const isCurrent = p._id === orderId;
                const buyer = p.buyer;
                
                return (
                  <TableRow 
                    key={p._id || idx} 
                    hover
                    sx={isCurrent ? { bgcolor: alpha(theme.palette.primary.main, 0.05) } : {}}
                  >
                    <TableCell>
                      {buyer ? (
                        <Link 
                          href={`/profile/${buyer._id}`} 
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ '&:hover': { opacity: 0.8, cursor: 'pointer' } }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                              {buyer.firstName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                {buyer.firstName} {buyer.lastName}
                                {isCurrent && <Chip label="Cette commande" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />}
                              </Typography>
                            </Box>
                          </Stack>
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Inconnu</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {p.quantity}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                        {(p.totalPrice || p.total || 0).toLocaleString()} DA
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(p.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={p.status} size="small" variant="outlined" color={p.status === 'CONFIRMED' ? 'success' : 'default'} />
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
