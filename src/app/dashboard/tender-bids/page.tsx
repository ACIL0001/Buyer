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
  Chip,
  Avatar,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  Paper,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { MdRefresh, MdAdd, MdCheckCircle, MdCancel } from 'react-icons/md';
import ResponsiveTable from '@/components/Tables/ResponsiveTable';
import useAuth from '@/hooks/useAuth';

// Types
enum TenderBidStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined'
}

interface Bidder {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  entreprise?: string;
}

interface Tender {
  _id: string;
  title: string;
  evaluationType?: 'MIEUX_DISANT' | 'MOINS_DISANT';
}

interface TenderBid {
  _id: string;
  bidder: Bidder;
  tender: Tender;
  bidAmount: number;
  deliveryTime?: number;
  createdAt: string;
  status: TenderBidStatus;
  proposal?: string;
  proposalFile?: string; // URL of the attached file
}

export default function TenderBidsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const { auth, isLogged } = useAuth();
  const { t } = useTranslation();
  
  const COLUMNS = [
    { id: 'bidder.firstName', label: t('dashboard.list.columns.provider'), alignRight: false, searchable: true, sortable: true },
    { id: 'tender.title', label: t('dashboard.list.columns.tender'), alignRight: false, searchable: true, sortable: true },
    { id: 'tender.evaluationType', label: 'Type', alignRight: false, searchable: false },
    { id: 'bidAmount', label: t('dashboard.list.columns.amountProposal'), alignRight: false, searchable: false, sortable: true },
    { id: 'createdAt', label: t('dashboard.list.columns.date'), alignRight: false, searchable: false, sortable: true },
    { id: 'status', label: t('dashboard.list.columns.status'), alignRight: false, searchable: false },
    { id: 'actions', label: t('dashboard.list.columns.actions') || 'Actions', alignRight: true, searchable: false }
  ];
  
  const [tenderBids, setTenderBids] = useState<TenderBid[]>([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedBid, setSelectedBid] = useState<TenderBid | null>(null);
  const [showBidDetailsDialog, setShowBidDetailsDialog] = useState(false);
  const [filterTab, setFilterTab] = useState<'received' | 'my'>('my');
  const [evaluationFilter, setEvaluationFilter] = useState<'all' | 'MIEUX_DISANT' | 'MOINS_DISANT'>('all');
  const [error, setError] = useState<string | null>(null);

  // Sync tab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'received' || tabParam === 'my') {
      setFilterTab(tabParam as 'received' | 'my');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLogged && auth?.user?._id) {
      fetchTenderBids();
    }
  }, [isLogged, auth?.user?._id]);

  const fetchTenderBids = async () => {
    if (!auth?.user?._id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { TendersAPI } = await import('@/services/tenders');
      
      // Try to fetch both types of bids, but handle failures gracefully
      let receivedBidsArray: any[] = [];
      let myBidsArray: any[] = [];
      
      try {
        const receivedBids = await TendersAPI.getTenderBidsByOwner(auth.user._id);
        receivedBidsArray = Array.isArray(receivedBids) ? receivedBids.map((bid: any) => ({ ...bid, type: 'received' })) : [];
      } catch (err: any) {
        console.log('Could not fetch received tender bids:', err.message);
        // Continue - this endpoint might not exist yet
      }
      
      try {
        const myBids = await TendersAPI.getTenderBidsByBidder(auth.user._id);
        myBidsArray = Array.isArray(myBids) ? myBids.map((bid: any) => ({ ...bid, type: 'my' })) : [];
      } catch (err: any) {
        console.log('Could not fetch my tender bids:', err.message);
        // Continue - this endpoint might not exist yet
      }
      
      setTenderBids([...receivedBidsArray, ...myBidsArray]);
      
      // If both failed, show a message but don't set error (just empty state)
      if (receivedBidsArray.length === 0 && myBidsArray.length === 0) {
        console.info('No tender bids available');
      }
    } catch (error: any) {
      console.error("Error fetching tender bids:", error);
      // Only set error for actual errors, not 404s
      if (error?.response?.status !== 404) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load tender bids';
        setError(errorMessage);
      }
      setTenderBids([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTenderBids();
  };

  const handleAcceptOffer = async (bidId: string) => {
    try {
      setLoading(true);
      const { TendersAPI } = await import('@/services/tenders');
      await TendersAPI.acceptTenderBid(bidId);
      fetchTenderBids();
    } catch (error: any) {
      console.error('Error accepting tender bid:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async (bidId: string) => {
    try {
      setLoading(true);
      const { TendersAPI } = await import('@/services/tenders');
      await TendersAPI.rejectTenderBid(bidId);
      fetchTenderBids();
    } catch (error: any) {
      console.error('Error rejecting tender bid:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TenderBidStatus): 'warning' | 'success' | 'error' | 'default' => {
    switch (status) {
      case TenderBidStatus.PENDING:
        return 'warning';
      case TenderBidStatus.ACCEPTED:
        return 'success';
      case TenderBidStatus.DECLINED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: TenderBidStatus) => {
    switch (status) {
      case TenderBidStatus.PENDING:
        return 'Pending';
      case TenderBidStatus.ACCEPTED:
        return 'Accepted';
      case TenderBidStatus.DECLINED:
        return 'Declined';
      default:
        return status;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter bids based on current tab and evaluation type
  const getFilteredBids = () => {
    if (!tenderBids || tenderBids.length === 0) return [];
    
    const currentUserId = auth?.user?._id;
    if (!currentUserId) return [];
    
    let result: TenderBid[];
    if (filterTab === 'received') {
      result = tenderBids.filter((bid: any) => bid.type === 'received');
    } else {
      result = tenderBids.filter((bid: any) => bid.type === 'my');
    }

    // Apply evaluation type filter
    if (evaluationFilter !== 'all') {
      result = result.filter((bid) => bid.tender?.evaluationType === evaluationFilter);
    }

    return result;
  };

  const filteredBids = getFilteredBids();

  const TableBodyComponent = ({ data = [] }: { data: TenderBid[] }) => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

    return (
      <TableBody>
        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
          const { _id, bidder, tender, bidAmount, deliveryTime, createdAt, status, proposal, proposalFile } = row;

          return (
            <TableRow hover key={_id} tabIndex={-1}>
              <TableCell component="th" scope="row" padding="none" sx={{ pl: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Tooltip title="Voir le profil du soumissionnaire" arrow>
                    <Link href={`/profile/${bidder?._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', cursor: 'pointer' }}>
                        {(bidder?.companyName || bidder?.firstName || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" noWrap sx={{ '&:hover': { textDecoration: 'underline' } }}>
                          {bidder?.companyName || bidder?.entreprise || `${bidder?.firstName || ''} ${bidder?.lastName || ''}`.trim() || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {bidder?.email}
                        </Typography>
                        {bidder?.phone && (
                            <Chip label={bidder.phone} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', mt: 0.5 }} />
                        )}
                      </Box>
                    </Link>
                  </Tooltip>
                </Stack>
              </TableCell>
              <TableCell align="left">
                <Typography variant="subtitle2" noWrap>
                  {tender?.title || 'N/A'}
                </Typography>
              </TableCell>
              
              <TableCell align="left">
                {tender?.evaluationType ? (
                  <Chip 
                    label={tender.evaluationType === 'MIEUX_DISANT' ? '✨ Mieux Disant' : '💰 Moins Disant'}
                    size="small"
                    color={tender.evaluationType === 'MIEUX_DISANT' ? 'info' : 'success'}
                    variant="filled"
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      ...(tender.evaluationType === 'MIEUX_DISANT' ? {
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.dark,
                      } : {
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.dark,
                      })
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">N/A</Typography>
                )}
              </TableCell>
              <TableCell align="left">
                {tender?.evaluationType === 'MIEUX_DISANT' ? (
                  <Stack spacing={0.5}>
                    {/* Proposal text */}
                    {proposal ? (
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 220,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'text.primary',
                        }}
                        title={proposal}
                      >
                        {proposal}
                      </Typography>
                    ) : (
                      !proposalFile && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          Aucune proposition
                        </Typography>
                      )
                    )}
                    {/* Attached file */}
                    {proposalFile && (
                      <Box
                        component="a"
                        href={proposalFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          textDecoration: 'none',
                          width: 'fit-content',
                        }}
                      >
                        <Chip
                          label={
                            proposalFile.toLowerCase().endsWith('.pdf') ? '📎 PDF' :
                            proposalFile.toLowerCase().endsWith('.docx') ? '📎 DOCX' : '📎 Fichier'
                          }
                          size="small"
                          color="primary"
                          variant="outlined"
                          clickable
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      </Box>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="h6" color="success.main">
                    {bidAmount.toLocaleString()} DA
                  </Typography>
                )}
              </TableCell>

              <TableCell align="left">{formatDate(createdAt)}</TableCell>
              <TableCell align="left">
                <Chip
                  label={getStatusLabel(status)}
                  color={getStatusColor(status)}
                  variant="outlined"
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      if (row.tender?._id) {
                        router.push(`/dashboard/tenders/${row.tender._id}/offers/${row._id}`);
                      }
                    }}
                  >
                    {t('dashboard.list.viewDetails')}
                  </Button>
                  {/* Accept/Reject only for received MIEUX_DISANT bids (MOINS_DISANT is auto-awarded by lowest price) */}
                  {filterTab === 'received' && status === TenderBidStatus.PENDING && tender?.evaluationType === 'MIEUX_DISANT' && (
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
                  {/* Moins Disant: show auto-award badge instead of buttons */}
                  {filterTab === 'received' && status === TenderBidStatus.PENDING && tender?.evaluationType !== 'MIEUX_DISANT' && (
                    <Chip
                      label="Auto-attribution"
                      size="small"
                      color="info"
                      variant="outlined"
                      title="Le gagnant sera désigné automatiquement au meilleur prix à la clôture"
                    />
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

    if (!tenderBids || tenderBids.length === 0) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('dashboard.list.noTenderBids')}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t('dashboard.list.noBidsYet')}
          </Typography>
        </Stack>
      );
    }

    if (filteredBids.length === 0) {
      return (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filterTab === 'received' ? 'No received bids' : 'No bids made'}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {filterTab === 'received' 
              ? 'You haven\'t received any bids on your tenders yet.'
              : 'You haven\'t made any bids on tenders yet.'}
          </Typography>
        </Stack>
      );
    }

    return (
      <ResponsiveTable
        data={filteredBids}
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
        searchFields={['bidder.firstName', 'bidder.lastName', 'tender.title']}
        selected={selected}
        setSelected={setSelected}
        onRowClick={(row) => router.push(`/dashboard/tenders/${row.tender?._id}/offers/${row._id}`)}
      />
    );
  };

  const receivedCount = tenderBids.filter((bid: any) => bid.type === 'received').length;
  const myCount = tenderBids.filter((bid: any) => bid.type === 'my').length;

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
              {filterTab === 'received' ? t('dashboard.list.receivedTenderBids') : t('dashboard.list.myTenderBids')}
            </Typography>
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
            variant="contained"
            component={Link}
            href="/dashboard/tenders/create"
            startIcon={<MdAdd />}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {t('dashboard.list.newTender')}
          </Button>
        </Stack>
      </Box>

      {/* Filter Tabs */}
      <Card sx={{ mb: 2, borderRadius: 2 }}>
        <Tabs
          value={filterTab}
          onChange={(event, newValue) => {
            setFilterTab(newValue);
            setPage(0);
            setSelected([]);
            setEvaluationFilter('all');
            
            // Update URL parameters
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', newValue);
            router.push(`/dashboard/tender-bids?${params.toString()}`);
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
            label={`${t('dashboard.list.tabs.received')} (${receivedCount})`} 
            value="received" 
          />
          <Tab 
            label={`${t('dashboard.list.tabs.my')} (${myCount})`} 
            value="my" 
          />
        </Tabs>
      </Card>

      {/* Evaluation Type Sub-filter */}
      <Card sx={{ mb: 3, borderRadius: 2, px: 2, py: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Type d&apos;évaluation :
          </Typography>
          {(['all', 'MIEUX_DISANT', 'MOINS_DISANT'] as const).map((val) => (
            <Chip
              key={val}
              label={
                val === 'all' ? 'Tous'
                : val === 'MIEUX_DISANT' ? '✨ Mieux Disant'
                : '💰 Moins Disant'
              }
              onClick={() => { setEvaluationFilter(val); setPage(0); }}
              color={evaluationFilter === val ? (val === 'MIEUX_DISANT' ? 'info' : val === 'MOINS_DISANT' ? 'success' : 'primary') : 'default'}
              variant={evaluationFilter === val ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer', fontWeight: evaluationFilter === val ? 700 : 400 }}
            />
          ))}
        </Stack>
      </Card>

      {renderContent()}

    </Container>
  );
}
