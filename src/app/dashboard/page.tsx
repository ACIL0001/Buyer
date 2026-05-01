'use client';

import { Container, Grid, Typography, Paper, Box, ButtonBase, Zoom } from '@mui/material';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { 
    MdGavel, 
    MdEmail, 
    MdStore, 
    MdRocketLaunch, 
    MdTrendingUp, 
    MdTrendingFlat,
    MdAddCircleOutline,
    MdVisibility,
    MdAdd,
    MdCheckCircleOutline,
    MdPaid,             // Hand/Coin
    MdPendingActions,   // Clock/Waiting
    MdOutbox,           // Email sent/response
    MdDescription,      // File/Paper
    MdMonetizationOn,   // Money
    MdShowChart,        // Chart
    MdTimeline,         // Line chart alternate
    MdInsertChartOutlined
} from 'react-icons/md';
import useAuth from '@/hooks/useAuth';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { ListPageSkeleton, DashboardKeyframes } from '@/components/dashboard/dashboardHelpers';

// ----------- Design Constants & Mock Data -----------

const COLORS = {
    submission: { bg: 'color-mix(in srgb, var(--primary-tender-color) 10%, transparent)', main: 'var(--primary-tender-color)', light: 'color-mix(in srgb, var(--primary-tender-color) 20%, transparent)' },
    auction: { bg: 'color-mix(in srgb, var(--primary-auction-color) 10%, transparent)', main: 'var(--primary-auction-color)', light: 'color-mix(in srgb, var(--primary-auction-color) 20%, transparent)' },
    direct: { bg: 'color-mix(in srgb, var(--primary-ds-color) 10%, transparent)', main: 'var(--primary-ds-color)', light: 'color-mix(in srgb, var(--primary-ds-color) 20%, transparent)' },
    
    // New Colors
    offer: { bg: 'color-mix(in srgb, var(--primary-auction-color) 10%, transparent)', main: 'var(--primary-auction-color)', light: 'color-mix(in srgb, var(--primary-auction-color) 20%, transparent)' },
    pending: { bg: '#FFFDE7', main: '#FBC02D', light: '#FFF9C4' },      // Yellow
    response: { bg: 'color-mix(in srgb, var(--primary-tender-color) 10%, transparent)', main: 'var(--primary-tender-color)', light: 'color-mix(in srgb, var(--primary-tender-color) 20%, transparent)' },
    waiting: { bg: '#FDFBF7', main: '#FFECB3', light: '#FFE0B2' },      // Beige/Pale
    finance_green: { bg: '#E8F5E9', main: '#43A047', light: '#C8E6C9' },// Money Green
    finance_blue: { bg: '#E3F2FD', main: '#1976D2', light: '#BBDEFB' }, // Chart Blue
    finance_indigo: { bg: '#E8EAF6', main: '#3F51B5', light: '#C5CAE9' },// Indigo
};

function buildStatsPerformance(data: any = {}) {
    return [
        { label: "dashboard.stats.totalAuctions", value: data.auctionsTotal || 0, trend: null, trendColor: null, category: "auction", icon: MdGavel },
        { label: "dashboard.stats.activeAuctions", value: data.auctionsActive || 0, trend: null, trendColor: null, category: "auction", icon: MdGavel },
        { label: "dashboard.stats.totalTenders", value: data.tendersTotal || 0, trend: null, trendColor: null, category: "submission", icon: MdEmail },
        { label: "dashboard.stats.activeTenders", value: data.tendersActive || 0, trend: null, trendColor: null, category: "submission", icon: MdEmail },
        { label: "dashboard.stats.totalSales", value: data.salesTotal || 0, trend: null, trendColor: null, category: "direct", icon: MdStore },
        { label: "dashboard.stats.activeSales", value: data.salesActive || 0, trend: null, trendColor: null, category: "direct", icon: MdStore },
    ];
}

function buildStatsOffers(data: any = {}) {
    return [
        { label: "dashboard.stats.totalOffers", value: data.offersTotal || 0, trend: null, trendColor: null, category: "offer", icon: MdPaid },
        { label: "dashboard.stats.pendingOffers", value: data.offersPending || 0, trend: null, trendColor: null, category: "pending", icon: MdPendingActions },
        { label: "dashboard.stats.tenderSubmissions", value: data.tenderSubmissionsTotal || 0, trend: null, trendColor: null, category: "response", icon: MdOutbox },
        { label: "dashboard.stats.pendingTenderSubmissions", value: data.tenderSubmissionsPending || 0, trend: null, trendColor: null, category: "waiting", icon: MdDescription },
    ];
}

function buildStatsFinance(data: any = {}) {
    return [
        { label: "dashboard.stats.totalEarnings", value: `${data.totalEarnings || 0} DA`, trend: null, trendColor: null, category: "finance_green", icon: MdMonetizationOn },
        { label: "dashboard.stats.averagePrice", value: `${data.avgPrice || 0} DA`, trend: null, trendColor: null, category: "finance_blue", icon: MdShowChart },
        { label: "dashboard.stats.totalViews", value: data.totalViews || 0, trend: null, trendColor: null, category: "finance_blue", icon: MdVisibility },
        { label: "dashboard.stats.conversionRate", value: `${data.conversionRate || "0.0"}%`, trend: null, trendColor: null, category: "finance_indigo", icon: MdTrendingUp },
    ];
}

const QUICK_ACTIONS = [
    { 
        title: "dashboard.navigation.myTenders", 
        category: "submission",
        icon: MdEmail,
        actions: [
            { label: "common.view", link: "/dashboard/tenders", icon: MdVisibility },
            { label: "common.create", link: "/dashboard/tenders/create/", icon: MdAdd, isCreate: true }
        ]
    },
    { 
        title: "dashboard.navigation.auctions", 
        category: "auction",
        icon: MdGavel,
        actions: [
            { label: "common.view", link: "/dashboard/auctions", icon: MdVisibility },
            { label: "common.create", link: "/dashboard/auctions/create/", icon: MdAdd, isCreate: true }
        ]
    },
    { 
        title: "dashboard.navigation.mySales", 
        category: "direct",
        icon: MdStore,
        actions: [
            { label: "common.view", link: "/dashboard/direct-sales", icon: MdVisibility },
            { label: "common.create", link: "/dashboard/direct-sales/create/", icon: MdAdd, isCreate: true }
        ]
    },
];

// ----------- Components -----------

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 2 }}>
        <Icon size={20} style={{ marginRight: 8, opacity: 0.8 }} />
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {title}
        </Typography>
    </Box>
);

const ActionCard = ({ item }: { item: typeof QUICK_ACTIONS[0] }) => {
    const { t } = useTranslation();
    const theme = COLORS[item.category as keyof typeof COLORS];
    
    return (
        <Paper
            elevation={0}
            sx={{
                width: '100%',
                minHeight: 180,
                bgcolor: theme.bg,
                color: theme.main,
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                border: '1px solid',
                borderColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 2,
                gap: 1.5,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 12px 24px rgba(0,0,0,0.08)`, 
                    '& .icon-bot': {
                        transform: 'scale(1.1)',
                        bgcolor: 'rgba(255,255,255,0.9)',
                    }
                }
            }}
        >
            <Box 
                className="icon-bot"
                sx={{ 
                    position: 'relative', 
                    p: 2,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.6)', 
                    color: theme.main,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
            >
                <item.icon size={32} />
            </Box>
            
            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1rem', mb: 1, textAlign: 'center' }}>
                {t(item.title)}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, width: '100%', px: 1 }}>
                {item.actions.map((action, idx) => (
                    <ButtonBase
                        key={idx}
                        component={Link}
                        href={action.link}
                        sx={{
                            flex: 1,
                            py: 1,
                            px: 1.5,
                            borderRadius: 3,
                            bgcolor: action.isCreate ? theme.main : 'rgba(255,255,255,0.6)',
                            color: action.isCreate ? '#fff' : theme.main,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                            transition: 'all 0.2s',
                            boxShadow: action.isCreate ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                            '&:hover': {
                                bgcolor: action.isCreate ? theme.main : 'rgba(255,255,255,0.9)',
                                opacity: action.isCreate ? 0.9 : 1,
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }
                        }}
                    >
                        {/* Translate standard keys or fallback */}
                        {t(action.label) === action.label && action.label === 'common.view' ? 'Voir' : 
                         t(action.label) === action.label && action.label === 'common.create' ? 'Créer' : 
                         t(action.label)}
                        {action.isCreate && <MdAdd size={14} />}
                    </ButtonBase>
                ))}
            </Box>
        </Paper>
    );
};

const StatCard = ({ item }: { item: any }) => {
    const { t } = useTranslation();
    const theme = COLORS[item.category as keyof typeof COLORS];
    const Icon = item.icon;

    return (
        <Paper
            elevation={0}
            sx={{
                px: { xs: 1.5, sm: 2, md: 3 },
                py: { xs: 1.5, sm: 2 },
                minHeight: 140,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, sm: 2, md: 3 },
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)', // Glassmorphism
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100px',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${theme.bg})`,
                    opacity: 0.5,
                    transform: 'skewX(-20deg) translateX(150%)',
                    transition: 'transform 0.5s',
                },
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px -10px ${theme.main}20`, // Colored shadow glow
                    borderColor: 'transparent',
                    '&::after': {
                        transform: 'skewX(-20deg) translateX(50%)',
                    },
                    '& .stat-icon': {
                        transform: 'scale(1.1) rotate(-10deg)',
                        boxShadow: `0 8px 16px ${theme.main}40`,
                    }
                }
            }}
        >
            {/* Icon Bubble - Left Side */}
            <Box
                className="stat-icon"
                sx={{
                    width: { xs: 44, sm: 52, md: 56 },
                    height: { xs: 44, sm: 52, md: 56 },
                    borderRadius: '20px',
                    bgcolor: theme.bg,
                    color: theme.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 10px ${theme.bg}`,
                }}
            >
                <Icon size={24} />
            </Box>

            {/* Content - Right Side */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a1a1a', lineHeight: 1, fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
                    {item.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)' }}>
                    {t(item.label)}
                </Typography>
                
                 {/* Trend */}
                 {item.trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, bgcolor: item.trendColor === 'success.main' ? '#E8F5E9' : '#F5F5F5', borderRadius: '12px', width: 'fit-content', px: 1, py: 0.2 }}>
                        <MdTrendingUp 
                            size={14} 
                            color={item.trendColor === 'success.main' ? '#2e7d32' : '#757575'} 
                            style={{ transform: item.trend.includes('-') ? 'rotate(180deg)' : 'none' }}
                        />
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: item.trendColor === 'success.main' ? '#2e7d32' : '#757575', 
                                fontWeight: 700,
                                fontSize: '0.7rem'
                            }}
                        >
                            {item.trend}
                        </Typography>
                    </Box>
                 )}
            </Box>
        </Paper>
    );
};

export default function DashboardPage() {
    const { t } = useTranslation();
    const { isLogged, auth } = useAuth();
    const queryClient = useQueryClient();
    const { socket } = useCreateSocket() || {};

    useEffect(() => {
        if (!socket) return;
        const handleRefetch = () => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        socket.on('newListingCreated', handleRefetch);
        socket.on('notification', handleRefetch);
        return () => {
            socket.off('newListingCreated', handleRefetch);
            socket.off('notification', handleRefetch);
        };
    }, [socket, queryClient]);

    const { data: statsData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            if (!auth?.user?._id) return null;
            const [
                { AuctionsAPI }, { TendersAPI }, { DirectSaleAPI }, { OffersAPI }
            ] = await Promise.all([
                import('@/services/auctions'), import('@/services/tenders'),
                import('@/services/direct-sale'), import('@/services/offers')
            ]);
            const [ar, tr, sr, or, pr, tbr] = await Promise.allSettled([
                AuctionsAPI.getAuctions(),
                TendersAPI.getTenders(),
                DirectSaleAPI.getMyDirectSales(),
                OffersAPI.getOffers({ data: { _id: auth.user._id } }),
                DirectSaleAPI.getMyOrders(),
                TendersAPI.getTenderBidsByBidder(auth.user._id)
            ]);

            const auctions = ar.status === 'fulfilled' ? ((ar.value as any)?.data || (Array.isArray(ar.value) ? ar.value : [])) : [];
            const tenders = tr.status === 'fulfilled' ? ((tr.value as any)?.data || (Array.isArray(tr.value) ? tr.value : [])) : [];
            const sales = sr.status === 'fulfilled' ? ((sr.value as any)?.data || (Array.isArray(sr.value) ? sr.value : [])) : [];
            const offers = or.status === 'fulfilled' ? ((or.value as any)?.data || (Array.isArray(or.value) ? or.value : [])) : [];
            const orders = pr.status === 'fulfilled' ? ((pr.value as any)?.data || (Array.isArray(pr.value) ? pr.value : [])) : [];
            const tenderBids = tbr.status === 'fulfilled' ? ((tbr.value as any)?.data || (Array.isArray(tbr.value) ? tbr.value : [])) : [];

            const auctionsTotal = auctions.length;
            const auctionsActive = auctions.filter((a: any) => new Date(a.endingAt) > new Date() && a.status !== 'CLOSED' && a.status !== 'ARCHIVED').length;
            const tendersTotal = tenders.length;
            const tendersActive = tenders.filter((t: any) => t.status === 'OPEN').length;
            const salesTotal = sales.length;
            const salesActive = sales.filter((s: any) => s.status === 'ACTIVE').length;

            const currentUserId = auth?.user?._id;
            if (!currentUserId) return null;

            const myOffers = offers.filter((o: any) => o.user?._id === currentUserId || (o.bid && (o.bid as any).user === currentUserId));
            const offersTotal = myOffers.length;
            const offersPending = myOffers.filter((o: any) => o.status === 'PENDING' || !o.status).length;
            
            const tenderSubmissionsTotal = tenderBids.length;
            const tenderSubmissionsPending = tenderBids.filter((b: any) => b.status === 'pending').length;

            const confirmedOrders = orders.filter((o: any) => o.status === 'CONFIRMED' || o.status === 'COMPLETED');
            const totalEarnings = confirmedOrders.reduce((acc: number, o: any) => acc + (o.totalPrice || o.total || 0), 0);
            const avgPrice = confirmedOrders.length ? Math.round(totalEarnings / confirmedOrders.length) : 0;
            const totalViews = sales.reduce((acc: number, s: any) => acc + (s.views || 0), 0) + auctions.reduce((acc: number, a: any) => acc + (a.views || 0), 0) + tenders.reduce((acc: number, t: any) => acc + (t.views || 0), 0);
            const conversionRate = (salesTotal > 0 ? (confirmedOrders.length / salesTotal) * 100 : 0).toFixed(1);

            return {
                auctionsTotal, auctionsActive, tendersTotal, tendersActive, salesTotal, salesActive,
                offersTotal, offersPending, tenderSubmissionsTotal, tenderSubmissionsPending,
                totalEarnings: totalEarnings.toLocaleString('fr-FR'),
                avgPrice: avgPrice.toLocaleString('fr-FR'),
                totalViews: totalViews.toLocaleString('fr-FR'),
                conversionRate
            };
        },
        enabled: isLogged && !!auth?.user?._id,
        staleTime: 60000,
    });

    const statsPerformance = buildStatsPerformance(statsData || {});
    const statsOffers = buildStatsOffers(statsData || {});
    const statsFinance = buildStatsFinance(statsData || {});

    if (isLoading && isLogged) return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <DashboardKeyframes />
            <ListPageSkeleton accentColor="var(--primary-auction-color)" />
        </Container>
    );

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
            <DashboardKeyframes />
            {/* Quick Actions Section */}
            <SectionHeader icon={MdRocketLaunch} title={t('dashboard.quickActions')} />

            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 4, md: 6 } }}>
                {QUICK_ACTIONS.map((action, index) => (
                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={index}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <ActionCard item={action} />
                        </Grid>
                    </Zoom>
                ))}
            </Grid>

            {/* Performance Section */}
            <SectionHeader icon={MdTrendingUp} title={t('dashboard.performance')} />
            
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 4, md: 6 } }}>
                {statsPerformance.map((stat, index) => (
                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={index}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard item={stat} />
                        </Grid>
                    </Zoom>
                ))}
            </Grid>

            {/* Offers & Submissions Section */}
            <SectionHeader icon={MdEmail} title={t('dashboard.offersOverview')} />
            
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 4, md: 6 } }}>
                {statsOffers.map((stat, index) => (
                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={index}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard item={stat} />
                        </Grid>
                    </Zoom>
                ))}
            </Grid>

            {/* Financial Section */}
            <SectionHeader icon={MdMonetizationOn} title={t('dashboard.financialOverview')} />

            <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
                {statsFinance.map((stat, index) => (
                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={index}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard item={stat} />
                        </Grid>
                    </Zoom>
                ))}
            </Grid>
        </Container>
    );
}
