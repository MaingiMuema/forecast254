'use client';

import React from 'react';
import Link from 'next/link';

const IntroductionPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm mb-8">
          <Link href="/docs" className="text-primary hover:text-primary/80">
            Documentation
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span>Introduction</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Introduction to Forecast254</h1>
          
          <p className="lead">
            Forecast254 is a cutting-edge prediction market platform that allows you to trade on future events
            and earn rewards based on your predictions.
          </p>

          <h2>What are Prediction Markets?</h2>
          <p>
            Prediction markets are exchange-traded markets where participants can trade on the outcome of future events.
            The market prices can be interpreted as collective forecasts of the probability of these events occurring.
          </p>

          <h2>Why Forecast254?</h2>
          <ul>
            <li>Trade on a wide variety of markets spanning politics, sports, economics, and more</li>
            <li>Benefit from our transparent and efficient market mechanisms</li>
            <li>Join a community of forward-thinking predictors</li>
            <li>Access advanced trading tools and analytics</li>
          </ul>

          <h2>Getting Started</h2>
          <p>
            To start trading on Forecast254, you&apos;ll need to:
          </p>
          <ol>
            <li>Create an account</li>
            <li>Complete identity verification</li>
            <li>Fund your account</li>
            <li>Browse available markets</li>
            <li>Place your first trade</li>
          </ol>

          <div className="mt-8 p-4 bg-card border border-border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
            <p>
              Ready to dive deeper? Check out our{' '}
              <Link href="/docs/quickstart" className="text-primary hover:text-primary/80">
                Quick Start Guide
              </Link>{' '}
              or learn about{' '}
              <Link href="/docs/concepts" className="text-primary hover:text-primary/80">
                Core Concepts
              </Link>
              .
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default IntroductionPage;
