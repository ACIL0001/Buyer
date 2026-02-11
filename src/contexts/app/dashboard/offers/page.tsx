'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  CircularProgress,
  Chip,
  Alert,
  Box,
  Tabs,
  Tab,
  Card,
} from '@mui/material';
import { MdRefresh } from 'react-icons/md';
import { alpha, useTheme } from '@mui/material/styles';
import ResponsiveTable from '@/components/Tables/ResponsiveTable';
import useAuth from '@/hooks/useAuth';

// Types
interface Bid {
  _id: string;
  title: string;
  currentPrice: number;
  status: 'active' | 'pending' | 'expired' | 'completed';
  endDate: string;
  category?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phone: string;
}

interface Offer {
  _id: string;
  price: number;
  createdAt: string;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  bid: Bid;
  user: User;
}

export default function OffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const { auth, isLogged } = useAuth();
  const { t, i18n } = useTranslation();
  
  const COLUMNS = [
    { id: 'user', label: t('dashboard.list.columns.user'), alignRight: false, searchable: true, sortable: true },
    { id: 'tel', label: t('dashboard.list.columns.phone'), alignRight: false, searchable: true, sortable: true },
    { id: 'bidTitle', label: t('dashboard.list.columns.auction'), alignRight: false, searchable: true, sortable: true },
    { id: 'price', label: t('dashboard.list.columns.price'), alignRight: false, searchable: false, sortable: true },
    { id: 'status', label: t('dashboard.list.columns.status'), alignRight: false, searchable: false, sortable: true },
    { id: 'createdAt', label: t('dashboard.list.columns.date'), alignRight: false, searchable: false, sortable: true },
    { id: 'actions', label: t('dashboard.list.columns.actions'), alignRight: true, searchable: false, sortable: false }
  ];

  const [offers, setOffers] = useState<Offer[]>([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'received' | 'my'>('my');

  // Sync tab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'received' || tabParam === 'my') {
      setFilterTab(tabParam as 'received' | 'my');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLogged && auth?.user?._id) {
      fetchOffers();
    }
  }, [isLogged, auth?.user?._id]);

  const fetchOffers = async (forceRefresh = false) => {
    if (!auth?.user?._id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { OffersAPI } = await import('@/services/offers');
      const userId = auth.user._id;
      
      const response = await OffersAPI.getOffers({ data: { _id: userId } });
      
      let offersData: Offer[] = [];
      
      if (Array.isArray(response)) {
        offersData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        offersData = response.data;
      } else if (response?.offers && Array.isArray(response.offers)) {
        offersData = response.offers;
      }
      
      setOffers(offersData);
      
    } catch (error: any) {
      console.error("Error fetching offers:", error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load offers';
      setError(errorMessage);
      // Set empty array on error instead of keeping stale data
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOffers(true);
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      setLoading(true);
      const { OffersAPI } = await import('@/services/offers');
      await OffersAPI.acceptOffer(offerId);
      fetchOffers(true);
    } catch (error: any) {
      console.error('Error accepting offer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      setLoading(true);
      const { OffersAPI } = await import('@/services/offers');
      await OffersAPI.rejectOffer(offerId);
      fetchOffers(true);
    } catch (error: any) {
      console.error('Error rejecting offer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      setLoading(true);
      const { OffersAPI } = await import('@/services/offers');
      await OffersAPI.deleteOffer(offerId);
      fetchOffers(true);
    } catch (error: any) {
      console.error('Error deleting offer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selected || selected.length === 0) return;
    try {
      setLoading(true);
      const { OffersAPI } = await import('@/services/offers');
      await Promise.all(selected.map((id) => OffersAPI.deleteOffer(id)));
      setSelected([]);
      fetchOffers(true);
    } catch (error: any) {
      console.error('Error bulk deleting offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getOfferStatusChip = (offer: Offer) => {
    const isActive = offer.bid?.status === 'active';
    const isExpired = offer.bid?.endDate && new Date(offer.bid.endDate) < new Date();
    
    if (isExpired) {
      return <Chip label={t('dashboard.orders.status.cancelled')} size="small" color="error" variant="outlined" />;
    }
    if (isActive) {
      return <Chip label={t('dashboard.orders.status.confirmed')} size="small" color="success" variant="outlined" />;
    }
    return <Chip label={t('dashboard.orders.status.pending')} size="small" color="warning" variant="outlined" />;
  };

  // Filter offers based on current tab
  const getFilteredOffers = () => {
    if (!offers || offers.length === 0) return [];
    
    const currentUserId = auth?.user?._id;
    if (!currentUserId) return [];
    
    if (filterTab === 'received') {
      // Show offers made by other users (received offers)
      return offers.filter(offer => offer.user._id !== currentUserId);
    } else {
      // Show offers made by current user (my offers)
      return offers.filter(offer => offer.user._id === currentUserId);
    }
  };

  const filteredOffers = getFilteredOffers();

  const TableBodyComponent = ({ data = [] }: { data: Offer[] }) => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

    return (
      <TableBody>
        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row: Offer) => {
          const { _id, user, price, createdAt, bid } = row;

          return (
            <TableRow
              hover
              key={_id}
              tabIndex={-1}
              sx={{ cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.action.hover } }}
            >
              <TableCell component="th" scope="row" padding="none" sx={{ pl: 2 }}>
                <Stack direction="column" spacing={0.5}>
                  <Typography variant="subtitle2" noWrap fontWeight={500}>
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.username || 'N/A'}
                  </Typography>
                  {user?.email && (
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  )}
                </Stack>
              </TableCell>
              
              <TableCell align="left">
                <Typography variant="body2">{user?.phone || 'N/A'}</Typography>
              </TableCell>
              
              <TableCell align="left">
                <Stack direction="column" spacing={0.5}>
                  <Typography variant="subtitle2" noWrap>{bid?.title || 'N/A'}</Typography>
                  {bid?.category && (
                    <Typography variant="caption" color="text.secondary">{bid.category}</Typography>
                  )}
                </Stack>
              </TableCell>
              
              <TableCell align="left">
                <Typography variant="subtitle2" fontWeight={600}>{formatPrice(price)}</Typography>
              </TableCell>
              
              <TableCell align="left">{getOfferStatusChip(row)}</TableCell>
              
              <TableCell align="left">
                <Typography variant="body2" color="text.secondary">{formatDate(createdAt)}</Typography>
              </TableCell>
              
              <TableCell align="right">
                <Stack direction="row" spacing={1}>
                  {bid?._id && (
                    <Button
                      component={Link}
                      href={`/dashboard/auctions/${bid._id}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    >
                      {t('dashboard.list.view')}
                    </Button>
                  )}
                  
                  {filterTab === 'received' ? (
                    // Actions for received offers (offers made by others)
                    <>
                      {(row.status || 'PENDING') === 'PENDING' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAcceptOffer(_id)}
                            disabled={loading}
                          >
                            {t('dashboard.list.accept')}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleRejectOffer(_id)}
                            disabled={loading}
                          >
                            {t('dashboard.list.reject')}
                          </Button>
                        </>
                      )}
                      
                      {(row.status || 'PENDING') !== 'PENDING' && (
                        <Chip
                          label={(row.status || 'PENDING') === 'ACCEPTED' ? t('dashboard.orders.status.confirmed') : t('dashboard.orders.status.cancelled')}
                          color={(row.status || 'PENDING') === 'ACCEPTED' ? 'success' : 'error'}
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </>
                  ) : (
                    // Actions for my offers (offers made by current user)
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteOffer(_id)}
                      disabled={loading}
                    >
                      {t('dashboard.list.delete')}
                    </Button>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
        
        {emptyRows > 0 && (
          <TableRow style={{ height: 53 * emptyRows }}>
            <TableCell colSpan={COLUMNS.length} />
          </TableRow>
        )}
      </TableBody>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>{t('dashboard.list.refreshing')}</Typography>
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh} variant="outlined">
              {t('dashboard.list.retry')}
            </Button>
          }
        >
          {error}
        </Alert>
      );
    }

    if (!offers || offers.length === 0) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('dashboard.list.noOffers')}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t('dashboard.list.noBidsYet')}
          </Typography>
        </Stack>
      );
    }

    if (filteredOffers.length === 0) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filterTab === 'received' ? t('dashboard.list.noOffers') : t('dashboard.list.noOffers')}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {filterTab === 'received' 
              ? t('dashboard.list.noReceivedOffers', 'You haven\'t received any offers yet.')
              : t('dashboard.list.noOffersMade', 'You haven\'t made any offers yet.')}
          </Typography>
        </Stack>
      );
    }

    return (
      <ResponsiveTable
        data={filteredOffers}
        columns={COLUMNS}
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
        searchFields={['user.firstName', 'user.lastName', 'user.phone', 'bid.title']}
        selected={selected}
        setSelected={setSelected}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Box
        sx={{
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          mb: { xs: 3, sm: 4, md: 5 },
          background: theme.palette.mode === 'light'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.02)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(theme.palette.primary.main, 0.06)})`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          alignItems={{ xs: 'stretch', sm: 'center' }} 
          justifyContent="space-between" 
          spacing={{ xs: 2, sm: 2 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
            <Typography variant="h4" sx={{ m: 0 }}>
              {filterTab === 'received' ? t('dashboard.list.receivedOffers') : t('dashboard.list.myOffers')}
            </Typography>
            {selected.length > 0 && filterTab === 'my' && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
                disabled={loading}
                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
              >
                {t('dashboard.list.deleteSelected', { count: selected.length })}
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={handleRefresh}
              disabled={loading}
              startIcon={<MdRefresh />}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              {t('dashboard.list.refresh')}
            </Button>
          </Stack>
          
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {loading ? t('dashboard.list.refreshing') : t('dashboard.list.refresh')}
          </Button>
        </Stack>
      </Box>

      {/* Filter Tabs */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={filterTab}
          onChange={(event, newValue) => {
            setFilterTab(newValue);
            setPage(0); // Reset to first page when switching tabs
            setSelected([]); // Clear selection when switching tabs
            
            // Update URL parameters
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', newValue);
            router.push(`/dashboard/offers?${params.toString()}`);
          }}
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '16px',
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
          }}
        >
          <Tab 
            label={`${t('dashboard.list.receivedOffers')} (${offers.filter(offer => offer.user._id !== auth?.user?._id).length})`} 
            value="received" 
          />
          <Tab 
            label={`${t('dashboard.list.myOffers')} (${offers.filter(offer => offer.user._id === auth?.user?._id).length})`} 
            value="my" 
          />
        </Tabs>
      </Card>

      {renderContent()}
    </Container>
  );
}
