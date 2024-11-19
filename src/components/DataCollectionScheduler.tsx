'use client';

import { useEffect, useRef } from 'react';

const COLLECTION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export default function DataCollectionScheduler() {
  const lastRunRef = useRef<number>(Date.now());

  const collectData = async () => {
    try {
      const response = await fetch('/api/market-data');
      const data = await response.json();
      
      if (data.success) {
        console.log('Data collection completed successfully:', data);
        lastRunRef.current = Date.now();
      } else {
        console.warn('Data collection failed:', data.message);
      }
    } catch (error) {
      console.error('Error triggering data collection:', error);
    }
  };

  useEffect(() => {
    // Initial collection after 1 minute of page load
    const initialTimeout = setTimeout(() => {
      collectData();
    }, 60 * 1000);

    // Set up periodic collection
    const interval = setInterval(() => {
      const timeSinceLastRun = Date.now() - lastRunRef.current;
      
      // Only collect if more than COLLECTION_INTERVAL has passed
      if (timeSinceLastRun >= COLLECTION_INTERVAL) {
        collectData();
      }
    }, 30 * 60 * 1000); // Check every 30 minutes

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
