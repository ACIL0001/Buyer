'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { MdRefresh, MdAdd, MdCheckCircle, MdCancel } from 'react-icons/md';
import ResponsiveTable from '@/components/Tables/ResponsiveTable';
import useAuth from '@/hooks/useAuth';

// Types
enum TenderBidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED'
}

interface Bidder {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
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
}

export default function TenderBidsPage() {
  const router = useRouter();
  const theme = useTheme();
  const { auth, isLogged } = useAuth();
  
  const COLUMNS = [
    { id: 'bidder', label: 'Provider', alignRight: false, searchable: true, sortable: true },
    { id: 'tender', label: 'Tender', alignRight: false, searchable: true, sortable: true },
    { id: 'bidAmount', label: 'Amount/Proposal', alignRight: false, searchable: false, sortable: true },
    { id: 'deliveryTime', label: 'Delivery Time', alignRight: false, searchable: false, sortable: true },
    { id: 'createdAt', label: 'Date', alignRight: false, searchable: false, sortable: true },
    { id: 'status', label: 'Status', alignRight: false, searchable: false },
    { id: 'actions', label: '', alignRight: true, searchable: false }
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
  const [filterTab, setFilterTab] = useState<'received' | 'my'>('received');
  const [error, setError] = useState<string | null>(null);

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

  // Filter bids based on current tab
  const getFilteredBids = () => {
    if (!tenderBids || tenderBids.length === 0) return [];
    
    const currentUserId = auth?.user?._id;
    if (!currentUserId) return [];
    
    if (filterTab === 'received') {
      // Show bids made by others on user's tenders (received bids)
      return tenderBids.filter((bid: any) => bid.type === 'received');
    } else {
      // Show bids made by current user (my bids)
      return tenderBids.filter((bid: any) => bid.type === 'my');
    }
  };

  const filteredBids = getFilteredBids();

  const TableBodyComponent = ({ data = [] }: { data: TenderBid[] }) => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

    return (
      <TableBody>
        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
          const { _id, bidder, tender, bidAmount, deliveryTime, createdAt, status, proposal } = row;

          return (
            <TableRow hover key={_id} tabIndex={-1}>
              <TableCell component="th" scope="row" padding="none" sx={{ pl: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {bidder?.firstName?.charAt(0) || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" noWrap>
                      {bidder?.firstName} {bidder?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {bidder?.email}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell align="left">
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" noWrap>
                    {tender?.title || 'N/A'}
                  </Typography>
                  {tender?.evaluationType && (
                    <Chip 
                      label={tender.evaluationType === 'MIEUX_DISANT' ? 'Best Offer' : 'Lowest Price'}
                      size="small"
                      color={tender.evaluationType === 'MIEUX_DISANT' ? 'info' : 'success'}
                      sx={{ width: 'fit-content', fontSize: '0.7rem' }}
                    />
                  )}
                </Stack>
              </TableCell>
              <TableCell align="left">
                {tender?.evaluationType === 'MIEUX_DISANT' ? (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontStyle: proposal ? 'normal' : 'italic',
                      color: proposal ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {proposal || 'No proposal'}
                  </Typography>
                ) : (
                  <Typography variant="h6" color="success.main">
                    {bidAmount.toLocaleString()} DA
                  </Typography>
                )}
              </TableCell>
              <TableCell align="left">
                {deliveryTime ? `${deliveryTime} days` : '-'}
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
                      setSelectedBid(row);
                      setShowBidDetailsDialog(true);
                    }}
                  >
                    View Details
                  </Button>
                  {filterTab === 'received' && status === TenderBidStatus.PENDING && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleAcceptOffer(_id)}
                        disabled={loading}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleRejectOffer(_id)}
                        disabled={loading}
                      >
                        Reject
                      </Button>
                    </>
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
          <Typography variant="body1" sx={{ mt: 2 }}>Loading tender bids...</Typography>
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
              Retry
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
            No tender bids found
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            You don't have any tender bids yet.
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
        onRowClick={(row) => router.push(`/dashboard/tenders/${row.tender?._id}`)}
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
              {filterTab === 'received' ? 'Received Tender Bids' : 'My Tender Bids'}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleRefresh}
              disabled={loading}
              startIcon={<MdRefresh />}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              Refresh
            </Button>
          </Stack>
          
          <Button
            variant="contained"
            component={Link}
            href="/dashboard/tenders/create"
            startIcon={<MdAdd />}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            New Tender
          </Button>
        </Stack>
      </Box>

      {/* Filter Tabs */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={filterTab}
          onChange={(event, newValue) => {
            setFilterTab(newValue);
            setPage(0);
            setSelected([]);
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
            label={`Received Bids (${receivedCount})`} 
            value="received" 
          />
          <Tab 
            label={`My Bids (${myCount})`} 
            value="my" 
          />
        </Tabs>
      </Card>

      {renderContent()}

      {/* Bid Details Dialog */}
      <Dialog
        open={showBidDetailsDialog}
        onClose={() => setShowBidDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: theme.palette.primary.main }}>
              {selectedBid?.bidder?.firstName?.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Tender Bid Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedBid?.bidder?.firstName} {selectedBid?.bidder?.lastName}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Stack spacing={3}>
            {/* Provider Information */}
            <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Provider Information
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedBid?.bidder?.firstName} {selectedBid?.bidder?.lastName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{selectedBid?.bidder?.email}</Typography>
                </Box>
                {selectedBid?.bidder?.phone && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body2">{selectedBid.bidder.phone}</Typography>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Tender Information */}
            <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tender Information
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Title</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedBid?.tender?.title || 'N/A'}
                  </Typography>
                </Box>
                {selectedBid?.tender?.evaluationType && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Chip 
                      label={selectedBid.tender.evaluationType === 'MIEUX_DISANT' ? 'Best Offer' : 'Lowest Price'}
                      size="small"
                      color={selectedBid.tender.evaluationType === 'MIEUX_DISANT' ? 'info' : 'success'}
                    />
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Bid Details */}
            <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Bid Details
              </Typography>
              <Stack spacing={2}>
                {selectedBid?.tender?.evaluationType === 'MIEUX_DISANT' ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Detailed Proposal
                    </Typography>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        mt: 1,
                        maxHeight: 300,
                        overflowY: 'auto',
                        bgcolor: 'white',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          lineHeight: 1.6,
                          fontStyle: selectedBid?.proposal ? 'normal' : 'italic',
                          color: selectedBid?.proposal ? 'text.primary' : 'text.secondary'
                        }}
                      >
                        {selectedBid?.proposal || 'No detailed proposal provided'}
                      </Typography>
                    </Paper>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Proposed Amount</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      {selectedBid?.bidAmount.toLocaleString()} DA
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Delivery Time</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedBid?.deliveryTime ? `${selectedBid.deliveryTime} days` : 'Not specified'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Submission Date</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedBid?.createdAt ? formatDate(selectedBid.createdAt) : '-'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={getStatusLabel(selectedBid?.status || TenderBidStatus.PENDING)}
                    color={getStatusColor(selectedBid?.status || TenderBidStatus.PENDING)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Stack>
            </Card>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setShowBidDetailsDialog(false)}
            variant="outlined"
          >
            Close
          </Button>
          {filterTab === 'received' && selectedBid?.status === TenderBidStatus.PENDING && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<MdCheckCircle />}
                onClick={() => {
                  if (selectedBid?._id) {
                    handleAcceptOffer(selectedBid._id);
                    setShowBidDetailsDialog(false);
                  }
                }}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<MdCancel />}
                onClick={() => {
                  if (selectedBid?._id) {
                    handleRejectOffer(selectedBid._id);
                    setShowBidDetailsDialog(false);
                  }
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
