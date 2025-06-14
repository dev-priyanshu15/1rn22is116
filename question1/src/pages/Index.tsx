
import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import PriceViewer from '../components/PriceViewer';
import CorrelationMatrix from '../components/CorrelationMatrix';

const Index = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Stock Market Analysis
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <PriceViewer />
        </Grid>
        <Grid item xs={12} md={6}>
          <CorrelationMatrix />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Index;
