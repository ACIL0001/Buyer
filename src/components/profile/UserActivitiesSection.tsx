"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuctionsAPI } from "@/app/api/auctions";
import { TendersAPI } from "@/app/api/tenders";
import { DirectSaleAPI } from "@/app/api/direct-sale";
import { Auction } from '@/types/auction';
import { Tender } from '@/types/tender';
import { DirectSale } from '@/types/direct-sale';
import { CircularProgress, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface UserActivitiesSectionProps {
  userId: string;
}

const UserActivitiesSection = ({ userId }: UserActivitiesSectionProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [directSales, setDirectSales] = useState<DirectSale[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [auctionsData, tendersData, directSalesData] = await Promise.all([
          AuctionsAPI.getAuctions().catch(err => { console.error('Error fetching auctions', err); return []; }),
          TendersAPI.getActiveTenders().catch(err => { console.error('Error fetching tenders', err); return []; }),
          DirectSaleAPI.getDirectSales().catch(err => { console.error('Error fetching sales', err); return []; })
        ]);

        // Helper to extract array from response
        const extractArray = (data: any) => {
             if (Array.isArray(data)) return data;
             if (data && Array.isArray(data.data)) return data.data;
             if (data && data.success && Array.isArray(data.data)) return data.data;
             return [];
        };

        const allAuctions = extractArray(auctionsData);
        const allTenders = extractArray(tendersData);
        const allDirectSales = extractArray(directSalesData);

        // Filter by userId
        const userAuctions = allAuctions.filter((item: any) => 
            item.owner?._id === userId || item.owner === userId || item.seller?._id === userId
        );
        
        const userTenders = allTenders.filter((item: any) => 
            item.owner?._id === userId || item.owner === userId
        );
        
        const userDirectSales = allDirectSales.filter((item: any) => 
            item.owner?._id === userId || item.owner === userId
        );

        setAuctions(userAuctions);
        setTenders(userTenders);
        setDirectSales(userDirectSales);

      } catch (error) {
        console.error("Failed to fetch user activities", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchActivities();
    } else {
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const containerStyle = {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      padding: '10px 0'
  };

  const cardStyle = (color: string, borderColor: string) => ({
      borderRadius: '20px',
      border: `2px solid ${borderColor}`,
      padding: '30px 20px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      background: 'white',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      transition: 'transform 0.2s',
      height: '100%',
      position: 'relative' as const,
      zIndex: 1
  });

  const iconCircleStyle = (bgColor: string, color: string) => ({
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
      color: color,
      fontSize: '32px'
  });

  const titleStyle = {
      fontSize: '20px',
      fontWeight: '700',
      color: '#0f3460',
      marginBottom: '30px'
  };

  const buttonContainerStyle = {
      display: 'flex',
      gap: '12px',
      width: '100%',
      marginTop: 'auto',
      position: 'relative' as const,
      zIndex: 10
  };

  const viewButtonStyle = {
      flex: 1,
      padding: '10px',
      borderRadius: '10px',
      border: 'none',
      background: '#0d47a1', // Blue
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '14px'
  };
  
  const createButtonStyle = {
      flex: 1,
      padding: '10px',
      borderRadius: '10px',
      border: 'none',
      background: '#0d47a1', // Blue
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '14px'
  };

  return (
    <div className="user-activities-section" style={{ width: '100%', padding: '10px 0' }}>
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)',
                border: '1px solid rgba(230, 230, 230, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '160px'
            }}
        >
            <div style={{ zIndex: 2 }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '10px'
                }}>
                    <span style={{
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        borderRadius: '20px',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {t('profile.activityStats.overview') || 'Overview'}
                    </span>
                </div>
                
                <h3 style={{ 
                    margin: '0 0 16px 0', 
                    color: '#1e293b', 
                    fontSize: '32px', 
                    fontWeight: '800',
                    lineHeight: 1.2
                }}>
                    {t('profile.activityStats.userActivity') || 'User Activity'}
                </h3>
                
                <div style={{ 
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '8px'
                }}>
                    <span style={{ 
                        fontSize: '64px', 
                        fontWeight: '900', 
                        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1
                    }}>
                        {auctions.length + tenders.length + directSales.length}
                    </span>
                    <span style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#64748b'
                    }}>
                        {t('profile.activityStats.totalInteractions') || 'Total Interactions'}
                    </span>
                </div>
            </div>

            {/* Decorative Visual on the right */}
            <div style={{ 
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '30px',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
                    boxShadow: '0 10px 30px rgba(37, 99, 235, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.8)'
                }}>
                    <i className="bi bi-bar-chart-fill" style={{ fontSize: '40px', color: '#2563eb' }}></i>
                </div>
            </div>

            {/* Abstract Background Shapes */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-5%',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(37,99,235,0.03) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                left: '-5%',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.03) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1
            }} />
        </motion.div>
    </div>
  );
};

export default UserActivitiesSection;
