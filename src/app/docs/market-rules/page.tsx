'use client';

import React from 'react';
import Link from 'next/link';
import { FaGavel, FaShieldAlt, FaClock, FaExclamationCircle } from 'react-icons/fa';

const MarketRulesPage = () => {
  const sections = [
    {
      icon: FaGavel,
      title: 'Market Creation Rules',
      description: `Guidelines for creating valid prediction markets on our platform. These rules ensure 
      markets are clear, unambiguous, and can be resolved definitively.`,
      rules: [
        'Markets must have a clear, verifiable outcome',
        'Resolution criteria must be specified in advance',
        'End date and time must be clearly defined',
        'Market questions must be unambiguous',
        'Resolution sources must be reliable and accessible',
        'No duplicate markets for the same event',
      ],
    },
    {
      icon: FaShieldAlt,
      title: 'Trading Rules',
      description: `Rules governing trading behavior and market participation. These ensure fair and 
      orderly markets for all participants.`,
      rules: [
        'No trading on inside information',
        'No market manipulation',
        'Respect position limits',
        'Follow KYC/AML requirements',
        'No coordinated trading',
        'Report suspicious activity',
      ],
    },
    {
      icon: FaClock,
      title: 'Resolution Rules',
      description: `Guidelines for market resolution and outcome determination. These rules ensure 
      consistent and fair market settlement.`,
      rules: [
        'Markets resolve based on predetermined criteria',
        'Resolution uses specified sources only',
        'Disputes must be filed within 24 hours',
        'Resolution committee decisions are final',
        'Invalid markets may be voided',
        'Early resolution requires clear outcome',
      ],
    },
    {
      icon: FaExclamationCircle,
      title: 'Prohibited Markets',
      description: `Categories of markets that are not allowed on our platform. These restrictions ensure 
      compliance with regulations and ethical standards.`,
      rules: [
        'No markets on illegal activities',
        'No markets promoting harm',
        'No markets on personal privacy',
        'No markets on protected information',
        'No markets violating local laws',
        'No markets on sensitive topics',
      ],
    },
  ];

  const violations = {
    minor: [
      'Late market creation',
      'Unclear market language',
      'Missing resolution sources',
      'Duplicate market creation',
    ],
    major: [
      'Market manipulation',
      'Trading on inside information',
      'Multiple account usage',
      'Coordinated trading',
    ],
    critical: [
      'Creating prohibited markets',
      'Fraudulent activity',
      'Identity misrepresentation',
      'Regulatory violations',
    ],
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm mb-8">
          <Link href="/docs" className="text-primary hover:text-primary/80">
            Documentation
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span>Market Rules</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Market Rules</h1>
          
          <p className="lead">
            Our market rules are designed to ensure fair, transparent, and efficient prediction markets.
            All participants must follow these rules to maintain market integrity and protect user interests.
          </p>

          {sections.map((section, index) => (
            <section key={index} className="mb-12">
              <div className="not-prose flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <section.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">{section.title}</h2>
              </div>
              
              <p>{section.description}</p>
              
              <div className="not-prose bg-card border border-border rounded-lg p-6 mt-4">
                <ul className="space-y-2">
                  {section.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex} className="flex items-center">
                      <span className="text-primary mr-2">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <h2>Rule Violations and Consequences</h2>
          <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-card border border-warning/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-warning">Minor Violations</h3>
              <ul className="space-y-2">
                {violations.minor.map((violation, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-warning mr-2">•</span>
                    {violation}
                  </li>
                ))}
              </ul>
              <p className="text-sm mt-4 text-muted-foreground">
                Result: Warning and corrective action required
              </p>
            </div>
            <div className="p-4 bg-card border border-orange-500/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-orange-500">Major Violations</h3>
              <ul className="space-y-2">
                {violations.major.map((violation, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-orange-500 mr-2">•</span>
                    {violation}
                  </li>
                ))}
              </ul>
              <p className="text-sm mt-4 text-muted-foreground">
                Result: Temporary account suspension
              </p>
            </div>
            <div className="p-4 bg-card border border-destructive/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-destructive">Critical Violations</h3>
              <ul className="space-y-2">
                {violations.critical.map((violation, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-destructive mr-2">•</span>
                    {violation}
                  </li>
                ))}
              </ul>
              <p className="text-sm mt-4 text-muted-foreground">
                Result: Permanent account termination
              </p>
            </div>
          </div>

          <div className="mt-12 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Have Questions About the Rules?</h3>
            <p>
              If you&apos;re unsure about any rules or need clarification, please contact our{' '}
              <Link href="/docs/support" className="text-primary hover:text-primary/80">
                support team
              </Link>
              . We&apos;re here to help ensure you can participate safely and effectively in our markets.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default MarketRulesPage;
