import React from 'react';
import { Box, Skeleton, Grid, Paper } from '@mui/material';

const ProfileSkeleton: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                    <Skeleton variant="circular" width={120} height={120} />
                    <Skeleton variant="text" width="60%" height={30} sx={{ mt: 2 }} />
                    <Skeleton variant="text" width="40%" height={20} />
                    <Skeleton variant="rectangular" width="100%" height={40} sx={{ mt: 3, borderRadius: 1 }} />
                </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Skeleton variant="text" height={40} width="30%" sx={{ mb: 3 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                             <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                             <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    </Box>
  );
};

export default ProfileSkeleton;
