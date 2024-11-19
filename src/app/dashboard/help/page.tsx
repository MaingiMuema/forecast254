'use client';

import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Help Center</h1>

      <div className="grid gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is-forecast254">
              <AccordionTrigger>What is Forecast254?</AccordionTrigger>
              <AccordionContent>
                Forecast254 is a prediction market platform where users can trade on the outcomes of future events. 
                Users can buy and sell shares in markets, with prices reflecting the probability of different outcomes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-to-trade">
              <AccordionTrigger>How do I start trading?</AccordionTrigger>
              <AccordionContent>
                1. Browse available markets on the dashboard
                2. Click on a market to view details
                3. Use your wallet balance to buy shares
                4. Sell shares anytime before market resolution
                5. Profit if your prediction is correct!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="wallet">
              <AccordionTrigger>How does the wallet system work?</AccordionTrigger>
              <AccordionContent>
                Your wallet holds your available balance for trading. You can:
                - Add funds through M-Pesa
                - View your transaction history
                - Withdraw your earnings
                - Monitor your current balance
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="market-resolution">
              <AccordionTrigger>How are markets resolved?</AccordionTrigger>
              <AccordionContent>
                Markets are resolved based on real-world outcomes. When an event concludes:
                1. The outcome is verified using trusted sources
                2. Winning positions are automatically paid out
                3. The market is marked as resolved
                4. Results are recorded in your history
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="leaderboard">
              <AccordionTrigger>How does the leaderboard work?</AccordionTrigger>
              <AccordionContent>
                The leaderboard ranks traders based on:
                - Total profit/loss
                - Number of trades
                - Win rate
                - Trading volume
                Rankings are updated regularly to reflect recent performance.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Need More Help?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            If you can&apos;t find the answer you&apos;re looking for, our support team is here to help.
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-gray-600 dark:text-gray-400">
                support@forecast254.com
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Business Hours</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monday - Friday: 9:00 AM - 6:00 PM EAT
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
