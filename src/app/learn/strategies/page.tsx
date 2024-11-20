"use client";

import { motion } from 'framer-motion';
import { FaUsers, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const sections = [
  {
    title: "Research and Analysis",
    content: `Successful predictions start with thorough research:
    • Gather information from reliable sources
    • Follow relevant news and developments
    • Understand historical patterns and trends
    • Consider multiple perspectives
    • Check official statistics and data
    
    Remember: The more informed you are, the better your predictions will be.`
  },
  {
    title: "Risk Management",
    content: `Protect your points with these risk management strategies:
    • Diversification: Don't put all your points in one market
    • Position Sizing: Limit each trade to a small percentage of your total points
    • Stop Losses: Know when to cut your losses
    • Take Profits: Set realistic profit targets
    
    Key principle: Never risk more points than you can afford to lose.`
  },
  {
    title: "Market Psychology",
    content: `Understanding market psychology is crucial:
    • Crowd Behavior: Markets can be influenced by group thinking
    • FOMO (Fear of Missing Out): Don't chase trending markets blindly
    • Confirmation Bias: Look for information that challenges your beliefs
    • Emotional Control: Make decisions based on analysis, not emotions
    
    Tip: Sometimes the best trade is no trade at all.`
  },
  {
    title: "Advanced Trading Techniques",
    content: `Advanced strategies for experienced traders:
    • Arbitrage: Profit from price differences across related markets
    • Hedging: Protect positions by trading correlated markets
    • Momentum Trading: Follow strong market trends
    • Contrarian Trading: Bet against the crowd when evidence supports it
    
    Important: Advanced techniques require more experience and careful risk management.`
  },
  {
    title: "Common Mistakes to Avoid",
    content: `Learn from these common trading pitfalls:
    • Overconfidence: Don't assume you're always right
    • Chasing Losses: Avoid increasing bets to recover losses
    • Ignoring Evidence: Don't trade based on emotions or hunches
    • Poor Timing: Consider market closing dates and information flow
    • Overtrading: Quality of trades matters more than quantity
    
    Remember: Every experienced trader has made these mistakes - learn from them.`
  }
];

export default function StrategiesPage() {
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
          <FaUsers className="text-3xl bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Trading Strategies
          </h1>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-muted-foreground">
            Learn advanced techniques and strategies to improve your prediction accuracy
            and manage your points effectively.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-md border border-border/40 p-6"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {section.title}
              </h2>
              <div className="text-muted-foreground whitespace-pre-line">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
