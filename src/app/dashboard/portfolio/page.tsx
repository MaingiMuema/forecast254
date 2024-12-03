'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Market {
  id: string;
  title: string;
  status: 'open' | 'closed' | 'resolved';
  yes_price: number;
  no_price: number;
  resolved_value: boolean | null;
}

interface Order {
  id: string;
  user_id: string;
  market_id: string;
  order_type: string;
  side: string;
  position: 'yes' | 'no';
  price: number;
  amount: number;
  filled_amount: number;
  remaining_amount: number;
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
  market: Market | null;
}

interface Position {
  marketId: string;
  marketTitle: string;
  position: 'yes' | 'no';
  amount: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  profitLossPercentage: number;
}

interface PortfolioStats {
  totalValue: number;
  totalProfitLoss: number;
  profitLossPercentage: number;
  positions: Position[];
  balance: number;
}

export default function PortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalProfitLoss: 0,
    profitLossPercentage: 0,
    positions: [],
    balance: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchPortfolioData();
  }, [user, router]);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);

      // Fetch user's balance
      const { data: profileData } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user?.id)
        .single();

      const balance = profileData?.balance || 0;

      // Fetch all filled orders with market data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          market:markets(
            id,
            title,
            status,
            yes_price,
            no_price,
            resolved_value
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'filled');

      if (ordersError) throw ordersError;

      // Group orders by market and position
      const positionMap = new Map<string, Map<'yes' | 'no', Position>>();

      (orders as Order[]).forEach((order: Order) => {
        if (!order.market || order.market.status === 'resolved') return;

        const marketPositions = positionMap.get(order.market_id) || new Map<'yes' | 'no', Position>();
        const existingPosition = marketPositions.get(order.position) || {
          marketId: order.market_id,
          marketTitle: order.market.title,
          position: order.position,
          amount: 0,
          averagePrice: 0,
          currentPrice: order.position === 'yes' ? order.market.yes_price : order.market.no_price,
          value: 0,
          profitLoss: 0,
          profitLossPercentage: 0
        };

        // Update position
        const newAmount = existingPosition.amount + order.filled_amount;
        const newTotalCost = (existingPosition.amount * existingPosition.averagePrice) + 
                           (order.filled_amount * order.price);
        
        existingPosition.amount = newAmount;
        existingPosition.averagePrice = newTotalCost / newAmount;
        existingPosition.value = newAmount * existingPosition.currentPrice;
        existingPosition.profitLoss = existingPosition.value - (newAmount * existingPosition.averagePrice);
        existingPosition.profitLossPercentage = (existingPosition.profitLoss / (newAmount * existingPosition.averagePrice)) * 100;

        marketPositions.set(order.position, existingPosition);
        positionMap.set(order.market_id, marketPositions);
      });

      // Convert positions map to array
      const positions: Position[] = [];
      positionMap.forEach(marketPositions => {
        marketPositions.forEach(position => {
          positions.push(position);
        });
      });

      // Calculate total stats
      const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0) + balance;
      const totalProfitLoss = positions.reduce((sum, pos) => sum + pos.profitLoss, 0);
      const totalCost = positions.reduce((sum, pos) => sum + (pos.amount * pos.averagePrice), 0);
      const profitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

      setStats({
        totalValue,
        totalProfitLoss,
        profitLossPercentage,
        positions: positions.sort((a, b) => b.value - a.value),
        balance
      });
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-800 rounded-lg"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Portfolio Summary */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm">Total Portfolio Value</h3>
              <p className="text-2xl font-bold">KES {stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm">Total Profit/Loss</h3>
              <p className={`text-2xl font-bold ${stats.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.totalProfitLoss >= 0 ? '+' : '-'}KES {Math.abs(stats.totalProfitLoss).toLocaleString()}
                <span className="text-sm ml-2">
                  ({stats.profitLossPercentage >= 0 ? '+' : ''}{stats.profitLossPercentage.toFixed(2)}%)
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-gray-400 text-sm">Available Balance</h3>
              <p className="text-2xl font-bold">KES {stats.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Positions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Open Positions</h2>
          {stats.positions.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
              No open positions
            </div>
          ) : (
            stats.positions.map((position, index) => (
              <motion.div
                key={`${position.marketId}-${position.position}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gray-800 rounded-lg p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <h3 className="font-medium text-lg">{position.marketTitle}</h3>
                    <p className="text-sm text-gray-400">
                      Position: <span className="text-white">{position.position.toUpperCase()}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Amount</p>
                    <p className="font-medium">{position.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">
                      Avg. Price: KES {position.averagePrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Current Value</p>
                    <p className="font-medium">KES {position.value.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">
                      Current Price: KES {position.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Profit/Loss</p>
                    <p className={`font-medium ${position.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {position.profitLoss >= 0 ? '+' : '-'}KES {Math.abs(position.profitLoss).toLocaleString()}
                    </p>
                    <p className={`text-sm ${position.profitLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {position.profitLossPercentage >= 0 ? (
                        <FaArrowUp className="inline mr-1" />
                      ) : (
                        <FaArrowDown className="inline mr-1" />
                      )}
                      {position.profitLossPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
