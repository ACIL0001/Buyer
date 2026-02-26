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
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  CircularProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DirectSaleAPI } from '@/services/direct-sale';
import { DirectSale } from '@/types/direct-sale';
import Label from '@/components/Label';
import { MdShoppingCart, MdLocalOffer, MdStore, MdPerson, MdCheckCircle, MdCancel } from 'react-icons/md';
import { Button } from '@mui/material';

// Mock Translation
const useTranslation = () => {
  const t = (key: string, options?: any) => {
    const trans: Record<string, string> = {
      'directSales.detail.orders': `Commandes (${options?.count || 0})`,
      'directSales.detail.table.buyer': 'Acheteur',
      'common.quantity': 'Quantité',
      'directSales.detail.table.totalPrice': 'Prix Total',
      'directSales.detail.table.status': 'Statut',
      'common.date': 'Date',
      'directSales.detail.noOrders': 'Aucune commande pour le moment',
      'common.price': 'Prix',
      'directSales.detail.availableQuantity': 'Quantité disponible',
      'directSales.unlimited': 'Illimité',
      'directSales.detail.outOf': `sur ${options?.total}`,
      'directSales.detail.categories': 'Catégories',
      'directSales.detail.mainCategory': 'Catégorie principale',
      'directSales.detail.subCategory': 'Sous-catégorie',
      'directSales.detail.sellerType': 'Type de vendeur',
      'directSales.detail.professional': 'Professionnel',
      'directSales.detail.individual': 'Particulier',
      'common.location': 'Localisation',
      'directSales.create.form.wilaya': 'Wilaya',
      'directSales.detail.place': 'Lieu',
      'common.address': 'Adresse',
      'directSales.detail.notSpecified': 'Non spécifié',
      'directSales.detail.timeline': 'Chronologie',
      'common.createdAt': 'Créé le',
      'common.updatedAt': 'Mis à jour le',
      'directSales.status.active': 'Actif',
      'directSales.status.soldOut': 'Épuisé',
      'directSales.status.inactive': 'Inactif',
    };
    return trans[key] || key;
  };
  return { t };
};

// Local types for UI
enum SALE_STATUS {
  ACTIVE = 'ACTIVE',
  SOLD_OUT = 'SOLD_OUT',
  INACTIVE = 'INACTIVE'
}

export default function DirectSaleDetailPage() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [directSale, setDirectSale] = useState<DirectSale | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

  const fetchDirectSale = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🌐 [FRONTEND] Fetching direct sale with ID:', id);
      const response = await DirectSaleAPI.getDirectSaleById(id);
      console.log('📞 [FRONTEND] Full Direct Sale response:', response);
      
      const directSaleData = response.data || response;
      if (directSaleData && (directSaleData._id || (directSaleData as any).id)) {
        console.log('📞 [FRONTEND] Contact Number field:', directSaleData.contactNumber);
        setDirectSale(directSaleData);
      }
    } catch (error) {
      console.error('Error fetching direct sale:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    try {
      const response = await DirectSaleAPI.getPurchasesByDirectSale(id);
      let purchasesData: any[] = [];
      
      if (response) {
        if (Array.isArray(response.data)) {
          purchasesData = response.data;
        } else if (Array.isArray(response)) {
          purchasesData = response;
        }
      }
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, [id]);

  const handleConfirmPurchase = async (purchaseId: string) => {
    try {
      await DirectSaleAPI.confirmPurchase(purchaseId);
      fetchPurchases();
    } catch (error) {
      console.error('Error confirming purchase:', error);
    }
  };

  const handleRejectPurchase = async (purchaseId: string) => {
    try {
      await DirectSaleAPI.cancelPurchase(purchaseId);
      fetchPurchases();
    } catch (error) {
      console.error('Error rejecting purchase:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDirectSale();
      fetchPurchases();
    }
  }, [id, fetchDirectSale, fetchPurchases]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SOLD_OUT': return 'warning';
      case 'INACTIVE': return 'default';
      default: return 'default';
    }
  };

  const getPurchaseStatusColor = (status: string) => {
      switch (status) {
        case 'CONFIRMED': return 'success';
        case 'PENDING': return 'warning';
        case 'CANCELLED': return 'error';
        case 'REFUNDED': return 'info';
        default: return 'default';
      }
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

  if (!directSale) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6">Vente directe non trouvée</Typography>
        </Box>
      </Container>
    );
  }

  const availableQuantity = directSale.quantity === 0 ? t('directSales.unlimited') : directSale.quantity - (directSale.soldQuantity || 0);

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Détails de la vente
          </Typography>
          <Chip
            label={t(`directSales.status.${directSale.status.toLowerCase()}`) || directSale.status}
            color={getStatusColor(directSale.status) as any}
            variant="filled"
          />
        </Stack>

        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
                {/* Product Details */}
                <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                        {directSale.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {directSale.description}
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t('common.price')}
                            </Typography>
                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                                {directSale.price.toLocaleString()} DA
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t('directSales.detail.availableQuantity')}
                            </Typography>
                            <Typography variant="h6">
                                {availableQuantity}
                                {directSale.quantity !== 0 && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                        {t('directSales.detail.outOf', { total: directSale.quantity })}
                                    </Typography>
                                )}
                            </Typography>
                        </Grid>
                    </Grid>
                </Card>
            </Grid>

            {/* Sidebar Info */}
            <Grid size={{ xs: 12, md: 4 }}>
                 <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>{t('directSales.detail.categories')}</Typography>
                    <Stack spacing={2}>
                        <Box>
                             <Typography variant="body2" color="text.secondary">{t('directSales.detail.mainCategory')}</Typography>
                             <Label variant="ghost" color="primary">
                                {typeof directSale.productCategory === 'object' ? directSale.productCategory?.name : directSale.productCategory || 'N/A'}
                             </Label>
                        </Box>
                         {directSale.productSubCategory && (
                            <Box>
                                <Typography variant="body2" color="text.secondary">{t('directSales.detail.subCategory')}</Typography>
                                <Label variant="ghost" color="secondary">
                                    {typeof directSale.productSubCategory === 'object' ? directSale.productSubCategory.name : directSale.productSubCategory}
                                </Label>
                            </Box>
                        )}
                         <Box>
                            <Typography variant="body2" color="text.secondary">{t('directSales.detail.sellerType')}</Typography>
                            <Label variant="ghost" color={directSale.isPro ? 'warning' : 'success'}>
                                {directSale.isPro ? t('directSales.detail.professional') : t('directSales.detail.individual')}
                            </Label>
                        </Box>
                    </Stack>
                 </Card>

                 <Card sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>{t('common.location')}</Typography>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{t('directSales.create.form.wilaya')}</Typography>
                            <Typography variant="body1" fontWeight={500}>{directSale.wilaya}</Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{t('directSales.detail.place')}</Typography>
                             <Typography variant="body1" fontWeight={500}>{directSale.place || directSale.location || t('directSales.detail.notSpecified')}</Typography>
                        </Box>
                        {directSale.contactNumber && (
                            <Box>
                                <Typography variant="body2" color="text.secondary">Numéro de contact</Typography>
                                <Typography variant="body1" fontWeight={500}>{directSale.contactNumber}</Typography>
                            </Box>
                        )}
                    </Stack>
                 </Card>

                 <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>{t('directSales.detail.timeline')}</Typography>
                    <Stack spacing={2}>
                        <Box>
                             <Typography variant="body2" color="text.secondary">{t('common.createdAt')}</Typography>
                             <Typography variant="body1">{formatDate(directSale.createdAt)}</Typography>
                        </Box>
                         <Box>
                             <Typography variant="body2" color="text.secondary">{t('common.updatedAt')}</Typography>
                             <Typography variant="body1">{formatDate(directSale.updatedAt)}</Typography>
                        </Box>
                    </Stack>
                 </Card>
            </Grid>
        </Grid>

        {/* Purchases / Orders Table */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              📦 {t('directSales.detail.orders', { count: purchases.length })}
            </Typography>
            {purchasesLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : purchases.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                {t('directSales.detail.noOrders')}
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 700 }}>{t('directSales.detail.table.buyer')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('common.quantity')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('directSales.detail.table.totalPrice')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('common.date')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('directSales.detail.table.status')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.map((purchase: any) => {
                      const buyerName = purchase.buyer?.firstName
                        ? `${purchase.buyer.firstName} ${purchase.buyer.lastName || ''}`.trim()
                        : purchase.buyer?.username || purchase.buyer?.email || 'Acheteur';
                      const buyerId = purchase.buyer?._id || purchase.buyer;
                      const isPending = purchase.status === 'PENDING';
                      return (
                        <TableRow key={purchase._id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 12 }}>
                                {buyerName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Link href={`/profile/${buyerId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <Typography variant="body2" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                  {buyerName}
                                </Typography>
                              </Link>
                            </Stack>
                          </TableCell>
                          <TableCell>{purchase.quantity || 1}</TableCell>
                          <TableCell>{((purchase.price || directSale.price) * (purchase.quantity || 1)).toLocaleString()} DA</TableCell>
                          <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                          <TableCell>
                            <Chip
                              label={purchase.status || 'PENDING'}
                              color={getPurchaseStatusColor(purchase.status) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {isPending && (
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<MdCheckCircle />}
                                  onClick={() => handleConfirmPurchase(purchase._id)}
                                  sx={{ textTransform: 'none', fontSize: '12px' }}
                                >
                                  Confirmé
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<MdCancel />}
                                  onClick={() => handleRejectPurchase(purchase._id)}
                                  sx={{ textTransform: 'none', fontSize: '12px' }}
                                >
                                  Refusé
                                </Button>
                              </Stack>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>

    </Container>
  );
}
