"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import useAuth from '@/hooks/useAuth';
import { OfferAPI } from '@/app/api/offer';
import { Pagination, Box, Typography, Card, CardContent, Grid, Chip } from '@mui/material';
import { styled } from '@mui/system';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; 
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { extractErrorMessage } from '@/types/Error'; 

interface OfferHistoryItem {
  _id: string;
  price: number;
  status?: 'en attente' | 'accepted' | 'declined'; 
  createdAt: string;
  bid: {
    title: string;
    _id: string;
  };
  user: {
    firstName: string;
    lastName: string;
  };
}



// --- Styled Components ---

const HistoryContainer = styled(Box)(({ theme }) => ({
  padding: '1.25rem', // Reduced padding for better UI/UX
  backgroundColor: '#ffffff', // Clean white background for the main content area
  borderRadius: '12px', // Smaller rounded corners
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // Lighter shadow
  border: '1px solid #e0e0e0', // Subtle border for definition
  position: 'relative',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #f8fbfd 0%, #edf2f7 100%)', // Very light, subtle gradient
  [theme.breakpoints.down('sm')]: {
    padding: '1rem', // Adjust padding for smaller screens
  },
}));

const OfferCard = styled(Card)(({ theme }) => ({
  marginBottom: '0.75rem', // Reduced space between cards
  borderRadius: '10px', // Smaller rounded corners
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', // Lighter shadow
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  backgroundColor: '#ffffff', // White card background
  border: '1px solid #f5f5f5', // Very light border
  '&:hover': {
    transform: 'translateY(-4px)', // Less pronounced lift on hover
    boxShadow: '0 6px 16px rgba(0,0,0,0.1)', // Lighter shadow on hover
    backgroundColor: '#fdfdfd', // Slight background change on hover
  },
  [theme.breakpoints.down('sm')]: {
    marginBottom: '0.625rem',
  },
}));

const StatusChip = styled(Chip)<{ status: string }>(({ status, theme }) => ({
  fontWeight: '600',
  color: 'white',
  padding: '4px 10px', // Reduced padding
  borderRadius: '12px', // Smaller rounded corners
  fontSize: '0.7rem', // Smaller font
  textTransform: 'uppercase',
  letterSpacing: '0.5px', // Less letter spacing
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)', // Lighter shadow
  ...(status === 'accepted' && {
    backgroundColor: '#28a745', // Success green
    boxShadow: '0 2px 8px rgba(40,167,69,0.25)',
  }),
  ...(status === 'en attente' && {
    backgroundColor: '#ffc107', // Warning yellow
    color: '#495057', // Darker text for contrast on yellow
    boxShadow: '0 2px 8px rgba(255,193,7,0.25)',
  }),
  ...(status === 'declined' && {
    backgroundColor: '#dc3545', // Danger red
    boxShadow: '0 2px 8px rgba(220,53,69,0.25)',
  }),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem',
    padding: '3px 8px',
  },
}));

// --- Loading Skeleton Component ---

const LoadingSkeleton = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {[...Array(3)].map((_, index) => (
      <OfferCard key={index}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <Box sx={{ height: 28, backgroundColor: '#e0e0e0', borderRadius: '8px', width: '60%', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <Box sx={{ height: 24, backgroundColor: '#e0e0e0', borderRadius: '12px', width: '20%', animation: 'pulse 1.5s infinite ease-in-out 0.1s' }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ height: 20, backgroundColor: '#e0e0e0', borderRadius: '6px', width: '40%', animation: 'pulse 1.5s infinite ease-in-out 0.2s' }} />
            <Box sx={{ height: 20, backgroundColor: '#e0e0e0', borderRadius: '6px', width: '30%', animation: 'pulse 1.5s infinite ease-in-out 0.3s' }} />
          </Box>
        </CardContent>
      </OfferCard>
    ))}
    <style jsx global>{`
      @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 0.4; }
        100% { opacity: 0.8; }
      }
    `}</style>
  </Box>
);


export default function HistoryPage() {
  const { auth, isLogged } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [offers, setOffers] = useState<OfferHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchOfferHistory = async () => {
      // --- Debugging console logs ---
      console.log('HistoryPage: useEffect triggered.');
      console.log('HistoryPage: isLogged:', isLogged);
      console.log('HistoryPage: auth.user?._id:', auth.user?._id);
      // --- End Debugging console logs ---

      // Ensure auth.user?._id is available before making the API call
      if (!isLogged || !auth.user?._id) {
        setIsLoading(false);
        console.log('HistoryPage: Not logged in or user ID not available. Skipping fetch.');
        return;
      }

      setIsLoading(true);
      try {
        // Correctly access the response: it's the array directly, not response.data
        const response = await OfferAPI.getOffersByUserId(auth.user._id);

        // --- Debugging console logs ---
        console.log('HistoryPage: API Response:', response); // Log the full response
        // --- End Debugging console logs ---

        // The API returns a wrapped response, so access the data property and map to the expected format
        const apiOffers = (response?.data || []) as Array<any>;
        const fetchedOffers: OfferHistoryItem[] = apiOffers.map((offer: any) => ({
          _id: offer._id || offer.id,
          price: offer.amount ?? offer.price ?? 0,
          status: offer.status === 'pending' ? 'en attente' : offer.status === 'accepted' ? 'accepted' : 'declined',
          createdAt: offer.createdAt || offer.created_at || new Date().toISOString(),
          bid: {
            title: `Bid ${offer.bidId || offer.bid_id || ''}`,
            _id: offer.bidId || offer.bid_id || ''
          },
          user: {
            firstName: 'User', // You might want to fetch actual user data
            lastName: 'Name'
          }
        }));

        // --- Debugging console logs ---
        console.log('HistoryPage: Fetched Offers (after direct access):', fetchedOffers); // Log the extracted data
        // --- End Debugging console logs ---

        // Implement client-side pagination
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setOffers(fetchedOffers.slice(startIndex, endIndex));
        setTotalPages(Math.ceil(fetchedOffers.length / itemsPerPage));

      } catch (error: unknown) {
        console.error('Error fetching offer history:', error);
        enqueueSnackbar(extractErrorMessage(error) || 'Failed to fetch offer history.', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfferHistory();
  }, [isLogged, auth.user?._id, enqueueSnackbar, page]); // Re-fetch when user ID or page changes

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Use 12-hour format
    };
    return date.toLocaleString('en-US', options);
  };

  return (
    <HistoryContainer>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '1.25rem' }} // Reduced bottom margin for header
      >
        <Typography variant="h4" component="h2" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem', // Reduced space around icon
          color: '#2C3E50', // Deep charcoal for main title
          fontWeight: 700,
          marginBottom: '0.5rem',
          fontSize: '1.25rem', // Smaller font size
        }}>
          <i className="bi bi-clock-history" style={{ fontSize: '1.5rem', color: '#5DADE2' }}></i> {/* Smaller icon */}
          My Offer History
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{
          fontSize: '0.875rem', // Smaller description text
          color: '#7F8C8D', // Softer, professional grey for description
        }}>
          Review all the offers you&apos;ve made and track their current status.
        </Typography>
      </motion.div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          {offers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center', padding: '80px 30px', color: '#90a4ae', backgroundColor: '#fdfdfd', borderRadius: '16px', border: '2px dashed #cfd8dc' }} // Enhanced empty state styling
            >
              <i className="bi bi-folder-x" style={{ fontSize: '5rem', marginBottom: '30px', color: '#b0bec5' }}></i> {/* More relevant icon */}
              <Typography variant="h5" sx={{ fontWeight: 700, marginBottom: '15px', color: '#5D6D7E' }}>No Offers Yet</Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#7F8C8D' }}>
                It looks like you haven&apos;t made any offers. Start exploring auctions today!
              </Typography>
              {/* Optional: Add a button to navigate to auctions page */}
              {/* <Button variant="contained" color="primary" sx={{ marginTop: '20px' }}>Browse Auctions</Button> */}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {offers.map((offer) => (
                  <Box key={offer._id}>
                    <OfferCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <Typography variant="h6" component="div" sx={{ color: '#34495E', fontWeight: 600, fontSize: '1rem' }}>
                            {offer.bid?.title || 'Untitled Bid'}
                          </Typography>
                          {/* Corrected: Apply optional chaining and nullish coalescing consistently */}
                          <StatusChip
                            label={(offer.status?.toUpperCase() ?? 'en attente')}
                            status={(offer.status ?? 'en attente')}
                            size="medium" 
                          />
                        </Box>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' }, 
                          gap: { xs: '10px', sm: '0' }, 
                        }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AttachMoneyIcon sx={{ color: '#607d8b', fontSize: '1rem' }} />
                            Offer Amount: <Typography component="span" sx={{ fontWeight: 700, color: '#27AE60', fontSize: '0.875rem' }}>${offer.price.toFixed(2)}</Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarTodayIcon sx={{ color: '#607d8b', fontSize: '1rem' }} />
                            Date: {formatDateTime(offer.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </OfferCard>
                  </Box>
                ))}
              </Box>
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: '8px', // Smaller rounded pagination items
                        padding: '6px 12px', // Reduced clickable area
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '&.Mui-selected': {
                          backgroundColor: '#3f51b5', // Primary color for selected
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(63,81,181,0.25)',
                          '&:hover': {
                            backgroundColor: '#303f9f', // Darker on hover for selected
                          },
                        },
                        '&:hover': {
                          backgroundColor: '#e3f2fd', // Light hover for unselected
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </HistoryContainer>
  );
}