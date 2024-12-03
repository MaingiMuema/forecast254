/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState } from 'react';
import { FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  created_at: string;
  status: string;
  position_type: string | null;
  market_id: string | null;
  mpesa_reference: string | null;
  mpesa_receipt: string | null;
  shares: number | null;
  price: number | null;
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          markets (
            title
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    switch (transaction.transaction_type) {
      case 'market':
        return `${transaction.position_type === 'buy' ? 'Bought' : 'Sold'} ${transaction.shares} shares at ${transaction.price} KES`;
      case 'deposit':
        return transaction.mpesa_receipt 
          ? `M-Pesa Deposit (${transaction.mpesa_receipt})`
          : 'Direct Deposit';
      case 'withdrawal':
        return transaction.mpesa_reference
          ? `M-Pesa Withdrawal (${transaction.mpesa_reference})`
          : 'Direct Withdrawal';
      default:
        return 'Unknown Transaction';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter !== 'all' && transaction.transaction_type !== filter) return false;
    const description = getTransactionDescription(transaction);
    if (searchQuery && !description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const downloadTransactions = () => {
    const csv = [
      ['Date', 'Description', 'Type', 'Amount', 'Status'].join(','),
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        getTransactionDescription(t),
        t.transaction_type,
        t.amount,
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your transaction history
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="market">Market Trades</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
          <button 
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
            onClick={downloadTransactions}
          >
            <FaDownload className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-left p-4 font-medium">Type</th>
                <th className="text-right p-4 font-medium">Amount</th>
                <th className="text-right p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="p-4">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{getTransactionDescription(transaction)}</p>
                        {transaction.market_id && (
                          <p className="text-sm text-muted-foreground">ID: {transaction.market_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${transaction.transaction_type === 'market' ? 'bg-blue-500/10 text-blue-500' : 
                          transaction.transaction_type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 
                          'bg-red-500/10 text-red-500'}`}
                      >
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-medium ${transaction.amount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} KES
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${transaction.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                          transaction.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-red-500/10 text-red-500'}`}
                      >
                        {transaction.status}
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
