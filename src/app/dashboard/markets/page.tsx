'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Market {
  id: string;
  title: string | null;
  description: string | null;
  category: string;
  active: boolean;
  created_at: string;
  status: string;
  closing_date: string | null;
  total_volume: number;
  probability_yes: number;
}

export default function MyMarkets() {
  const router = useRouter();
  const { user } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setMarkets(data || []);
      } catch (error) {
        console.error('Error fetching markets:', error);
        toast.error('Failed to load markets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
  }, [user]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <FiArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">My Markets</h1>
        </div>
        <Button
          variant="default"
          onClick={() => router.push('/markets/create')}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create Market
        </Button>
      </div>

      {/* Markets List */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Volume</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Probability</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Closes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    Loading markets...
                  </td>
                </tr>
              ) : markets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    You haven&apos;t created any markets yet.
                  </td>
                </tr>
              ) : (
                markets.map((market) => (
                  <tr
                    key={market.id}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/market/${market.id}`)}
                  >
                    <td className="p-4 align-middle">
                      <div className="font-medium">{market.title}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        {market.category}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        market.status === 'open' ? 'bg-green-500/10 text-green-500' :
                        market.status === 'closed' ? 'bg-red-500/10 text-red-500' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {market.status}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      KES {market.total_volume?.toLocaleString() || 0}
                    </td>
                    <td className="p-4 align-middle">
                      {(market.probability_yes * 100).toFixed(1)}%
                    </td>
                    <td className="p-4 align-middle">
                      {new Date(market.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle">
                      {market.closing_date
                        ? new Date(market.closing_date).toLocaleDateString()
                        : 'No end date'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
