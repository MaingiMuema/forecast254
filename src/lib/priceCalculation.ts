/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Calculate share price based on probability percentage
 * Uses a logit function to map probabilities to prices
 * Price will be between 0 and 100 KES
 */
export function calculateSharePrice(probability: number): number {
  // Ensure probability is between 0 and 1
  probability = Math.max(0.01, Math.min(0.99, probability));
  
  // Convert probability to odds ratio
  const odds = probability / (1 - probability);
  
  // Calculate price (will be between 0 and 100 KES)
  const price = 100 * probability;
  
  // Round to 2 decimal places
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
 * Get initial share prices for a new market
 * Returns both YES and NO prices based on 50/50 probability
 */
export function getInitialSharePrices() {
  const initialProbability = 0.5;
  const yesPrice = calculateSharePrice(initialProbability);
  const noPrice = calculateSharePrice(1 - initialProbability);
  
  return {
    yesPrice,
    noPrice,
    probability: initialProbability
  };
}
