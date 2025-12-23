import React from 'react';
import { Box, Paper, Typography, Container, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface WizardWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function WizardWrapper({ title, subtitle, children }: WizardWrapperProps) {
  const theme = useTheme();

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Paper
          elevation={0}
          sx={{
            background: theme.palette.background.paper,
            borderRadius: 5, // Modern large radius
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: `0 24px 48px -12px rgba(16, 24, 40, 0.08)`, // Modern deep shadow
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Modern Header */}
          <Box
            sx={{
              px: { xs: 3, md: 5 },
              py: 4,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.03)}, transparent)`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700 }}>
              {subtitle}
            </Typography>
          </Box>

          {/* Compact Content */}
          <Box sx={{ p: { xs: 3, md: 5 }, flexGrow: 1 }}>
            {children}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
