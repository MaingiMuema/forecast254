/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { withRoleAccess } from '@/components/Auth/withRoleAccess';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useState, useEffect } from 'react';
import { FiUsers, FiCheckCircle, FiShield, FiActivity, FiDollarSign, FiTrendingUp, FiEye, FiClock } from 'react-icons/fi';
import { analyticsService, AnalyticsData } from '@/lib/analytics';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  last_sign_in_at?: string | null;
};

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalMarketValue: number;
  validatorsCount: number;
  adminsCount: number;
  analytics?: AnalyticsData;
}

function AdminDashboard() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalMarketValue: 0,
    validatorsCount: 0,
    adminsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: orders } = await supabase
        .from('orders')
        .select('price, amount, filled_amount')
        .not('status', 'eq', 'cancelled'); // Exclude cancelled orders
      
      const validatorsCount = profiles?.filter(p => p.role === 'validator').length || 0;
      const adminsCount = profiles?.filter(p => p.role === 'admin').length || 0;

      // Fetch analytics data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      const analytics = await analyticsService.getAnalytics(startDate, endDate);

      // Calculate total market value safely handling null values
      const totalMarketValue = orders?.reduce((sum, order) => {
        const price = order.price || 0;
        const filledAmount = order.filled_amount || 0;
        return sum + (price * filledAmount);
      }, 0) || 0;

      // Consider users active if they've updated their profile in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeUsers = profiles?.filter(p => {
        const lastUpdate = new Date(p.updated_at);
        return lastUpdate >= thirtyDaysAgo;
      }).length || 0;

      setStats({
        totalUsers: profiles?.length || 0,
        activeUsers,
        totalTransactions: orders?.length || 0,
        totalMarketValue,
        validatorsCount,
        adminsCount,
        analytics,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: Profile['role']) => {
    // Don't allow self-role modification
    if (userId === user?.id) {
      setError("You cannot modify your own role");
      return;
    }

    // Prevent concurrent updates for the same user
    if (updatingRoles[userId]) {
      return;
    }

    try {
      setError(null);
      setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
      console.log(`Attempting to update user ${userId} to role: ${newRole}`);

      // Call the database function to update the role
      const { data: updateSuccess, error: updateError } = await supabase
        .rpc('update_user_role', {
          new_role: newRole,
          user_id: userId
        });

      if (updateError) {
        console.error('Error updating role:', updateError);
        throw updateError;
      }

      if (!updateSuccess) {
        throw new Error('Role update failed');
      }

      // Fetch the updated user data
      const { data: updatedUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !updatedUser) {
        console.error('Error fetching updated user:', fetchError);
        throw new Error('Failed to fetch updated user data');
      }

      console.log('Update successful:', updatedUser);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? updatedUser : u
        )
      );

      // Update stats
      const roleChange = {
        from: updatedUser.role,
        to: newRole
      };

      setStats(prev => {
        const newStats = { ...prev };
        if (roleChange.from === 'validator') newStats.validatorsCount--;
        if (roleChange.from === 'admin') newStats.adminsCount--;
        if (roleChange.to === 'validator') newStats.validatorsCount++;
        if (roleChange.to === 'admin') newStats.adminsCount++;
        return newStats;
      });

    } catch (err) {
      console.error('Role update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user role');
      
      // Revert optimistic update on error
      await fetchUsers();
      await fetchStats();
    } finally {
      setUpdatingRoles(prev => ({ ...prev, [userId]: false }));
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }: { title: string; value: number | string; icon: any; description: string }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 mr-4">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-gray-600 dark:text-gray-400">
          Manage users and monitor platform activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={FiUsers}
          description="Registered platform users"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={FiActivity}
          description="Users active in last 30 days"
        />
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions}
          icon={FiDollarSign}
          description="Number of transactions"
        />
        <StatCard
          title="Market Value"
          value={`KES ${stats.totalMarketValue.toLocaleString()}`}
          icon={FiTrendingUp}
          description="Total market value"
        />
        <StatCard
          title="Validators"
          value={stats.validatorsCount}
          icon={FiCheckCircle}
          description="Active validators"
        />
        <StatCard
          title="Admins"
          value={stats.adminsCount}
          icon={FiShield}
          description="Platform administrators"
        />
      </div>

      {/* Analytics Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Website Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FiEye className="text-blue-500 dark:text-blue-400 text-2xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Page Views</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {new Intl.NumberFormat().format(stats.analytics?.pageViews || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <FiUsers className="text-green-500 dark:text-green-400 text-2xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {new Intl.NumberFormat().format(stats.analytics?.uniqueVisitors || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FiClock className="text-purple-500 dark:text-purple-400 text-2xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Session Duration</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {Math.round(stats.analytics?.averageSessionDuration || 0)}m
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Top Pages</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Page</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.analytics?.topPages.map((page, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{page.path}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-800 dark:text-gray-200">
                        {new Intl.NumberFormat().format(page.views)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user roles and permissions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {profile.avatar_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={profile.avatar_url}
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')}
                          </span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {profile.first_name} {profile.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.phone || 'No phone'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {profile.role === 'admin' && <FiShield className="w-5 h-5 text-red-500" />}
                      {profile.role === 'validator' && <FiCheckCircle className="w-5 h-5 text-emerald-500" />}
                      {profile.role === 'user' && <FiUsers className="w-5 h-5 text-blue-500" />}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">{profile.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user?.id !== profile.id && (
                      <div className="relative">
                        <select
                          value={profile.role}
                          onChange={(e) => updateUserRole(profile.id, e.target.value as Profile['role'])}
                          disabled={updatingRoles[profile.id]}
                          className={`block w-full pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-md ${
                            updatingRoles[profile.id] ? 'opacity-50 cursor-pointer' : ''
                          }`}
                        >
                          <option value="user">User</option>
                          <option value="validator">Validator</option>
                          <option value="admin">Admin</option>
                        </select>
                        {updatingRoles[profile.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-30 rounded-md">
                            <div className="w-5 h-5 border-t-2 border-emerald-500 rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Close</span>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default withRoleAccess(AdminDashboard, ['admin']);
