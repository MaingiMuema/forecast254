'use client';

import React from 'react';
import { FaBook, FaCode, FaChartLine, FaQuestionCircle } from 'react-icons/fa';

const DocumentationPage = () => {
  const sections = [
    {
      title: 'Getting Started',
      icon: FaBook,
      description: 'Learn the basics of Forecast254 and how to start predicting markets.',
      links: [
        { title: 'Introduction', href: '/docs/introduction' },
        { title: 'Quick Start Guide', href: '/docs/quickstart' },
        { title: 'Core Concepts', href: '/docs/concepts' },
      ],
    },
    {
      title: 'Market Mechanics',
      icon: FaChartLine,
      description: 'Understand how markets work, trading, and settlement processes.',
      links: [
        { title: 'Market Types', href: '/docs/market-types' },
        { title: 'Trading Guide', href: '/docs/trading' },
        { title: 'Settlement Process', href: '/docs/settlement' },
      ],
    },
    {
      title: 'API Reference',
      icon: FaCode,
      description: 'Detailed documentation for integrating with our API.',
      links: [
        { title: 'API Overview', href: '/docs/api-overview' },
        { title: 'Authentication', href: '/docs/authentication' },
        { title: 'Endpoints', href: '/docs/endpoints' },
      ],
    },
    {
      title: 'Help & Support',
      icon: FaQuestionCircle,
      description: 'Get help and find answers to common questions.',
      links: [
        { title: 'FAQs', href: '/docs/faqs' },
        { title: 'Troubleshooting', href: '/docs/troubleshooting' },
        { title: 'Contact Support', href: '/docs/support' },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Documentation</h1>
        <p className="text-muted-foreground text-lg mb-12">
          Welcome to Forecast254 documentation. Find everything you need to know about prediction markets,
          trading, and using our platform effectively.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-6 hover:border-primary transition-colors"
            >
              <div className="flex items-center mb-4">
                <section.icon className="w-6 h-6 text-primary mr-3" />
                <h2 className="text-xl font-semibold">{section.title}</h2>
              </div>
              <p className="text-muted-foreground mb-4">{section.description}</p>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
