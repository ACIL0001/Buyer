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
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DirectSaleAPI } from '@/services/direct-sale';
import Label from '@/components/Label';
import { MdShoppingCart, MdLocalOffer, MdStore, MdPerson } from 'react-icons/md';

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

interface DirectSale {
  _id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  soldQuantity: number;
  status: 'ACTIVE' | 'SOLD_OUT' | 'INACTIVE';
  productCategory?: { name: string } | string;
  productSubCategory?: { name: string } | string;
  wilaya: string;
  location: string;
  place?: string;
  isPro?: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: any;
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
      const data = await DirectSaleAPI.getDirectSaleById(id);
      setDirectSale(data);
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

                {/* Orders Table */}
                <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MdShoppingCart /> {t('directSales.detail.orders', { count: purchases.length })}
                    </Typography>
                    
                    {purchasesLoading ? (
                        <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
                    ) : purchases.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell>{t('directSales.detail.table.buyer')}</TableCell>
                                        <TableCell align="right">{t('common.quantity')}</TableCell>
                                        <TableCell align="right">{t('directSales.detail.table.totalPrice')}</TableCell>
                                        <TableCell align="center">{t('directSales.detail.table.status')}</TableCell>
                                        <TableCell align="right">{t('common.date')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {purchases.map((purchase) => (
                                        <TableRow key={purchase._id} hover>
                                             <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <Link href={`/profile/${purchase.buyer?._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.light }}>
                                                            {purchase.buyer?.firstName?.charAt(0) || <MdPerson />}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle2" sx={{ '&:hover': { textDecoration: 'underline' } }}>
                                                                {purchase.buyer?.firstName} {purchase.buyer?.lastName}
                                                            </Typography>
                                                            {purchase.buyer?.email && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                                    {purchase.buyer?.email}
                                                                </Typography>
                                                            )}
                                                            {purchase.buyer?.phone && (
                                                                <Chip label={purchase.buyer.phone} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }} />
                                                            )}
                                                        </Box>
                                                    </Link>
                                                </Stack>
                                             </TableCell>
                                             <TableCell align="right">{purchase.quantity}</TableCell>
                                             <TableCell align="right">{purchase.totalPrice?.toLocaleString()} DA</TableCell>
                                             <TableCell align="center">
                                                <Chip 
                                                    label={purchase.status} 
                                                    size="small" 
                                                    color={getPurchaseStatusColor(purchase.status) as any}
                                                    variant="outlined" 
                                                />
                                             </TableCell>
                                             <TableCell align="right">{formatDate(purchase.createdAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                         <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                             <MdShoppingCart size={48} color="gray" />
                             <Typography variant="body1" color="text.secondary">{t('directSales.detail.noOrders')}</Typography>
                         </Paper>
                    )}
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
    </Container>
  );
}
