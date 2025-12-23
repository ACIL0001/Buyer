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

// ----------- Design Constants & Mock Data -----------

const COLORS = {
    submission: { bg: '#F1F8E9', main: '#558B2F', light: '#DCEDC8' }, // Light Green
    auction: { bg: '#E3F2FD', main: '#1565C0', light: '#BBDEFB' },    // Light Blue
    direct: { bg: '#FFF3E0', main: '#EF6C00', light: '#FFE0B2' },     // Light Orange
    
    // New Colors
    offer: { bg: '#E3F2FD', main: '#2196F3', light: '#BBDEFB' },        // Blue
    pending: { bg: '#FFFDE7', main: '#FBC02D', light: '#FFF9C4' },      // Yellow
    response: { bg: '#F1F8E9', main: '#4CAF50', light: '#DCEDC8' },     // Green
    waiting: { bg: '#FDFBF7', main: '#FFECB3', light: '#FFE0B2' },      // Beige/Pale
    finance_green: { bg: '#E8F5E9', main: '#43A047', light: '#C8E6C9' },// Money Green
    finance_blue: { bg: '#E3F2FD', main: '#1976D2', light: '#BBDEFB' }, // Chart Blue
    finance_indigo: { bg: '#E8EAF6', main: '#3F51B5', light: '#C5CAE9' },// Indigo
};

const STATS_PERFORMANCE = [
    { 
        label: "dashboard.stats.totalAuctions", 
        value: 2, 
        trend: "+10%", 
        trendColor: "success.main",
        category: "auction",
        icon: MdGavel
    },
    { 
        label: "dashboard.stats.activeAuctions", 
        value: 0, 
        trend: "- 0%", 
        trendColor: "text.disabled",
        category: "auction",
        icon: MdGavel
    },
    { 
        label: "dashboard.stats.totalTenders", 
        value: 2, 
        trend: "+20%", 
        trendColor: "success.main",
        category: "submission",
        icon: MdEmail
    },
    { 
        label: "dashboard.stats.activeTenders", 
        value: 2, 
        trend: "+4%", 
        trendColor: "success.main",
        category: "submission",
        icon: MdEmail
    },
    { 
        label: "dashboard.stats.totalSales", 
        value: 2, 
        trend: "+17%", 
        trendColor: "success.main",
        category: "direct",
        icon: MdStore
    },
    { 
        label: "dashboard.stats.activeSales", 
        value: 2, 
        trend: "+3%", 
        trendColor: "success.main",
        category: "direct",
        icon: MdStore
    },
];

const STATS_OFFERS = [
    { 
        label: "dashboard.stats.totalOffers", 
        value: 7, 
        trend: "+21%", 
        trendColor: "success.main", 
        category: "offer", 
        icon: MdPaid 
    },
    { 
        label: "dashboard.stats.pendingOffers", 
        value: 7, 
        trend: null, 
        trendColor: null, 
        category: "pending", 
        icon: MdPendingActions 
    },
    { 
        label: "dashboard.stats.tenderSubmissions", 
        value: 0, 
        trend: "- 0%", 
        trendColor: "text.disabled", 
        category: "response", 
        icon: MdOutbox 
    },
    { 
        label: "dashboard.stats.pendingTenderSubmissions", 
        value: 0, 
        trend: null, 
        trendColor: null, 
        category: "waiting", 
        icon: MdDescription 
    },
];

const STATS_FINANCE = [
    { 
        label: "dashboard.stats.totalEarnings", 
        value: "0 DA", 
        trend: "- 0%", 
        trendColor: "text.disabled", 
        category: "finance_green", 
        icon: MdMonetizationOn 
    },
    { 
        label: "dashboard.stats.averagePrice", 
        value: "0 DA", 
        trend: "- 0%", 
        trendColor: "text.disabled", 
        category: "finance_blue", 
        icon: MdShowChart 
    },
    { 
        label: "dashboard.stats.totalViews", 
        value: 0, 
        trend: "- 0%", 
        trendColor: "text.disabled", 
        category: "finance_blue", 
        icon: MdVisibility 
    },
    { 
        label: "dashboard.stats.conversionRate", 
        value: "0.0%", 
        trend: "- 0%", 
        trendColor: "text.disabled", 
        category: "finance_indigo", 
        icon: MdTrendingUp 
    },
];

const QUICK_ACTIONS = [
    { 
        name: "dashboard.navigation.newTender", 
        action: "create_submission", 
        category: "submission",
        icon: MdEmail,
        subIcon: MdAdd
    },
    { 
        name: "dashboard.navigation.myTenders", 
        action: "view_submissions", 
        category: "submission",
        icon: MdEmail, // Base icon
        subIcon: null // Plain or check? Image implies just the icon or icon variant
    },
    { 
        name: "dashboard.navigation.createAuction", 
        action: "create_auction", 
        category: "auction",
        icon: MdGavel,
        subIcon: MdAdd
    },
    { 
        name: "dashboard.navigation.auctions", 
        action: "view_auctions", 
        category: "auction",
        icon: MdGavel,
        subIcon: null
    },
    { 
        name: "dashboard.navigation.createSale", 
        action: "create_direct_sale", 
        category: "direct",
        icon: MdStore,
        subIcon: MdAdd
    },
    { 
        name: "dashboard.navigation.mySales", 
        action: "view_direct_sales", 
        category: "direct",
        icon: MdStore,
        subIcon: null
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
    
    // Determine link
    let href = '#';
    if(item.action.includes('submission')) href = item.action.includes('create') ? '/dashboard/tenders/create' : '/dashboard/tenders';
    else if(item.action.includes('auction')) href = item.action.includes('create') ? '/dashboard/auctions/create' : '/dashboard/auctions';
    else if(item.action.includes('direct')) href = item.action.includes('create') ? '/dashboard/direct-sales/create' : '/dashboard/direct-sales';

    return (
        <ButtonBase
            component={Link}
            href={href}
            sx={{
                width: '100%',
                height: 140, 
                bgcolor: theme.bg, // Restored theme background
                color: theme.main, // Restored theme color
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                border: '1px solid',
                borderColor: 'transparent', // Usually colored cards don't need borders
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 3,
                gap: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', // Subtle initial shadow
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 100%)', // Lighten gradient
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 14px 28px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.05)`, 
                    '&::before': {
                        opacity: 1,
                    },
                    '& .icon-bot': {
                        transform: 'scale(1.1) rotate(5deg)',
                        bgcolor: 'rgba(255,255,255,0.9)', // Lighter bg on hover for icon
                        color: theme.main,
                    }
                },
                '&:active': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 5px 10px rgba(0,0,0,0.1)`,
                }
            }}
        >
            <Box 
                className="icon-bot"
                sx={{ 
                    position: 'relative', 
                    p: 2,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.7)', // Semi-transparent white to blend
                    color: theme.main,
                    transition: 'all 0.3s ease',
                    mb: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
            >
                <item.icon size={32} />
                {item.subIcon && (
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            bottom: -2, 
                            right: -2, 
                            bgcolor: 'white', 
                            borderRadius: '50%',
                            display: 'flex',
                            p: 0.5,
                            boxShadow: 1
                        }}
                    >
                        <item.subIcon size={16} style={{ fill: theme.main }}/>
                    </Box>
                )}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.95rem', zIndex: 1, textAlign: 'center' }}>
                {t(item.name)}
            </Typography>
        </ButtonBase>
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
                px: 3,
                height: 140, // Increased height
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
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
                    width: 56,
                    height: 56,
                    borderRadius: '20px', // Soft square
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
                <Icon size={28} />
            </Box>

            {/* Content - Right Side */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a1a1a', lineHeight: 1, fontSize: '2rem' }}>
                    {item.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
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

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Quick Actions Section */}
            <SectionHeader icon={MdRocketLaunch} title={t('dashboard.quickActions', 'Quick Actions - Auctions, Tenders & Direct Sales')} />
            
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {QUICK_ACTIONS.map((action, index) => (
                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={index}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <ActionCard item={action} />
                        </Grid>
                    </Zoom>
                ))}
            </Grid>

            {/* Performance Section */}
            <SectionHeader icon={MdTrendingUp} title={t('dashboard.performance', 'Auctions, Tenders & Direct Sales Performance')} />
            
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {STATS_PERFORMANCE.map((stat, index) => (
                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={index}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard item={stat} />
                        </Grid>
                    </Zoom>
                ))}
            </Grid>

            {/* Offers & Submissions Section */}
            <SectionHeader icon={MdEmail} title={t('dashboard.offersOverview', 'Offers & Submissions Overview')} />
            
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {STATS_OFFERS.map((stat, index) => (
                    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }} key={index}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard item={stat} />
                        </Grid>
                    </Zoom>
                ))}
            </Grid>

            {/* Financial Section */}
            <SectionHeader icon={MdMonetizationOn} title={t('dashboard.financialOverview', 'Financial Overview')} />
            
            <Grid container spacing={3}>
                {STATS_FINANCE.map((stat, index) => (
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
