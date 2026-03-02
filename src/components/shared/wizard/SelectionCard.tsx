import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface SelectionCardProps {
  selected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  color?: string;
}

export default function SelectionCard({ 
    selected, 
    onClick, 
    icon, 
    title, 
    description, 
    children,
    className,
    color
}: SelectionCardProps) {
  const theme = useTheme();
  const activeColor = color || theme.palette.primary.main;

  return (
    <Box
        component={motion.div}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={className}
        onClick={onClick}
        sx={{ 
            height: '100%', 
            minHeight: 140,
            cursor: 'pointer',
            position: 'relative',
        }}
    >
        <Box
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 5,
                border: '2px solid',
                borderColor: selected ? activeColor : alpha(theme.palette.divider, 0.3),
                backgroundColor: selected ? alpha(activeColor, 0.03) : alpha(theme.palette.background.paper, 0.5),
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                textAlign: 'left',
                gap: 2.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selected ? `0 10px 30px ${alpha(activeColor, 0.15)}` : 'none',
                '&:hover': {
                    borderColor: selected ? activeColor : alpha(activeColor, 0.5),
                    backgroundColor: selected ? alpha(activeColor, 0.05) : alpha(activeColor, 0.02),
                    boxShadow: `0 12px 30px ${selected ? alpha(activeColor, 0.25) : alpha(activeColor, 0.08)}`,
                    '& .selection-icon': {
                        backgroundColor: selected ? activeColor : alpha(activeColor, 0.1),
                        color: selected ? '#fff' : activeColor,
                        transform: 'scale(1.05)'
                    },
                    '& .selection-title': {
                        color: activeColor
                    }
                },
                ...(selected && {
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: activeColor,
                        boxShadow: `0 0 0 4px ${alpha(activeColor, 0.2)}`
                    }
                })
            }}
        >
            {icon && (
                <Box 
                    className="selection-icon"
                    sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        backgroundColor: selected ? activeColor : theme.palette.background.paper,
                        color: selected ? '#fff' : theme.palette.text.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: selected ? `0 4px 12px ${alpha(activeColor, 0.4)}` : `0 2px 8px ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s ease',
                        '& svg': { fontSize: 26 }
                    }}
                >
                    {icon}
                </Box>
            )}

            <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={800} className="selection-title" sx={{ 
                    color: selected ? activeColor : 'text.primary', 
                    fontSize: '1.1rem', 
                    lineHeight: 1.4,
                    mb: 0.5,
                    transition: 'color 0.3s ease'
                }}>
                    {title}
                </Typography>

                {description && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, opacity: 0.9 }}>
                        {description}
                    </Typography>
                )}
                {children}
            </Box>
        </Box>
    </Box>
  );
}
