
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Button,
  Grid
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface StockPrice {
  price: number;
  lastUpdatedAt: string;
}

interface CurrentStock {
  stock: {
    price: number;
    lastUpdatedAt: string;
  };
}

const PriceViewer = () => {
  const [selectedTicker, setSelectedTicker] = useState('NVDA');
  const [minutes, setMinutes] = useState(50);

  const { data: currentPrice, isLoading: currentLoading, error: currentError } = useQuery({
    queryKey: ['currentPrice', selectedTicker],
    queryFn: async (): Promise<CurrentStock> => {
      const response = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${selectedTicker}`);
      return response.data;
    },
    refetchInterval: 5000,
  });

  const { data: historicalPrices, isLoading: historicalLoading, error: historicalError } = useQuery({
    queryKey: ['historicalPrices', selectedTicker, minutes],
    queryFn: async (): Promise<StockPrice[]> => {
      const response = await axios.get(`http://20.244.56.144/evaluation-service/stocks/${selectedTicker}?minutes=${minutes}`);
      return response.data;
    },
    refetchInterval: 10000,
  });

  const calculateAverage = (prices: StockPrice[]) => {
    if (!prices || prices.length === 0) return 0;
    return prices.reduce((sum, item) => sum + item.price, 0) / prices.length;
  };

  const average = historicalPrices ? calculateAverage(historicalPrices) : 0;

  if (currentError || historicalError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load stock data. Please ensure the API server is accessible.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: 'fit-content' }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Stock Price Viewer
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Stock Ticker"
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Minutes"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 50)}
              size="small"
            />
          </Grid>
        </Grid>

        {currentLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : currentPrice ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h3" component="div" sx={{ color: 'primary.main', mb: 1 }}>
              ${currentPrice.stock.price.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(currentPrice.stock.lastUpdatedAt).toLocaleString()}
            </Typography>
          </Box>
        ) : null}

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          Price History (Last {minutes} Minutes)
        </Typography>
        
        {average > 0 && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Average: $${average.toFixed(2)}`}
              color="secondary"
              variant="outlined"
            />
          </Box>
        )}
        
        {historicalLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : historicalPrices && historicalPrices.length > 0 ? (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {historicalPrices.map((price, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`$${price.price.toFixed(2)}`}
                  secondary={new Date(price.lastUpdatedAt).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">No historical data available</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceViewer;
