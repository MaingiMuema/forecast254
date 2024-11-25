/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
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
  position_type: 'yes' | 'no';
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
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [side, setSide] = useState<OrderSide>('buy');
  const [position, setPosition] = useState<Position>('yes');
  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [market, setMarket] = useState<any>(null);
  const [userPositions, setUserPositions] = useState<{ yes: number; no: number }>({ yes: 0, no: 0 });
  const [lastTradePrice, setLastTradePrice] = useState<number | null>(null);

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

  const fetchOrderBook = async () => {
    try {
      // Fetch asks (sell orders)
      const { data: asks, error: asksError } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('side', 'sell')
        .eq('status', 'open')
        .order('created_at', { ascending: false });  // Latest first

      if (asksError) throw asksError;

      // Fetch bids (buy orders)
      const { data: bids, error: bidsError } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('side', 'buy')
        .eq('status', 'open')
        .order('created_at', { ascending: false });  // Latest first

      if (bidsError) throw bidsError;

      setOrderBook({
        asks: asks || [],
        bids: bids || []
      });
    } catch (error) {
      console.error('Error fetching order book:', error);
      toast.error('Failed to fetch order book');
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
      // Get all filled/partial orders and open sell orders for this user in this market
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('user_id', user.id)
        .or('status.in.(filled,partial),and(status.eq.open,side.eq.sell)')
        .order('created_at', { ascending: true });
      
      console.log('User filled/partially orders:', orders);

      if (error) throw error;

      // Calculate net positions from orders
      const positions = (orders || []).reduce((acc, order) => {
        let positionChange = 0;
        
        if (order.status === 'open') {
          // For open sell orders, subtract the remaining amount
          positionChange = -order.remaining_amount;
        } else {
          // For filled/partial orders, use filled_amount with buy/sell direction
          positionChange = order.filled_amount * (order.side === 'buy' ? 1 : -1);
        }

        console.log('Processing order:', {
          position: order.position,
          status: order.status,
          filled_amount: order.filled_amount,
          remaining_amount: order.remaining_amount,
          side: order.side,
          positionChange,
          currentAccumulator: acc
        });
        
        acc[order.position] = (acc[order.position] || 0) + positionChange;
        return acc;
      }, { yes: 0, no: 0 } as { yes: number; no: number });

      console.log('Final positions:', positions);

      setUserPositions(positions);
    } catch (error) {
      console.error('Error fetching user positions:', error);
      toast.error('Failed to fetch your positions');
    }
  };

  const validateOrder = () => {
    if (side === 'sell') {
      const availableShares = userPositions[position];
      const sellingAmount = Number(amount);
      
      if (sellingAmount > availableShares) {
        toast.error(`Insufficient shares. You only have ${availableShares} ${position.toUpperCase()} shares available.`);
        return false;
      }
    }
    return true;
  };

  const getEffectivePrice = () => {
    if (orderType === 'limit') {
      return Number(price);
    }
    
    // For market orders, use last trade price if available, otherwise calculate from probability
    if (lastTradePrice !== null) {
      return lastTradePrice;
    }
    
    // Calculate price from probability
    const probability = position === 'yes' 
      ? (market?.probability_yes || 0.5)
      : (market?.probability_no || 0.5);
    
    return calculateSharePrice(probability);
  };

  const fetchLastTradePrice = async () => {
    if (!marketId) return null;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('price')
        .eq('market_id', marketId)
        .eq('status', 'filled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching last trade price:', error);
        return null;
      }

      return data?.price || null;
    } catch (error) {
      console.error('Error in fetchLastTradePrice:', error);
      return null;
    }
  };

  useEffect(() => {
    const getLastTradePrice = async () => {
      const price = await fetchLastTradePrice();
      setLastTradePrice(price);
    };
    getLastTradePrice();
  }, [marketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to place orders');
      return;
    }

    if (!validateOrder()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const currentPrice = await fetchLastTradePrice();
      const effectivePrice = currentPrice || getEffectivePrice();
      
      const response = await fetch('/api/markets/trade/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          market_id: marketId,
          order_type: orderType,
          side,
          position,
          price: Number(price),
          amount: Number(amount),
          market_price: effectivePrice
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Clear form
      setAmount('');
      
      // Reset price to current market price
      if (market) {
        const probability = position === 'yes' 
          ? market.probability_yes 
          : market.probability_no;
        const marketPrice = calculateSharePrice(probability);
        setPrice(marketPrice.toString());
      }
      
      // Show success message
      toast.success(`${side === 'buy' ? 'Buy' : 'Sell'} order placed successfully`);
      
      // Update local state
      setUserBalance(data.balance);
      
      // Refresh last trade price
      const newLastTradePrice = await fetchLastTradePrice();
      setLastTradePrice(newLastTradePrice);
      
    } catch (error: any) {
      console.error('Error placing order:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSuggestedPrice = () => {
    if (!market) return null;
    const probability = position === 'yes' ? market.probability_yes : market.probability_no;
    return calculateSharePrice(probability);
  };

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!user) return;
    
    fetchUserPositions();
  }, [user, marketId]);

  useEffect(() => {
    const suggestedPrice = getSuggestedPrice();
    if (suggestedPrice !== null) {
      setPrice(suggestedPrice.toString());
    }
  }, [position]);

  useEffect(() => {
    if (market && orderType === 'market') {
      // Use last trade price if available
      if (lastTradePrice !== null) {
        setPrice(lastTradePrice.toString());
        return;
      }

      const probability = position === 'yes' 
        ? (market.probability_yes || 0.5)
        : (market.probability_no || 0.5);
      
      const marketPrice = calculateSharePrice(probability);
      setPrice(marketPrice.toString());
    }
  }, [market, position, orderType, lastTradePrice]);

  function generateUUID() {
    // Generate 16 random bytes
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    
    // Set version (4) and variant (2) bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;  // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80;  // variant 2
    
    // Convert to hex string with proper UUID format
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

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
      
      // Update price immediately after getting market data
      if (data && orderType === 'market') {
        // Use last trade price if available
        if (lastTradePrice !== null) {
          setPrice(lastTradePrice.toString());
        } else {
          const probability = position === 'yes' 
            ? (data.probability_yes || 0.5)
            : (data.probability_no || 0.5);
          const marketPrice = calculateSharePrice(probability);
          setPrice(marketPrice.toString());
        }
      }
    };

    fetchMarket();
  }, [marketId, orderType, position, lastTradePrice]);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Trading Form Section */}
      <div className="mb-8 relative">
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
            {/* Order Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground/80">Order Type</label>
              <select
                value={orderType}
                onChange={(e) => {
                  const newOrderType = e.target.value as OrderType;
                  setOrderType(newOrderType);
                  
                  // For market orders, set price to current market price
                  if (newOrderType === 'market' && market) {
                    const probability = position === 'yes' 
                      ? (market.probability_yes || 0.5)
                      : (market.probability_no || 0.5);
                    const marketPrice = calculateSharePrice(probability);
                    setPrice(marketPrice.toString());
                  } else if (newOrderType === 'limit') {
                    // For limit orders, set to suggested price as default
                    const suggestedPrice = getSuggestedPrice();
                    if (suggestedPrice !== null) {
                      setPrice(suggestedPrice.toString());
                    }
                  }
                }}
                className="w-full p-3.5 rounded-xl border border-border/50 bg-background/80 hover:bg-background/90 hover:border-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer backdrop-blur-sm"
              >
                <option value="limit">Limit Order</option>
                <option value="market">Market Order</option>
              </select>
            </div>

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
                          {(market.probability_yes || 0.5) * 100}% 
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
                          {(market.probability_no || 0.5) * 100}% 
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Price Input (Show for both limit and market orders, but readonly for market) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground/80">Price (KES)</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    if (orderType === 'limit') {
                      setPrice(e.target.value);
                      if (market && e.target.value) {
                        const newProbability = calculateProbability(Number(e.target.value));
                        if (position === 'yes') {
                          market.probability_yes = newProbability;
                          market.yes_price = Number(e.target.value);
                        } else {
                          market.probability_no = newProbability;
                          market.no_price = Number(e.target.value);
                        }
                        setMarket({...market});
                      }
                    }
                  }}
                  readOnly={orderType === 'market'}
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  className={`w-full p-3.5 rounded-xl border border-border/50 bg-background/80 hover:bg-background/90 hover:border-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 pr-24 backdrop-blur-sm ${orderType === 'market' ? 'cursor-not-allowed opacity-75' : ''}`}
                  placeholder="0.00"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-background/90 text-xs font-medium text-muted-foreground/80">
                  KES
                </div>
              </div>
              {market && (
                <div className="flex items-center justify-between text-xs text-muted-foreground/80">
                  <span>Market Price: {getSuggestedPrice()?.toFixed(2)} KES</span>
                  <span>Probability: {((position === 'yes' ? market.probability_yes : market.probability_no) * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/*Share Amount Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground/80">Share Amount</label>
                <div className="flex flex-col items-end text-xs text-muted-foreground/80">
                  {side === 'sell' && (
                    <span>Available: {userPositions[position]} {position.toUpperCase()} shares</span>
                  )}
                  {market && side === 'buy' && (
                    <span>
                      Max: {Math.floor(userBalance! / (position === 'yes' ? (market.probability_yes || 0.5) : (market.probability_no || 0.5)))} shares
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
              {market && price && amount && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground/80">
                    Total Cost: {(Number(price) * Number(amount)).toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                  </span>
                  <span className={`font-medium ${userBalance! >= Number(price) * Number(amount) ? 'text-green-500' : 'text-red-500'}`}>
                    {userBalance! >= Number(price) * Number(amount) ? 'Sufficient Balance' : 'Insufficient Balance'}
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || (market && userBalance! < Number(price) * Number(amount))}
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

      {/* Order Book Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Order Book</h2>
            <p className="text-xs text-muted-foreground mt-1">Live market depth</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
            Top 5 Orders
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Asks (Sell Orders) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground px-2">
              <span>PRICE</span>
              <span>SHARES</span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
              <div className="space-y-[2px] relative">
                {orderBook.asks.slice(0, 5).map((order, index) => (
                  <div
                    key={order.id}
                    className="flex justify-between text-sm py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors group"
                    style={{ backgroundColor: `rgba(239, 68, 68, ${0.02 + (0.01 * (5 - index))})` }}
                  >
                    <span className="font-medium text-red-500 group-hover:text-red-600">{order.price !== null ? order.price.toFixed(2) : 'N/A'}</span>
                    <span className="font-medium text-foreground/80">{order.remaining_amount.toFixed(2)}</span>
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
            <div className="flex justify-between text-xs font-semibold text-muted-foreground px-2">
              <span>PRICE</span>
              <span>SHARES</span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
              <div className="space-y-[2px] relative">
                {orderBook.bids.slice(0, 5).map((order, index) => (
                  <div
                    key={order.id}
                    className="flex justify-between text-sm py-2 px-3 rounded-lg hover:bg-green-500/10 transition-colors group"
                    style={{ backgroundColor: `rgba(34, 197, 94, ${0.02 + (0.01 * (5 - index))})` }}
                  >
                    <span className="font-medium text-green-500 group-hover:text-green-600">{order.price !== null ? order.price.toFixed(2) : 'N/A'}</span>
                    <span className="font-medium text-foreground/80">{order.remaining_amount.toFixed(2)}</span>
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
    </div>
  );
}

const crypto = window.crypto || (window as any).msCrypto;
