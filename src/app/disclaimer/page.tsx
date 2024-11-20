'use client';

import React from 'react';
import Link from 'next/link';
import { FaExclamationTriangle, FaMoneyBillWave, FaBalanceScale, FaGlobe, FaHandPaper } from 'react-icons/fa';

const DisclaimerPage = () => {
  const lastUpdated = '2024-01-01';

  const sections = [
    {
      title: 'Financial Risk Warning',
      icon: <FaMoneyBillWave className="w-6 h-6 text-yellow-500" />,
      content: {
        intro: 'Participation in prediction markets involves substantial financial risk:',
        items: [
          'You may lose some or all of your invested funds',
          'Past performance does not guarantee future results',
          'Market outcomes are unpredictable',
          'Trading fees apply to all transactions',
          'Market liquidity may affect your ability to trade',
          'Cryptocurrency values can be highly volatile'
        ],
        note: 'Never invest more than you can afford to lose.'
      }
    },
    {
      title: 'No Financial Advice',
      icon: <FaHandPaper className="w-6 h-6 text-red-500" />,
      content: {
        intro: 'Forecast254 does not provide financial advice:',
        items: [
          'Market information is for informational purposes only',
          'We do not recommend specific trades or investments',
          'Users are responsible for their own trading decisions',
          'Consider consulting a financial advisor before trading',
          'Research and verify all information independently',
          'Market discussions are user opinions, not professional advice'
        ]
      }
    },
    {
      title: 'Platform Limitations',
      icon: <FaExclamationTriangle className="w-6 h-6 text-orange-500" />,
      content: {
        intro: 'Be aware of the following platform limitations:',
        items: [
          'Service availability is not guaranteed',
          'Technical issues may affect trading',
          'Market resolution may be delayed',
          'Smart contract limitations may apply',
          'Platform upgrades may cause temporary disruptions',
          'Market data may have delays or inaccuracies'
        ]
      }
    },
    {
      title: 'Legal Compliance',
      icon: <FaBalanceScale className="w-6 h-6 text-blue-500" />,
      content: {
        intro: 'Users must comply with all applicable laws:',
        items: [
          'Verify your eligibility to participate',
          'Comply with local trading regulations',
          'Report and pay applicable taxes',
          'Follow anti-money laundering regulations',
          'Adhere to market rules and terms of service',
          'Report suspicious activities'
        ]
      }
    },
    {
      title: 'Market Information',
      icon: <FaGlobe className="w-6 h-6 text-green-500" />,
      content: {
        intro: 'Regarding market information and data:',
        items: [
          'Information may be incomplete or inaccurate',
          'Sources may be unreliable or biased',
          'Market conditions change rapidly',
          'Historical data may not reflect current conditions',
          'External events may impact market outcomes',
          'Resolution sources may become unavailable'
        ]
      }
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <FaExclamationTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-4">Disclaimer</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg mb-12">
          <p className="text-lg font-semibold mb-2">Important Notice</p>
          <p>
            Trading in prediction markets involves substantial risk of loss and is not suitable for all
            individuals. Before trading, carefully consider your investment objectives, experience level,
            and risk tolerance. Past performance is not indicative of future results.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section, index) => (
            <section key={index} className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                {section.icon}
                <h2 className="text-2xl font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-muted-foreground mb-4">{section.content.intro}</p>
                <ul className="space-y-3">
                  {section.content.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <span className="mt-1">•</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                {section.content.note && (
                  <p className="mt-4 text-sm font-medium text-primary">
                    Note: {section.content.note}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Acknowledgment */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            By using Forecast254, you acknowledge that you have read, understood, and agree to this
            disclaimer. For questions about risks or legal compliance, please{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPage;
