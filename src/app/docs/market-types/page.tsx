'use client';

import React from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaListUl, FaChartLine, FaClock } from 'react-icons/fa';

const MarketTypesPage = () => {
  const marketTypes = [
    {
      icon: FaCheckCircle,
      title: 'Binary Markets',
      description: `Binary markets have exactly two possible outcomes: Yes or No. These are the simplest form of 
      prediction markets and are ideal for events with clear, binary outcomes.`,
      examples: [
        'Will candidate X win the election?',
        'Will it rain tomorrow in Nairobi?',
        'Will Team A win against Team B?',
      ],
      features: [
        'Simple Yes/No outcomes',
        'Easy to understand pricing',
        'Quick settlement process',
        'Ideal for beginners',
      ],
    },
    {
      icon: FaListUl,
      title: 'Multiple Choice Markets',
      description: `Multiple choice markets allow trading on events with several possible outcomes. These markets 
      are perfect for scenarios where there are more than two possible results.`,
      examples: [
        'Which team will win the tournament?',
        'Who will be the next party leader?',
        'Which city will host the next event?',
      ],
      features: [
        'Multiple outcome options',
        'Complex probability distributions',
        'Higher potential returns',
        'Suitable for detailed analysis',
      ],
    },
    {
      icon: FaChartLine,
      title: 'Numeric Range Markets',
      description: `Numeric range markets allow predictions on numerical outcomes within a specified range. These 
      markets are ideal for financial metrics, statistics, and other quantifiable outcomes.`,
      examples: [
        'What will be the GDP growth rate?',
        'How many goals will be scored?',
        'What will be the closing price?',
      ],
      features: [
        'Continuous price curves',
        'Precise predictions',
        'Scalar outcome resolution',
        'Advanced trading mechanics',
      ],
    },
    {
      icon: FaClock,
      title: 'Time-Based Markets',
      description: `Time-based markets focus on when an event will occur. These markets are particularly useful 
      for project deadlines, launch dates, and other time-sensitive predictions.`,
      examples: [
        'When will the project launch?',
        'Which quarter will the milestone be reached?',
        'Date of the next major announcement?',
      ],
      features: [
        'Temporal predictions',
        'Dynamic time windows',
        'Early resolution potential',
        'Time-weighted scoring',
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
          <span>Market Types</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Market Types</h1>
          
          <p className="lead">
            Forecast254 offers various types of prediction markets to accommodate different kinds of events
            and prediction scenarios. Understanding these market types will help you choose the right
            markets for your trading strategy.
          </p>

          {marketTypes.map((market, index) => (
            <section key={index} className="mb-12">
              <div className="not-prose flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <market.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">{market.title}</h2>
              </div>
              
              <p>{market.description}</p>
              
              <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Example Markets</h3>
                  <ul className="space-y-2">
                    {market.examples.map((example, exIndex) => (
                      <li key={exIndex} className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Key Features</h3>
                  <ul className="space-y-2">
                    {market.features.map((feature, featIndex) => (
                      <li key={featIndex} className="flex items-center">
                        <span className="text-primary mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}

          <h2>Choosing the Right Market</h2>
          <p>
            When selecting a market to trade in, consider:
          </p>
          <ul>
            <li>The nature of the event you want to predict</li>
            <li>Your understanding of the market mechanics</li>
            <li>The available data and research resources</li>
            <li>Your risk tolerance and trading strategy</li>
          </ul>

          <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Ready to Start Trading?</h3>
            <p>
              Now that you understand the different market types, check out our{' '}
              <Link href="/docs/trading" className="text-primary hover:text-primary/80">
                Trading Guide
              </Link>{' '}
              to learn how to place trades and manage your positions effectively.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default MarketTypesPage;
