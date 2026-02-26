'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { MdAdd } from 'react-icons/md';
import ResponsiveTable from '@/components/Tables/ResponsiveTable';
import Label from '@/components/Label';
import useAuth from '@/hooks/useAuth';
import { Tender, TENDER_STATUS } from '@/types/tender';
import { useQuery } from '@tanstack/react-query';
import TableSkeleton from '@/components/skeletons/TableSkeleton';

// Local types for UI removed in favor of global types

export default function TendersPage() {
  const router = useRouter();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  
  const COLUMNS = [
    { id: 'title', label: t('dashboard.list.columns.title'), alignRight: false, searchable: true, sortable: true },
    { 
      id: 'category', 
      label: t('dashboard.list.columns.category'), 
      alignRight: false, 
      searchable: false,
      format: (value: any) => typeof value === 'object' ? value?.name : value
    },
    { 
      id: 'evaluationType', 
      label: 'Type', 
      alignRight: false, 
      searchable: false,
    },
    { 
      id: 'budget', 
      label: t('dashboard.list.columns.budget'), 
      alignRight: false, 
      searchable: false, 
      sortable: true,
      format: (value: any, row: any) => {
        const amount = row.maxBudget || row.budget || 0;
        return amount > 0 ? amount.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' }) : 'N/A';
      }
    },
    { 
      id: 'deadline', 
      label: t('dashboard.list.columns.deadline'), 
      alignRight: false, 
      searchable: false, 
      sortable: true,
      format: (value: any, row: any) => {
        const date = row.endingAt || row.deadline || new Date();
        return new Date(date).toLocaleDateString(i18n.language, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    { 
      id: 'bidsCount', 
      label: t('dashboard.list.columns.bidsReceived'), 
      alignRight: false, 
      searchable: false, 
      sortable: true,
      format: (value: any, row: any) => row.bidsCount || row.bids?.length || 0
    },
    { 
      id: 'status', 
      label: t('dashboard.list.columns.status'), 
      alignRight: false, 
      searchable: false,
      format: (value: any) => (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: value === 'OPEN' ? '#e1f5fe' : 
                          value === 'AWARDED' ? '#e8f5e9' : 
                          value === 'CLOSED' ? '#fff3e0' : '#ffebee',
          color: value === 'OPEN' ? '#0288d1' : 
                 value === 'AWARDED' ? '#2e7d32' : 
                 value === 'CLOSED' ? '#ef6c00' : '#c62828'
        }}>
          {t(`dashboard.tenders.status.${value}`, value) as string}
        </span>
      )
    },
    { id: 'actions', label: '', alignRight: true, searchable: false }
  ];
  
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState('deadline');
  const [filterName, setFilterName] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const { isLogged } = useAuth();

  const { data: tenders = [], isLoading } = useQuery({
    queryKey: ['tenders', 'my'],
    queryFn: async () => {
      const { TendersAPI } = await import('@/services/tenders');
      const response = await TendersAPI.getTenders();
      const rawData = response.data || (Array.isArray(response) ? response : []);
      
      // Normalize category to be a string
      return rawData.map(item => ({
        ...item,
        category: typeof item.category === 'object' ? item.category?.name : item.category
      }));
    },
    enabled: isLogged,
  });

  const getStatusColor = (status: TENDER_STATUS): 'info' | 'success' | 'error' | 'warning' => {
    switch (status) {
      case TENDER_STATUS.OPEN:
        return 'info';
      case TENDER_STATUS.AWARDED:
        return 'success';
      case TENDER_STATUS.CLOSED:
        return 'warning';
      case TENDER_STATUS.CANCELLED:
        return 'error';
      default:
        return 'info';
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

  const getFilteredTenders = () => {
    if (statusFilter === 'ALL') return tenders;
    return tenders.filter(tender => tender.status === statusFilter);
  };

  const TableBodyComponent = ({ data = [] }: { data: Tender[] }) => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

    return (
      <TableBody>
        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
          const { _id, title, category, maxBudget, budget, endingAt, deadline, bidsCount, bids, status, evaluationType } = row;
          
          const categoryName = typeof category === 'object' ? category?.name : category;
          const displayBudget = maxBudget || budget || 0;
          const displayDate = endingAt || deadline || new Date().toISOString();
          const displayBidsCount = bidsCount || bids?.length || 0;

          return (
            <TableRow hover key={_id} tabIndex={-1}>
              <TableCell component="th" scope="row" padding="none" sx={{ pl: 2 }}>
                <Typography variant="subtitle2" noWrap>
                  {title}
                </Typography>
              </TableCell>
              <TableCell align="left">
                <Label variant="ghost" color="default">
                  {categoryName || 'N/A'}
                </Label>
              </TableCell>
              <TableCell align="left">
                {evaluationType ? (
                  <Chip 
                    label={evaluationType === 'MIEUX_DISANT' ? '✨ Mieux Disant' : '💰 Moins Disant'}
                    size="small"
                    color={evaluationType === 'MIEUX_DISANT' ? 'info' : 'success'}
                    variant="soft"
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      borderRadius: '6px',
                      ...(evaluationType === 'MIEUX_DISANT' ? {
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
              <TableCell align="left">{displayBudget > 0 ? displayBudget.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' }) : 'N/A'}</TableCell>
              <TableCell align="left">{formatDate(displayDate)}</TableCell>
              <TableCell align="left">{displayBidsCount}</TableCell>
              <TableCell align="left">
                <Chip
                  label={t(`dashboard.tenders.status.${status}`, status) as string}
                  color={getStatusColor(status)}
                  variant="outlined"
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Button
                  component={Link}
                  href={`/dashboard/tenders/${_id}`}
                  size="small"
                  variant="outlined"
                >
                  {t('dashboard.list.view')}
                </Button>
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
            {t('dashboard.list.myTenders')}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/dashboard/tenders/create/"
            startIcon={<MdAdd />}
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              py: { xs: 1.5, sm: 1 }
            }}
          >
            {t('dashboard.list.newTender')}
          </Button>
        </Stack>
      </Box>
      
      {isLoading ? (
        <TableSkeleton rows={rowsPerPage} columns={8} />
      ) : tenders.length === 0 ? (
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
            {t('dashboard.list.noTenders')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            {t('dashboard.list.createFirstTender')}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/dashboard/tenders/create/"
            startIcon={<MdAdd />}
            sx={{ px: 4, py: 1.5 }}
          >
            {t('dashboard.list.newTender')}
          </Button>
        </Stack>
      ) : (
        <ResponsiveTable
          data={getFilteredTenders()}
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
          onRowClick={(row) => router.push(`/dashboard/tenders/${row._id}`)}
        />
      )}
    </Container>
  );
}
