const express = require('express');
const cors = require('cors');
const { calculateCorrelation } = require('./utils/correlationUtils');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data storage for demonstration
let nvidiaBasePrice = 850.00;
let priceHistory = [];

// Generate realistic price movements
const generatePriceMovement = (basePrice) => {
  const volatility = 0.02; // 2% volatility
  const randomChange = (Math.random() - 0.5) * 2 * volatility;
  return basePrice * (1 + randomChange);
};

// Initialize price history
const initializePriceHistory = () => {
  const now = new Date();
  for (let i = 49; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
    const price = generatePriceMovement(nvidiaBasePrice);
    priceHistory.push({
      timestamp: timestamp.toISOString(),
      price: price
    });
  }
};

// Initialize on startup
initializePriceHistory();

// Update price every 30 seconds
setInterval(() => {
  const newPrice = generatePriceMovement(nvidiaBasePrice);
  priceHistory.push({
    timestamp: new Date().toISOString(),
    price: newPrice
  });
  
  // Keep only last 50 minutes
  if (priceHistory.length > 50) {
    priceHistory = priceHistory.slice(-50);
  }
  
  // Update base price occasionally
  if (Math.random() < 0.3) {
    nvidiaBasePrice = newPrice;
  }
}, 30000);

// Routes
app.get('/api/stocks/nvidia/current', (req, res) => {
  try {
    const currentPrice = priceHistory[priceHistory.length - 1];
    const previousPrice = priceHistory[priceHistory.length - 2] || currentPrice;
    
    const change = currentPrice.price - previousPrice.price;
    const changePercent = (change / previousPrice.price) * 100;
    
    res.json({
      symbol: 'NVDA',
      price: currentPrice.price,
      change: change,
      changePercent: changePercent,
      timestamp: currentPrice.timestamp
    });
  } catch (error) {
    console.error('Error fetching current price:', error);
    res.status(500).json({ error: 'Failed to fetch current price' });
  }
});

app.get('/api/stocks/nvidia/last50', (req, res) => {
  try {
    res.json(priceHistory.slice().reverse()); // Return in reverse chronological order
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

app.get('/api/stocks/correlation', (req, res) => {
  try {
    const { ticker1, ticker2, minutes } = req.query;
    
    if (!ticker1 || !ticker2 || !minutes) {
      return res.status(400).json({ error: 'Missing required parameters: ticker1, ticker2, minutes' });
    }
    
    const minutesNum = parseInt(minutes);
    if (isNaN(minutesNum) || minutesNum <= 0) {
      return res.status(400).json({ error: 'Minutes must be a positive number' });
    }
    
    // Generate mock price data for both tickers
    const prices1 = [];
    const prices2 = [];
    
    // Base prices for different stocks
    const stockPrices = {
      'NVDA': 850,
      'AAPL': 175,
      'GOOGL': 140,
      'MSFT': 420,
      'TSLA': 250,
      'AMZN': 145,
      'META': 350
    };
    
    const basePrice1 = stockPrices[ticker1.toUpperCase()] || 100;
    const basePrice2 = stockPrices[ticker2.toUpperCase()] || 100;
    
    // Generate correlated price movements
    const correlationFactor = Math.random() * 2 - 1; // Random correlation between -1 and 1
    
    for (let i = 0; i < minutesNum; i++) {
      const randomFactor = Math.random() - 0.5;
      const sharedFactor = Math.random() - 0.5;
      
      const price1Movement = (randomFactor * 0.5 + sharedFactor * correlationFactor * 0.5) * 0.02;
      const price2Movement = (randomFactor * 0.5 + sharedFactor * 0.5) * 0.02;
      
      prices1.push(basePrice1 * (1 + price1Movement));
      prices2.push(basePrice2 * (1 + price2Movement));
    }
    
    const correlation = calculateCorrelation(prices1, prices2);
    
    res.json({
      ticker1: ticker1.toUpperCase(),
      ticker2: ticker2.toUpperCase(),
      correlation: correlation,
      minutes: minutesNum,
      dataPoints: prices1.length
    });
  } catch (error) {
    console.error('Error calculating correlation:', error);
    res.status(500).json({ error: 'Failed to calculate correlation' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});
