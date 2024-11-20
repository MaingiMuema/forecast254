"use client";

import { motion } from 'framer-motion';
import { FaGraduationCap, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const sections = [
  {
    title: "Market Psychology",
    content: `Understanding the psychological aspects of trading:
    
    1. Common Biases
    • Confirmation Bias: Seeking information that confirms existing beliefs
    • Anchoring: Over-relying on first piece of information
    • Recency Bias: Giving too much weight to recent events
    • Overconfidence: Overestimating prediction abilities
    • Loss Aversion: Fear of losses over desire for gains
    
    2. Emotional Control
    • Recognizing emotional triggers
    • Developing trading discipline
    • Managing stress and pressure
    • Maintaining objectivity
    • Building mental resilience
    
    3. Group Psychology
    • Understanding crowd behavior
    • Identifying market sentiment
    • Recognizing panic and euphoria
    • Dealing with FOMO
    • Contrarian thinking`
  },
  {
    title: "Portfolio Management",
    content: `Advanced portfolio strategies:
    
    1. Diversification Techniques
    • Across market categories
    • By event type
    • Time-based diversification
    • Risk level spreading
    • Correlation consideration
    
    2. Position Sizing
    • Kelly Criterion application
    • Risk-based sizing
    • Confidence level adjustments
    • Market volatility consideration
    • Portfolio rebalancing
    
    3. Performance Tracking
    • Return calculation
    • Risk-adjusted metrics
    • Drawdown analysis
    • Win rate monitoring
    • Profit factor calculation`
  },
  {
    title: "Advanced Market Mechanics",
    content: `Understanding complex market dynamics:
    
    1. Price Discovery
    • Market efficiency
    • Information absorption
    • Price formation process
    • Market maker role
    • Order book dynamics
    
    2. Liquidity Dynamics
    • Depth analysis
    • Spread interpretation
    • Volume patterns
    • Liquidity cycles
    • Impact cost assessment
    
    3. Market Microstructure
    • Order types
    • Matching mechanisms
    • Settlement process
    • Fee structures
    • Trading restrictions`
  },
  {
    title: "Arbitrage Strategies",
    content: `Exploiting market inefficiencies:
    
    1. Types of Arbitrage
    • Cross-market arbitrage
    • Time arbitrage
    • Information arbitrage
    • Statistical arbitrage
    • Risk arbitrage
    
    2. Implementation
    • Identifying opportunities
    • Timing considerations
    • Risk assessment
    • Execution strategy
    • Position management
    
    3. Challenges
    • Speed requirements
    • Cost considerations
    • Risk factors
    • Technical limitations
    • Competition impact`
  },
  {
    title: "Research and Analysis Tools",
    content: `Advanced tools for market analysis:
    
    1. Data Analysis
    • Statistical tools
    • Probability calculators
    • Trend analysis software
    • Market scanners
    • Backtesting platforms
    
    2. Information Sources
    • Professional news services
    • Expert networks
    • Research databases
    • Social media analytics
    • Market data feeds
    
    3. Analysis Frameworks
    • Quantitative models
    • Scenario analysis
    • Decision trees
    • Risk models
    • Performance analytics`
  }
];

export default function AdvancedTradingPage() {
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
          <FaGraduationCap className="text-3xl bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
            Advanced Trading Concepts
          </h1>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-muted-foreground">
            Explore advanced trading concepts and techniques to take your prediction skills
            to the next level. This guide covers complex topics for experienced traders.
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
