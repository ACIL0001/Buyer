'use client';

import { useEffect, useState } from 'react';
import { Container, Grid, Typography, Card, CardContent, Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { MdGavel, MdEmail, MdStore, MdAttachMoney } from 'react-icons/md';
import useAuth from '@/hooks/useAuth';

export default function DashboardPage() {
    const { auth } = useAuth();
    const user = auth?.user;
    const theme = useTheme();

    // Mock stats - in real implementation, these would come from an API
    const stats = [
        { 
            title: 'Total Auctions', 
            value: 12, 
            icon: MdGavel, 
            color: theme.palette.primary.main, 
            bgcolor: alpha(theme.palette.primary.main, 0.12)
        },
        { 
            title: 'Active Tenders', 
            value: 5, 
            icon: MdEmail, 
            color: theme.palette.info.main, 
            bgcolor: alpha(theme.palette.info.main, 0.12)
        },
        { 
            title: 'Direct Sales', 
            value: 8, 
            icon: MdStore, 
            color: theme.palette.warning.main, 
            bgcolor: alpha(theme.palette.warning.main, 0.12) 
        },
        { 
            title: 'Total Revenue', 
            value: '45,000 DA', 
            icon: MdAttachMoney, 
            color: theme.palette.success.main, 
            bgcolor: alpha(theme.palette.success.main, 0.12) 
        },
    ];

    return (
        <Container maxWidth="xl">
            <Typography variant="h4" sx={{ mb: 5 }}>
                Hi, Welcome back {user?.firstName || 'Back'}
            </Typography>

            <Grid container spacing={3}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                p: 3,
                                boxShadow: theme.shadows[2],
                                borderRadius: 2
                            }}
                        >
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                    {stat.title}
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                                    {stat.value}
                                </Typography>
                            </Box>
                             <Box sx={{ 
                                 width: 64, 
                                 height: 64, 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 borderRadius: '50%',
                                 bgcolor: stat.bgcolor,
                                 color: stat.color
                             }}>
                                <stat.icon size={32} />
                             </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            
            {/* Future: Revenue Chart and Recent Activity Tables */}
            
        </Container>
    );
}
