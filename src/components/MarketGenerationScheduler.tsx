'use client';

import { useEffect, useRef } from 'react';

const INITIAL_DELAY = 1 * 60 * 1000; // 1 minute
const GENERATION_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

export default function MarketGenerationScheduler() {
  const lastRunRef = useRef<number>(Date.now() - GENERATION_INTERVAL); // Start ready to generate

  const generateMarkets = async () => {
    try {
      console.log('Starting market generation...', new Date().toISOString());
      
      const response = await fetch('/api/market-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`Market generation completed successfully at ${new Date().toISOString()}:`, data);
        console.log(`Successfully generated ${data.marketsCreated || 0} new markets`);
        lastRunRef.current = Date.now();
      } else {
        console.error(`Market generation failed at ${new Date().toISOString()}:`, {
          status: response.status,
          statusText: response.statusText,
          error: data.error
        });
      }
    } catch (error) {
      console.log(`Error triggering market generation at ${new Date().toISOString()}:`, error);
    }
  };

  useEffect(() => {
    console.log(`MarketGenerationScheduler initialized at ${new Date().toISOString()}`);
    console.log(`Initial generation will run in ${INITIAL_DELAY / 1000} seconds`);
    console.log(`Last run was at ${new Date(lastRunRef.current).toISOString()}`);

    // Initial generation after INITIAL_DELAY
    const initialTimeout = setTimeout(() => {
      console.log(`Running initial market generation at ${new Date().toISOString()}`);
      generateMarkets();
    }, INITIAL_DELAY);

    // Set up periodic generation check
    const interval = setInterval(() => {
      const timeSinceLastRun = Date.now() - lastRunRef.current;
      console.log(`Checking if generation needed at ${new Date().toISOString()}`);
      console.log(`Time since last run: ${timeSinceLastRun / 1000} seconds`);
      console.log(`Next run in: ${(GENERATION_INTERVAL - timeSinceLastRun) / 1000} seconds`);
      
      // Only generate if more than GENERATION_INTERVAL has passed
      if (timeSinceLastRun >= GENERATION_INTERVAL) {
        console.log(`Running scheduled market generation at ${new Date().toISOString()}`);
        generateMarkets();
      }
    }, CHECK_INTERVAL);

    // Cleanup on unmount
    return () => {
      console.log(`MarketGenerationScheduler cleanup at ${new Date().toISOString()}`);
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}