'use client';

import React from 'react';
import Link from 'next/link';
import { FaHeadset, FaUsers, FaBook, FaBug, FaLightbulb, FaShieldAlt } from 'react-icons/fa';

const SupportPage = () => {
  const supportChannels = [
    {
      icon: FaHeadset,
      title: 'Customer Support',
      description: `Our dedicated support team is available 24/7 to help you with any questions or issues 
      you may encounter while using our platform.`,
      contactMethods: [
        'Email: support@forecast254.com',
        'Live Chat: Available in-app',
        'Phone: +254 (0) 11 2246 573',
        'Response time: Within 24 hours',
      ],
    },
    {
      icon: FaUsers,
      title: 'Community Support',
      description: `Join our vibrant community of traders and get help from experienced users. Share insights, 
      strategies, and learn from others.`,
      channels: [
        'Discord Community',
        'Telegram Group',
        'Reddit Forum',
        'Community Blog',
      ],
    },
    {
      icon: FaBug,
      title: 'Technical Support',
      description: `Experiencing technical issues? Our technical support team can help you resolve platform-related 
      problems quickly and efficiently.`,
      commonIssues: [
        'Account access problems',
        'Trading interface issues',
        'Mobile app support',
        'API integration help',
      ],
    },
  ];

  const resources = [
    {
      icon: FaBook,
      title: 'Documentation',
      description: 'Comprehensive guides and tutorials',
      link: '/docs',
    },
    {
      icon: FaLightbulb,
      title: 'Knowledge Base',
      description: 'Articles and how-to guides',
      link: '/docs/learn',
    },
    {
      icon: FaShieldAlt,
      title: 'Security Help',
      description: 'Account security assistance',
      link: '/docs/security',
    },
  ];

  const priorityIssues = [
    'Account security concerns',
    'Payment or withdrawal issues',
    'Market resolution disputes',
    'Platform accessibility problems',
    'Trading errors or discrepancies',
    'KYC verification issues',
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
          <span>Support</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Support Center</h1>
          
          <p className="lead">
            Need help? We&apos;re here to assist you. Choose from our various support channels or browse our
            self-help resources to find the answers you need.
          </p>

          {supportChannels.map((channel, index) => (
            <section key={index} className="mb-12">
              <div className="not-prose flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <channel.icon className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold m-0">{channel.title}</h2>
              </div>
              
              <p>{channel.description}</p>
              
              <div className="not-prose bg-card border border-border rounded-lg p-6 mt-4">
                <ul className="space-y-2">
                  {(channel.contactMethods || channel.channels || channel.commonIssues)?.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center">
                      <span className="text-primary mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}

          <h2>Priority Issues</h2>
          <p>
            The following issues receive priority support response. If you&apos;re experiencing any of these,
            please contact us immediately:
          </p>
          <div className="not-prose bg-card border border-warning/20 rounded-lg p-6 mt-4">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priorityIssues.map((issue, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-warning mr-2">!</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>

          <h2>Additional Resources</h2>
          <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {resources.map((resource, index) => (
              <Link 
                key={index}
                href={resource.link}
                className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <resource.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold m-0">{resource.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {resource.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-12 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Before Contacting Support</h3>
            <p>
              To help us assist you better:
            </p>
            <ul className="mt-2">
              <li>Check our{' '}
                <Link href="/docs/faqs" className="text-primary hover:text-primary/80">
                  FAQs
                </Link>
                {' '}for quick answers
              </li>
              <li>Have your account details ready</li>
              <li>Provide specific details about your issue</li>
              <li>Include any relevant screenshots or error messages</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
};

export default SupportPage;
