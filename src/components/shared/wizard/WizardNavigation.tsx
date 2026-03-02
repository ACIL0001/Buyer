import React from 'react';
import { Box, Button, CircularProgress, alpha } from '@mui/material';
import { MdArrowBack, MdArrowForward, MdCheck } from 'react-icons/md';

import { useTranslation } from 'react-i18next';

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  isSubmitting?: boolean;
  isLastStep?: boolean;
  disableNext?: boolean;
  disableBack?: boolean;
  backLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
}

export default function WizardNavigation({
    onBack,
    onNext,
    isSubmitting = false,
    isLastStep = false,
    disableNext = false,
    disableBack = false,
    backLabel,
    nextLabel,
    submitLabel,
    hideNext = false
}: WizardNavigationProps & { hideNext?: boolean }) {
    const { t } = useTranslation();
    
    // Safety check missing translations in parent
    const finalBackLabel = backLabel || t('common.back');
    const finalNextLabel = nextLabel || t('common.next');
    const finalSubmitLabel = submitLabel || t('common.submit');

    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: { xs: 4, md: 8 }, 
            pt: 4, 
            borderTop: '2px dashed',
            borderColor: (theme) => alpha(theme.palette.divider, 0.4)
        }}>
            <Button
                variant="text"
                onClick={onBack}
                disabled={disableBack || !onBack}
                startIcon={<MdArrowBack />}
                sx={{ 
                    borderRadius: 4,
                    px: 3,
                    py: 1.5,
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1rem',
                    color: 'text.secondary',
                    opacity: !onBack ? 0 : 1,
                    visibility: !onBack ? 'hidden' : 'visible',
                    '&:hover': { bgcolor: (theme) => alpha(theme.palette.text.primary, 0.05), color: 'text.primary' }
                }}
            >
                {finalBackLabel}
            </Button>
            
            {!hideNext && (
                <Button
                    variant="contained"
                    onClick={onNext}
                    disabled={disableNext || isSubmitting}
                    endIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : (isLastStep ? <MdCheck /> : <MdArrowForward />)}
                    sx={{ 
                        borderRadius: 4,
                        px: { xs: 4, md: 6 },
                        py: 1.5,
                        fontWeight: 700,
                        textTransform: 'none',
                        fontSize: '1.05rem',
                        boxShadow: (theme) => `0 8px 24px -6px ${alpha(theme.palette.primary.main, 0.5)}`,
                        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s',
                        '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: (theme) => `0 12px 30px -6px ${alpha(theme.palette.primary.main, 0.6)}`,
                        },
                        '&:active': {
                            transform: 'translateY(1px)'
                        }
                    }}
                >
                    {isSubmitting ? 'Processing...' : (isLastStep ? finalSubmitLabel : finalNextLabel)}
                </Button>
            )}
        </Box>
    );
}
