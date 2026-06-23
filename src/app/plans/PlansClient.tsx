"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SubscriptionAPI } from '@/app/api/subscription';
import { SubscriptionPlan } from '@/app/api/subscription';
import './plans.css';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  ThemeProvider,
  createTheme,
} from "@mui/material";

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: "#0EA5E9",
      light: "#38BDF8",
      dark: "#0284C7",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#06B6D4",
      light: "#22D3EE",
      dark: "#0891B2",
    },
  },
  typography: {
    fontFamily: '"Inter", "DM Sans", sans-serif',
  }
});

export default function PlansClient() {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();
  const { isLogged, user } = useAuth();

  const translate = (key: string, fallback: string) => {
    const result = t(key);
    return result === key ? fallback : result;
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await SubscriptionAPI.getPlans();
      const data = Array.isArray(res?.data) ? res.data : [];
      const activePlans = data.filter(plan => plan.isActive);
      setPlans(activePlans);
    } catch (error) {
      console.error("Error fetching subscription plans", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planId?: string) => {
    if (!isLogged) {
      router.push('/auth/login?redirect=/plans');
      return;
    }
    const plan = plans.find(p => p._id === planId);
    if (plan?.role === 'PROFESSIONAL' && user?.type !== 'PROFESSIONAL') {
      router.push('/dashboard/profile?tab=documents');
      return;
    }
    router.push(`/plans/subscribe/${planId}`);
  };

  if (loading) {
    return (
      <div className="plans-page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredPlans = plans.filter(plan => {
    if (billingPeriod === 'monthly') {
      return plan.duration < 12 || plan.isDurationUnlimited;
    } else {
      return plan.duration >= 12 && !plan.isDurationUnlimited;
    }
  });

  return (
    <ThemeProvider theme={theme}>
      <div className="plans-page-wrapper">
        <div className="plans-header" style={{ textAlign: 'center', marginBottom: '60px', padding: '0 20px' }}>
          <h1 className="plans-title" style={{ 
            fontFamily: '"DM Sans", sans-serif', 
            fontWeight: 700, 
            fontSize: 'clamp(32px, 5vw, 56px)', 
            lineHeight: '1.2', 
            textAlign: 'center', 
            margin: '0 auto 24px', 
            width: '100%',
            maxWidth: '900px',
            marginTop: '60px',
            color: '#002896'
          }}>
            Solutions & Abonnements MazadClick.
          </h1>
          <p className="plans-subtitle" style={{ 
            fontFamily: '"Inter", sans-serif', 
            fontWeight: 400, 
            fontSize: '18px', 
            lineHeight: '1.6', 
            textAlign: 'center', 
            color: '#454545', 
            margin: '0 auto 40px', 
            maxWidth: '800px' 
          }}>
            Des packs adaptés à vos besoins, activez votre abonnement en un clic
          </p>
        </div>

        <div className="plan-toggle-container">
          <div className="plan-toggle-wrapper">
            <button 
              className={`toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Mensuel
            </button>
            <button 
              className={`toggle-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Annuel
            </button>
          </div>
        </div>

        <div className="plans-grid">
          {filteredPlans.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '60px', color: '#94a3b8' }}>
              {translate('plans.noPlans', 'Aucun plan disponible pour le moment.')}
            </div>
          ) : (
            filteredPlans.map((plan, index) => {
              const isPopular = index === 1; // Highlighting the middle plan
              const displayPrice = plan.price;
              
              let features: string[] = [];
              if (Array.isArray(plan.benefits) && plan.benefits.length > 0) {
                features = plan.benefits;
              }

              return (
                <motion.div 
                  key={plan._id || index} 
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'visible',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '24px',
                      background: 'white',
                      boxShadow: '0 8px 32px rgba(14, 165, 233, 0.04)',
                      transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                      "&:hover": {
                        transform: "translateY(-12px)",
                        boxShadow: "0 20px 60px rgba(14, 165, 233, 0.12)",
                      },
                    }}
                  >
                    
                    {/* Card Header matching the top blue banner */}
                    <Box
                      sx={{
                        background: plan.color || 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                        color: 'white',
                        py: 2,
                        textAlign: 'center',
                        borderRadius: '22px 22px 0 0',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {plan.name || 'Basique'}
                      </Typography>
                    </Box>

                    <CardContent 
                      sx={{ 
                        flexGrow: 1, 
                        p: 4.5,
                        pt: 3,
                        background: 'linear-gradient(to bottom, #F0F9FF 0%, #FFFFFF 100%)',
                        borderRadius: '0 0 22px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Quote Description */}
                      <Typography 
                        sx={{ 
                          color: '#1E3A8A', 
                          fontSize: '0.875rem', 
                          fontWeight: 600, 
                          fontStyle: 'italic', 
                          textAlign: 'center',
                          mt: 1.5,
                          px: 1,
                          lineHeight: 1.4,
                          minHeight: '48px'
                        }}
                      >
                        « {plan.description || 'Lorem ipsum dolor sit amet dolor siti conseiller adipiscing elit.'} »
                      </Typography>

                      {/* Price Section */}
                      <Box display="flex" alignItems="baseline" justifyContent="center" mt={3.5} mb={2.5}>
                        <Typography sx={{ fontSize: '2.8rem', fontWeight: 800, color: '#1E3A8A', mr: 0.5, lineHeight: 1 }}>
                          {displayPrice}
                        </Typography>
                        <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E3A8A' }}>
                          {billingPeriod === 'yearly' ? 'DA/an' : 'DA/mois'}
                        </Typography>
                      </Box>

                      {/* Obtenir maintenant Button */}
                      <Button
                        variant="contained"
                        onClick={() => handleSubscribe(plan._id)}
                        disabled={!plan.isActive}
                        sx={{
                          alignSelf: 'center',
                          background: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)',
                          color: 'white !important',
                          borderRadius: '24px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          py: 1.5,
                          px: 4,
                          width: '85%',
                          mb: 4,
                          boxShadow: '0 4px 15px rgba(14, 165, 233, 0.25)',
                          "&:hover": {
                            background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                            transform: 'translateY(-1px)',
                          }
                        }}
                      >
                        {translate('plans.subscribe', "S'abonner")}
                      </Button>

                      {/* Dynamic Bullet Lists */}
                      <Stack spacing={3.5} sx={{ textAlign: 'left', mb: 3 }}>
                        
                        {/* Ideal For Section */}
                        <Box>
                          <Typography sx={{ color: '#1E3A8A', fontWeight: 800, fontSize: '0.925rem', mb: 1.5 }}>
                            Idéal pour :
                          </Typography>
                          <Box display="flex" alignItems="flex-start" gap={1.25}>
                            <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                            <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                              Idéal pour les comptes {plan.role?.toLowerCase() === 'professional' ? 'professionnels' : 'particuliers'}, booster votre activité et maximiser vos performances.
                            </Typography>
                          </Box>
                        </Box>

                        {/* Key Advantages Section */}
                        {features.length > 0 && (
                          <Box>
                            <Typography sx={{ color: '#1E3A8A', fontWeight: 800, fontSize: '0.925rem', mb: 1.5 }}>
                              Avantages clés :
                            </Typography>
                            <Stack spacing={1.25}>
                              {features.map((feature, idx) => (
                                <Box key={idx} display="flex" alignItems="flex-start" gap={1.25}>
                                  <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                                  <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                    {feature}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {/* Included Features Section */}
                        <Box>
                          <Typography sx={{ color: '#1E3A8A', fontWeight: 800, fontSize: '0.925rem', mb: 1.5 }}>
                            Ce qui est inclus :
                          </Typography>
                          <Stack spacing={1.25}>
                            {/* Announces */}
                            <Box display="flex" alignItems="flex-start" gap={1.25}>
                              <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                              <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                {plan.announcesPerMonth === -1 ? 'Annonces par mois : Illimitées' : `${plan.announcesPerMonth} annonces par mois`} (active pendant {plan.isDurationUnlimited ? 'illimité' : plan.duration * 30} jours)
                              </Typography>
                            </Box>

                            {/* Media Limits */}
                            <Box display="flex" alignItems="flex-start" gap={1.25}>
                              <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                              <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                {plan.photosLimit === -1 ? 'Photos : Illimitées' : `Jusqu'à ${plan.photosLimit || 0} photos`}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="flex-start" gap={1.25}>
                              <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                              <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                {plan.videosLimit === -1 ? 'Vidéos : Illimitées' : `Jusqu'à ${plan.videosLimit || 0} vidéos`}
                              </Typography>
                            </Box>

                            {/* Soumission Limit */}
                            <Box display="flex" alignItems="flex-start" gap={1.25}>
                              <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                              <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                {plan.enchereSoumissionLimit === -1 ? 'Enchères / soumissions simultanées : Illimitées' : `${plan.enchereSoumissionLimit} enchères / soumissions simultanées`}
                              </Typography>
                            </Box>

                            {/* Stats / Analytics */}
                            <Box display="flex" alignItems="flex-start" gap={1.25}>
                              <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                              <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                Niveau d'analyse : {plan.statisticsLevel === 'BASIC' ? 'Basique' : plan.statisticsLevel === 'ADVANCED' ? 'Avancé' : 'Standard'}
                              </Typography>
                            </Box>

                            {/* Switch features */}
                            {plan.hasChatAndMessaging && (
                              <Box display="flex" alignItems="flex-start" gap={1.25}>
                                <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                                <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                  Chat & messagerie instantanés
                                </Typography>
                              </Box>
                            )}

                            {plan.hasRatingAndHistory && (
                              <Box display="flex" alignItems="flex-start" gap={1.25}>
                                <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                                <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                  Historique & évaluations
                                </Typography>
                              </Box>
                            )}

                            {plan.hasAutoTranslation && (
                              <Box display="flex" alignItems="flex-start" gap={1.25}>
                                <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                                <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                  Traduction automatique en temps réel
                                </Typography>
                              </Box>
                            )}

                            {plan.hasMiseEnAvant && (
                              <Box display="flex" alignItems="flex-start" gap={1.25}>
                                <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                                <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                  Mise en avant prioritaire de l'annonce
                                </Typography>
                              </Box>
                            )}

                            {plan.hasEmailNotification && (
                              <Box display="flex" alignItems="flex-start" gap={1.25}>
                                <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                                <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                  Notifications par e-mail
                                </Typography>
                              </Box>
                            )}

                            {plan.isDurationUnlimited && (
                              <Box display="flex" alignItems="flex-start" gap={1.25}>
                                <Typography sx={{ color: '#0EA5E9', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1.2 }}>✓</Typography>
                                <Typography sx={{ color: '#1E3A8A', fontSize: '0.875rem', fontWeight: 550, opacity: 0.9, lineHeight: 1.45 }}>
                                  Durée illimitée (N'expire jamais et ne requiert aucun réabonnement)
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
