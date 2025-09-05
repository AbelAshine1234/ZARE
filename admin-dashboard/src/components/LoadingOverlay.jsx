import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingOverlay = ({ open = false, text = 'Loading...' }) => {
  if (!open) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(255,255,255,0.6)',
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">{text}</Typography>
      </Box>
    </Box>
  );
};

export default LoadingOverlay;


