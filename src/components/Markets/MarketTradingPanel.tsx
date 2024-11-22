/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface MarketData {
  id: string;
  title: string;
  description: string;
  probability_yes: number;
  probability_no: number;
  total_volume: number;
  volume?: number; // For backward compatibility
  total_yes_amount: number;
  total_no_amount: number;
  closing_date: string;
  status: string;
  min_amount: number;
  max_amount: number;
  trades: number;
  views: number;
  resolved_value?: boolean;
}

interface Position {
  id: string;
  user_id: string;
  market_id: string;
  position: 'yes' | 'no';
  amount: number;
  shares: number;
  created_at: string;
}

export default function MarketTradingPanel({ marketId }: { marketId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [position, setPosition] = useState<'yes' | 'no'>('yes');
  const [estimatedShares, setEstimatedShares] = useState<number>(0);

  // Fetch market data and user positions
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch market data
        const marketRes = await fetch(`/api/markets/${marketId}`);
        if (!marketRes.ok) {
          const errorData = await marketRes.json();
          console.error('Market fetch error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch market data');
        }
        
        const marketData = await marketRes.json();
        console.log('Received market data:', marketData);
        
        // Only set state if component is still mounted
        if (!mounted) return;
        setMarket(marketData);

        // Fetch positions if user is logged in
        if (user) {
          try {
            const positionsRes = await fetch(`/api/markets/${marketId}/positions`, {
              credentials: 'include', // Include cookies for authentication
            });
            
            if (!positionsRes.ok) {
              const errorData = await positionsRes.json();
              console.error('Positions fetch error:', errorData);
              if (positionsRes.status === 401) {
                // Handle unauthorized error quietly - user might not be logged in
                console.log('User not authenticated for positions');
                return;
              }
              throw new Error(errorData.error || 'Failed to fetch positions');
            }
            
            const positionsData = await positionsRes.json();
            console.log('Received positions data:', positionsData);
            if (mounted) {
              setPositions(positionsData || []);
            }
          } catch (posError) {
            console.error('Error fetching positions:', posError);
            toast.error('Failed to load your positions');
            // Don't throw here to prevent market data from being hidden
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        if (mounted) {
          toast.error(error instanceof Error ? error.message : 'Failed to load market data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [marketId, user]);

  // Calculate estimated shares based on amount and position
  useEffect(() => {
    if (!market || !amount) {
      setEstimatedShares(0);
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setEstimatedShares(0);
      return;
    }

    const probability = position === 'yes' ? market.probability_yes : market.probability_no;
    if (probability <= 0 || probability >= 100) {
      setEstimatedShares(0);
      return;
    }

    const shares = Number((numAmount / (probability / 100)).toFixed(4));
    setEstimatedShares(shares);
  }, [amount, position, market]);

  const formattedShares = useMemo(() => {
    if (!estimatedShares || isNaN(estimatedShares)) return '0.00';
    return estimatedShares.toFixed(2);
  }, [estimatedShares]);

  const handleTrade = async () => {
    if (!user) {
      toast.error('Please sign in to trade');
      router.push('/login');
      return;
    }

    if (!market) {
      toast.error('Market data not available');
      return;
    }

    const tradeAmount = Number(amount);
    if (!amount || isNaN(tradeAmount) || tradeAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    if (tradeAmount < market.min_amount || tradeAmount > market.max_amount) {
      toast.error(`Amount must be between ${market.min_amount} and ${market.max_amount}`);
      return;
    }

    setTradeLoading(true);

    try {
      const res = await fetch(`/api/markets/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          marketId: market.id,
          amount: tradeAmount,
          position,
        }),
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        console.log('Trade failed:', responseData);
        toast.error(responseData.error || 'Failed to execute trade');
        setTradeLoading(false);
        return;
      }

      await fetchMarketData();
      toast.success('Trade executed successfully');
      setAmount('');
    } catch (error) {
      console.error('Trade error:', error);
      toast.error('Failed to execute trade. Please try again.');
    } finally {
      setTradeLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      
      // Fetch market data
      const marketRes = await fetch(`/api/markets/${marketId}`);
      if (!marketRes.ok) {
        const error = await marketRes.json();
        throw new Error(error.message || 'Failed to fetch market data');
      }
      
      const marketData = await marketRes.json();
      
      // Only set state if component is still mounted
      setMarket(marketData);

      // Fetch positions if user is logged in
      if (user) {
        try {
          const positionsRes = await fetch(`/api/markets/${marketId}/positions`, {
            credentials: 'include', // Include cookies for authentication
          });
          
          if (!positionsRes.ok) {
            const error = await positionsRes.json();
            if (positionsRes.status === 401) {
              // Handle unauthorized error quietly - user might not be logged in
              console.log('User not authenticated for positions');
              return;
            }
            console.error('Failed to fetch positions:', error);
            return;
          }
          
          const positionsData = await positionsRes.json();
          setPositions(positionsData || []);
        } catch (posError) {
          console.error('Error fetching positions:', posError);
          // Don't throw here to prevent market data from being hidden
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-500">Market data not available</p>
      </div>
    );
  }

  const isMarketClosed = market.status !== 'open' || new Date(market.closing_date) <= new Date();

  // Safe formatting functions
  const formatPercent = (num: number | null | undefined) => 
    num !== null && num !== undefined && isFinite(num) ? num.toFixed(2) : '0.00';

  const formatCurrency = (num: number | null | undefined) => 
    num !== null && num !== undefined && isFinite(num)
      ? num.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })
      : 'KES 0.00';

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-6">
      {/* Market Status */}
      {isMarketClosed && (
        <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-sm text-center">
          This market is closed for trading
        </div>
      )}

      {/* Current Price */}
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Current Price</h3>
        <div className="text-4xl font-bold text-white">
          {formatPercent(market.probability_yes)}%
        </div>
        <p className="text-sm text-gray-400 mt-1">
          24h Volume: {formatCurrency(market.total_volume || 0)}
        </p>
      </div>

      {/* Position Selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPosition('yes')}
          disabled={isMarketClosed}
          className={`p-4 rounded-lg flex flex-col items-center justify-center transition-colors ${
            position === 'yes'
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          } ${isMarketClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowUpIcon className="h-6 w-6 mb-2" />
          <span className="text-sm font-medium">Yes ({formatPercent(market.probability_yes)}%)</span>
        </button>
        <button
          onClick={() => setPosition('no')}
          disabled={isMarketClosed}
          className={`p-4 rounded-lg flex flex-col items-center justify-center transition-colors ${
            position === 'no'
              ? 'bg-rose-500/10 text-rose-500'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          } ${isMarketClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ArrowDownIcon className="h-6 w-6 mb-2" />
          <span className="text-sm font-medium">No ({formatPercent(market.probability_no)}%)</span>
        </button>
      </div>

      {/* User Positions Summary */}
      {user && positions && positions.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Your Positions</h4>
          {(() => {
            // Calculate position summaries
            const summary = positions.reduce((acc, pos) => {
              const shares = Number(pos.shares) || 0;
              const amount = Number(pos.amount) || 0;
              
              if (pos.position === 'yes') {
                acc.totalYesShares += shares;
                acc.totalYesAmount += amount;
              } else if (pos.position === 'no') {
                acc.totalNoShares += shares;
                acc.totalNoAmount += amount;
              }
              return acc;
            }, {
              totalYesShares: 0,
              totalYesAmount: 0,
              totalNoShares: 0,
              totalNoAmount: 0
            });

            // Format numbers safely
            const formatNumber = (num: number) => 
              isFinite(num) ? num.toFixed(2) : '0.00';

            const formatCurrency = (num: number) => 
              isFinite(num) 
                ? num.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })
                : 'KES 0.00';

            return (
              <>
                {summary.totalYesShares > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-500">Yes Position:</span>
                    <span className="text-white">
                      {formatNumber(summary.totalYesShares)} shares 
                      ({formatCurrency(summary.totalYesAmount)})
                    </span>
                  </div>
                )}
                {summary.totalNoShares > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-rose-500">No Position:</span>
                    <span className="text-white">
                      {formatNumber(summary.totalNoShares)} shares
                      ({formatCurrency(summary.totalNoAmount)})
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-400">
            Amount (KES)
          </label>
          <span className="text-xs text-gray-400">
            Min: {market.min_amount} KES | Max: {market.max_amount} KES
          </span>
        </div>
        <div className="relative">
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isMarketClosed}
            min={market.min_amount}
            max={market.max_amount}
            step="1"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={`Enter amount (${market.min_amount}-${market.max_amount})...`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-sm text-gray-400">KES</span>
          </div>
        </div>
        {estimatedShares > 0 && (
          <p className="text-xs text-gray-400">
            Estimated shares: {formattedShares}
          </p>
        )}
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {[100, 500, 1000].map((quickAmount) => (
          <button
            key={quickAmount}
            onClick={() => setAmount(quickAmount.toString())}
            disabled={isMarketClosed || quickAmount > market.max_amount}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isMarketClosed || quickAmount > market.max_amount
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-50'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            +{quickAmount}
          </button>
        ))}
      </div>

      {/* Trade Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleTrade}
        disabled={!amount || isMarketClosed || tradeLoading || !user}
        className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
          amount && !isMarketClosed && !tradeLoading && user
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'bg-gray-800 text-gray-400 cursor-not-allowed'
        }`}
      >
        {!user ? 'Sign in to Trade' :
         tradeLoading ? 'Processing...' :
         isMarketClosed ? 'Market Closed' :
         position === 'yes' ? 'Buy Yes' : 'Buy No'}
      </motion.button>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        By trading, you agree to our terms and conditions.
        Make sure you understand the risks involved.
      </p>
    </div>
  );
}
