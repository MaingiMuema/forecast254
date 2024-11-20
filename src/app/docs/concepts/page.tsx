'use client';

import React from 'react';
import Link from 'next/link';

const CoreConceptsPage = () => {
  const concepts = [
    {
      title: 'Prediction Markets',
      content: `Prediction markets are trading platforms where users can buy and sell shares based on the probability 
      of future events occurring. These markets harness the wisdom of crowds to generate accurate forecasts.`,
      key_points: [
        'Markets represent real-world events',
        'Prices reflect probability estimates',
        'Traders profit from accurate predictions',
      ],
    },
    {
      title: 'Market Types',
      content: `Forecast254 supports various types of prediction markets to accommodate different kinds of events 
      and outcomes.`,
      key_points: [
        'Binary markets (Yes/No outcomes)',
        'Multiple choice markets',
        'Numeric range markets',
        'Time-based markets',
      ],
    },
    {
      title: 'Market Mechanics',
      content: `Understanding how markets work is crucial for successful trading. Our markets use an automated 
      market maker system to ensure liquidity and fair pricing.`,
      key_points: [
        'Automated market maker (AMM)',
        'Liquidity pools',
        'Price impact and slippage',
        'Trading fees and rewards',
      ],
    },
    {
      title: 'Settlement Process',
      content: `When a market reaches its end date or the outcome becomes known, it enters the settlement phase. 
      This process ensures fair and accurate distribution of rewards.`,
      key_points: [
        'Outcome verification',
        'Resolution sources',
        'Reward distribution',
        'Dispute resolution',
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm mb-8">
          <Link href="/docs" className="text-primary hover:text-primary/80">
            Documentation
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span>Core Concepts</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Core Concepts</h1>
          
          <p className="lead">
            Understanding these fundamental concepts will help you navigate Forecast254&apos;s prediction markets
            more effectively and make informed trading decisions.
          </p>

          {concepts.map((concept, index) => (
            <section key={index} className="mb-12">
              <h2>{concept.title}</h2>
              <p>{concept.content}</p>
              
              <div className="not-prose bg-card border border-border rounded-lg p-6 mt-4">
                <h3 className="text-lg font-semibold mb-4">Key Points</h3>
                <ul className="space-y-2">
                  {concept.key_points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-center">
                      <span className="text-primary mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <h2>Advanced Topics</h2>
          <p>
            Ready to dive deeper? Explore these advanced topics:
          </p>
          <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Link 
              href="/docs/market-types"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold mb-2">Market Types</h3>
              <p className="text-sm text-muted-foreground">
                Learn about different market types and their specific characteristics.
              </p>
            </Link>
            <Link 
              href="/docs/trading"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold mb-2">Trading Guide</h3>
              <p className="text-sm text-muted-foreground">
                Master advanced trading strategies and market analysis.
              </p>
            </Link>
          </div>

          <div className="mt-12 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Still Have Questions?</h3>
            <p>
              Check out our{' '}
              <Link href="/docs/faqs" className="text-primary hover:text-primary/80">
                FAQs
              </Link>{' '}
              or join our{' '}
              <Link href="/community" className="text-primary hover:text-primary/80">
                community
              </Link>{' '}
              to discuss with other traders.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default CoreConceptsPage;
