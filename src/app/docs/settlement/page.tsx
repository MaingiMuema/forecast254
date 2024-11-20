'use client';

import React from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaExclamationTriangle, FaBalanceScale, FaCoins } from 'react-icons/fa';

const SettlementPage = () => {
  const stages = [
    {
      icon: FaCheckCircle,
      title: 'Market Resolution',
      description: `When a market reaches its end date or the event occurs, it enters the resolution phase. 
      Our system automatically checks the specified resolution sources to determine the outcome.`,
      points: [
        'Automatic outcome verification',
        'Multiple data source validation',
        'Transparent resolution criteria',
        'Real-time status updates',
      ],
    },
    {
      icon: FaExclamationTriangle,
      title: 'Dispute Period',
      description: `After initial resolution, there is a 24-hour dispute period where traders can challenge 
      the outcome if they believe it's incorrect. This ensures fair and accurate market resolution.`,
      points: [
        'Clear dispute process',
        'Evidence submission system',
        'Community review mechanism',
        'Timely resolution timeline',
      ],
    },
    {
      icon: FaBalanceScale,
      title: 'Final Settlement',
      description: `Once the dispute period ends without challenges (or after dispute resolution), the market 
      enters final settlement. The outcome is locked, and the settlement process begins.`,
      points: [
        'Irreversible outcome confirmation',
        'Position settlement calculations',
        'Fee distribution processing',
        'Historical record creation',
      ],
    },
    {
      icon: FaCoins,
      title: 'Profit Distribution',
      description: `After final settlement, profits are automatically distributed to winning positions. Funds 
      become available in traders's accounts immediately for withdrawal or reinvestment.`,
      points: [
        'Automatic profit calculation',
        'Instant fund distribution',
        'Transaction record generation',
        'Withdrawal availability',
      ],
    },
  ];

  const disputeGuidelines = [
    'Submit disputes within 24 hours of initial resolution',
    'Provide clear evidence supporting your claim',
    'Reference specific market rules and resolution criteria',
    'Follow the formal dispute submission process',
    'Await confirmation of dispute receipt',
    'Participate in the resolution process if required',
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
          <span>Settlement Process</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Settlement Process</h1>
          
          <p className="lead">
            Understanding how markets are settled is crucial for traders. Our settlement process is designed 
            to be transparent, fair, and efficient, ensuring accurate outcome resolution and timely profit distribution.
          </p>

          {stages.map((stage, index) => (
            <section key={index} className="mb-12">
              <div className="not-prose flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <stage.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">{stage.title}</h2>
              </div>
              
              <p>{stage.description}</p>
              
              <div className="not-prose bg-card border border-border rounded-lg p-6 mt-4">
                <h3 className="font-semibold mb-4">Key Points</h3>
                <ul className="space-y-2">
                  {stage.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-center">
                      <span className="text-primary mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <h2>Dispute Guidelines</h2>
          <div className="not-prose bg-card border border-border rounded-lg p-6 mt-4">
            <ul className="space-y-3">
              {disputeGuidelines.map((guideline, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-primary mr-2">{index + 1}.</span>
                  {guideline}
                </li>
              ))}
            </ul>
          </div>

          <h2>Resolution Sources</h2>
          <p>
            Markets use different resolution sources depending on their type:
          </p>
          <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Primary Sources</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-primary mr-2">•</span>
                  Official announcements
                </li>
                <li className="flex items-center">
                  <span className="text-primary mr-2">•</span>
                  Verified news sources
                </li>
                <li className="flex items-center">
                  <span className="text-primary mr-2">•</span>
                  Government data
                </li>
              </ul>
            </div>
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Secondary Sources</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-primary mr-2">•</span>
                  Industry reports
                </li>
                <li className="flex items-center">
                  <span className="text-primary mr-2">•</span>
                  Expert analysis
                </li>
                <li className="flex items-center">
                  <span className="text-primary mr-2">•</span>
                  Market data feeds
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Need More Information?</h3>
            <p>
              For specific questions about market resolution or the dispute process, contact our{' '}
              <Link href="/docs/support" className="text-primary hover:text-primary/80">
                support team
              </Link>
              . You can also review our detailed{' '}
              <Link href="/docs/market-rules" className="text-primary hover:text-primary/80">
                market rules
              </Link>
              .
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default SettlementPage;
