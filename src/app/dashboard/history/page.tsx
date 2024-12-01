'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Transaction } from '@/lib/database';
import { format } from 'date-fns';

interface Market {
  title: string;
}

interface TransactionWithMarket extends Transaction {
  market: Market;
}

interface ExtendedTransaction extends TransactionWithMarket {
  total: number;
}

interface RawTransaction extends Transaction {
  market: { title: string }[];
}

export default function History() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!user) return;

        const { data: rawData, error } = await supabase
          .from('transactions')
          .select(`
            *,
            market:markets(title)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform and validate the data
        const transformedData = (rawData as RawTransaction[] || []).map(transaction => {
          const amount = transaction.amount || 0;
          const price = transaction.price || 0;
          const marketTitle = transaction.market?.[0]?.title || '-';
          
          const extendedTransaction: ExtendedTransaction = {
            ...transaction,
            market: { title: marketTitle },
            total: amount * price
          };

          return extendedTransaction;
        });

        setTransactions(transformedData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>
        <p className="text-muted-foreground">
          View all your past transactions and their status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Total Transactions
          </h3>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Total Volume
          </h3>
          <p className="text-2xl font-bold">
            KES{' '}
            {transactions
              .reduce((sum, t) => sum + Math.abs(t.total), 0)
              .toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Completed Transactions
          </h3>
          <p className="text-2xl font-bold">
            {
              transactions.filter((t) => t.status === 'completed').length
            }
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Pending Transactions
          </h3>
          <p className="text-2xl font-bold">
            {transactions.filter((t) => t.status === 'pending').length}
          </p>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>M-Pesa Ref</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(
                      new Date(transaction.created_at),
                      'MMM d, yyyy HH:mm'
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {transaction.transaction_type}
                  </TableCell>
                  <TableCell>
                    {transaction.market.title}
                  </TableCell>
                  <TableCell>
                    KES {Math.abs(transaction.total).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {transaction.shares?.toLocaleString() || '-'}
                  </TableCell>
                  <TableCell>
                    {transaction.price
                      ? `KES ${transaction.price.toLocaleString()}`
                      : '-'}
                  </TableCell>
                  <TableCell>{transaction.mpesa_reference || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
