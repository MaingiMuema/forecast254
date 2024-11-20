/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { FaMoneyBillWave, FaPlus, FaMinus } from 'react-icons/fa';

export default function WalletPage() {
  const [balance, setBalance] = useState(25000); // Demo balance in KES

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-2">
          Manage your funds and transactions
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-4xl font-bold">KES {balance.toLocaleString()}</p>
          </div>
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FaMoneyBillWave className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => {/* Handle deposit */}}
        >
          <FaPlus className="h-5 w-5" />
          <span>Deposit via M-PESA</span>
        </button>
        <button
          className="flex items-center justify-center space-x-2 p-4 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          onClick={() => {/* Handle withdrawal */}}
        >
          <FaMinus className="h-5 w-5" />
          <span>Withdraw to M-PESA</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-4">
          <TransactionItem
            type="deposit"
            amount={5000}
            date="2024-01-15"
            status="completed"
            description="M-PESA Deposit"
          />
          <TransactionItem
            type="withdrawal"
            amount={2000}
            date="2024-01-14"
            status="completed"
            description="M-PESA Withdrawal"
          />
          <TransactionItem
            type="deposit"
            amount={10000}
            date="2024-01-10"
            status="completed"
            description="M-PESA Deposit"
          />
        </div>
      </div>
    </div>
  );
}

function TransactionItem({
  type,
  amount,
  date,
  status,
  description,
}: {
  type: 'deposit' | 'withdrawal';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-emerald-500';
      case 'pending':
        return 'text-amber-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${type === 'deposit' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {type === 'deposit' ? (
            <FaPlus className={`h-4 w-4 ${type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`} />
          ) : (
            <FaMinus className={`h-4 w-4 ${type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`} />
          )}
        </div>
        <div>
          <p className="font-medium">{description}</p>
          <p className="text-sm text-muted-foreground">{new Date(date).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-medium ${type === 'deposit' ? 'text-emerald-500' : 'text-red-500'}`}>
          {type === 'deposit' ? '+' : '-'} KES {amount.toLocaleString()}
        </p>
        <p className={`text-sm ${getStatusColor()}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</p>
      </div>
    </div>
  );
}
