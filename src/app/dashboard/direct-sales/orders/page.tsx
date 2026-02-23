'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Stack,
  TableBody,
  TableCell,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdVisibility } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import useAuth from '@/hooks/useAuth';
import ResponsiveTable from '@/components/Tables/ResponsiveTable';

interface Order {
  _id: string;
  directSale?: {
    _id: string;
    title: string;
    owner?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        companyName?: string;
        entreprise?: string;
    };
  } | null;
  buyer?: {
    _id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    companyName?: string;
    entreprise?: string;
  } | null;
  seller?: {
    _id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    companyName?: string;
    entreprise?: string;
  } | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();
  const { isLogged } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Table state
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);

  // Sync tab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'received') {
      setTabValue(0);
    } else if (tabParam === 'made' || tabParam === 'my') {
      setTabValue(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLogged) {
        fetchData();
    }
  }, [isLogged]);

  // Reset pagination when switching tabs
  useEffect(() => {
    setPage(0);
    setFilterName('');
    setSelected([]);
  }, [tabValue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      
      const [ordersData, purchasesData] = await Promise.all([
        DirectSaleAPI.getMyOrders(),
        DirectSaleAPI.getMyPurchases()
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData.filter((o: any) => o.directSale) : []);
      setPurchases(Array.isArray(purchasesData) ? purchasesData.filter((p: any) => p.directSale) : []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedOrder) return;

    try {
      setConfirming(true);
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      await DirectSaleAPI.confirmPurchase(selectedOrder._id);
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error: any) {
      console.error('Error confirming order:', error);
    } finally {
      setConfirming(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return t('dashboard.orders.status.confirmed');
      case 'PENDING':
        return t('dashboard.orders.status.pending');
      case 'CANCELLED':
        return t('dashboard.orders.status.cancelled');
      case 'COMPLETED':
        return t('dashboard.orders.status.completed');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update URL parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newValue === 0 ? 'received' : 'made');
    router.push(`/dashboard/direct-sales/orders?${params.toString()}`);
  };

  const getColumns = (isPurchase: boolean) => [
      { id: 'directSale.title', label: t('dashboard.orders.columns.product'), alignRight: false, searchable: true, sortable: true },
      { 
          id: isPurchase ? 'seller.firstName' : 'buyer.firstName',
          label: isPurchase ? t('dashboard.orders.columns.seller') : t('dashboard.orders.columns.buyer'), 
          alignRight: false, 
          searchable: true,
          sortable: true
      },
      { id: 'quantity', label: t('dashboard.orders.columns.quantity'), alignRight: true, searchable: false, sortable: true },
      { 
          id: 'unitPrice', 
          label: t('dashboard.orders.columns.unitPrice'), 
          alignRight: true, 
          searchable: false, 
          sortable: true,
          format: (value: number) => `${value.toLocaleString(i18n.language)} DA`
      },
      { 
          id: 'totalPrice', 
          label: t('dashboard.orders.columns.total'), 
          alignRight: true, 
          searchable: false, 
          sortable: true,
          format: (value: number) => `${value.toLocaleString(i18n.language)} DA`
      },
      { id: 'status', label: t('dashboard.orders.columns.status'), alignRight: false, searchable: false, sortable: true },
      { 
          id: 'createdAt', 
          label: t('dashboard.orders.columns.date'), 
          alignRight: false, 
          searchable: false, 
          sortable: true,
          format: (value: string) => formatDate(value)
      },
      { id: 'actions', label: t('dashboard.orders.columns.actions'), alignRight: true, searchable: false }
  ];

  const TableBodyComponent = ({ data }: { data: Order[] }) => {
    const isPurchase = tabValue === 1;
    
    // Slice data for pagination
    const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
    
    return (
      <TableBody>
        {paginatedData.map((order) => {
            const counterparty = isPurchase
                ? (order.seller || order.directSale?.owner)
                : order.buyer;
            
            const displayName = counterparty
                ? (counterparty.companyName || counterparty.entreprise || `${counterparty.firstName || ''} ${counterparty.lastName || ''}`.trim())
                : (isPurchase ? t('dashboard.orders.unknownSeller') : t('dashboard.orders.unknownBuyer'));

            const initials = displayName ? displayName.charAt(0).toUpperCase() : '?';
            const profileId = (counterparty as any)?._id;
            const counterpartyPhone = counterparty?.phone || t('dashboard.orders.phoneUnavailable');

            return (
            <TableRow hover key={order._id} tabIndex={-1}>
                {/* Product */}
                <TableCell>
                  <Typography variant="subtitle2" noWrap>
                    {order.directSale?.title || t('dashboard.orders.unknownProduct')}
                  </Typography>
                </TableCell>
                
                {/* Counterparty (Buyer or Seller) — clickable profile link */}
                <TableCell>
                  {profileId ? (
                    <Tooltip title={isPurchase ? 'Voir le profil du vendeur' : 'Voir le profil de l\'acheteur'} arrow>
                      <Link
                        href={`/profile/${profileId}`}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem', bgcolor: isPurchase ? 'primary.main' : 'secondary.main', cursor: 'pointer' }}>
                          {initials}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" noWrap sx={{ '&:hover': { textDecoration: 'underline' } }}>
                            {displayName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {counterpartyPhone}
                          </Typography>
                        </Box>
                      </Link>
                    </Tooltip>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem' }}>{initials}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" noWrap>{displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">{counterpartyPhone}</Typography>
                      </Box>
                    </Box>
                  )}
                </TableCell>
                
                {/* Quantity */}
                <TableCell align="right">{order.quantity}</TableCell>
                
                {/* Unit Price */}
                <TableCell align="right">{order.unitPrice.toLocaleString(i18n.language)} DA</TableCell>
                
                {/* Total Price */}
                <TableCell align="right">
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {order.totalPrice.toLocaleString(i18n.language)} DA
                </Typography>
                </TableCell>
                
                {/* Status */}
                <TableCell>
                <Chip
                    label={getStatusLabel(order.status)}
                    color={getStatusColor(order.status)}
                    size="small"
                    variant="outlined"
                />
                </TableCell>
                
                {/* Date */}
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                
                {/* Actions */}
                <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                    size="small"
                    variant="outlined"
                    startIcon={<MdVisibility />}
                    onClick={() => {
                        if (order.directSale?._id && order._id) {
                          router.push(`/dashboard/direct-sales/${order.directSale._id}/orders/${order._id}`);
                        } else {
                          console.error('Direct sale ID or Order ID not found for order:', order._id);
                        }
                    }}
                    >
                    {t('dashboard.list.viewDetails')}
                    </Button>
                    {!isPurchase && order.status === 'PENDING' && (
                    <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => {
                        setSelectedOrder(order);
                        setConfirmDialogOpen(true);
                        }}
                    >
                        {t('dashboard.orders.confirm')}
                    </Button>
                    )}
                </Stack>
                </TableCell>
            </TableRow>
            );
        })}
        {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
            <TableCell colSpan={8} />
            </TableRow>
        )}
      </TableBody>
    );
  };

  const currentData = tabValue === 0 ? orders : purchases;
  const isPurchase = tabValue === 1;

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          {t('dashboard.orders.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.orders.subtitle')}
        </Typography>
      </Box>

      {loading && orders.length === 0 && purchases.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>{t('dashboard.orders.loading')}</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="orders tabs">
              <Tab label={t('dashboard.orders.tabs.received')} />
              <Tab label={t('dashboard.orders.tabs.made')} />
            </Tabs>
          </Box>
          
          <ResponsiveTable
            data={currentData}
            columns={getColumns(isPurchase)}
            page={page}
            setPage={setPage}
            order={order}
            setOrder={setOrder}
            orderBy={orderBy}
            setOrderBy={setOrderBy}
            filterName={filterName}
            setFilterName={setFilterName}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            TableBody={TableBodyComponent}
            searchFields={['directSale.title', isPurchase ? 'seller.firstName' : 'buyer.firstName']}
            selected={selected}
            setSelected={setSelected}
          />
        </>
      )}

      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => setConfirmDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>{t('dashboard.orders.confirmOrder')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('dashboard.orders.confirmMessage', {
              buyer: selectedOrder?.buyer 
                ? `${selectedOrder.buyer.firstName || ''} ${selectedOrder.buyer.lastName || ''}`.trim() || t('dashboard.orders.unknownBuyer')
                : t('dashboard.orders.unknownBuyer'),
              product: selectedOrder?.directSale?.title || t('dashboard.orders.unknownProduct')
            })}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.orders.quantityLabel')} {selectedOrder?.quantity}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.orders.totalLabel')} {selectedOrder?.totalPrice.toLocaleString(i18n.language)} DA
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>{t('dashboard.orders.cancel')}</Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            variant="contained"
            color="success"
          >
            {confirming ? <CircularProgress size={20} /> : t('dashboard.orders.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
