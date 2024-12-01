/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { withRoleAccess } from '@/components/Auth/withRoleAccess';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiEye, FiAlertTriangle, FiDollarSign, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

type Market = Database['public']['Tables']['markets']['Row'];

interface MarketList {
  id: string;
  title: string | null;
  description: string | null;
  category: string;
  active: boolean;
  created_at: string;
  status: string;
  closing_date: string | null;
}

interface ValidatorStats {
  totalMarkets: number;
  activeMarkets: number;
  pendingMarkets: number;
  totalVolume: number;
  totalTrades: number;
}

function ValidatorDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ValidatorStats>({
    totalMarkets: 0,
    activeMarkets: 0,
    pendingMarkets: 0,
    totalVolume: 0,
    totalTrades: 0,
  });
  const [markets, setMarkets] = useState<MarketList[]>([]);
  const [updatingMarkets, setUpdatingMarkets] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMarkets();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total markets count
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select('id, active');

      if (marketsError) throw marketsError;

      // Get orders data for volume and trades calculation
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('price, amount, filled_amount, status')
        .not('status', 'eq', 'cancelled'); // Exclude cancelled orders

      if (ordersError) throw ordersError;
      
      // Calculate total market value from orders
      const totalVolume = orders?.reduce((sum, order) => {
        // Use filled_amount for executed orders, otherwise use the original amount
        const orderAmount = order.filled_amount || order.amount || 0;
        return sum + (orderAmount * (order.price || 0));
      }, 0) || 0;

      const totalTrades = orders?.length || 0;
      const activeMarkets = marketsData?.filter(m => m.active).length || 0;
      const totalMarkets = marketsData?.length || 0;

      setStats({
        totalMarkets,
        activeMarkets,
        pendingMarkets: totalMarkets - activeMarkets,
        totalVolume,
        totalTrades
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      toast.error('Failed to fetch statistics');
    }
  };

  const fetchMarkets = async () => {
    setIsLoading(true);
    try {
      // First get the markets data
      const { data: markets, error } = await supabase
        .from('markets')
        .select(`
          id,
          title,
          description,
          category,
          active,
          created_at,
          status,
          closing_date
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (markets) {
        setMarkets(markets);
        
        // Update active and pending market counts in stats
        const activeMarkets = markets.filter(m => m.active).length;
        setStats(prev => ({
          ...prev,
          activeMarkets,
          pendingMarkets: markets.length - activeMarkets
        }));
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch markets');
      toast.error('Failed to fetch markets');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMarketStatus = async (marketId: string, newStatus: boolean) => {
    setUpdatingMarkets(prev => ({ ...prev, [marketId]: true }));
    try {
      const { error } = await supabase
        .from('markets')
        .update({ 
          active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', marketId);

      if (error) {
        if (error.code === 'PGRST301') {
          throw new Error('You do not have permission to update market status');
        }
        throw new Error(error.message || 'Failed to update market status');
      }

      toast.success(`Market ${newStatus ? 'activated' : 'deactivated'} successfully`);
      
      // Refresh data
      await Promise.all([fetchMarkets(), fetchStats()]);
    } catch (err) {
      console.error('Error updating market status:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update market status');
    } finally {
      setUpdatingMarkets(prev => ({ ...prev, [marketId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Market Validation Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage and validate prediction markets
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg flex items-center">
            <FiAlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiActivity className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Markets</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalMarkets}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiDollarSign className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Volume</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats.totalVolume.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiActivity className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Trades</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalTrades}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Market
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Closing Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {markets.map((market) => (
                  <tr key={market.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{market.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{market.description?.slice(0, 100)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {market.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        market.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {market.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {market.closing_date ? new Date(market.closing_date).toLocaleDateString() : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => updateMarketStatus(market.id, !market.active)}
                        disabled={updatingMarkets[market.id]}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white ${
                          market.active
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
                          updatingMarkets[market.id] ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {updatingMarkets[market.id] ? (
                          <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                        ) : market.active ? (
                          <FiX className="w-4 h-4 mr-2" />
                        ) : (
                          <FiCheck className="w-4 h-4 mr-2" />
                        )}
                        {market.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRoleAccess(ValidatorDashboard, ['admin', 'validator']);
