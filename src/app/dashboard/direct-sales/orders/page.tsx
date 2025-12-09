'use client';

import {
  Box,
  Card,
  Container,
  Typography,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MdVisibility } from 'react-icons/md';

interface Order {
  _id: string;
  directSale?: {
    _id: string;
    title: string;
  } | null;
  buyer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  } | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { DirectSaleAPI } = await import('@/services/direct-sale');
      const data = await DirectSaleAPI.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
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
      fetchOrders();
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
        return 'Confirmed';
      case 'PENDING':
        return 'Pending';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          My Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your direct sale orders
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading orders...</Typography>
        </Box>
      ) : orders.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No orders found
          </Typography>
          <Typography color="text.secondary">
            You haven't received any orders yet
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Buyer</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.directSale?.title || 'Unknown Product'}</TableCell>
                  <TableCell>
                    {order.buyer 
                      ? `${order.buyer.firstName || ''} ${order.buyer.lastName || ''}`.trim() || 'Unknown Buyer' 
                      : 'Unknown Buyer'}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {order.buyer?.phone || 'Phone not available'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{order.quantity}</TableCell>
                  <TableCell align="right">{order.unitPrice.toLocaleString()} DA</TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {order.totalPrice.toLocaleString()} DA
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MdVisibility />}
                        onClick={() => {
                          if (order.directSale?._id) {
                            router.push(`/dashboard/direct-sales/${order.directSale._id}`);
                          } else {
                            console.error('Direct sale ID not found for order:', order._id);
                          }
                        }}
                      >
                        View Details
                      </Button>
                      {order.status === 'PENDING' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => {
                            setSelectedOrder(order);
                            setConfirmDialogOpen(true);
                          }}
                        >
                          Confirm
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => setConfirmDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Confirm Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to confirm this order from{' '}
            {selectedOrder?.buyer 
              ? `${selectedOrder.buyer.firstName || ''} ${selectedOrder.buyer.lastName || ''}`.trim() || 'Unknown Buyer' 
              : 'Unknown Buyer'}{' '}
            for {selectedOrder?.directSale?.title || 'Unknown Product'}?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Quantity: {selectedOrder?.quantity}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {selectedOrder?.totalPrice.toLocaleString()} DA
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            variant="contained"
            color="success"
          >
            {confirming ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
