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
  Avatar,
  IconButton,
  Pagination,
  Select,
  MenuItem,
  Stack,
  alpha,
  useTheme
} from '@mui/material';
import { MdEdit, MdDelete } from 'react-icons/md';
import { useQuery } from '@tanstack/react-query';
import { UserAPI } from '@/services/user';

const COLUMNS = ['NOM', 'NUMÉRO', 'CRÉE', 'ACTION'];

export default function ClientsPage() {
  const theme = useTheme();
  
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: async () => {
      const response = await UserAPI.getClients();
      return response.data || [];
    }
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'transparent' }}>
      <TableContainer 
        component={Box} 
        sx={{ 
          boxShadow: 'none', 
          bgcolor: 'white', 
          borderRadius: '12px',
          overflow: 'hidden'
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
               <TableRow><TableCell colSpan={4} align="center">Chargement...</TableCell></TableRow>
            ) : clientsData?.map((client: any, index: number) => (
              <TableRow 
                key={client._id || index}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  '& td': { borderBottom: '1px solid #F4F6F8', py: 2.5 }
                }}
              >
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar 
                      src={client.photoURL} 
                      sx={{ 
                        width: 40, 
                        height: 40,
                        boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#1A1A1A', fontSize: '14px' }}>
                        {client.firstName || client.socialReason || 'Sarlabc'}
                      </Typography>
                      <Typography sx={{ color: '#919EAB', fontSize: '12px' }}>
                        {client.email || 'Sarlabc@gmail.com'}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell sx={{ color: '#1A1A1A', fontSize: '14px' }}>
                  {client.phone || '000000000000'}
                </TableCell>
                <TableCell sx={{ color: '#1A1A1A', fontSize: '14px' }}>
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '15 mars 2026'}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" sx={{ color: '#919EAB' }}>
                      <MdEdit size={20} />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#919EAB' }}>
                      <MdDelete size={20} />
                    </IconButton>
                  </Stack>
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
          <Typography sx={{ color: '#919EAB', fontSize: '14px' }}>Affichage</Typography>
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
          <Typography sx={{ color: '#919EAB', fontSize: '14px' }}>de 50</Typography>
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
