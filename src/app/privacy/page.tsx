'use client';

import React from 'react';
import Link from 'next/link';
import { FaLock, FaUserShield, FaDatabase, FaCookie } from 'react-icons/fa';

const PrivacyPolicyPage = () => {
  const lastUpdated = '2024-01-01';

  const sections = [
    {
      title: '1. Information We Collect',
      icon: <FaDatabase className="w-6 h-6 text-primary" />,
      content: {
        intro: 'We collect various types of information to provide and improve our Service:',
        subsections: [
          {
            title: 'Personal Information',
            items: [
              'Email address',
              'Full name',
              'Phone number (optional)',
              'Profile information',
              'Payment information',
              'Authentication data'
            ]
          },
          {
            title: 'Usage Data',
            items: [
              'Browser type and version',
              'Access times and dates',
              'Pages viewed',
              'Trading activity',
              'Market interactions',
              'Device information'
            ]
          },
          {
            title: 'Financial Data',
            items: [
              'Transaction history',
              'Market positions',
              'Account balances',
              'Trading patterns',
              'Payment records'
            ]
          }
        ]
      }
    },
    {
      title: '2. How We Use Your Information',
      icon: <FaUserShield className="w-6 h-6 text-green-500" />,
      content: {
        intro: 'We use the collected information for various purposes:',
        items: [
          'Providing and maintaining our Service',
          'Notifying you about changes to our Service',
          'Allowing you to participate in interactive features',
          'Providing customer support',
          'Gathering analysis to improve our Service',
          'Monitoring the usage of our Service',
          'Detecting, preventing, and addressing technical issues',
          'Complying with legal obligations',
          'Processing your transactions',
          'Sending you marketing communications (with consent)'
        ]
      }
    },
    {
      title: '3. Data Storage and Security',
      icon: <FaLock className="w-6 h-6 text-blue-500" />,
      content: {
        intro: 'We implement robust security measures to protect your data:',
        items: [
          'End-to-end encryption for sensitive data',
          'Regular security audits and assessments',
          'Secure data storage with Supabase',
          'Access controls and authentication',
          'Regular backups and disaster recovery',
          'Employee data handling training',
          'Incident response procedures'
        ]
      }
    },
    {
      title: '4. Cookies and Tracking',
      icon: <FaCookie className="w-6 h-6 text-yellow-500" />,
      content: {
        intro: 'We use cookies and similar tracking technologies to:',
        items: [
          'Remember your preferences',
          'Understand how you use our Service',
          'Improve user experience',
          'Maintain your session',
          'Analyze usage patterns',
          'Provide personalized content'
        ]
      }
    },
    {
      title: '5. Data Sharing and Third Parties',
      content: {
        intro: 'We may share your information with:',
        items: [
          'Service providers (hosting, analytics, payments)',
          'Legal authorities when required',
          'Business partners (with consent)',
          'Analytics services',
          'Marketing services (with consent)'
        ],
        note: 'We never sell your personal data to third parties.'
      }
    },
    {
      title: '6. Your Data Rights',
      content: {
        intro: 'You have the right to:',
        items: [
          'Access your personal data',
          'Correct inaccurate data',
          'Request data deletion',
          'Object to data processing',
          'Request data portability',
          'Withdraw consent',
          'File a complaint with authorities'
        ]
      }
    },
    {
      title: '7. Data Retention',
      content: {
        intro: 'We retain your data for:',
        items: [
          'Active accounts: As long as necessary',
          'Closed accounts: Up to 5 years',
          'Financial records: As required by law',
          'Marketing data: Until consent withdrawal',
          'Analytics: Up to 2 years'
        ]
      }
    },
    {
      title: '8. Children\'s Privacy',
      content: {
        text: 'Our Service is not intended for use by children under 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us.'
      }
    },
    {
      title: '9. International Data Transfers',
      content: {
        text: 'Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.'
      }
    },
    {
      title: '10. Policy Updates',
      content: {
        text: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.'
      }
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <FaLock className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-card rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((section, index) => (
              <a
                key={index}
                href={`#section-${index}`}
                className="text-primary hover:underline"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section, index) => (
            <section key={index} id={`section-${index}`} className="scroll-mt-24">
              <div className="flex items-center space-x-3 mb-4">
                {section.icon}
                <h2 className="text-2xl font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {section.content.intro && (
                  <p className="text-muted-foreground mb-4">{section.content.intro}</p>
                )}
                {section.content.text && (
                  <p className="text-muted-foreground">{section.content.text}</p>
                )}
                {section.content.subsections && (
                  <div className="space-y-6">
                    {section.content.subsections.map((subsection, subIndex) => (
                      <div key={subIndex}>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          {subsection.title}
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                          {subsection.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-muted-foreground">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                {section.content.items && (
                  <ul className="list-disc pl-6 space-y-2">
                    {section.content.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {section.content.note && (
                  <p className="mt-4 text-sm font-medium text-primary">
                    {section.content.note}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            For any privacy-related questions or concerns, please{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact us
            </Link>
            . We are committed to protecting your privacy and will respond to your inquiries promptly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
