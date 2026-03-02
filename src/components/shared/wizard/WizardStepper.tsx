import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

export default function WizardStepper({ activeStep, steps }: { activeStep: number, steps: string[] }) {
    const theme = useTheme();
    const progress = ((activeStep) / (steps.length - 1)) * 100;

    return (
        <Box sx={{ mb: { xs: 5, md: 8 }, mt: 2, px: { xs: 1, sm: 5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                {steps.map((label, index) => {
                    const isActive = index === activeStep;
                    const isPassed = index < activeStep;
                    return (
                        <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%', zIndex: 1 }}>
                            <Box 
                                component={motion.div}
                                initial={false}
                                animate={{
                                    backgroundColor: isActive || isPassed ? theme.palette.primary.main : alpha(theme.palette.text.disabled, 0.1),
                                    scale: isActive ? 1.15 : 1,
                                    color: isActive || isPassed ? '#fff' : theme.palette.text.secondary
                                }}
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    mb: 1.5,
                                    boxShadow: isActive ? `0 0 0 6px ${alpha(theme.palette.primary.main, 0.15)}` : 'none',
                                    transition: 'box-shadow 0.3s ease'
                                }}
                            >
                                {isPassed ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : index + 1}
                            </Box>
                            <Typography 
                                variant="caption" 
                                fontWeight={isActive ? 800 : 500}
                                sx={{ 
                                    color: isActive ? 'text.primary' : 'text.disabled',
                                    textAlign: 'center',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.02em',
                                    textTransform: 'uppercase',
                                    transition: 'color 0.3s ease'
                                }}
                            >
                                {label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
            
            {/* Progress Bar Background */}
            <Box sx={{ position: 'relative', height: 4, bgcolor: alpha(theme.palette.text.disabled, 0.1), borderRadius: 2, mt: -7, mb: 7, zIndex: 0, mx: '10%' }}>
                {/* Active Progress */}
                <Box 
                    component={motion.div}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`
                    }}
                />
            </Box>
        </Box>
    );
}
