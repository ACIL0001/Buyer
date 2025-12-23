import React from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Typography, 
  useTheme, 
  alpha,
  StepConnector,
  stepConnectorClasses,
  StepIconProps
} from '@mui/material';
import { motion } from 'framer-motion';
import { MdCheck } from 'react-icons/md';

interface WizardStepperProps {
  activeStep: number;
  steps: string[];
}

// Custom Connector
const ColorlibConnector = React.memo((props: any) => {
    const theme = useTheme();
    return (
        <StepConnector 
            {...props} 
            sx={{
                [`&.${stepConnectorClasses.alternativeLabel}`]: {
                    top: 16,
                },
                [`&.${stepConnectorClasses.active}`]: {
                    [`& .${stepConnectorClasses.line}`]: {
                        backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    },
                },
                [`&.${stepConnectorClasses.completed}`]: {
                    [`& .${stepConnectorClasses.line}`]: {
                        backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    },
                },
                [`& .${stepConnectorClasses.line}`]: {
                    height: 2,
                    border: 0,
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
                    borderRadius: 1,
                },
            }} 
        />
    );
});

ColorlibConnector.displayName = 'ColorlibConnector';

// Custom Step Icon
function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;
  const theme = useTheme();

  const styles = {
    root: {
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
      zIndex: 1,
      color: completed ? '#fff' : theme.palette.text.secondary,
      width: 32,
      height: 32,
      display: 'flex',
      borderRadius: '50%',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: 'none',
      border: `2px solid ${completed || active ? 'transparent' : theme.palette.divider}`,
      transition: 'all 0.3s ease',
      ...(active && {
        backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        boxShadow: `0 4px 10px 0 ${alpha(theme.palette.primary.main, 0.25)}`,
        color: '#fff',
        border: 'none',
      }),
      ...(completed && {
        backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        border: 'none',
      }),
    }
  };

  return (
    <div className={className} style={styles.root}>
      {completed ? <MdCheck size={18} /> : <Typography fontWeight="bold" variant="caption">{props.icon}</Typography>}
    </div>
  );
}

export default function WizardStepper({ activeStep, steps }: WizardStepperProps) {
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon}>
                <Typography 
                    variant="caption" 
                    fontWeight={600} 
                    sx={{ 
                        mt: 0.5, 
                        color: (theme) => alpha(theme.palette.text.primary, activeStep >= steps.indexOf(label) ? 1 : 0.5) 
                    }}
                >
                    {label}
                </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
