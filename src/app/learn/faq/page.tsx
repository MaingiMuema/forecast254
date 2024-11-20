"use client";

import { motion } from 'framer-motion';
import { FaQuestionCircle, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const faqs = [
  {
    question: "What is Forecast254?",
    answer: `Forecast254 is a prediction market platform focused on events relevant to Kenya. Users can trade on the outcomes of various events using points, earning rewards for accurate predictions.`
  },
  {
    question: "How do I get started?",
    answer: `To get started:
    1. Create an account
    2. Receive your initial points
    3. Browse available markets
    4. Make your first prediction
    
    Check our Getting Started guide for more detailed instructions.`
  },
  {
    question: "Is this gambling?",
    answer: `No, Forecast254 is not gambling. It's a prediction market platform that:
    • Uses points instead of real money
    • Rewards knowledge and research
    • Helps aggregate information about future events
    • Provides educational value through market mechanics
    
    The platform is designed for learning and entertainment purposes.`
  },
  {
    question: "How are points calculated?",
    answer: `Points are calculated based on:
    • Accuracy of predictions
    • Size of positions
    • Market difficulty
    • Time in market
    
    The exact formula considers these factors to reward both accuracy and conviction in predictions.`
  },
  {
    question: "Can I lose my points?",
    answer: `Yes, you can lose points if your predictions are incorrect. However:
    • New users receive regular point bonuses
    • You can never go below zero points
    • Points have no monetary value
    • You can always earn more points through accurate predictions`
  },
  {
    question: "How are markets resolved?",
    answer: `Markets are resolved based on:
    • Pre-specified resolution criteria
    • Verified information sources
    • Clear outcome determination
    
    Resolution sources and criteria are always listed in the market description.`
  },
  {
    question: "What happens if a market is cancelled?",
    answer: `If a market is cancelled:
    • All trades are reversed
    • Points are refunded to traders
    • Users are notified via email
    • The market is marked as cancelled
    
    Markets are only cancelled in exceptional circumstances.`
  },
  {
    question: "How can I improve my prediction accuracy?",
    answer: `To improve your accuracy:
    • Research thoroughly before trading
    • Start with small positions
    • Learn from both wins and losses
    • Read our Trading Strategies guide
    • Practice with different market types
    
    Remember that experience and careful analysis are key to success.`
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/learn" 
          className="inline-flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <FaArrowLeft className="text-sm" />
          <span>Back to Learn</span>
        </Link>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <FaQuestionCircle className="text-3xl bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about Forecast254, prediction markets, and how to use the platform.
          </p>
        </div>

        {/* FAQs */}
        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-md border border-border/40 p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {faq.question}
              </h2>
              <div className="text-muted-foreground whitespace-pre-line">
                {faq.answer}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
