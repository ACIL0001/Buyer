import React from 'react';
import { Card, CardContent, Skeleton, Box } from '@mui/material';

const CardSkeleton: React.FC = () => {
  return (
    <Card sx={{ maxWidth: '100%', m: 1, borderRadius: 2, boxShadow: 'none', border: '1px solid #eee' }}>
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" height={30} width="80%" />
        <Skeleton variant="text" height={20} width="60%" />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default CardSkeleton;
