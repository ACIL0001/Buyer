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

enum SALE_STATUS {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

interface DirectSale {
  _id: string;
  title: string;
  description: string;
  category: string | { name: string };
  productCategory?: string | { name: string };
  price: number;
  stock: number;
  quantity?: number;
  status: SALE_STATUS;
  ordersCount: number;
  createdAt: string;
}

export default function DirectSalesPage() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  
  const COLUMNS = [
    { id: 'title', label: t('dashboard.list.columns.title'), alignRight: false, searchable: true, sortable: true },
    { id: 'category', label: t('dashboard.list.columns.category'), alignRight: false, searchable: false },
    { id: 'price', label: t('dashboard.list.columns.price'), alignRight: false, searchable: false, sortable: true },
    { id: 'stock', label: t('dashboard.list.columns.stock'), alignRight: false, searchable: false, sortable: true },
    { id: 'ordersCount', label: t('dashboard.list.columns.orders'), alignRight: false, searchable: false, sortable: true },
    { id: 'status', label: t('dashboard.list.columns.status'), alignRight: false, searchable: false },
    { id: 'actions', label: '', alignRight: true, searchable: false }
  ];
  
  const [sales, setSales] = useState<DirectSale[]>([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const { isLogged } = useAuth();

  useEffect(() => {
    if (isLogged) {
        fetchSales();
    }
  }, [isLogged]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      const response = await DirectSaleAPI.getMyDirectSales();
      console.log('Fetched direct sales:', response);
      // Handle both array response or { data: [...] } response
      // Handle both array response or { data: [...] } response
      const rawData: DirectSale[] = Array.isArray(response) ? response : (response?.data || []);
      
      // Normalize data for table: ensure category/productCategory are not objects to avoid MobileCard crash
      const normalizedData = rawData.map(item => ({
        ...item,
        category: typeof item.category === 'object' ? item.category.name : item.category,
        productCategory: typeof item.productCategory === 'object' ? item.productCategory.name : item.productCategory
      }));

      setSales(normalizedData);
    } catch (error) {
      console.error('Error fetching direct sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: SALE_STATUS): 'success' | 'info' | 'warning' | 'error' => {
    switch (status) {
      case SALE_STATUS.ACTIVE:
        return 'success';
      case SALE_STATUS.SOLD:
        return 'info';
      case SALE_STATUS.INACTIVE:
        return 'warning';
      case SALE_STATUS.OUT_OF_STOCK:
        return 'error';
      default:
        return 'info';
    }
  };

  const getFilteredSales = () => {
    if (statusFilter === 'ALL') return sales;
    return sales.filter(sale => sale.status === statusFilter);
  };

  const TableBodyComponent = ({ data = [] }: { data: DirectSale[] }) => {
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

    return (
      <TableBody>
        {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
          const { _id, title, productCategory, category, price, quantity, stock, ordersCount, status } = row;

          const categoryName = (typeof productCategory === 'object' ? productCategory?.name : productCategory) || 
                               (typeof category === 'object' ? category?.name : category);
          const displayStock = quantity !== undefined ? quantity : (stock || 0);

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
              <TableCell align="left">{price.toFixed(2)} DA</TableCell>
              <TableCell align="left">{displayStock}</TableCell>
              <TableCell align="left">{ordersCount || 0}</TableCell>
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
                  href={`/dashboard/direct-sales/${_id}`}
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
            {t('dashboard.list.myDirectSales')}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/dashboard/direct-sales/create"
            startIcon={<MdAdd />}
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              py: { xs: 1.5, sm: 1 }
            }}
          >

            {t('dashboard.list.newSale')}
          </Button>
        </Stack>
      </Box>
      
      {sales.length === 0 && !loading ? (
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
            {t('dashboard.list.noSales')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            {t('dashboard.list.createFirstSale')}
          </Typography>
          <Button
            variant="contained"
            component={Link}
            href="/dashboard/direct-sales/create"
            startIcon={<MdAdd />}
            sx={{ px: 4, py: 1.5 }}
          >
            {t('dashboard.list.newSale')}
          </Button>
        </Stack>
      ) : (
        <ResponsiveTable
          data={getFilteredSales()}
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
          onRowClick={(row) => router.push(`/dashboard/direct-sales/${row._id}`)}
        />
      )}
    </Container>
  );
}
