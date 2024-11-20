"use client";

import { motion } from 'framer-motion';
import { FaChartBar, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const sections = [
  {
    title: "Fundamental Analysis",
    content: `Understanding the basics of market analysis:
    
    1. Information Gathering
    • Official reports and statistics
    • News articles and press releases
    • Expert opinions and analysis
    • Historical data and trends
    • Social media sentiment
    
    2. Data Interpretation
    • Identifying key metrics
    • Understanding cause and effect
    • Recognizing patterns
    • Evaluating source reliability
    • Cross-referencing information
    
    3. Context Consideration
    • Local vs global impact
    • Seasonal factors
    • Cultural influences
    • Economic conditions
    • Political environment`
  },
  {
    title: "Technical Analysis",
    content: `Using market data to make predictions:
    
    1. Price Trends
    • Upward trends
    • Downward trends
    • Sideways movements
    • Breakout points
    • Support and resistance levels
    
    2. Volume Analysis
    • Trading volume patterns
    • Volume-price relationship
    • Liquidity indicators
    • Market depth
    • Trading activity spikes
    
    3. Market Indicators
    • Moving averages
    • Price momentum
    • Market sentiment
    • Volatility measures
    • Trend strength indicators`
  },
  {
    title: "Event Impact Analysis",
    content: `Evaluating how events affect market outcomes:
    
    1. Event Categories
    • Political events (elections, policy changes)
    • Economic events (GDP reports, inflation data)
    • Sports events (matches, tournaments)
    • Social events (cultural celebrations, protests)
    • Natural events (weather, disasters)
    
    2. Impact Assessment
    • Direct effects
    • Indirect consequences
    • Short-term vs long-term impact
    • Ripple effects
    • Unintended outcomes
    
    3. Timing Considerations
    • Event schedule
    • Lead-up period
    • Immediate aftermath
    • Long-term implications
    • Market closing dates`
  },
  {
    title: "Risk Assessment",
    content: `Evaluating and managing prediction risks:
    
    1. Risk Types
    • Information risk (incomplete/incorrect data)
    • Timing risk (market closure, event changes)
    • Position risk (size of prediction)
    • Market risk (price movements)
    • External risk (unexpected events)
    
    2. Risk Measurement
    • Probability assessment
    • Potential loss calculation
    • Risk-reward ratio
    • Position exposure
    • Portfolio impact
    
    3. Risk Mitigation
    • Position sizing
    • Diversification
    • Stop-loss levels
    • Regular monitoring
    • Contingency planning`
  },
  {
    title: "Decision Making Framework",
    content: `Structured approach to making predictions:
    
    1. Information Phase
    • Gather all relevant data
    • Verify information sources
    • Identify knowledge gaps
    • Consider multiple perspectives
    • Document key findings
    
    2. Analysis Phase
    • Apply analytical methods
    • Consider different scenarios
    • Evaluate probabilities
    • Assess risk factors
    • Review historical patterns
    
    3. Decision Phase
    • Set clear objectives
    • Define entry/exit points
    • Determine position size
    • Plan monitoring approach
    • Document reasoning
    
    4. Review Phase
    • Track prediction outcomes
    • Analyze performance
    • Identify improvements
    • Update strategies
    • Learn from experience`
  }
];

export default function MarketAnalysisPage() {
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
          <FaChartBar className="text-3xl bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Market Analysis Guide
          </h1>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-muted-foreground">
            Learn how to analyze markets effectively using fundamental and technical analysis.
            This comprehensive guide will help you make more informed predictions.
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
