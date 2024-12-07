/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Order, OrderBook, CreateOrderRequest, OrderType, OrderSide, Position } from '@/types/order';
import { toast } from 'react-hot-toast';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { calculateSharePrice, calculateProbability } from '@/lib/priceCalculation';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface MarketTradingPanelProps {
  marketId: string;
}

interface UserPosition {
  position: 'yes' | 'no';
  shares: number;
}

interface PurchasePrice {
  price: number;
  shares: number;
}

interface Profile {
  id: string;
  balance: number;
  updated_at: string;
  created_at: string;
}

export default function MarketTradingPanel({ marketId }: MarketTradingPanelProps) {
  const supabase = createClientComponentClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderBook, setOrderBook] = useState<OrderBook>({ asks: [], bids: [] });
  const [side, setSide] = useState<OrderSide>('buy');
  const [position, setPosition] = useState<Position>('yes');
  const [amount, setAmount] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [market, setMarket] = useState<any>(null);
  const [userPositions, setUserPositions] = useState<{ yes: number; no: number }>({ yes: 0, no: 0 });
  const [purchasePrices, setPurchasePrices] = useState<{ yes: PurchasePrice[], no: PurchasePrice[] }>({
    yes: [],
    no: []
  });
  const [probabilityHistory, setProbabilityHistory] = useState<Array<{
    timestamp: string;
    probabilityYes: number;
    probabilityNo: number;
    volume?: number;
  }>>([]);

  interface ValidationResult {
    isValid: boolean;
    price?: number;
    error?: string;
  }

  const validateOrder = (): ValidationResult => {
    if (!market) {
      return {
        isValid: false,
        error: 'Market data is not available'
      };
    }

    // Check if market is resolved
    if (market.resolved_value !== null) {
      return {
        isValid: false,
        error: `This market has been resolved. The outcome was ${market.resolved_value ? 'YES' : 'NO'}.`
      };
    }

    const orderAmount = Number(amount);

    // Validate share amount (not monetary value)
    if (orderAmount < 1) {
      return {
        isValid: false,
        error: 'Number of shares must be at least 1'
      };
    }

    if (side === 'sell') {
      const availableShares = userPositions[position];
      
      if (availableShares < orderAmount) {
        return {
          isValid: false,
          error: `Insufficient shares. You only have ${availableShares} ${position.toUpperCase()} shares available.`
        };
      }

      // For sell orders, calculate the refund price based on original purchase prices
      let remainingToSell = orderAmount;
      let totalValue = 0;
      const purchaseHistory = [...purchasePrices[position]]; // Create a copy to avoid modifying original

      for (const purchase of purchaseHistory) {
        if (purchase.shares > 0) {
          const sellAmount = Math.min(remainingToSell, purchase.shares);
          totalValue += sellAmount * purchase.price;
          remainingToSell -= sellAmount;

          if (remainingToSell <= 0) break;
        }
      }

      if (remainingToSell > 0) {
        return {
          isValid: false,
          error: `Can only sell ${orderAmount - remainingToSell} shares at their purchase prices`
        };
      }

      // Return the weighted average purchase price for refund
      const refundPrice = Math.round(totalValue / orderAmount);
      return {
        isValid: true,
        price: refundPrice
      };
    }

    // For buy orders, use market probability
    return {
      isValid: true,
      price: getEffectivePrice()
    };
  };

  const getEffectivePrice = () => {
    if (!market) return 0;

    if (side === 'sell') {
      // For sell orders, calculate the refund price
      const orderAmount = Number(amount);
      let remainingToSell = orderAmount;
      let totalValue = 0;
      const purchaseHistory = [...purchasePrices[position]];

      for (const purchase of purchaseHistory) {
        if (purchase.shares > 0) {
          const sellAmount = Math.min(remainingToSell, purchase.shares);
          totalValue += sellAmount * purchase.price;
          remainingToSell -= sellAmount;

          if (remainingToSell <= 0) break;
        }
      }

      // If we can't sell all shares, return 0 to trigger validation error
      if (remainingToSell > 0) return 0;

      // Return the weighted average purchase price
      return Math.round(totalValue / orderAmount);
    } else {
      // For buy orders, calculate price based on market probability and order size
      const baseProb = position === 'yes' ? market.probability_yes : market.probability_no;
      const orderAmount = Number(amount) || 0;
      
      // Calculate market impact based on order size
      // Larger orders have more impact on the price
      const marketImpact = Math.min(0.1, Math.max(0.01, orderAmount / 100));
      
      // Adjust probability based on order side and size
      let adjustedProb = baseProb;
      if (side === 'buy') {
        // Buying increases the probability/price
        adjustedProb = Math.min(0.99, baseProb + (marketImpact * (1 - baseProb)));
      } else {
        // Selling decreases the probability/price
        adjustedProb = Math.max(0.01, baseProb - (marketImpact * baseProb));
      }

      // Convert probability to price (0-100 range)
      return Math.round(adjustedProb * 100);
    }
  };

  const getEstimatedProbability = () => {
    if (!market || !amount) return null;

    const orderAmount = Number(amount);
    const marketImpact = Math.min(0.1, Math.max(0.01, orderAmount / 100));
    
    let newProbYes = market.probability_yes;
    let newProbNo = market.probability_no;

    if (position === 'yes') {
      if (side === 'buy') {
        newProbYes = Math.min(0.99, market.probability_yes + (marketImpact * (1 - market.probability_yes)));
      } else {
        newProbYes = Math.max(0.01, market.probability_yes - (marketImpact * market.probability_yes));
      }
      newProbNo = 1 - newProbYes;
    } else {
      if (side === 'buy') {
        newProbNo = Math.min(0.99, market.probability_no + (marketImpact * (1 - market.probability_no)));
      } else {
        newProbNo = Math.max(0.01, market.probability_no - (marketImpact * market.probability_no));
      }
      newProbYes = 1 - newProbNo;
    }

    return {
      yes: newProbYes,
      no: newProbNo
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to place orders');
      return;
    }

    const validation = validateOrder();
    if (!validation.isValid) {
      if (validation.error) {
        toast.error(validation.error);
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const effectivePrice = validation.price!;
      console.log('Submitting order with effective price:', effectivePrice);

      const response = await fetch('/api/markets/trade/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(amount),
          market_id: marketId,
          position: position,
          price: effectivePrice,
          required_funds: side === 'buy' ? effectivePrice * Number(amount) : 0,
          side: side,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      console.log('Order response:', data);
      
      // Clear form
      setAmount('');
      
      // Show success message
      toast.success(
        `${side === 'buy' ? 'Bought' : 'Sold'} ${amount} ${position.toUpperCase()} shares at ${effectivePrice} KES`
      );
      
      // Update local state with the new balance from the response
      if (typeof data.balance === 'number') {
        setUserBalance(data.balance);
        console.log('Balance updated to:', data.balance);
      } else {
        console.warn('Balance not found in response:', data);
        // Refresh balance as fallback
        await fetchBalance();
      }
      
      // Update shares if available
      if (typeof data.shares === 'number') {
        const newPositions = {
          ...userPositions,
          [position]: data.shares
        };
        setUserPositions(newPositions);
        console.log('Positions updated to:', newPositions);
      } else {
        // Refresh positions as fallback
        await fetchUserPositions();
      }
      
      // Update probabilities if available
      if (data.probabilities) {
        console.log('New probabilities:', data.probabilities);
        const { yes, no } = data.probabilities;
        if (typeof yes === 'number' && typeof no === 'number') {
          const updatedMarket = {
            ...market!,
            probability_yes: yes,
            probability_no: no,
          };
          setMarket(updatedMarket);
          console.log('Market updated with new probabilities:', updatedMarket);
        }
      }
      
      // Refresh market data as fallback
      const { data: marketData } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();
        
      if (marketData) {
        setMarket(marketData);
        console.log('Market refreshed from database:', marketData);
      }
      
    } catch (error: any) {
      console.error('Error placing order:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    let retryCount = 0;
    const MAX_RETRIES = 3;
    let retryTimeout: NodeJS.Timeout;

    const setupSubscription = () => {
      // Clear any existing retry timeout
      if (retryTimeout) clearTimeout(retryTimeout);

      // Subscribe to balance updates
      const channel = supabase.channel(`profile:${user.id}:${Date.now()}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload: RealtimePostgresChangesPayload<Profile>) => {
          console.log('Profile update received:', payload);
          if (payload.new && 'balance' in payload.new) {
            setUserBalance(payload.new.balance);
          }
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to profile updates');
            retryCount = 0; // Reset retry count on successful subscription
          }
          if (status === 'CHANNEL_ERROR') {
            console.log('Profile subscription error:', err);
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`Retrying subscription (attempt ${retryCount}/${MAX_RETRIES})...`);
              retryTimeout = setTimeout(() => {
                channel.unsubscribe();
                setupSubscription();
              }, 5000);
            } else {
              console.error('Max retry attempts reached');
              toast.error('Unable to connect to real-time updates. Please refresh the page.');
            }
          }
        });

      return channel;
    };

    // Initial subscription setup
    const channel = setupSubscription();

    // Cleanup function
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserPositions();
      fetchBalance();
    }
  }, [user]);

  useEffect(() => {
    if (!marketId) return;

    // Fetch initial order book
    fetchOrderBook();

    // Set up 1-second interval for updates
    const updateInterval = setInterval(fetchOrderBook, 1000);

    // Set up real-time subscription
    const channel = supabase.channel(`orderbook:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId}`,
        },
        async (payload) => {
          console.log('Real-time order update:', payload);
          await fetchOrderBook();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      clearInterval(updateInterval);
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  useEffect(() => {
    if (!user || !marketId) return;

    let retryCount = 0;
    const MAX_RETRIES = 3;
    let retryTimeout: NodeJS.Timeout;

    const setupOrderSubscription = () => {
      // Clear any existing retry timeout
      if (retryTimeout) clearTimeout(retryTimeout);

      const channel = supabase.channel(`orders:${marketId}:${user.id}:${Date.now()}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId} AND user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Order update received:', payload);
          fetchUserPositions();
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to order updates');
            retryCount = 0; // Reset retry count on successful subscription
          }
          if (status === 'CHANNEL_ERROR') {
            console.log('Order subscription error:', err);
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              console.log(`Retrying order subscription (attempt ${retryCount}/${MAX_RETRIES})...`);
              retryTimeout = setTimeout(() => {
                channel.unsubscribe();
                setupOrderSubscription();
              }, 5000);
            } else {
              console.error('Max retry attempts reached for order subscription');
              toast.error('Unable to connect to real-time order updates. Please refresh the page.');
            }
          }
        });

      return channel;
    };

    // Initial subscription setup
    const channel = setupOrderSubscription();

    // Cleanup function
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      supabase.removeChannel(channel);
    };
  }, [user, marketId]);

  useEffect(() => {
    if (!marketId) return;

    // Fetch initial market data
    const fetchMarketData = async () => {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();
      
      if (error) {
        console.error('Error fetching market:', error);
        return;
      }
      
      setMarket(data);
    };

    fetchMarketData();

    // Subscribe to market updates
    const channel = supabase.channel(`market:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'markets',
          filter: `id=eq.${marketId}`,
        },
        (payload) => {
          console.log('Market update received:', payload);
          if (payload.new) {
            setMarket(payload.new);
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  useEffect(() => {
    if (!user) return;

    fetchUserPositions();
    fetchUserProfile();
    fetchOrderBook();

    // Set up intervals for real-time updates
    const positionsInterval = setInterval(fetchUserPositions, 1000);
    const profileInterval = setInterval(fetchUserProfile, 1000);
    const orderBookInterval = setInterval(fetchOrderBook, 1000);

    return () => {
      clearInterval(positionsInterval);
      clearInterval(profileInterval);
      clearInterval(orderBookInterval);
    };
  }, [user]);

  // Fetch user profile to get balance
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (profile) {
        setUserBalance(profile.balance);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchOrderBook = async () => {
    try {
      // Fetch asks (sell orders) - both open and filled
      const { data: asks, error: asksError } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('side', 'sell')
        .in('status', ['open', 'filled'])
        .order('price', { ascending: true })  // Sort asks by lowest price first
        .limit(50);

      if (asksError) throw asksError;

      // Fetch bids (buy orders) - both open and filled
      const { data: bids, error: bidsError } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('side', 'buy')
        .in('status', ['open', 'filled'])
        .order('price', { ascending: false })  // Sort bids by highest price first
        .limit(50);

      if (bidsError) throw bidsError;

      setOrderBook({
        asks: asks || [],
        bids: bids || []
      });
    } catch (error) {
      console.error('Error fetching order book:', error);
    }
  };

  const fetchBalance = async () => {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserBalance(profile.balance);
      }
    }
  };

  const fetchUserPositions = async () => {
    if (!user) return;
    
    try {
      // Get all filled orders for this user in this market
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('user_id', user.id)
        .eq('status', 'filled')
        .order('created_at', { ascending: true });
      
      console.log('User filled orders:', orders);

      if (error) throw error;

      // Calculate net positions and track purchase prices
      const positions = { yes: 0, no: 0 };
      const prices = { yes: [] as PurchasePrice[], no: [] as PurchasePrice[] };

      (orders || []).forEach(order => {
        const position = order.position as 'yes' | 'no';
        
        if (order.side === 'buy') {
          // Add new purchase
          positions[position] += order.filled_amount;
          prices[position].push({
            price: order.price,
            shares: order.filled_amount
          });
        } else {
          // Handle sell - FIFO (First In, First Out)
          let remainingToSell = order.filled_amount;
          
          // Remove shares from the oldest purchases first
          while (remainingToSell > 0 && prices[position].length > 0) {
            const oldestPurchase = prices[position][0];
            const sellAmount = Math.min(remainingToSell, oldestPurchase.shares);
            
            oldestPurchase.shares -= sellAmount;
            remainingToSell -= sellAmount;
            positions[position] -= sellAmount;

            // Remove the purchase record if all shares sold
            if (oldestPurchase.shares === 0) {
              prices[position].shift();
            }
          }
        }
      });

      console.log('Final positions:', positions);
      console.log('Purchase prices:', prices);

      setUserPositions(positions);
      setPurchasePrices(prices);
    } catch (error) {
      console.error('Error fetching user positions:', error);
      toast.error('Failed to fetch your positions');
    }
  };

  const getValidatedProbabilities = () => {
    const yesProb = market?.probability_yes ?? 0.5;
    const noProb = market?.probability_no ?? 0.5;
    
    // Ensure probabilities are between 0 and 1
    const validYesProb = Math.max(0.01, Math.min(0.99, yesProb));
    const validNoProb = Math.max(0.01, Math.min(0.99, noProb));
    
    // Normalize probabilities to sum to 1
    const total = validYesProb + validNoProb;
    if (total === 0) {
      return { yes: 0.5, no: 0.5 };
    }
    
    return {
      yes: validYesProb / total,
      no: validNoProb / total
    };
  };

  const formatProbability = (probability: number) => {
    return `${Math.round(probability * 100)}%`;
  };

  const validateProbabilities = (yesProb: number, noProb: number) => {
    return yesProb >= 0 && yesProb <= 1 && noProb >= 0 && noProb <= 1 && yesProb + noProb === 1;
  };

  useEffect(() => {
    const fetchMarket = async () => {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();
      
      if (error) {
        console.error('Error fetching market:', error);
        return;
      }
      
      console.log('Fetched market data:', data);
      setMarket(data);
    };

    fetchMarket();
  }, [marketId]);

  useEffect(() => {
    if (!marketId) return;

    // Fetch initial order book
    fetchOrderBook();

    // Set up interval for updates
    const orderBookInterval = setInterval(fetchOrderBook, 1000);

    return () => {
      clearInterval(orderBookInterval);
    };
  }, [marketId]);

  useEffect(() => {
    if (!user || !marketId) return;

    // Fetch user data
    fetchUserPositions();
    fetchUserProfile();

    // Set up intervals for user data updates
    const positionsInterval = setInterval(fetchUserPositions, 1000);
    const profileInterval = setInterval(fetchUserProfile, 1000);

    return () => {
      clearInterval(positionsInterval);
      clearInterval(profileInterval);
    };
  }, [user, marketId]);

  const fetchProbabilityHistory = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('status', 'filled')
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      if (ordersData) {
        const history = ordersData.reduce((acc: any[], order) => {
          const lastEntry = acc[acc.length - 1];
          const volume = order.filled_amount * order.price;
          
          if (lastEntry && new Date(order.created_at).getTime() - new Date(lastEntry.timestamp).getTime() < 300000) {
            // If less than 5 minutes apart, update the last entry
            lastEntry.probabilityYes = order.position === 'yes' ? 
              Math.min(0.99, lastEntry.probabilityYes + 0.01) : 
              Math.max(0.01, lastEntry.probabilityYes - 0.01);
            lastEntry.probabilityNo = 1 - lastEntry.probabilityYes;
            lastEntry.volume = (lastEntry.volume || 0) + volume;
          } else {
            // Create a new entry
            acc.push({
              timestamp: order.created_at,
              probabilityYes: order.position === 'yes' ? 0.55 : 0.45,
              probabilityNo: order.position === 'yes' ? 0.45 : 0.55,
              volume
            });
          }
          return acc;
        }, []);

        setProbabilityHistory(history);
      }
    } catch (error) {
      console.error('Error fetching probability history:', error);
    }
  }, [marketId, supabase]);

  useEffect(() => {
    fetchProbabilityHistory();
  }, [fetchProbabilityHistory]);

  return (
    <div className="space-y-6">
      {market && market.resolved_value !== null && (
        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-md text-blue-800 dark:text-blue-200">
          <p className="font-semibold">Market Resolved</p>
          <p>The outcome of this market was: {market.resolved_value ? 'YES' : 'NO'}</p>
          {market.outcome && <p>Resolution Details: {market.outcome}</p>}
        </div>
      )}
      {/* Trading Form Section */}
      <div className="mb-8 relative bg-background/80 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-xl pointer-events-none" />
        <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/10 to-transparent opacity-50 blur-2xl pointer-events-none" />
        
        <div className="relative">
          {/* Buy/Sell Tabs */}
          <div className="flex items-center space-x-1 mb-6 bg-background/80 p-1 rounded-lg border border-border/50 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setSide('buy')}
              className={`flex-1 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-300 ${
                side === 'buy'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'hover:bg-background/90 text-foreground/80 hover:text-green-500'
              }`}
            >
              Buy Shares
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              className={`flex-1 px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-300 ${
                side === 'sell'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'hover:bg-background/90 text-foreground/80 hover:text-red-500'
              }`}
            >
              Sell Shares
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Place Order
              </h2>
              <p className="text-sm text-muted-foreground/80">Create a new market position</p>
            </div>
            {userBalance !== null && (
              <div className="px-5 py-3 rounded-xl bg-background/90 border border-border/50 backdrop-blur-sm hover:border-primary/20 transition-colors">
                <p className="text-xs font-medium text-muted-foreground/80">Available Balance</p>
                <p className="text-sm font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {userBalance.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm animate-in slide-in-from-top-4 duration-300">
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Position Selection with Prices */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground/80">Position</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPosition('yes')}
                  className={`relative p-4 rounded-xl font-medium transition-all duration-300 ${
                    position === 'yes'
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-background/80 border border-border/50 hover:border-primary/30 text-foreground/80 hover:text-primary'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold mb-1">YES</span>
                    {market && (
                      <>
                        <span className="text-sm opacity-80">
                          {formatProbability(getValidatedProbabilities().yes)}
                        </span>
                      </>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('no')}
                  className={`relative p-4 rounded-xl font-medium transition-all duration-300 ${
                    position === 'no'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                      : 'bg-background/80 border border-border/50 hover:border-red-500/30 text-foreground/80 hover:text-red-500'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold mb-1">NO</span>
                    {market && (
                      <>
                        <span className="text-sm opacity-80">
                          {formatProbability(getValidatedProbabilities().no)}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Share Amount Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground/80">Share Amount</label>
                <div className="flex flex-col items-end text-xs text-muted-foreground/80">
                  {side === 'sell' && (
                    <span>Available: {userPositions[position]} {position.toUpperCase()} shares</span>
                  )}
                  {market && side === 'buy' && (
                    <span>
                      Max: {Math.floor(userBalance! / getEffectivePrice())} shares
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="1"
                  min="1"
                  required
                  className="w-full p-3.5 rounded-xl border border-border/50 bg-background/80 hover:bg-background/90 hover:border-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 pr-24 backdrop-blur-sm"
                  placeholder="Enter amount"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-background/90 text-xs font-medium text-muted-foreground/80">
                  SHARES
                </div>
              </div>
              {market && amount && (
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground/80">
                      Total Cost: {(Number(amount) * getEffectivePrice()).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                    </span>
                    <span className={`font-medium ${side === 'sell' || userBalance! >= Number(amount) * getEffectivePrice() ? 'text-green-500' : 'text-red-500'}`}>
                      {side === 'sell' || userBalance! >= Number(amount) * getEffectivePrice() ? 'Sufficient Balance' : 'Insufficient Balance'}
                    </span>
                  </div>
                  {getEstimatedProbability() && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground/80">
                      <span>Estimated Probability After Trade:</span>
                      <div className="flex items-center gap-3">
                        <span className={position === 'yes' ? 'text-green-500' : ''}>
                          YES: {(getEstimatedProbability()!.yes * 100).toFixed(1)}%
                        </span>
                        <span className={position === 'no' ? 'text-green-500' : ''}>
                          NO: {(getEstimatedProbability()!.no * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting || 
                !amount || 
                (side === 'buy' && market && userBalance! < Number(amount) * getEffectivePrice()) ||
                (side === 'sell' && userPositions[position] < Number(amount))
              }
              className={`w-full p-4 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] shadow-lg ${
                side === 'buy'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/20'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none backdrop-blur-sm`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Order...
                </span>
              ) : (
                `${side === 'buy' ? 'Buy' : 'Sell'} ${position.toUpperCase()} Shares`
              )}
            </button>
          </form>
        </div>
      </div>
      {side === 'sell' && (
        <div className="text-sm text-gray-600">
          <p className="font-semibold">Available shares to sell:</p>
          <div className="animate-pulse-slow">
            {purchasePrices[position]
              .filter(p => p.shares > 0)
              .map((p, i) => (
                <p key={i} className="transition-all duration-200">
                  {p.shares} shares at {p.price} KES
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Order Book Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Order Book</h2>
            <p className="text-xs text-muted-foreground mt-1">Live market depth</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
            Latest Orders
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Asks (Sell Orders) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground px-2 sticky top-0 bg-background z-10">
              <span>POSITION</span>
              <span>PRICE</span>
              <span>SHARES</span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
              <div className="space-y-[2px] relative max-h-[300px] overflow-y-auto custom-scrollbar">
                {orderBook.asks.map((order, index) => (
                  <div
                    key={order.id}
                    className={`flex justify-between text-sm py-2 px-3 rounded-lg transition-colors group ${
                      order.status === 'filled' ? 'bg-red-500/5' : 'hover:bg-red-500/10'
                    }`}
                    style={{ 
                      backgroundColor: order.status === 'filled' 
                        ? `rgba(239, 68, 68, 0.05)` 
                        : `rgba(239, 68, 68, ${0.02 + (0.01 * Math.min(5, index))})` 
                    }}
                  >
                    <span className="font-medium text-foreground/80 uppercase">
                      {order.position}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-red-500 group-hover:text-red-600">
                        {order.price !== null ? order.price.toFixed(2) : 'N/A'}
                      </span>

                    </div>
                    <span className="font-medium text-foreground/80">
                      {order.status === 'filled' ? order.amount.toFixed(2) : order.remaining_amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                {orderBook.asks.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                    No sell orders
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground px-2 sticky top-0 bg-background z-10">
              <span>POSITION</span>
              <span>PRICE</span>
              <span>SHARES</span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
              <div className="space-y-[2px] relative max-h-[300px] overflow-y-auto custom-scrollbar">
                {orderBook.bids.map((order, index) => (
                  <div
                    key={order.id}
                    className={`flex justify-between text-sm py-2 px-3 rounded-lg transition-colors group ${
                      order.status === 'filled' ? 'bg-green-500/5' : 'hover:bg-green-500/10'
                    }`}
                    style={{ 
                      backgroundColor: order.status === 'filled' 
                        ? `rgba(34, 197, 94, 0.05)` 
                        : `rgba(34, 197, 94, ${0.02 + (0.01 * Math.min(5, index))})` 
                    }}
                  >
                    <span className="font-medium text-foreground/80 uppercase">
                      {order.position}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-green-500 group-hover:text-green-600">
                        {order.price !== null ? order.price.toFixed(2) : 'N/A'}
                      </span>

                    </div>
                    <span className="font-medium text-foreground/80">
                      {order.status === 'filled' ? order.amount.toFixed(2) : order.remaining_amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                {orderBook.bids.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                    No buy orders
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

const crypto = window.crypto || (window as any).msCrypto;
