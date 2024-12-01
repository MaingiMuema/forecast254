/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface Trade {
  id: string;
  created_at: string;
  side: string | null;
  position: string | null;
  price: number | null;
  amount: number | null;
  filled_amount: number | null;
  remaining_amount: number | null;
  status: string;
  market_id: string | null;
  market_title: string | null;
}

interface SupabaseOrder extends Omit<Trade, 'market_title'> {
  markets: {
    title: string | null;
  };
}

export default function TradesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        if (!user) return;

        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            side,
            position,
            price,
            amount,
            filled_amount,
            remaining_amount,
            status,
            market_id,
            markets!inner (
              title
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }) as { data: SupabaseOrder[] | null, error: any };

        if (error) throw error;

        // Transform the data to include market title directly
        const transformedTrades: Trade[] = (data || [])
          .filter(order => order.market_id !== null) // Filter out orders without market_id
          .map(order => ({
            ...order,
            market_title: order.markets.title,
            markets: undefined
          }));

        setTrades(transformedTrades);
      } catch (error) {
        console.error('Error fetching trades:', error);
        toast.error('Failed to load trades');
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [user]);

  const getStatusColor = (status: Trade['status']) => {
    switch (status) {
      case 'filled':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(price);
  };

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
          <h1 className="text-2xl font-bold text-foreground">My Trades</h1>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Market</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Side</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Position</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Filled</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Loading trades...
                  </td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No trades found
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => trade.market_id && router.push(`/markets/${trade.market_id}`)}
                  >
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(trade.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {trade.market_title || 'Untitled Market'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                        {trade.side?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{trade.position?.toUpperCase() || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{trade.price ? formatPrice(trade.price) : 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{trade.amount || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{trade.filled_amount || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={getStatusColor(trade.status as Trade['status'])}>
                        {trade.status.toUpperCase()}
                      </span>
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
