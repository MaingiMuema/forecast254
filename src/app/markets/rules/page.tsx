'use client';

import React from 'react';
import { FaGavel, FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const MarketRulesPage = () => {
  const rules = [
    {
      category: 'Market Creation',
      icon: <FaGavel className="w-6 h-6 text-primary" />,
      items: [
        'Questions must be clear, specific, and unambiguous',
        'Resolution criteria must be objective and verifiable',
        'Resolution source must be reliable and publicly accessible',
        'End date must be set in the future with reasonable time for resolution',
        'Market description must provide comprehensive context',
        'Multiple markets on the same topic are allowed if they have distinct resolution criteria'
      ]
    },
    {
      category: 'Trading Guidelines',
      icon: <FaCheck className="w-6 h-6 text-green-500" />,
      items: [
        'All trades are final and cannot be reversed',
        'Minimum trade amount is 1 KES',
        'Maximum position size is 25% of the liquidity pool',
        'Trading fees are 1% of the trade amount',
        'Trades must be placed before the market closing date',
        'Users must have sufficient balance to cover their trades'
      ]
    },
    {
      category: 'Market Resolution',
      icon: <FaInfoCircle className="w-6 h-6 text-blue-500" />,
      items: [
        'Markets are resolved based on the predefined resolution criteria',
        'Resolution must use the specified resolution source',
        'Markets can be resolved as Yes (100%), No (0%), or Invalid',
        'Invalid markets will have all trades refunded minus fees',
        'Resolution can occur any time after the resolution date',
        'Disputes must be raised within 24 hours of resolution'
      ]
    },
    {
      category: 'Prohibited Markets',
      icon: <FaTimes className="w-6 h-6 text-red-500" />,
      items: [
        'Markets promoting illegal activities',
        'Markets involving harm to individuals or property',
        'Markets about private individual information',
        'Markets that could be easily manipulated',
        'Markets with subjective resolution criteria',
        'Markets involving hate speech or discrimination'
      ]
    },
    {
      category: 'Market Moderation',
      icon: <FaExclamationTriangle className="w-6 h-6 text-yellow-500" />,
      items: [
        'Markets may be suspended if rules are violated',
        'Invalid markets will be clearly marked',
        'Moderators can edit market descriptions for clarity',
        'Users can report markets that violate rules',
        'Repeated violations may result in account restrictions',
        'Moderation decisions are final but can be appealed'
      ]
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Market Rules</h1>
          <p className="text-muted-foreground text-lg">
            Guidelines and regulations for creating and participating in prediction markets
          </p>
        </div>

        {/* Rules Sections */}
        <div className="space-y-12">
          {rules.map((section, index) => (
            <div key={index} className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                {section.icon}
                <h2 className="text-2xl font-semibold text-foreground">{section.category}</h2>
              </div>
              <ul className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-3">
                    <span className="mt-1.5">•</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-3">Disclaimer</h3>
          <p className="text-sm text-muted-foreground">
            These rules are subject to change. Users are responsible for reviewing the rules regularly.
            Forecast254 reserves the right to modify, suspend, or terminate markets that violate these rules.
            By participating in prediction markets on Forecast254, you agree to abide by these rules and
            any future updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketRulesPage;
