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

enum TENDER_STATUS {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  AWARDED = 'AWARDED',
  CANCELLED = 'CANCELLED'
}

interface Tender {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: TENDER_STATUS;
  bidsCount: number;
}

export default function TendersPage() {
  const router = useRouter();
  const theme = useTheme();
  
  const COLUMNS = [
    { id: 'title', label: 'Title', alignRight: false, searchable: true, sortable: true },
    { id: 'category', label: 'Category', alignRight: false, searchable: false },
    { id: 'budget', label: 'Budget', alignRight: false, searchable: false, sortable: true },
    { id: 'deadline', label: 'Deadline', alignRight: false, searchable: false, sortable: true },
    { id: 'bidsCount', label: 'Bids Received', alignRight: false, searchable: false, sortable: true },
    { id: 'status', label: 'Status', alignRight: false, searchable: false },
    { id: 'actions', label: '', alignRight: true, searchable: false }
  ];
  
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState('deadline');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockTenders: Tender[] = [];
      setTenders(mockTenders);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  };

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
    return new Date(date).toLocaleDateString('fr-FR', {
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
          const { _id, title, category, budget, deadline, bidsCount, status } = row;

          return (
            <TableRow hover key={_id} tabIndex={-1}>
              <TableCell component="th" scope="row" padding="none" sx={{ pl: 2 }}>
                <Typography variant="subtitle2" noWrap>
                  {title}
                </Typography>
              </TableCell>
              <TableCell align="left">
                <Label variant="ghost" color="default">
                  {category}
                </Label>
              </TableCell>
              <TableCell align="left">{budget.toFixed(2)} DA</TableCell>
              <TableCell align="left">{formatDate(deadline)}</TableCell>
              <TableCell align="left">{bidsCount}</TableCell>
              <TableCell align="left">
                <Chip
                  label={status}
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
                  View
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
        {emptyRows > 0 && (
          <TableRow style={{ height: 53 * emptyRows }}>
            <TableCell colSpan={7} />
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
            My Tenders
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/dashboard/tenders/create"
            startIcon={<MdAdd />}
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              py: { xs: 1.5, sm: 1 }
            }}
          >
            New Tender
          </Button>
        </Stack>
      </Box>
      
      {tenders.length === 0 && !loading ? (
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
            No tenders found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            Get started by creating your first tender!
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/dashboard/tenders/create"
            startIcon={<MdAdd />}
            sx={{ px: 4, py: 1.5 }}
          >
            Create New Tender
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
