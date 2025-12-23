import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
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
    
    const finalBackLabel = backLabel || t('common.back');
    const finalNextLabel = nextLabel || t('common.next');
    const finalSubmitLabel = submitLabel || t('common.submit');

    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 3, 
            pt: 2, 
            borderTop: '1px solid',
            borderColor: 'divider'
        }}>
            <Button
                variant="outlined"
                onClick={onBack}
                disabled={disableBack || !onBack}
                startIcon={<MdArrowBack />}
                sx={{ 
                    borderRadius: 2,
                    px: 3,
                    opacity: !onBack ? 0 : 1,
                    visibility: !onBack ? 'hidden' : 'visible'
                }}
            >
                {backLabel}
            </Button>
            
            {!hideNext && (
                <Button
                    variant="contained"
                    onClick={onNext}
                    disabled={disableNext || isSubmitting}
                    endIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : (isLastStep ? <MdCheck /> : <MdArrowForward />)}
                    sx={{ 
                        borderRadius: 2,
                        px: 3,
                        boxShadow: 'none',
                    }}
                >
                    {isSubmitting ? 'Processing...' : (isLastStep ? submitLabel : nextLabel)}
                </Button>
            )}
        </Box>
    );
}
