'use client';

import { Container, Grid, Typography, Paper, Box, Avatar, ButtonBase } from '@mui/material';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { 
    MdGavel, 
    MdStore, 
    MdEmail,
    MdShoppingCart,
    MdArrowForward,
    MdCircle,
    MdHourglassEmpty,
    MdInventory
} from 'react-icons/md';
import useAuth from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCreateSocket } from '@/contexts/socket';
import { ListPageSkeleton, DashboardKeyframes } from '@/components/dashboard/dashboardHelpers';

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

            const auctionsActive = auctions.filter((a: any) => new Date(a.endingAt) > new Date() && a.status !== 'CLOSED' && a.status !== 'ARCHIVED').length;
            const tendersActive = tenders.filter((t: any) => t.status === 'OPEN').length;
            const salesActive = sales.filter((s: any) => s.status === 'ACTIVE').length;
            
            const annoncesActives = auctionsActive + tendersActive + salesActive;

            const timeAgo = (dateStr: string) => {
                const date = new Date(dateStr);
                const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
                let interval = seconds / 31536000;
                if (interval > 1) return "Il y a " + Math.floor(interval) + " an(s)";
                interval = seconds / 2592000;
                if (interval > 1) return "Il y a " + Math.floor(interval) + " mois";
                interval = seconds / 86400;
                if (interval > 1) return "Il y a " + Math.floor(interval) + " jour(s)";
                interval = seconds / 3600;
                if (interval > 1) return "Il y a " + Math.floor(interval) + " heure(s)";
                interval = seconds / 60;
                if (interval > 1) return "Il y a " + Math.floor(interval) + " min";
                return "À l'instant";
            };

            const recentActivity = [
                ...auctions.map((a: any) => ({
                    _id: a._id,
                    rawDate: new Date(a.createdAt || new Date()),
                    type: 'ENCHÈRE', color: '#C34B4E', bg: 'rgba(195, 75, 78, 0.3)',
                    title: a.title || 'Enchère',
                    user: a.creator?.firstName ? `${a.creator.firstName} ${a.creator.lastName?.charAt(0) || ''}.` : 'Inconnu',
                    userImage: a.creator?.profilePicture || '',
                    amount: `${(a.currentBid || a.startingPrice || 0).toLocaleString('fr-FR')} Da`,
                    status: a.status === 'ACTIVE' ? 'En cours' : a.status === 'CLOSED' ? 'Fermée' : 'En attente',
                    statusColor: a.status === 'ACTIVE' ? '#0050CB' : a.status === 'CLOSED' ? '#64748B' : '#EA580C',
                    time: timeAgo(a.createdAt || new Date())
                })),
                ...sales.map((s: any) => ({
                    _id: s._id,
                    rawDate: new Date(s.createdAt || new Date()),
                    type: 'VENTE', color: '#70D979', bg: 'rgba(112, 217, 121, 0.3)',
                    title: s.productName || s.title || 'Vente Directe',
                    user: s.seller?.firstName ? `${s.seller.firstName} ${s.seller.lastName?.charAt(0) || ''}.` : 'Inconnu',
                    userImage: s.seller?.profilePicture || '',
                    amount: `${(s.price || 0).toLocaleString('fr-FR')} Da`,
                    status: s.status === 'ACTIVE' ? 'Disponible' : s.status === 'SOLD' ? 'Vendue' : 'En attente',
                    statusColor: s.status === 'ACTIVE' ? '#0050CB' : s.status === 'SOLD' ? '#059669' : '#EA580C',
                    time: timeAgo(s.createdAt || new Date())
                })),
                ...offers.map((o: any) => ({
                    _id: o._id,
                    rawDate: new Date(o.createdAt || new Date()),
                    type: 'OFFRE', color: '#EFCB6E', bg: 'rgba(239, 203, 110, 0.3)',
                    title: o.target?.title || 'Offre de service',
                    user: o.user?.firstName ? `${o.user.firstName} ${o.user.lastName?.charAt(0) || ''}.` : 'Moi',
                    userImage: o.user?.profilePicture || '',
                    amount: o.amount ? `${o.amount.toLocaleString('fr-FR')} Da` : '-',
                    status: o.status === 'ACCEPTED' ? 'Acceptée' : o.status === 'REJECTED' ? 'Refusée' : 'En attente',
                    statusColor: o.status === 'ACCEPTED' ? '#059669' : o.status === 'REJECTED' ? '#C34B4E' : '#EA580C',
                    icon: (o.status === 'PENDING' || !o.status) ? MdHourglassEmpty : null,
                    time: timeAgo(o.createdAt || new Date())
                }))
            ].sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime()).slice(0, 5);

            return {
                annoncesActives,
                encheresRecues: offers.length,
                ventesDirectes: sales.length,
                offresServices: tenders.length,
                mesAchats: orders.length,
                recentActivity
            };
        },
        enabled: isLogged && !!auth?.user?._id,
        staleTime: 60000,
    });

    if (isLoading && isLogged) return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <DashboardKeyframes />
            <ListPageSkeleton accentColor="var(--primary-auction-color)" />
        </Container>
    );

    const formatNumber = (num: number | undefined) => {
        if (num === undefined) return '00';
        return num < 10 ? `0${num}` : num.toString();
    };

    const MOCK_ACTIVITY = statsData?.recentActivity || [];

    const topCards = [
        { label: 'ANNONCES\nACTIVES', value: formatNumber(statsData?.annoncesActives || 12), icon: MdInventory, color: '#0050CB', bg: 'rgba(0, 102, 255, 0.1)', className: 'annonces-actives-card' },
        { label: 'ENCHÈRES\nREÇUES', value: formatNumber(statsData?.encheresRecues || 8), icon: MdGavel, color: '#C34B4E', bg: 'rgba(195, 75, 78, 0.3)', className: 'encheres-recues-card' },
        { label: 'VENTES\nDIRECTES', value: formatNumber(statsData?.ventesDirectes || 3), icon: MdStore, color: '#70D979', bg: 'rgba(112, 217, 121, 0.3)', className: 'ventes-directes-card' },
        { label: 'OFFRES &\nSERVICES', value: formatNumber(statsData?.offresServices || 5), icon: MdEmail, color: '#EFCB6E', bg: 'rgba(239, 203, 110, 0.3)', className: 'offres-services-card-mini' },
        { label: 'MES\nACHATS', value: formatNumber(statsData?.mesAchats || 3), icon: MdShoppingCart, color: '#424656', bg: 'rgba(66, 70, 86, 0.1)', className: 'mes-achats-card' },
    ];

    const navigationCards = [
        { 
            title: 'Enchères', 
            desc: 'Gérez vos ventes aux enchères en temps réel.', 
            linkText: 'Voir mes enchères', 
            href: '/dashboard/auctions', 
            icon: MdGavel, 
            color: '#C34B4E',
            className: 'enchere-card'
        },
        { 
            title: 'Vente directe', 
            desc: 'Configurez vos articles à prix fixe.', 
            linkText: 'Voir mes ventes', 
            href: '/dashboard/direct-sales', 
            icon: MdStore, 
            color: '#70D979',
            className: 'vente-directe-card'
        },
        { 
            title: 'Offres & services', 
            desc: 'Consultez et négociez des offres et proposez votre expertise .', 
            linkText: 'Mes offres & services', 
            href: '/dashboard/tenders', 
            icon: MdEmail, 
            color: '#EFCB6E',
            className: 'offres-services-card'
        },
    ];

    return (
        <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 }, bgcolor: '#fafafa', minHeight: '100vh' }}>
            <DashboardKeyframes />
            
            {/* Header */}
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#191B24', mb: 1, fontSize: '24px' }}>
                    Bienvenue {auth?.user?.firstName || 'Anis'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B', fontSize: '15px' }}>
                    Voici un aperçu de votre activité
                </Typography>
            </Box>

            {/* Top Cards Row */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 6, justifyContent: 'center' }}>
                {topCards.map((card, idx) => (
                    <Paper
                        key={idx}
                        elevation={0}
                        className={card.className}
                        sx={{
                            flex: '1 1 0',
                            minWidth: '170px',
                            height: '110px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            p: '24px',
                            gap: '16px',
                            borderRadius: '16px',
                            border: '1px solid #C2C6D8',
                            bgcolor: '#FFFFFF',
                            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <Box sx={{
                            width: '32px',
                            height: '48px',
                            bgcolor: card.bg,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: card.color,
                            flexShrink: 0
                        }}>
                            <card.icon size={20} />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                            <Typography sx={{ 
                                fontFamily: 'DM Sans', 
                                fontWeight: 400, 
                                fontSize: '12px', 
                                lineHeight: '14px', 
                                textTransform: 'uppercase', 
                                color: '#424656',
                                whiteSpace: 'pre-line'
                            }}>
                                {card.label}
                            </Typography>
                            <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#191B24' }}>
                                {card.value}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Navigation Cards Row */}
            <Grid container spacing={3} sx={{ justifyContent: 'center', mb: 6 }}>
                {navigationCards.map((card, idx) => (
                    <Grid size={{ xs: 12, sm: 'auto' }} key={idx} className={card.className}>
                        <Paper
                            elevation={0}
                            className={card.className}
                            sx={{
                                width: { xs: '100%', sm: '222px' },
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                p: '24px',
                                height: '224px',
                                bgcolor: '#FFFFFF',
                                border: '1px solid #C2C6D8',
                                boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                                borderRadius: '16px',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: card.color,
                                    boxShadow: `0px 4px 12px ${card.color}20`,
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ mb: 1.5, color: card.color, display: 'flex', alignItems: 'center' }}>
                                    <card.icon size={24} />
                                </Box>
                                <Typography sx={{ 
                                    fontFamily: 'DM Sans', 
                                    fontWeight: 400, 
                                    fontSize: '16px', 
                                    lineHeight: '24px', 
                                    color: '#191B24', 
                                    mb: 1,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {card.title}
                                </Typography>
                                <Typography sx={{ 
                                    fontFamily: 'Inter', 
                                    fontWeight: 400, 
                                    fontSize: '16px', 
                                    lineHeight: '24px', 
                                    color: '#424656',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {card.desc}
                                </Typography>
                            </Box>
                            <ButtonBase
                                component={Link}
                                href={card.href}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontFamily: 'Inter',
                                    fontWeight: 400,
                                    fontSize: '16px',
                                    lineHeight: '24px',
                                    color: card.color,
                                    '&:hover': { textDecoration: 'underline' }
                                }}
                            >
                                <Typography sx={{ 
                                    fontFamily: 'Inter',
                                    fontWeight: 400,
                                    fontSize: '16px',
                                    lineHeight: '24px',
                                    color: 'inherit',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {card.linkText}
                                </Typography>
                                <MdArrowForward size={16} />
                            </ButtonBase>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Recent Activity Table */}
            <Box sx={{ mb: 2 }}>
                <Paper
                    elevation={0}
                    sx={{
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        p: 0,
                        width: '100%',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #C2C6D8',
                        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
                        borderRadius: '16px',
                        overflow: 'hidden'
                    }}
                >
                    {/* HorizontalBorder (Header) */}
                    <Box sx={{
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: '24px',
                        py: '16px',
                        width: '100%',
                        height: '57px',
                        borderBottom: '1px solid #C2C6D8'
                    }}>
                        <Typography sx={{ fontFamily: 'Inter', fontStyle: 'normal', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#191B24' }}>
                            Activité récente
                        </Typography>
                        <Box sx={{ width: '151.86px', height: '24px' }} /> {/* Placeholder for Button */}
                    </Box>

                    {/* Table Header Row */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        width: '100%',
                        height: '52px',
                        bgcolor: '#F2F3FF',
                        borderBottom: '1px solid #C2C6D8'
                    }}>
                        <Typography sx={{ width: '11%', px: '24px', fontFamily: 'Inter', fontWeight: 700, fontSize: '16px', lineHeight: '19px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#424656' }}>TYPE</Typography>
                        <Typography sx={{ width: '23%', px: '24px', fontFamily: 'Inter', fontWeight: 700, fontSize: '16px', lineHeight: '19px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#424656' }}>TITRE</Typography>
                        <Typography sx={{ width: '16%', px: '24px', fontFamily: 'Inter', fontWeight: 700, fontSize: '16px', lineHeight: '19px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#424656' }}>UTILISATEUR</Typography>
                        <Typography sx={{ width: '18%', pl: '48px', pr: '24px', fontFamily: 'Inter', fontWeight: 700, fontSize: '16px', lineHeight: '19px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#424656' }}>MONTANT</Typography>
                        <Typography sx={{ width: '12%', px: '24px', fontFamily: 'Inter', fontWeight: 700, fontSize: '16px', lineHeight: '19px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#424656' }}>ETAT</Typography>
                        <Typography sx={{ width: '20%', pl: '48px', pr: '24px', fontFamily: 'Inter', fontWeight: 700, fontSize: '16px', lineHeight: '19px', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#424656' }}>TEMPS</Typography>
                    </Box>

                    {/* Table Rows */}
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                        {MOCK_ACTIVITY.map((row, idx) => (
                            <Box key={idx} sx={{
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                width: '100%',
                                minHeight: '72.5px',
                                borderBottom: idx < MOCK_ACTIVITY.length - 1 ? '1px solid #C2C6D8' : 'none',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' }
                            }}>
                                {/* Type */}
                                <Box sx={{ width: '11%', px: '24px', py: '25px', display: 'flex', alignItems: 'flex-start' }}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'flex-start',
                                        padding: '4px 12px',
                                        bgcolor: row.bg,
                                        borderRadius: '9999px'
                                    }}>
                                        <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '11px', lineHeight: '13px', textTransform: 'uppercase', color: row.color }}>
                                            {row.type}
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                {/* Titre */}
                                <Box sx={{ width: '23%', px: '24px', py: '26px' }}>
                                    <Typography sx={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '16px', lineHeight: '19px', color: '#191B24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {row.title}
                                    </Typography>
                                </Box>
                                
                                {/* Utilisateur */}
                                <Box sx={{ width: '16%', pl: '24px', pr: '24px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                                    <Avatar sx={{ width: '32px', height: '32px', bgcolor: '#e2e8f0', color: '#64748b', fontSize: '14px', border: '1px solid #C2C6D8' }}>
                                        {row.user.charAt(0)}
                                    </Avatar>
                                    <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', lineHeight: '19px', color: '#191B24' }}>
                                        {row.user}
                                    </Typography>
                                </Box>
                                
                                {/* Montant */}
                                <Box sx={{ width: '18%', pl: '48px', pr: '24px', py: '26px' }}>
                                    <Typography sx={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '19px', color: '#191B24' }}>
                                        {row.amount}
                                    </Typography>
                                </Box>
                                
                                {/* Etat */}
                                <Box sx={{ width: '12%', pl: '24px', pr: '24px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                                    {row.icon ? (
                                        <row.icon size={11.67} color={row.statusColor} />
                                    ) : (
                                        <Box sx={{ width: '8px', height: '8px', bgcolor: row.statusColor, borderRadius: '9999px' }} />
                                    )}
                                    <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '12px', lineHeight: '15px', color: row.statusColor }}>
                                        {row.status}
                                    </Typography>
                                </Box>
                                
                                {/* Temps */}
                                <Box sx={{ width: '20%', pl: '48px', pr: '24px', py: '26px' }}>
                                    <Typography sx={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '16px', lineHeight: '19px', color: '#424656' }}>
                                        {row.time}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Table Footer */}
                    <Box sx={{
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: '16px 24px',
                        width: '100%',
                        height: '57px',
                        bgcolor: '#F2F3FF',
                        borderTop: '1px solid #C2C6D8'
                    }}>
                        <ButtonBase sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontFamily: 'Inter',
                            fontWeight: 400,
                            fontSize: '16px',
                            lineHeight: '24px',
                            color: '#424656',
                            textAlign: 'center',
                            borderRadius: '4px',
                            py: 0.5,
                            px: 1,
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                        }}>
                            Charger plus d'activités
                        </ButtonBase>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
