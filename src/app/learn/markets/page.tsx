"use client";

import { motion } from 'framer-motion';
import { FaChartLine, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const sections = [
  {
    title: "Market Types",
    content: `Forecast254 offers several types of prediction markets:
    • Binary Markets: Two possible outcomes (Yes/No, Win/Lose)
    • Multiple Choice: Several possible outcomes where one must be correct
    • Numeric: Predicting a specific number or range
    
    Each market type is clearly labeled and has its own trading mechanics.`
  },
  {
    title: "Market Lifecycle",
    content: `Every market goes through these stages:
    1. Open: Trading is active and you can buy/sell shares
    2. Closed: Trading stops when the event begins
    3. Resolved: Outcome is determined and winners are paid
    
    Markets may be canceled in rare cases (e.g., event cancellation). In such cases, all trades are refunded.`
  },
  {
    title: "Market Resolution",
    content: `How markets are resolved:
    • Binary markets: The correct outcome (Yes/No) is determined
    • Multiple choice: The winning option is selected
    • Numeric: The final number is confirmed
    
    Resolution sources are always specified in the market description. Common sources include:
    • Official government data
    • News reports
    • Sports results
    • Verified social media announcements`
  },
  {
    title: "Market Categories",
    content: `Markets are organized into categories:
    • Politics: Elections, policy decisions, appointments
    • Sports: Football, athletics, cricket matches
    • Economics: GDP, inflation, exchange rates
    • Entertainment: Music, movies, celebrity events
    • Technology: Product launches, company milestones
    
    Each category has its own section on the platform for easy browsing.`
  },
  {
    title: "Market Liquidity",
    content: `Liquidity affects how easily you can trade:
    • Higher liquidity means easier trading and more stable prices
    • Lower liquidity means larger price impacts from trades
    
    Tips for trading in different liquidity conditions:
    • Use limit orders in low liquidity markets
    • Check the order book depth before large trades
    • Consider breaking large trades into smaller ones`
  }
];

export default function MarketsPage() {
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
          <FaChartLine className="text-3xl bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            How Markets Work
          </h1>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-muted-foreground">
            Understand the different types of markets, how they work, and how they&apos;re resolved.
            This knowledge will help you make more informed trading decisions.
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
