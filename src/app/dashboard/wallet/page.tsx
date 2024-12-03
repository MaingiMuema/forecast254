/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'market_order';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  description: string;
}

interface WalletStats {
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingTransactions: number;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<WalletStats>({
    balance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingTransactions: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositMethod, setDepositMethod] = useState<'direct' | 'mpesa'>('direct');
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!user) return;
    fetchWalletData();
  }, [user]);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);

      // Fetch user's balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Fetch recent transactions
      const { data: txns, error: txnsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txnsError) throw txnsError;

      // Calculate wallet stats
      const deposits = txns?.reduce((sum, t) => 
        t.type === 'deposit' && t.status === 'completed' ? sum + t.amount : sum, 0) || 0;
      const withdrawals = txns?.reduce((sum, t) => 
        t.type === 'withdrawal' && t.status === 'completed' ? sum + t.amount : sum, 0) || 0;
      const pending = txns?.filter(t => t.status === 'pending').length || 0;

      setStats({
        balance: profile?.balance || 0,
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
        pendingTransactions: pending
      });
      setTransactions(txns || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || isProcessing) return;
    
    try {
      setIsProcessing(true);
      const amount = parseFloat(depositAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Create transaction record
      const { error: txnError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'deposit',
          amount: amount,
          status: 'completed',
          description: 'Wallet deposit'
        });

      if (txnError) throw txnError;

      // Update user's balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: stats.balance + amount
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Refresh wallet data
      await fetchWalletData();
      setDepositAmount('');
    } catch (error) {
      console.error('Error processing deposit:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMpesaDeposit = async () => {
    if (!depositAmount || !phoneNumber || isProcessing) return;
    
    try {
      setIsProcessing(true);
      const amount = parseFloat(depositAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Validate phone number format (0XXXXXXXXX or +254XXXXXXXXX)
      const phoneRegex = /^(?:0|\+254|254)?([17]\d{8})$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Initiate M-Pesa STK Push
      const response = await fetch('/api/mpesa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to initiate M-Pesa payment');
      }

      toast.success('Check your phone to complete the M-Pesa payment');
      setDepositAmount('');
      setPhoneNumber('');
    } catch (error: any) {
      console.error('Error processing M-Pesa deposit:', error);
      toast.error(error.message || 'Failed to process M-Pesa deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isProcessing) return;
    
    try {
      setIsProcessing(true);
      const amount = parseFloat(withdrawAmount);
      
      if (isNaN(amount) || amount <= 0 || amount > stats.balance) {
        throw new Error('Invalid amount');
      }

      // Create transaction record
      const { error: txnError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'withdrawal',
          amount: amount,
          status: 'completed',
          description: 'Wallet withdrawal'
        });

      if (txnError) throw txnError;

      // Update user's balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          balance: stats.balance - amount
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Refresh wallet data
      await fetchWalletData();
      setWithdrawAmount('');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-800 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        {/* Wallet Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <FaWallet className="text-4xl text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold">Wallet Balance</h2>
              <p className="text-3xl font-bold text-blue-500">
                KES {stats.balance.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400">Total Deposits</p>
              <p className="text-xl font-medium text-green-500">
                +KES {stats.totalDeposits.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Withdrawals</p>
              <p className="text-xl font-medium text-red-500">
                -KES {stats.totalWithdrawals.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending Transactions</p>
              <p className="text-xl font-medium">{stats.pendingTransactions}</p>
            </div>
          </div>
        </motion.div>

        {/* Deposit/Withdraw Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Deposit Funds</h3>
            
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setDepositMethod('direct')}
                className={`px-4 py-2 rounded-lg ${
                  depositMethod === 'direct'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                Direct Deposit
              </button>
              <button
                onClick={() => setDepositMethod('mpesa')}
                className={`px-4 py-2 rounded-lg ${
                  depositMethod === 'mpesa'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                M-Pesa
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount (KES)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                min="0"
              />
            </div>

            {depositMethod === 'mpesa' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 0712345678"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Format: 07XXXXXXXX or +254XXXXXXXXX
                </p>
              </div>
            )}

            <button
              onClick={depositMethod === 'mpesa' ? handleMpesaDeposit : handleDeposit}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FaArrowUp />
                  {depositMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Deposit'}
                </>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Withdraw Funds</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (KES)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  min="0"
                  max={stats.balance}
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={isProcessing || parseFloat(withdrawAmount) > stats.balance}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaArrowDown />
                {isProcessing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <FaHistory className="text-xl text-gray-400" />
            <h3 className="text-xl font-semibold">Recent Transactions</h3>
          </div>

          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-400">No transactions found</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-400">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}KES {tx.amount.toLocaleString()}
                    </p>
                    <p className={`text-sm ${
                      tx.status === 'completed' ? 'text-green-500' : 
                      tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
