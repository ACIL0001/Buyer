import React from 'react';
import { Box, Paper, Typography, Container, useTheme, alpha, IconButton, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { MdArrowBack } from 'react-icons/md';

interface WizardWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

export default function WizardWrapper({ title, subtitle, children, onBack, backLabel }: WizardWrapperProps) {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        pt: { xs: 4, md: 8 }, 
        pb: { xs: 4, md: 6 },
        position: 'relative',
        background: `radial-gradient(circle at 10% 20%, ${alpha(theme.palette.primary.light, 0.15)} 0%, transparent 40%),
                     radial-gradient(circle at 90% 80%, ${alpha(theme.palette.secondary.light, 0.15)} 0%, transparent 40%),
                     ${theme.palette.background.default}`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, zoom: { xs: 1, md: 0.8 } }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} // Apple-like smooth spring
        >
          <Box sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center', position: 'relative' }}>
            <Typography variant="h3" fontWeight={800} color="text.primary" sx={{ 
                letterSpacing: '-0.04em', 
                mb: 2,
                fontSize: { xs: '2rem', md: '2.8rem' }
            }}>
              {title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ 
                maxWidth: 600, 
                mx: 'auto', 
                fontSize: '1.1rem',
                lineHeight: 1.6
            }}>
              {subtitle}
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              background: theme.palette.mode === 'dark' ? alpha('#1e1e1e', 0.6) : alpha('#ffffff', 0.8),
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderRadius: { xs: 4, md: 6 },
              border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#ffffff', 0.08) : alpha('#ffffff', 0.8)}`,
              boxShadow: `0 40px 100px -20px ${alpha(theme.palette.primary.main, 0.15)}, 0 0 0 1px ${alpha(theme.palette.divider, 0.05)} inset`, 
              overflow: 'hidden',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 3, md: 5, lg: 6 }
            }}
          >
            {/* TOP BACK BUTTON */}
            {onBack && (
              <Box sx={{ position: 'absolute', top: { xs: 16, md: 24 }, left: { xs: 16, md: 24 }, zIndex: 10 }}>
                <Button 
                    variant="text" 
                    startIcon={<MdArrowBack />} 
                    onClick={onBack}
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 700,
                        textTransform: 'none',
                        px: 2,
                        py: 1,
                        borderRadius: 3,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.text.primary, 0.05),
                            color: 'text.primary',
                            transform: 'translateX(-4px)'
                        }
                    }}
                >
                    {backLabel || 'Retour'}
                </Button>
              </Box>
            )}

            {children}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
