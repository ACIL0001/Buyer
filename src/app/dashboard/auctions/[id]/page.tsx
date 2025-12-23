'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Card,
  Grid,
  Stack,
  Avatar,
  Button,
  Container,
  Typography,
  CircularProgress,
  Chip,
  Paper,
  Slide,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AuctionsAPI } from '@/services/auctions';
import { OffersAPI } from '@/services/offers';
import useAuth from '@/hooks/useAuth';
import Label from '@/components/Label';
import {
  MdCheckCircle,
  MdChat,
  MdEmojiEvents,
  MdOpenInNew,
  MdTimer,
} from 'react-icons/md';

// Local Mock Translation
const useTranslation = () => {
  const t = (key: string, options?: any) => {
    const trans: Record<string, string> = {
      'details': 'Détails',
      'auctionDetails': "Détails de l'enchère",
      'notFound': 'Enchère non trouvée',
      'unknownUser': 'Utilisateur inconnu',
      'winnerBanner': 'Gagnant',
      'phone': 'Téléphone',
      'startChat': 'Démarrer le chat',
      'statusLabel': 'Statut',
      'description': 'Description',
      'initialPrice': 'Prix initial',
      'currentPrice': 'Prix actuel',
      'participants': 'Participants',
      'noParticipants': 'Aucun participant pour le moment',
      'information': 'Informations',
      'type': 'Type',
      'typeProduct': 'Produit',
      'typeService': 'Service',
      'mode': 'Mode',
      'modeExpress': 'Express',
      'modeAutomatic': 'Automatique',
      'modeClassic': 'Classique',
      'timeline': 'Chronologie',
      'startDate': 'Date de début',
      'endDate': 'Date de fin',
      'errors.noValidParticipant': 'Aucun participant valide trouvé',
    };
    return trans[key] || key;
  };
  return { t, i18n: { language: 'fr' } };
};

enum BID_STATUS {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    ON_AUCTION = 'ON_AUCTION',
    ARCHIVED = 'ARCHIVED'
}

enum AUCTION_TYPE {
    CLASSIC = 'CLASSIC',
    EXPRESS = 'EXPRESS',
    AUTO_SUB_BID = 'AUTO_SUB_BID'
}

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: { path: string };
}

interface Auction {
    _id: string;
    title: string;
    description: string;
    startingPrice: number;
    currentPrice?: number;
    status: BID_STATUS;
    bidType: 'PRODUCT' | 'SERVICE';
    auctionType: AUCTION_TYPE;
    startingAt: string;
    endingAt: string;
    winner?: User;
    owner?: User;
}

interface Participant {
  name: string;
  avatar: string;
  bidAmount: number;
  bidDate: Date | string;
  user: User;
}

export default function AuctionDetailPage() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const { auth, isLogged } = useAuth();
  const fetchInProgress = useRef(false);

  const getAuctionDetails = useCallback(async (auctionId: string) => {
    if (fetchInProgress.current) return;

    try {
      fetchInProgress.current = true;
      setLoading(true);
      console.log('Fetching auction details for ID:', auctionId);
      const response = await AuctionsAPI.getAuctionById(auctionId);
      console.log("Auction details response:", response);
      
      if (response) {
        setAuction(response);
      }
    } catch (error: any) {
      console.error('Error fetching auction details:', error);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, []);

  const getAuctionParticipants = useCallback(async (auctionId: string) => {
    // Wait for authentication to be ready if needed
    if (!isLogged && !auth?.user) {
        // Just proceed if public or wait? logic from seller app says wait for auth
        // But for viewing details might be public? 
        // For now, let's assume valid auth is needed for offers
    }

    setParticipantsLoading(true);
    try {
      console.log('Fetching participants for auction ID:', auctionId);
      const offers = await OffersAPI.getOffersByBidId(auctionId);

      console.log('Offers response:', offers);
      
      if (Array.isArray(offers)) {
        const formattedParticipants = offers
          .map((offer: any) => ({
            name: offer.user?.firstName && offer.user?.lastName 
              ? `${offer.user.firstName} ${offer.user.lastName}` 
              : offer.user?.email || t('unknownUser'),
            avatar: offer.user?.avatar?.path || '',
            bidAmount: offer.price || 0,
            bidDate: offer.createdAt || new Date(),
            user: offer.user as User
          }))
          .sort((a, b) => new Date(b.bidDate).getTime() - new Date(a.bidDate).getTime());
        
        setParticipants(formattedParticipants);
      } else {
        setParticipants([]);
      }
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  }, [isLogged, auth?.user]);

  useEffect(() => {
    if (id) {
      getAuctionDetails(id);
      getAuctionParticipants(id);
    }
  }, [id, getAuctionDetails, getAuctionParticipants]);

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: BID_STATUS) => {
    switch (status) {
      case BID_STATUS.OPEN: return 'info';
      case BID_STATUS.ON_AUCTION: return 'success';
      case BID_STATUS.CLOSED: return 'error';
      case BID_STATUS.ARCHIVED: return 'default';
      default: return 'default';
    }
  };

  const CreateChat = async () => {
    if (!participants.length || !participants[0]?.user || !auth.user) return;

    setChatLoading(true);
    // TODO: Implement Chat logic or navigation
    console.log('Create chat logic placeholder');
    setChatLoading(false);
  };

  const WinnerBanner = ({ winner }: { winner: User }) => (
    <Slide in direction="down" timeout={600}>
      <Paper
        elevation={6}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
          color: '#fff',
          boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <MdEmojiEvents size={40} style={{ color: '#fff', marginRight: 16 }} />
        <Avatar
          src={winner?.avatar?.path || ''}
          alt={winner?.firstName || 'Winner'}
          sx={{ width: 56, height: 56, border: '2px solid #fff', boxShadow: 2 }}
        >
          {winner?.firstName?.charAt(0) || 'W'}
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            {t('winnerBanner')}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            <b>{winner?.firstName || ''} {winner?.lastName || ''}</b>
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 400, opacity: 0.9 }}>
            <b>{t('phone')}: {winner?.phone || 'N/A'}</b>
          </Typography>
        </Box>
      </Paper>
    </Slide>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!auction) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6">{t('notFound')}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 10 }}>
      {auction.winner && <WinnerBanner winner={auction.winner} />}
      
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4" gutterBottom>
          {auction.title}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {auction.status === BID_STATUS.OPEN && participants.length > 0 && (
            <Button
              variant="contained"
              startIcon={<MdChat />}
              onClick={CreateChat}
              disabled={chatLoading}
              sx={{
                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                color: '#fff',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: '0 4px 20px 0 rgba(34, 197, 94, 0.15)',
                px: 3,
                py: 1.2,
                fontSize: '1rem',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(90deg, #38f9d7 0%, #43e97b 100%)',
                },
              }}
              size="large"
            >
              {chatLoading ? <CircularProgress size={22} color="inherit" /> : t('startChat')}
            </Button>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: (theme) => {
                    const color = getStatusColor(auction.status);
                    return (theme.palette as any)[color]?.main || theme.palette.primary.main;
                  },
                  animation: 'pulse 2s infinite',
                }}
              />
              <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {t('statusLabel')}
              </Typography>
            </Box>
            <Chip
              label={auction.status === BID_STATUS.OPEN 
                ? 'Open' 
                : auction.status === BID_STATUS.ON_AUCTION ? 'On Auction' 
                : auction.status === BID_STATUS.CLOSED ? 'Closed'
                : auction.status === BID_STATUS.ARCHIVED ? 'Archived'
                : auction.status}
              color={getStatusColor(auction.status) as any}
              variant="filled"
              size="small"
              sx={{ fontWeight: 600, borderRadius: 1.5, minWidth: 80 }}
            />
          </Paper>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2, mb: 3, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{t('details')}</Typography>
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('description')}</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{auction.description}</Typography>
              </Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">{t('initialPrice')}</Typography>
                  <Typography variant="h6">{(auction.startingPrice || 0).toFixed(2)} DA</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">{t('currentPrice')}</Typography>
                  <Typography variant="h6" color="primary.main">{(auction.currentPrice || auction.startingPrice || 0).toFixed(2)} DA</Typography>
                </Grid>
              </Grid>
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('participants')}</Typography>
            {participantsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="60px">
                <CircularProgress size={24} />
              </Box>
            ) : participants && participants.length > 0 ? (
              <Stack spacing={2}>
                {participants.map((participant, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar src={participant.avatar} alt={participant.name}>{participant.name.charAt(0)}</Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{participant.name}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" color="text.secondary">
                                Offre: {participant.bidAmount?.toFixed(2) || '0.00'} DA
                            </Typography>
                            {participant.user?.phone && (
                                <Chip label={participant.user.phone} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                            )}
                        </Stack>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary">{formatDate(participant.bidDate)}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                {t('noParticipants')}
              </Typography>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, mb: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>{t('information')}</Typography>
            <Stack spacing={2} sx={{ flex: 1, justifyContent: 'space-around' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">{t('type')}</Typography>
                <Label variant="ghost" color="default">
                  {auction.bidType === 'PRODUCT' ? t('typeProduct') : t('typeService')}
                </Label>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">{t('mode')}</Typography>
                <Label variant="ghost" color={auction.auctionType === AUCTION_TYPE.EXPRESS ? 'warning' : 'default'}>
                  {auction.auctionType === AUCTION_TYPE.EXPRESS
                    ? `${t('modeExpress')} (MEZROUB)`
                    : auction.auctionType === AUCTION_TYPE.AUTO_SUB_BID
                    ? t('modeAutomatic')
                    : t('modeClassic')}
                </Label>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('timeline')}</Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">{t('startDate')}</Typography>
                <Typography variant="body1">{formatDate(auction.startingAt)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">{t('endDate')}</Typography>
                <Typography variant="body1">{formatDate(auction.endingAt)}</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
