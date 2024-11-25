/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Calculate share price based on probability percentage
 * Uses a linear function to map probabilities to prices
 * Price will be between 0 and 100 KES
 */
export function calculateSharePrice(probability: number): number {
  /**
   * Ensure probability is within valid range (0.01 to 0.99)
   * This prevents division by zero and ensures price is within bounds
   */
  probability = Math.max(0.01, Math.min(0.99, probability));
  
  /**
   * Calculate price directly from probability
   * Price is a linear function of probability, scaled to 0-100 KES range
   */
  const price = 100 * probability;
  
  /**
   * Round price to 2 decimal places for display purposes
   */
  return Math.round(price * 100) / 100;
}

/**
 * Calculate probability from share price
 * Inverse of calculateSharePrice function
 */
export function calculateProbability(price: number): number {
  // Ensure price is between 0 and 100
  price = Math.max(0, Math.min(100, price));
  
  // Convert price to probability
  const probability = price / 100;
  
  // Round to 4 decimal places
  return Math.round(probability * 10000) / 10000;
}

/**
 * Validates that yes and no probabilities sum to 1 (within rounding error)
 * Returns true if valid, false otherwise
 */
export function validateProbabilities(yesProb: number, noProb: number): boolean {
  const sum = Math.round((yesProb + noProb) * 10000) / 10000;
  return Math.abs(sum - 1) < 0.0001; // Allow for small rounding errors
}

/**
 * Get initial share prices for a new market
 * Returns both YES and NO prices based on 50/50 probability
 */
export function getInitialSharePrices() {
  const initialProbability = 0.5;
  const yesPrice = calculateSharePrice(initialProbability);
  const noPrice = calculateSharePrice(1 - initialProbability);
  
  if (!validateProbabilities(initialProbability, 1 - initialProbability)) {
    throw new Error('Probabilities do not sum to 1');
  }
  
  return {
    yesPrice,
    noPrice,
    probability: initialProbability
  };
}
