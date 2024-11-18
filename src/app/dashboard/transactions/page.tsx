'use client';

import { useState } from 'react';
import { FaSearch, FaFilter, FaDownload } from 'react-icons/fa';

const TRANSACTIONS = [
  {
    id: 1,
    type: 'market',
    amount: 1000,
    date: '2024-01-15',
    status: 'completed',
    description: 'Bought YES shares - Kenya Tech Growth 2024',
    marketId: 'KE-TECH-2024',
  },
  {
    id: 2,
    type: 'deposit',
    amount: 5000,
    date: '2024-01-14',
    status: 'completed',
    description: 'M-PESA Deposit',
  },
  {
    id: 3,
    type: 'market',
    amount: -500,
    date: '2024-01-13',
    status: 'completed',
    description: 'Sold NO shares - Nairobi Housing Prices Q1',
    marketId: 'NBO-HOUSE-Q1',
  },
  {
    id: 4,
    type: 'withdrawal',
    amount: -2000,
    date: '2024-01-12',
    status: 'completed',
    description: 'M-PESA Withdrawal',
  },
];

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredTransactions = TRANSACTIONS.filter(transaction => {
    if (filter !== 'all' && transaction.type !== filter) return false;
    if (searchQuery && !transaction.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
          <button className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
            <FaFilter className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg border border-border hover:bg-accent transition-colors">
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
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                  <td className="p-4">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      {transaction.marketId && (
                        <p className="text-sm text-muted-foreground">ID: {transaction.marketId}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${transaction.type === 'market' ? 'bg-blue-500/10 text-blue-500' : 
                        transaction.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 
                        'bg-red-500/10 text-red-500'}`}
                    >
                      {transaction.type}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
