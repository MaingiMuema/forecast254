'use client';

import React from 'react';
import Link from 'next/link';
import { FaUserPlus, FaIdCard, FaWallet, FaSearch, FaChartLine } from 'react-icons/fa';

const QuickStartPage = () => {
  const steps = [
    {
      icon: FaUserPlus,
      title: 'Create Your Account',
      description: 'Sign up with your email address and create a secure password. Verify your email to activate your account.',
      tip: 'Choose a strong password that includes numbers, special characters, and both upper and lowercase letters.',
    },
    {
      icon: FaIdCard,
      title: 'Complete Verification',
      description: 'Complete our KYC (Know Your Customer) process by providing the required identification documents.',
      tip: 'Have your government-issued ID and proof of address ready for faster verification.',
    },
    {
      icon: FaWallet,
      title: 'Fund Your Account',
      description: 'Add funds to your account using our supported payment methods to start trading.',
      tip: 'Start with a small amount to familiarize yourself with the platform before making larger investments.',
    },
    {
      icon: FaSearch,
      title: 'Explore Markets',
      description: 'Browse through available prediction markets and find opportunities that interest you.',
      tip: 'Use filters and search to find markets in categories you are knowledgeable about.',
    },
    {
      icon: FaChartLine,
      title: 'Place Your First Trade',
      description: 'Select a market and place your first prediction trade using our intuitive trading interface.',
      tip: 'Start with small positions until you are comfortable with how the markets work.',
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
          <span>Quick Start Guide</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Quick Start Guide</h1>
          
          <p className="lead">
            Get started with Forecast254 in just a few simple steps. This guide will walk you through
            everything you need to begin trading on our prediction markets.
          </p>

          {/* Steps */}
          <div className="not-prose">
            {steps.map((step, index) => (
              <div key={index} className="mb-8 p-6 bg-card border border-border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <p className="text-sm">
                        <span className="font-semibold">💡 Pro Tip:</span> {step.tip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2>What&apos;s Next?</h2>
          <p>
            Now that you&apos;re set up, dive deeper into our platform by:
          </p>
          <ul>
            <li>
              Learning about{' '}
              <Link href="/docs/market-types" className="text-primary hover:text-primary/80">
                different types of markets
              </Link>
            </li>
            <li>
              Understanding our{' '}
              <Link href="/docs/trading" className="text-primary hover:text-primary/80">
                trading mechanics
              </Link>
            </li>
            <li>
              Reading about{' '}
              <Link href="/docs/concepts" className="text-primary hover:text-primary/80">
                core platform concepts
              </Link>
            </li>
          </ul>

          <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <p>
              If you encounter any issues during setup, our{' '}
              <Link href="/docs/support" className="text-primary hover:text-primary/80">
                support team
              </Link>{' '}
              is here to help.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default QuickStartPage;
