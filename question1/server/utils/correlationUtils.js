
/**
 * Calculate the mean of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} - Mean value
 */
const calculateMean = (values) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

/**
 * Calculate the standard deviation of an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} - Standard deviation
 */
const calculateStandardDeviation = (values) => {
  if (values.length === 0) return 0;
  
  const mean = calculateMean(values);
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = calculateMean(squaredDifferences);
  
  return Math.sqrt(variance);
};

/**
 * Calculate the covariance between two arrays of numbers
 * @param {number[]} x - First array of values
 * @param {number[]} y - Second array of values
 * @returns {number} - Covariance
 */
const calculateCovariance = (x, y) => {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('Arrays must have the same non-zero length');
  }
  
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  
  const covariance = x.reduce((sum, xi, i) => {
    return sum + (xi - meanX) * (y[i] - meanY);
  }, 0) / x.length;
  
  return covariance;
};

/**
 * Calculate the Pearson correlation coefficient between two arrays
 * @param {number[]} x - First array of values
 * @param {number[]} y - Second array of values
 * @returns {number} - Pearson correlation coefficient (-1 to 1)
 */
const calculateCorrelation = (x, y) => {
  try {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Arrays must have the same non-zero length');
    }
    
    const covariance = calculateCovariance(x, y);
    const stdDevX = calculateStandardDeviation(x);
    const stdDevY = calculateStandardDeviation(y);
    
    // Handle edge case where standard deviation is zero
    if (stdDevX === 0 || stdDevY === 0) {
      return 0;
    }
    
    const correlation = covariance / (stdDevX * stdDevY);
    
    // Ensure correlation is within valid range [-1, 1]
    return Math.max(-1, Math.min(1, correlation));
  } catch (error) {
    console.error('Error calculating correlation:', error);
    return 0;
  }
};

module.exports = {
  calculateMean,
  calculateStandardDeviation,
  calculateCovariance,
  calculateCorrelation
};
