'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { MdAdd, MdRefresh } from 'react-icons/md';
import ResponsiveTable from '@/components/Tables/ResponsiveTable';
import Label from '@/components/Label';
import useAuth from '@/hooks/useAuth';

// Types (simplified - in production these would come from a types file)
enum AUCTION_TYPE {
  CLASSIC = 'CLASSIC',
  EXPRESS = 'EXPRESS',
  AUTO_SUB_BID = 'AUTO_SUB_BID'
}

enum BID_STATUS {
  OPEN = 'OPEN',
  ON_AUCTION = 'ON_AUCTION',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

interface Auction {
  _id: string;
  title: string;
  description: string;
  bidType: string;
  auctionType: AUCTION_TYPE;
  startingPrice: number;
  currentPrice: number;
  endingAt: string;
  startingAt: string;
  status: BID_STATUS;
  place?: string;
  quantity?: string;
  wilaya?: string;
}

export default function AuctionsPage() {
  const router = useRouter();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  
  const COLUMNS = [
    { id: 'title', label: t('dashboard.list.columns.title'), alignRight: false, searchable: true, sortable: true },
    { id: 'bidType', label: t('dashboard.list.columns.type'), alignRight: false, searchable: false },
    { id: 'auctionType', label: t('dashboard.list.columns.mode'), alignRight: false, searchable: false },
    { id: 'startingPrice', label: t('dashboard.list.columns.startingPrice'), alignRight: false, searchable: false, sortable: true },
    { id: 'currentPrice', label: t('dashboard.list.columns.currentPrice'), alignRight: false, searchable: false, sortable: true },
    { id: 'endingAt', label  : t('dashboard.list.columns.endsAt'), alignRight: false, searchable: false, sortable: true },
    { id: 'status', label: t('dashboard.list.columns.status'), alignRight: false, searchable: false },
    { id: 'actions', label: t('dashboard.list.columns.actions'), alignRight: true, searchable: false }
  ];
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState('endingAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { isLogged } = useAuth();
  const [finishedAuctions, setFinishedAuctions] = useState<Auction[]>([]);
  const [activeAuctions, setActiveAuctions] = useState<Auction[]>([]);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (isLogged) {
        fetchAuctions();
        const interval = setInterval(() => {
            fetchAuctions();
        }, 30000);
        return () => clearInterval(interval);
    }
  }, [isLogged]);
  

  const fetchAuctions = async () => {
    if (isFetchingRef.current) return;
    
    // Only set loading on initial load or if we have no auctions
    if (auctions.length === 0) {
      setLoading(true);
    }
    
    isFetchingRef.current = true;
    try {
      const { AuctionsAPI } = await import('@/services/auctions');
      const response = await AuctionsAPI.getAuctions();
      
      let auctionData: Auction[] = [];
      if (Array.isArray(response)) {
        auctionData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        auctionData = response.data;
      }
      
      setAuctions(auctionData);
      
      // Separate active and finished auctions
      const now = new Date();
      const active = auctionData.filter(auction => {
        const endTime = new Date(auction.endingAt);
        return endTime > now && auction.status !== BID_STATUS.CLOSED;
      });
      const finished = auctionData.filter(auction => {
        const endTime = new Date(auction.endingAt);
        return endTime <= now || auction.status === BID_STATUS.CLOSED;
      });
      
      setActiveAuctions(active);
      setFinishedAuctions(finished);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const getStatusColor = (status: BID_STATUS): 'info' | 'success' | 'error' | 'default' => {
    switch (status) {
      case BID_STATUS.OPEN:
        return 'info';
      case BID_STATUS.ON_AUCTION:
        return 'success';
      case BID_STATUS.CLOSED:
        return 'error';
      case BID_STATUS.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: BID_STATUS) => {
    switch (status) {
      case BID_STATUS.OPEN:
        return t('dashboard.auctions.status.OPEN', 'Open');
      case BID_STATUS.ON_AUCTION:
        return t('dashboard.auctions.status.ON_AUCTION', 'On Auction');
      case BID_STATUS.CLOSED:
        return t('dashboard.auctions.status.CLOSED', 'Closed');
      case BID_STATUS.ARCHIVED:
        return t('dashboard.auctions.status.ARCHIVED', 'Archived');
      default:
        return status;
    }
  };

  const getAuctionTypeLabel = (type: AUCTION_TYPE) => {
    switch (type) {
      case AUCTION_TYPE.CLASSIC:
        return t('dashboard.auctions.type.CLASSIC', 'Classic');
      case AUCTION_TYPE.EXPRESS:
        return t('dashboard.auctions.type.EXPRESS', 'Express');
      case AUCTION_TYPE.AUTO_SUB_BID:
        return t('dashboard.auctions.type.AUTO_SUB_BID', 'Automatic');
      default:
        return type;
    }
  };

  const getAuctionTypeColor = (type: AUCTION_TYPE): 'default' | 'warning' | 'info' => {
    switch (type) {
      case AUCTION_TYPE.CLASSIC:
        return 'default';
      case AUCTION_TYPE.EXPRESS:
        return 'warning';
      case AUCTION_TYPE.AUTO_SUB_BID:
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const isAuctionFinished = (auction: Auction) => {
    const now = new Date();
    const endTime = new Date(auction.endingAt);
    return endTime < now || auction.status === BID_STATUS.CLOSED;
  };

  const getFilteredAuctions = () => {
    switch (statusFilter) {
      case 'ACTIVE':
        return activeAuctions;
      case 'FINISHED':
        return finishedAuctions;
      case 'ALL':
      default:
        return auctions;
    }
  };

  const TableBodyComponent = ({ data = [] }: { data: Auction[] }) => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

    return (
      <TableBody>
        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
          const { _id, title, bidType, auctionType, startingPrice, currentPrice, endingAt, status } = row;

          return (
            <TableRow
              hover
              key={_id}
              tabIndex={-1}
            >
              <TableCell component="th" scope="row" padding="none" sx={{ pl: 2 }}>
                <Typography variant="subtitle2" noWrap>
                  {title}
                </Typography>
              </TableCell>
              <TableCell align="left">
                <Label variant="ghost" color="default">
                  {bidType === 'PRODUCT' ? t('dashboard.auctions.type.PRODUCT', 'Product') : t('dashboard.auctions.type.SERVICE', 'Service')}
                </Label>
              </TableCell>
              <TableCell align="left">
                <Label variant="ghost" color={getAuctionTypeColor(auctionType)}>
                  {getAuctionTypeLabel(auctionType)}
                </Label>
              </TableCell>
              <TableCell align="left">{formatPrice(startingPrice)} DA</TableCell>
              <TableCell align="left">{formatPrice(currentPrice)} DA</TableCell>
              <TableCell align="left">{formatDate(endingAt)}</TableCell>
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
                    component={Link}
                    href={`/dashboard/auctions/${_id}`}
                    size="small"
                    variant="outlined"
                  >
                    {t('dashboard.list.view')}
                  </Button>
                  {(statusFilter === 'FINISHED' || (statusFilter === 'ALL' && isAuctionFinished(row))) && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Handle relaunch
                      }}
                      startIcon={<MdRefresh />}
                    >
                      {t('dashboard.list.relaunch')}
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
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          alignItems={{ xs: 'stretch', sm: 'center' }} 
          justifyContent="space-between" 
          spacing={{ xs: 2, sm: 2 }}
        >
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              m: 0,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            {t('dashboard.list.myAuctions')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>{t('dashboard.list.filterByStatus')}</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label={t('dashboard.list.filterByStatus')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: theme.palette.mode === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(8px)'
                  }
                }}
              >
                <MenuItem value="ALL">{t('dashboard.list.allAuctions')}</MenuItem>
                <MenuItem value="ACTIVE">{t('dashboard.list.activeAuctions')}</MenuItem>
                <MenuItem value="FINISHED">{t('dashboard.list.finishedAuctions')}</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              component={Link}
              href="/dashboard/auctions/create"
              startIcon={<MdAdd />}
              sx={{
                minWidth: { xs: '100%', sm: 'auto' },
                py: { xs: 1.5, sm: 1 }
              }}
            >
              {t('dashboard.list.newAuction')}
            </Button>
          </Stack>
        </Stack>
      </Box>
      
      {getFilteredAuctions() && getFilteredAuctions().length > 0 ? (
        <ResponsiveTable
          data={getFilteredAuctions()}
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
          searchFields={['title']}
          selected={selected}
          setSelected={setSelected}
          onRowClick={(row) => router.push(`/dashboard/auctions/${row._id}`)}
        />
      ) : (
        <Stack 
          spacing={3} 
          alignItems="center" 
          justifyContent="center" 
          sx={{ 
            py: 8, 
            textAlign: 'center',
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h5" color="text.secondary">
            {statusFilter === 'ACTIVE' && t('dashboard.list.activeAuctions')}
            {statusFilter === 'FINISHED' && t('dashboard.list.finishedAuctions')}
            {statusFilter === 'ALL' && t('dashboard.list.noAuctions')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            {statusFilter === 'ACTIVE' && t('dashboard.list.noAuctions')}
            {statusFilter === 'FINISHED' && t('dashboard.list.noAuctions')}
            {statusFilter === 'ALL' && t('dashboard.list.createFirstAuction')}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/dashboard/auctions/create"
            startIcon={<MdAdd />}
            sx={{ px: 4, py: 1.5 }}
          >
            {t('dashboard.list.newAuction')}
          </Button>
        </Stack>
      )}
    </Container>
  );
}
