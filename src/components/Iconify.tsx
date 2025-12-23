import { Icon } from '@iconify/react';
import { Box, BoxProps } from '@mui/material';
import { forwardRef } from 'react';

// ----------------------------------------------------------------------

interface IconifyProps extends BoxProps {
  icon: string | React.ReactElement;
}

const Iconify = forwardRef<HTMLDivElement, IconifyProps>(({ icon, sx, ...other }, ref) => {
  return <Box ref={ref} component={Icon} icon={icon} sx={{ ...sx }} {...other} />;
});

Iconify.displayName = 'Iconify';

export default Iconify;
