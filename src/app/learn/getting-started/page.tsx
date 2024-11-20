"use client";

import { motion } from 'framer-motion';
import { FaLightbulb, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const sections = [
  {
    title: "What are Prediction Markets?",
    content: `Prediction markets are platforms where users can trade on the outcomes of future events. 
    Think of them as a stock market for predictions. Instead of trading company shares, you're trading 
    your beliefs about what will happen in the future.`
  },
  {
    title: "How Forecast254 Works",
    content: `Forecast254 is a prediction market platform focused on events relevant to Kenya. Users can:
    • Create an account and receive initial trading points
    • Browse available markets across different categories
    • Buy shares in outcomes they believe will happen
    • Sell shares when they change their mind or want to take profits
    • Earn points when their predictions are correct`
  },
  {
    title: "Making Your First Prediction",
    content: `To make your first prediction:
    1. Browse the available markets on the homepage
    2. Click on a market that interests you
    3. Review the market details and current prices
    4. Use the trading interface to buy shares in your predicted outcome
    5. Wait for the event to occur and the market to be resolved
    6. Receive points if your prediction was correct`
  },
  {
    title: "Understanding Market Prices",
    content: `Market prices show the probability of each outcome occurring:
    • A price of 0.75 means the market estimates a 75% chance of that outcome
    • Prices always add up to 1 (or 100%) across all outcomes
    • Lower prices mean higher potential returns, but lower probability
    • Higher prices mean lower potential returns, but higher probability`
  }
];

export default function GettingStartedPage() {
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
          <FaLightbulb className="text-3xl bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Getting Started
          </h1>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-muted-foreground">
            Welcome to Forecast254! This guide will help you understand prediction markets
            and show you how to get started with making predictions.
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
