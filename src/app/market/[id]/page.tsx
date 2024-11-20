import { Suspense } from 'react';
import MarketHeader from '@/components/Markets/MarketHeader';
import MarketDescription from '@/components/Markets/MarketDescription';
import MarketActivity from '@/components/Markets/MarketActivity';
import MarketTradingPanel from '@/components/Markets/MarketTradingPanel';
import MarketStats from '@/components/Markets/MarketStats';
import MarketSkeleton from '@/components/Markets/MarketSkeleton';

type Props = {
  params: {
    id: string;
  };
};

export default async function MarketPage({ params }: Props) {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<MarketSkeleton />}>
              <MarketHeader marketId={params.id} />
              <MarketDescription marketId={params.id} />
              <MarketActivity marketId={params.id} />
            </Suspense>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Suspense fallback={<div className="h-[400px] animate-pulse bg-gray-800 rounded-lg" />}>
              <MarketTradingPanel marketId={params.id} />
              <MarketStats marketId={params.id} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
