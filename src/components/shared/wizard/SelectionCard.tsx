import React from 'react';
import { Paper, Typography, Box, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface SelectionCardProps {
  selected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function SelectionCard({ 
    selected, 
    onClick, 
    icon, 
    title, 
    description, 
    children,
    className
}: SelectionCardProps) {
  const theme = useTheme();

  return (
    <Box
        component={motion.div}
        whileHover={{ y: -6 }}
        className={className}
        sx={{ height: '100%', minHeight: 140 }}
    >
        <Paper
            onClick={onClick}
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                cursor: 'pointer',
                borderRadius: 4,
                border: '1px solid',
                borderColor: selected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.6),
                backgroundColor: selected 
                    ? alpha(theme.palette.primary.main, 0.04) 
                    : theme.palette.background.paper,
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                gap: 2.5,
                boxShadow: selected 
                    ? `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}` 
                    : '0 2px 12px rgba(0,0,0,0.03)',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: 0,
                },
                '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 20px 40px -4px ${alpha(theme.palette.primary.main, 0.12)}`,
                    '&::before': {
                        opacity: selected ? 0.5 : 1,
                    },
                    '& .selection-icon': {
                        transform: 'scale(1.1) rotate(-5deg)',
                        backgroundColor: selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1),
                    }
                }
            }}
        >
            {/* Icon Wrapper */}
            {icon && (
                <Box 
                    className="selection-icon"
                    sx={{
                        p: 0,
                        width: 56,
                        height: 56,
                        borderRadius: 3, // Soft square
                        backgroundColor: selected 
                            ? theme.palette.primary.main 
                            : alpha(theme.palette.primary.main, 0.05),
                        color: selected ? '#fff' : theme.palette.primary.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.3s ease',
                        zIndex: 1,
                        boxShadow: `0 4px 12px ${selected ? alpha(theme.palette.primary.main, 0.4) : 'rgba(0,0,0,0.05)'}`,
                        '& svg': {
                            fontSize: 28,
                        }
                    }}
                >
                    {icon}
                </Box>
            )}

            <Box sx={{ minWidth: 0, flex: 1, zIndex: 1 }}>
                <Typography variant="h6" fontWeight={700} color={selected ? 'primary.main' : 'text.primary'} sx={{ fontSize: '1.05rem', mb: 0.5 }}>
                    {title}
                </Typography>

                {description && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5, opacity: 0.9 }}>
                        {description}
                    </Typography>
                )}
            </Box>

            {/* Checkmark when selected */}
            {selected && (
                <Box 
                    component={motion.div} 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main',
                        color: 'white',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`
                    }} 
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </Box>
            )}

            {children}
        </Paper>
    </Box>
  );
}
