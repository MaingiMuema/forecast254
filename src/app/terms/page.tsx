'use client';

import React from 'react';
import Link from 'next/link';
import { FaShieldAlt } from 'react-icons/fa';

const TermsOfServicePage = () => {
  const lastUpdated = '2024-11-20';

  const sections = [
    {
      title: '1. Agreement to Terms',
      content: `By accessing and using Forecast254's prediction market platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms constitute a legally binding agreement between you and Forecast254.`
    },
    {
      title: '2. Account Registration',
      content: `To use our Service, you must:
        • Be at least 18 years old
        • Register for an account with valid information
        • Maintain the security of your account credentials
        • Notify us immediately of any unauthorized access
        • Accept responsibility for all activities under your account
        
        We reserve the right to suspend or terminate accounts that violate these Terms.`
    },
    {
      title: '3. Prediction Market Rules',
      content: `Users must comply with our Market Rules when:
        • Creating prediction markets
        • Trading in markets
        • Resolving markets
        • Participating in market discussions
        
        For detailed guidelines, please refer to our Market Rules page.`
    },
    {
      title: '4. User Conduct',
      content: `You agree not to:
        • Violate any laws or regulations
        • Manipulate markets or trading activity
        • Impersonate others or provide false information
        • Attempt to gain unauthorized access
        • Use the service for money laundering
        • Engage in abusive or disruptive behavior
        • Interfere with the proper functioning of the Service`
    },
    {
      title: '5. Financial Terms',
      content: `By using our Service:
        • You understand the risks of prediction markets
        • You accept responsibility for all financial decisions
        • You agree to our fee structure
        • You acknowledge that past performance doesn't guarantee future results
        • You understand that markets can be declared invalid
        • You accept that trades are final and irreversible`
    },
    {
      title: '6. Intellectual Property',
      content: `All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are the exclusive property of Forecast254 and are protected by international copyright, trademark, and other intellectual property laws.`
    },
    {
      title: '7. Privacy and Data',
      content: `Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to our collection and use of your data as described in the Privacy Policy.`
    },
    {
      title: '8. Disclaimers',
      content: `The Service is provided "as is" without warranties of any kind. We do not guarantee:
        • Continuous, uninterrupted access to the Service
        • The accuracy of market information
        • The behavior of other users
        • The resolution of technical issues
        • The outcome of any prediction market`
    },
    {
      title: '9. Limitation of Liability',
      content: `To the maximum extent permitted by law, Forecast254 shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service.`
    },
    {
      title: '10. Modifications',
      content: `We reserve the right to modify these Terms at any time. We will notify users of significant changes via:
        • Email notification
        • Service announcements
        • Website notices
        
        Your continued use of the Service after changes constitutes acceptance of the modified Terms.`
    },
    {
      title: '11. Termination',
      content: `We may terminate or suspend your account and access to the Service:
        • For violations of these Terms
        • For suspicious activity
        • At our sole discretion
        • Without prior notice or liability
        
        Upon termination, your right to use the Service will immediately cease.`
    },
    {
      title: '12. Governing Law',
      content: `These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions.`
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <FaShieldAlt className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
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
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {section.title}
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-line text-muted-foreground">
                  {section.content}
                </p>
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            If you have any questions about these Terms, please{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact us
            </Link>
            . By using Forecast254, you acknowledge that you have read and understood these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
