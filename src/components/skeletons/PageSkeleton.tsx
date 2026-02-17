"use client";
import React from 'react';
import { Box, Skeleton, Grid, Container } from '@mui/material';

const PageSkeleton: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafc', py: 8 }}>
      <Container maxWidth="xl">
        {/* Banner Area Skeleton */}
        <Skeleton 
          variant="rectangular" 
          height={300} 
          sx={{ 
            borderRadius: 4, 
            mb: 6,
            background: 'linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
          }} 
        />

        {/* Section Title Skeleton */}
        <Skeleton 
          variant="text" 
          width={200} 
          height={40} 
          sx={{ mb: 4, borderRadius: 1 }} 
        />

        {/* Grid Area Skeleton */}
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'white', 
                borderRadius: 4, 
                boxShadow: '0 8px 20px rgba(0,0,0,0.06)' 
              }}>
                <Skeleton 
                  variant="rectangular" 
                  height={200} 
                  sx={{ borderRadius: 2, mb: 2 }} 
                />
                <Skeleton variant="text" height={30} width="80%" sx={{ mb: 1 }} />
                <Skeleton variant="text" height={20} width="60%" />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      <style jsx global>{`
        @keyframes shimmer {
          to {
            background-position-x: -200%;
          }
        }
      `}</style>
    </Box>
  );
};

export default PageSkeleton;
