"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuctionsAPI } from "@/app/api/auctions";
import { TendersAPI } from "@/app/api/tenders";
import { DirectSaleAPI } from "@/app/api/direct-sale";
import { Auction } from '@/types/auction';
import { Tender } from '@/types/tender';
import { DirectSale } from '@/types/direct-sale';
import AuctionCard from '../cards/AuctionCard';
import TenderCard from '../cards/TenderCard';
import DirectSaleCard from '../cards/DirectSaleCard';
import { CircularProgress, Box, Typography, Tabs, Tab } from '@mui/material';

interface UserActivitiesSectionProps {
  userId: string;
}

const UserActivitiesSection = ({ userId }: UserActivitiesSectionProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
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
        // Note: Check both direct object equality and _id property
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasActivities = auctions.length > 0 || tenders.length > 0 || directSales.length > 0;

  if (!hasActivities) {
      return (
        <Box sx={{ textAlign: 'center', p: 4, color: '#666', background: '#f8f9fa', borderRadius: '16px' }}>
            <Typography variant="h6" color="textSecondary">
                {t('profile.noActivities') || "Aucune activité récente"}
            </Typography>
        </Box>
      );
  }

  return (
    <div className="user-activities-section">
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="User activities tabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
                '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    minWidth: 'auto',
                    mr: 2,
                    '&.Mui-selected': {
                        color: '#0063b1'
                    }
                },
                '& .MuiTabs-indicator': {
                    backgroundColor: '#0063b1'
                }
            }}
        >
          <Tab label={t('common.all') || "Tout"} />
          {auctions.length > 0 && <Tab label={`${t('common.auctions') || "Enchères"} (${auctions.length})`} />}
          {tenders.length > 0 && <Tab label={`${t('common.tenders') || "Appels d'offres"} (${tenders.length})`} />}
          {directSales.length > 0 && <Tab label={`${t('common.directSales') || "Ventes directes"} (${directSales.length})`} />}
        </Tabs>
      </Box>

      <div className="activities-grid">
         {/* Grid Layout Style */}
         <style jsx>{`
            .cards-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                gap: 32px;
            }
         `}</style>
        
        <div className="cards-grid">
            {/* Show ALL */}
            {activeTab === 0 && (
                <>
                    {auctions.map(auction => (
                        <AuctionCard key={auction.id || (auction as any)._id || `auction-${Math.random()}`} auction={auction} />
                    ))}
                    {tenders.map(tender => (
                        <TenderCard key={tender._id || `tender-${Math.random()}`} tender={tender} />
                    ))}
                    {directSales.map(sale => (
                        <DirectSaleCard key={sale._id || `sale-${Math.random()}`} sale={sale} />
                    ))}
                </>
            )}

            {/* Show Auctions - Dynamic Index */}
            {/* Logic: We filter what tabs are shown. 
                If Tab 1 is clicked, it corresponds to the first available category.
                This dynamic indexing is tricky. Better to be explicit based on counts.
            */}
            
            {/* Correct Logic: verify if the specific type tab is active 
                We need to know which index corresponds to which type.
                Let's simplify: All is always 0.
                Next ones depend on presence.
            */}
             
            {(activeTab === (1) && auctions.length > 0) && (
                 auctions.map(auction => (
                    <AuctionCard key={auction.id || (auction as any)._id} auction={auction} />
                ))
            )}

             {/* Tenders Tab Logic */}
            {((activeTab === 1 && auctions.length === 0 && tenders.length > 0) || 
              (activeTab === 2 && auctions.length > 0 && tenders.length > 0)) && (
                 tenders.map(tender => (
                    <TenderCard key={tender._id} tender={tender} />
                ))
            )}

             {/* Direct Sales Tab Logic */}
             {/* 
                Possible Indices for Direct Sales:
                - 1: If no Auctions, no Tenders
                - 2: If Auctions OR Tenders present (but not both)
                - 3: If Auctions AND Tenders present
             */}
             {(() => {
                 let salesIndex = 1;
                 if (auctions.length > 0) salesIndex++;
                 if (tenders.length > 0) salesIndex++;
                 
                 return activeTab === salesIndex ? directSales.map(sale => (
                     <DirectSaleCard key={sale._id} sale={sale} />
                 )) : null;
             })()}

        </div>
      </div>
    </div>
  );
};

export default UserActivitiesSection;
