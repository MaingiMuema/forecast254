"use client";

import { motion } from 'framer-motion';
import { FaGlobe, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

const sections = [
  {
    title: "Kenyan Political Markets",
    content: `Understanding Kenyan political prediction markets:
    
    1. Election Markets
    • Presidential elections
    • County elections
    • Party primaries
    • Parliamentary seats
    • Special interest groups
    
    2. Policy Markets
    • Budget predictions
    • Legislative outcomes
    • Constitutional amendments
    • Executive orders
    • Regulatory changes
    
    3. Political Events
    • Party alliances
    • Cabinet appointments
    • Political rallies
    • Public opinion polls
    • Leadership changes`
  },
  {
    title: "Economic Markets",
    content: `Predicting Kenyan economic outcomes:
    
    1. Macroeconomic Indicators
    • GDP growth rates
    • Inflation rates
    • Exchange rates (KES/USD)
    • Interest rates
    • Foreign investment levels
    
    2. Market Performance
    • NSE indices
    • Corporate earnings
    • IPO outcomes
    • Bond yields
    • Market capitalization
    
    3. Sector Performance
    • Agriculture
    • Technology
    • Manufacturing
    • Real estate
    • Financial services`
  },
  {
    title: "Sports Markets",
    content: `Sports prediction markets in Kenya:
    
    1. Football
    • Harambee Stars matches
    • Premier League outcomes
    • FKF Cup predictions
    • Club championships
    • Player transfers
    
    2. Athletics
    • Marathon events
    • Track competitions
    • Medal predictions
    • Record attempts
    • Team performance
    
    3. Other Sports
    • Rugby (Kenya Sevens)
    • Cricket matches
    • Basketball leagues
    • Local tournaments
    • International competitions`
  },
  {
    title: "Social and Cultural Events",
    content: `Predicting social and cultural outcomes:
    
    1. Entertainment
    • Music awards
    • Film releases
    • TV show ratings
    • Celebrity events
    • Festival outcomes
    
    2. Cultural Events
    • Cultural festivals
    • Traditional ceremonies
    • Art exhibitions
    • Literary awards
    • Fashion events
    
    3. Social Trends
    • Social media trends
    • Viral content
    • Cultural movements
    • Celebrity influence
    • Public opinion shifts`
  },
  {
    title: "Technology and Innovation",
    content: `Technology-related prediction markets:
    
    1. Tech Industry
    • Startup funding rounds
    • Product launches
    • Market expansion
    • Partnership deals
    • Innovation awards
    
    2. Digital Transformation
    • Mobile money adoption
    • E-commerce growth
    • Digital service launches
    • Tech infrastructure
    • Innovation hubs
    
    3. Future Trends
    • Emerging technologies
    • Digital adoption rates
    • Tech policy changes
    • Innovation metrics
    • Industry disruption`
  }
];

export default function KenyaMarketsPage() {
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
          <FaGlobe className="text-3xl bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            Kenyan Markets Guide
          </h1>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-muted-foreground">
            Learn about the unique characteristics of Kenyan prediction markets across different sectors.
            This guide helps you understand local market dynamics and opportunities.
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
