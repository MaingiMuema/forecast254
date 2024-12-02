/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MarketResolutionPanelProps {
  marketId: string;
  marketTitle: string;
  onResolutionComplete?: () => void;
}

export default function MarketResolutionPanel({ 
  marketId, 
  marketTitle,
  onResolutionComplete 
}: MarketResolutionPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);

  const handleResolveMarket = async () => {
    if (selectedOutcome === null) {
      toast.error('Please select an outcome');
      return;
    }

    setIsResolving(true);
    try {
      const response = await fetch('/api/market/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          marketId,
          outcome: selectedOutcome 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve market');
      }

      toast.success('Market resolved successfully');
      setIsDialogOpen(false);
      onResolutionComplete?.();

    } catch (error) {
      console.error('Error resolving market:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resolve market');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsDialogOpen(true)}
        className="inline-flex items-center space-x-2"
      >
        <FiCheck className="w-4 h-4" />
        <span>Resolve Market</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Market</DialogTitle>
            <DialogDescription>
              {marketTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Select Outcome
              </h3>
              <div className="flex space-x-4">
                <Button
                  variant={selectedOutcome === true ? "default" : "outline"}
                  onClick={() => setSelectedOutcome(true)}
                  className="flex-1"
                >
                  Yes
                </Button>
                <Button
                  variant={selectedOutcome === false ? "default" : "outline"}
                  onClick={() => setSelectedOutcome(false)}
                  className="flex-1"
                >
                  No
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Important Notice
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <div>
                      Resolving this market will:
                      <ul className="list-disc list-inside mt-1">
                        <li>Determine winners and losers</li>
                        <li>Distribute funds to winning positions</li>
                        <li>Close the market permanently</li>
                      </ul>
                      <p className="mt-2">This action cannot be undone.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isResolving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolveMarket}
                disabled={selectedOutcome === null || isResolving}
              >
                {isResolving ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                    Resolving...
                  </>
                ) : (
                  'Confirm Resolution'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
