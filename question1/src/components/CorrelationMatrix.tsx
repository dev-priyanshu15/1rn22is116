
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface StockPrice {
  price: number;
  lastUpdatedAt: string;
}

interface StocksList {
  stocks: Record<string, string>;
}

interface CorrelationResult {
  ticker1: string;
  ticker2: string;
  correlation: number;
  minutes: number;
  dataPoints: number;
}

const CorrelationMatrix = () => {
  const [ticker1, setTicker1] = useState('NVDA');
  const [ticker2, setTicker2] = useState('AAPL');
  const [minutes, setMinutes] = useState(50);
  const [correlationResult, setCorrelationResult] = useState<CorrelationResult | null>(null);

  const { data: stocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: async (): Promise<StocksList> => {
      const response = await axios.get('http://20.244.56.144/evaluation-service/stocks');
      return response.data;
    },
  });

  const correlationMutation = useMutation({
    mutationFn: async (params: { ticker1: string; ticker2: string; minutes: number }): Promise<CorrelationResult> => {
      const [response1, response2] = await Promise.all([
        axios.get(`http://20.244.56.144/evaluation-service/stocks/${params.ticker1}?minutes=${params.minutes}`),
        axios.get(`http://20.244.56.144/evaluation-service/stocks/${params.ticker2}?minutes=${params.minutes}`)
      ]);

      const prices1: StockPrice[] = response1.data;
      const prices2: StockPrice[] = response2.data;

      // Calculate correlation using Pearson's correlation coefficient
      const correlation = calculateCorrelation(
        prices1.map(p => p.price),
        prices2.map(p => p.price)
      );

      return {
        ticker1: params.ticker1,
        ticker2: params.ticker2,
        correlation,
        minutes: params.minutes,
        dataPoints: Math.min(prices1.length, prices2.length)
      };
    },
    onSuccess: (data) => {
      setCorrelationResult(data);
    }
  });

  const calculateMean = (values: number[]): number => {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const calculateStandardDeviation = (values: number[]): number => {
    if (values.length === 0) return 0;
    const mean = calculateMean(values);
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = calculateMean(squaredDifferences);
    return Math.sqrt(variance);
  };

  const calculateCovariance = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length === 0) return 0;
    const meanX = calculateMean(x);
    const meanY = calculateMean(y);
    return x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / x.length;
  };

  const calculateCorrelation = (x: number[], y: number[]): number => {
    if (x.length !== y.length || x.length === 0) return 0;
    const covariance = calculateCovariance(x, y);
    const stdDevX = calculateStandardDeviation(x);
    const stdDevY = calculateStandardDeviation(y);
    if (stdDevX === 0 || stdDevY === 0) return 0;
    return Math.max(-1, Math.min(1, covariance / (stdDevX * stdDevY)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker1.trim() && ticker2.trim() && minutes > 0) {
      correlationMutation.mutate({ ticker1: ticker1.trim(), ticker2: ticker2.trim(), minutes });
    }
  };

  const getCorrelationColor = (correlation: number) => {
    if (correlation > 0.7) return 'success';
    if (correlation > 0.3) return 'warning';
    if (correlation > -0.3) return 'default';
    if (correlation > -0.7) return 'warning';
    return 'error';
  };

  const getCorrelationLabel = (correlation: number) => {
    if (correlation > 0.7) return 'Strong Positive';
    if (correlation > 0.3) return 'Moderate Positive';
    if (correlation > -0.3) return 'Weak Correlation';
    if (correlation > -0.7) return 'Moderate Negative';
    return 'Strong Negative';
  };

  return (
    <Card sx={{ height: 'fit-content' }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Stock Correlation Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Calculate Pearson correlation coefficient between two stocks
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Ticker 1"
                value={ticker1}
                onChange={(e) => setTicker1(e.target.value.toUpperCase())}
                placeholder="NVDA"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Ticker 2"
                value={ticker2}
                onChange={(e) => setTicker2(e.target.value.toUpperCase())}
                placeholder="AAPL"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Minutes"
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 50)}
                inputProps={{ min: 1, max: 500 }}
                size="small"
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            variant="contained"
            disabled={correlationMutation.isPending}
            sx={{ mt: 2 }}
            fullWidth
          >
            {correlationMutation.isPending ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Calculating...
              </>
            ) : (
              'Calculate Correlation'
            )}
          </Button>
        </Box>

        {correlationMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to calculate correlation. Please check the ticker symbols and try again.
          </Alert>
        )}

        {correlationResult && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Correlation Result
            </Typography>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <Typography variant="body1">
                {correlationResult.ticker1} vs {correlationResult.ticker2}:
              </Typography>
              <Chip
                label={correlationResult.correlation.toFixed(4)}
                color={getCorrelationColor(correlationResult.correlation)}
                variant="filled"
              />
            </Box>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Strength:
              </Typography>
              <Chip
                label={getCorrelationLabel(correlationResult.correlation)}
                size="small"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Based on {correlationResult.dataPoints} data points over {correlationResult.minutes} minutes
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Correlation Guide:</strong>
          </Typography>
          <Typography variant="caption" display="block">
            • +1.0: Perfect positive correlation
          </Typography>
          <Typography variant="caption" display="block">
            • +0.7 to +1.0: Strong positive correlation
          </Typography>
          <Typography variant="caption" display="block">
            • +0.3 to +0.7: Moderate positive correlation
          </Typography>
          <Typography variant="caption" display="block">
            • -0.3 to +0.3: Weak correlation
          </Typography>
          <Typography variant="caption" display="block">
            • -0.7 to -0.3: Moderate negative correlation
          </Typography>
          <Typography variant="caption" display="block">
            • -1.0 to -0.7: Strong negative correlation
          </Typography>
          <Typography variant="caption" display="block">
            • -1.0: Perfect negative correlation
          </Typography>
        </Box>

        {stocks && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Available stocks: {Object.values(stocks.stocks).join(', ')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CorrelationMatrix;
