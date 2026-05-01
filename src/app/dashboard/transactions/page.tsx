'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Pagination,
  Select,
  MenuItem,
  Menu,
  Stack,
  TextField,
  InputAdornment,
  Button,
  alpha,
  useTheme
} from '@mui/material';
import { MdSearch, MdFilterList, MdKeyboardArrowDown } from 'react-icons/md';
import { useQuery } from '@tanstack/react-query';
import { DirectSaleAPI } from '@/services/direct-sale';

const COLUMNS = ['ID', 'CLIENT', 'DATE', 'TOTALE', 'STATUTS', 'ACTION'];

export default function TransactionsPage() {
  const theme = useTheme();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const response = await DirectSaleAPI.getMyOrders();
      return response.data || [];
    }
  });

  const [anchorElStatus, setAnchorElStatus] = React.useState<null | HTMLElement>(null);
  const openStatus = Boolean(anchorElStatus);

  const handleStatusClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElStatus(event.currentTarget);
  };
  const handleStatusClose = (val?: string) => {
    if (val) setStatus(val);
    setAnchorElStatus(null);
  };

  const filteredTransactions = React.useMemo(() => {
    if (!transactionsData) return [];
    return transactionsData.filter((tx: any) => {
      const orderNum = tx.orderNumber?.toString() || (tx._id ? tx._id.slice(-4) : '');
      const buyerName = (tx.buyer?.firstName || tx.buyerName || 'Karim B').toLowerCase();
      
      const matchesSearch = 
        orderNum.includes(search) || 
        buyerName.includes(search.toLowerCase());
      
      const txStatus = tx.status || 'En cours';
      const matchesStatus = status === 'all' || txStatus.toLowerCase() === status.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [transactionsData, search, status]);

  const getStatusLabel = () => {
    if (status === 'all') return 'Statuts : tout';
    return `Statut : ${status}`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'transparent' }}>
      
      {/* Top Filter Bar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          placeholder="recherche"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 240 },
            '& .MuiOutlinedInput-root': {
              bgcolor: 'white',
              borderRadius: '8px',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'transparent' },
              '&.Mui-focused fieldset': { borderColor: 'transparent' },
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.02)'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch size={20} color="#919EAB" />
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          variant="contained"
          onClick={handleStatusClick}
          endIcon={<MdKeyboardArrowDown />}
          sx={{
            bgcolor: 'white',
            color: '#1A1A1A',
            textTransform: 'none',
            borderRadius: '8px',
            boxShadow: '0px 2px 4px rgba(0,0,0,0.02)',
            border: '1px solid #F4F6F8',
            px: 2,
            minWidth: { xs: 'auto', sm: 160 },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: 'space-between',
            '&:hover': { bgcolor: '#F4F6F8' }
          }}
        >
          {getStatusLabel()}
        </Button>
        <Menu
          anchorEl={anchorElStatus}
          open={openStatus}
          onClose={() => handleStatusClose()}
          PaperProps={{
            sx: { mt: 1, borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }
          }}
        >
          <MenuItem onClick={() => handleStatusClose('all')}>Statuts : tout</MenuItem>
          <MenuItem onClick={() => handleStatusClose('En cours')}>En cours</MenuItem>
          <MenuItem onClick={() => handleStatusClose('Terminé')}>Terminé</MenuItem>
          <MenuItem onClick={() => handleStatusClose('Annulé')}>Annulé</MenuItem>
        </Menu>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="contained"
          endIcon={<MdKeyboardArrowDown />}
          sx={{
            bgcolor: 'white',
            color: '#1A1A1A',
            textTransform: 'none',
            borderRadius: '8px',
            boxShadow: '0px 2px 4px rgba(0,0,0,0.02)',
            border: '1px solid #F4F6F8',
            '&:hover': { bgcolor: '#F4F6F8' }
          }}
        >
          Filtrer
        </Button>
      </Stack>

      <TableContainer
        component={Box}
        className="table-scroll"
        sx={{
          boxShadow: 'none',
          bgcolor: 'white',
          borderRadius: '12px',
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell 
                  key={col}
                  sx={{ 
                    color: '#919EAB', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    borderBottom: '1px solid #F4F6F8',
                    py: 2
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={6} align="center">Chargement...</TableCell></TableRow>
            ) : filteredTransactions.length === 0 ? (
               <TableRow><TableCell colSpan={6} align="center">Aucune transaction trouvée</TableCell></TableRow>
            ) : filteredTransactions.map((tx: any, index: number) => (
              <TableRow 
                key={tx._id || index}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  '& td': { borderBottom: '1px solid #F4F6F8', py: 2.5 }
                }}
              >
                <TableCell sx={{ color: '#1A1A1A', fontSize: '14px' }}>
                  #{tx.orderNumber || (5089 + index)}
                </TableCell>
                <TableCell sx={{ color: '#1A1A1A', fontSize: '14px' }}>
                  {tx.buyer?.firstName || tx.buyerName || 'Karim B'}
                </TableCell>
                <TableCell sx={{ color: '#1A1A1A', fontSize: '14px' }}>
                  {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '15 Mars 2026'}
                </TableCell>
                <TableCell sx={{ color: '#1A1A1A', fontSize: '14px', fontWeight: 500 }}>
                  {tx.totalPrice || tx.total || 1500} Da
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: '8px',
                      color: tx.status === 'Terminé' ? '#00A76F' : tx.status === 'Annulé' ? '#FF5630' : '#FFB800',
                      bgcolor: alpha(tx.status === 'Terminé' ? '#00A76F' : tx.status === 'Annulé' ? '#FF5630' : '#FFB800', 0.08),
                      fontSize: '13px',
                      fontWeight: 700,
                      width: 'fit-content'
                    }}
                  >
                    {tx.status || 'En cours'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography 
                    component="a" 
                    href={`/dashboard/transactions/${tx._id}`}
                    sx={{ 
                      color: '#0052FF', 
                      fontSize: '14px', 
                      fontWeight: 600,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Détails
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Bar */}
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ mt: 4, px: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography sx={{ color: '#919EAB', fontSize: '14px' }}>Afficher</Typography>
          <Select 
            value={10} 
            size="small" 
            sx={{ 
              borderRadius: '8px', 
              '& .MuiSelect-select': { py: 0.5, fontSize: '14px' } 
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
          <Typography sx={{ color: '#919EAB', fontSize: '14px' }}>De 50</Typography>
        </Stack>
        
        <Pagination 
          count={5} 
          shape="rounded" 
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: '8px',
              bgcolor: '#F4F6F8',
              border: 'none',
              '&.Mui-selected': {
                bgcolor: '#0052FF',
                color: 'white',
              }
            }
          }}
        />
      </Stack>
    </Container>
  );
}
