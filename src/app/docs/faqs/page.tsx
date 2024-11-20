'use client';

import React from 'react';
import Link from 'next/link';
import { FaPlus, FaMinus } from 'react-icons/fa';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'What is Forecast254?',
          a: `Forecast254 is a prediction market platform where users can trade on the outcomes of future events. 
          Our platform allows you to put your knowledge and insights to work by making predictions on various topics 
          including politics, sports, economics, and more.`,
        },
        {
          q: 'How do I create an account?',
          a: `Creating an account is simple. Click the "Sign Up" button, provide your email address, create a 
          password, and verify your email. You&apos;ll then need to complete our KYC process before you can start trading.`,
        },
        {
          q: 'Is Forecast254 available in my country?',
          a: `Forecast254 is available in most countries, but there may be restrictions in certain jurisdictions. 
          Check our Terms of Service or contact support for specific information about your country.`,
        },
      ],
    },
    {
      category: 'Trading',
      questions: [
        {
          q: 'How do prediction markets work?',
          a: `Prediction markets allow you to buy and sell shares based on the probability of future events. 
          Prices range from 0 to 1, representing 0% to 100% probability. If you think an event is more likely 
          than the current market price suggests, you can buy shares and profit if you&apos;re correct.`,
        },
        {
          q: 'What is the minimum trade amount?',
          a: `The minimum trade amount varies by market but is typically set low to allow users to start with 
          small positions. You can view the specific minimum trade amount on each market&apos;s trading page.`,
        },
        {
          q: 'How are profits calculated?',
          a: `Profits are calculated based on the difference between your entry price and the final settlement 
          price, multiplied by your position size. For binary markets, correct predictions settle at 1 and 
          incorrect ones at 0.`,
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'How do I secure my account?',
          a: `We recommend enabling two-factor authentication (2FA), using a strong unique password, and never 
          sharing your login credentials. You can enable 2FA in your account security settings.`,
        },
        {
          q: 'What happens if I forget my password?',
          a: `You can reset your password using the "Forgot Password" link on the login page. We&apos;ll send a 
          password reset link to your registered email address.`,
        },
        {
          q: 'How do I verify my identity?',
          a: `Identity verification (KYC) requires a valid government-issued ID and proof of address. Follow the 
          verification steps in your account dashboard. The process typically takes 1-2 business days.`,
        },
      ],
    },
    {
      category: 'Market Resolution',
      questions: [
        {
          q: 'How are markets resolved?',
          a: `Markets are resolved based on predetermined resolution sources specified in the market rules. Once 
          the outcome is known, the market is settled and profits are distributed to winning positions.`,
        },
        {
          q: 'What happens if there&apos;s a dispute?',
          a: `We have a robust dispute resolution process. Users can raise disputes within the specified timeframe, 
          and our resolution committee will review the evidence and make a final determination.`,
        },
        {
          q: 'When do I receive my profits?',
          a: `Profits are credited to your account immediately after market resolution, assuming there are no 
          disputes. You can then withdraw your funds subject to our standard withdrawal process.`,
        },
      ],
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
          <span>FAQs</span>
        </div>

        {/* Main Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Frequently Asked Questions</h1>
          
          <p className="lead">
            Find answers to common questions about Forecast254&apos;s prediction markets, account management,
            trading, and more.
          </p>

          {faqs.map((category, categoryIndex) => (
            <section key={categoryIndex} className="mb-12">
              <h2>{category.category}</h2>
              
              <div className="not-prose space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const index = categoryIndex * 100 + faqIndex;
                  const isOpen = openIndex === index;

                  return (
                    <div
                      key={faqIndex}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-card/50 transition-colors"
                      >
                        <span className="font-semibold">{faq.q}</span>
                        <span className="text-primary ml-4">
                          {isOpen ? <FaMinus /> : <FaPlus />}
                        </span>
                      </button>
                      
                      {isOpen && (
                        <div className="p-4 bg-card border-t border-border">
                          <p className="text-muted-foreground">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="mt-12 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Still Have Questions?</h3>
            <p>
              Can&apos;t find what you&apos;re looking for? Contact our{' '}
              <Link href="/docs/support" className="text-primary hover:text-primary/80">
                support team
              </Link>{' '}
              or join our{' '}
              <Link href="/community" className="text-primary hover:text-primary/80">
                community
              </Link>{' '}
              for help.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default FAQPage;
