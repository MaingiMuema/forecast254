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
import { Position } from '@/lib/database';

export default function Portfolio() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPositions() {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('positions')
          .select(`
            *,
            market:markets(title, status)
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        setPositions(data || []);
      } catch (error) {
        console.error('Error loading positions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPositions();
  }, [user?.id]);

  const calculateTotalValue = (shares: number, avgPrice: number) => {
    return shares * avgPrice;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Portfolio</h2>
        <p className="text-muted-foreground">
          View and manage your market positions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Total Positions
          </h3>
          <p className="text-2xl font-bold">{positions.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Active Markets
          </h3>
          <p className="text-2xl font-bold">
            {positions.filter(p => p.market?.status === 'open').length}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Total Value
          </h3>
          <p className="text-2xl font-bold">
            KES{' '}
            {positions
              .reduce(
                (sum, p) => sum + calculateTotalValue(p.shares, p.average_price),
                0
              )
              .toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Realized P/L
          </h3>
          <p className="text-2xl font-bold">
            KES{' '}
            {positions
              .reduce((sum, p) => sum + (p.realized_pnl || 0), 0)
              .toLocaleString()}
          </p>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Market</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Shares</TableHead>
              <TableHead>Avg. Price</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Realized P/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading positions...
                </TableCell>
              </TableRow>
            ) : positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No positions found. Start trading to build your portfolio!
                </TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell>{position.market?.title}</TableCell>
                  <TableCell className="capitalize">
                    {position.position_type}
                  </TableCell>
                  <TableCell>{position.shares.toLocaleString()}</TableCell>
                  <TableCell>
                    KES {position.average_price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    KES{' '}
                    {calculateTotalValue(
                      position.shares,
                      position.average_price
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize">
                    {position.market?.status}
                  </TableCell>
                  <TableCell>
                    KES {(position.realized_pnl || 0).toLocaleString()}
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
