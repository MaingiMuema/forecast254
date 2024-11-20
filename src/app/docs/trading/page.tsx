'use client';

import React from 'react';
import Link from 'next/link';
import { FaChartLine, FaBalanceScale, FaShieldAlt, FaChartBar } from 'react-icons/fa';

const TradingGuidePage = () => {
  const sections = [
    {
      icon: FaChartLine,
      title: 'Understanding Market Prices',
      content: `Market prices in prediction markets represent the probability of an event occurring. A price of 
      0.75 means the market estimates a 75% chance of the event happening. These probabilities are derived 
      from the collective trading activity of all participants.`,
      tips: [
        'Prices range from 0 to 1 (0% to 100%)',
        'Higher prices indicate higher probability',
        'Watch for price movements over time',
        'Consider market liquidity when trading',
      ],
    },
    {
      icon: FaBalanceScale,
      title: 'Position Sizing',
      content: `Position sizing is crucial for managing risk in prediction markets. Your position size should 
      reflect both your confidence in the prediction and your risk tolerance. Never risk more than you can 
      afford to lose.`,
      tips: [
        'Start with smaller positions',
        'Diversify across different markets',
        'Consider your total portfolio exposure',
        'Use stop-loss orders when available',
      ],
    },
    {
      icon: FaShieldAlt,
      title: 'Risk Management',
      content: `Successful trading requires effective risk management. This includes diversifying your 
      portfolio, setting stop-losses, and never investing more than you can afford to lose. Remember that 
      even high-probability events can sometimes not occur.`,
      tips: [
        'Set clear risk limits',
        'Monitor your total exposure',
        'Keep records of your trades',
        'Learn from both wins and losses',
      ],
    },
    {
      icon: FaChartBar,
      title: 'Analysis Techniques',
      content: `While prediction markets are different from traditional financial markets, many analysis 
      techniques can still be valuable. This includes fundamental analysis of the underlying event, technical 
      analysis of price movements, and sentiment analysis.`,
      tips: [
        'Research the underlying event thoroughly',
        'Monitor relevant news and developments',
        'Track historical price patterns',
        'Consider market sentiment indicators',
      ],
    },
  ];

  const commonMistakes = [
    'Overconfidence in predictions',
    'Not diversifying positions',
    'Ignoring transaction costs',
    'Chasing losses',
    'Trading without proper research',
    'Emotional decision making',
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
          <span>Trading Guide</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Trading Guide</h1>
          
          <p className="lead">
            Learn how to trade effectively on Forecast254&apos;s prediction markets. This guide covers key
            concepts, strategies, and best practices for successful trading.
          </p>

          {sections.map((section, index) => (
            <section key={index} className="mb-12">
              <div className="not-prose flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">{section.title}</h2>
              </div>
              
              <p>{section.content}</p>
              
              <div className="not-prose bg-card border border-border rounded-lg p-6 mt-4">
                <h3 className="font-semibold mb-4">Key Tips</h3>
                <ul className="space-y-2">
                  {section.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-center">
                      <span className="text-primary mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <h2>Common Trading Mistakes to Avoid</h2>
          <div className="not-prose bg-card border border-border rounded-lg p-6 mt-4">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commonMistakes.map((mistake, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-red-500 mr-2">✕</span>
                  {mistake}
                </li>
              ))}
            </ul>
          </div>

          <h2>Advanced Trading Topics</h2>
          <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Link 
              href="/docs/market-mechanics"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold mb-2">Market Mechanics</h3>
              <p className="text-sm text-muted-foreground">
                Deep dive into how our markets work under the hood.
              </p>
            </Link>
            <Link 
              href="/docs/settlement"
              className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold mb-2">Settlement Process</h3>
              <p className="text-sm text-muted-foreground">
                Learn how markets are resolved and rewards distributed.
              </p>
            </Link>
          </div>

          <div className="mt-12 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Practice Makes Perfect</h3>
            <p>
              Consider starting with our paper trading feature to practice without risking real money.
              Once you&apos;re comfortable with the mechanics and have developed a strategy, you can
              transition to real trading.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default TradingGuidePage;
