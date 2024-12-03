'use client';

import { useEffect } from 'react';
import { marketService } from '@/lib/market-service';

export default function MarketViewTracker({ marketId }: { marketId: string }) {
  useEffect(() => {
    // Store viewed markets in session storage to prevent duplicate counts
    const viewedMarkets = sessionStorage.getItem('viewedMarkets');
    const viewedMarketsArray = viewedMarkets ? JSON.parse(viewedMarkets) : [];

    // Only increment views if market hasn't been viewed in this session
    if (!viewedMarketsArray.includes(marketId)) {
      marketService.incrementViews(marketId);
      
      // Add market to viewed markets
      viewedMarketsArray.push(marketId);
      sessionStorage.setItem('viewedMarkets', JSON.stringify(viewedMarketsArray));
    }
  }, [marketId]);

  return null; // This component doesn't render anything
}
