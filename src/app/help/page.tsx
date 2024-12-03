"use client";

import { motion } from 'framer-motion';
import { 
  FaQuestionCircle, 
  FaEnvelope, 
  FaDiscord, 
  FaTwitter, 
  FaSearch, 
  FaChartLine,
  FaUserCircle,
  FaNewspaper,
  FaTrophy,
  FaTools
} from 'react-icons/fa';
import Link from 'next/link';
import { useState, useMemo } from 'react';

const sections = [
  {
    title: "Market Trading",
    icon: FaChartLine,
    items: [
      {
        question: "How do prediction markets work?",
        answer: "Prediction markets allow you to trade on future outcomes. Each market has YES/NO positions. The price (0-100) represents the probability of the event occurring. Trade YES if you think it's more likely, NO if less likely."
      },
      {
        question: "How to place a trade?",
        answer: "Select a market, choose YES/NO position, enter your trade amount and price (for limit orders), then click 'Place Order'. Market orders execute immediately at the best available price, while limit orders wait for your specified price."
      },
      {
        question: "What happens when a market resolves?",
        answer: "When the event occurs, the market resolves. YES positions pay ₿1 if the event happened, ₿0 if not. NO positions pay the opposite. Unresolved markets show live probability based on trading activity."
      },
      {
        question: "Understanding Market Stats",
        answer: "Each market displays key statistics: total trades, volume, unique traders, and view count. High view counts indicate popular markets, while trading volume shows market liquidity. Use these metrics to gauge market activity."
      },
      {
        question: "What are Featured Markets?",
        answer: "Featured markets appear on the homepage and receive special visibility. These are typically high-stakes markets with significant trading activity or important upcoming events. They often offer special rewards for accurate predictions."
      }
    ]
  },
  {
    title: "Account & Profile",
    icon: FaUserCircle,
    items: [
      {
        question: "How does the leaderboard work?",
        answer: "The leaderboard ranks traders by their performance metrics including profit/loss, accuracy, and trading volume. Rankings are updated daily and you can view historical performance."
      },
      {
        question: "What are Achievement Badges?",
        answer: "Badges are awarded for reaching trading milestones, maintaining accuracy streaks, and contributing to market liquidity. View your badges in your profile dashboard."
      },
      {
        question: "How to manage notifications?",
        answer: "Access notification settings in your profile to customize alerts for market movements, trade fills, and news updates. You can receive notifications via email, browser, or mobile."
      },
      {
        question: "How to secure your account?",
        answer: "Enable two-factor authentication (2FA) in your security settings. We support authenticator apps and SMS verification. Keep your recovery codes safe and update your password regularly."
      },
      {
        question: "Managing your portfolio",
        answer: "Your portfolio page shows all active positions, pending orders, and trading history. Use filters to analyze specific markets or time periods. Export data for personal analysis."
      }
    ]
  },
  {
    title: "News & Analysis",
    icon: FaNewspaper,
    items: [
      {
        question: "How to use the News Feed?",
        answer: "The News Feed aggregates relevant news and analysis for each market. Filter by category, source, or market. Click the bookmark icon to save articles for later reference."
      },
      {
        question: "Understanding Market Stats",
        answer: "Market stats show key metrics like total trades, volume, and unique traders. The view counter tracks market popularity. Use these metrics to gauge market activity and liquidity."
      },
      {
        question: "How to use Market Analysis Tools?",
        answer: "Access price charts, volume analysis, and trader sentiment indicators in the Analysis tab. Use technical indicators and historical data to inform your trading decisions."
      },
      {
        question: "Setting up News Alerts",
        answer: "Create custom news alerts for specific markets or topics. Choose delivery frequency and notification method. Alerts help you stay informed about market-moving events."
      },
      {
        question: "Using Technical Analysis",
        answer: "Our charting tools include price trends, volume indicators, and market depth. Access historical data and use drawing tools to identify patterns. Save and share your analysis."
      }
    ]
  },
  {
    title: "Leaderboard & Rewards",
    icon: FaTrophy,
    items: [
      {
        question: "How are rewards calculated?",
        answer: "Rewards are based on trading performance, market making, and community contribution. Top traders receive weekly and monthly rewards. Special bonuses are awarded for accurate predictions in featured markets."
      },
      {
        question: "Understanding Performance Metrics",
        answer: "Key metrics include P/L ratio, prediction accuracy, and market participation. The scoring system weights recent performance more heavily. View detailed breakdowns in your dashboard."
      },
      {
        question: "How to compete in Trading Challenges?",
        answer: "Trading challenges are special events with specific rules and prize pools. Join through the Challenges tab, track your progress, and compete against other traders for rewards."
      },
      {
        question: "Seasonal Competitions",
        answer: "Participate in quarterly trading competitions with larger prize pools. Rankings consider overall performance and specific challenge achievements. Winners receive exclusive badges and rewards."
      },
      {
        question: "Market Maker Rewards",
        answer: "Earn additional rewards by providing market liquidity. Place competitive limit orders and maintain active positions. Market maker status is calculated daily based on order book contribution."
      }
    ]
  },
  {
    title: "Technical Support",
    icon: FaTools,
    items: [
      {
        question: "Common Trading Issues",
        answer: "If orders aren't executing, check your balance, market status, and order parameters. For limit orders, ensure your price is within market bounds. Contact support for persistent issues."
      },
      {
        question: "Platform Performance",
        answer: "For optimal performance, use a modern browser and stable internet connection. Clear cache if experiencing display issues. The platform auto-updates with real-time data."
      },
      {
        question: "Data & Privacy",
        answer: "Your trading data and personal information are securely stored. Two-factor authentication is available for enhanced security. Review our privacy policy for details on data handling."
      },
      {
        question: "Mobile Trading Tips",
        answer: "Our platform is fully responsive for mobile trading. Use landscape mode for better chart viewing. Enable push notifications for important market updates and order fills."
      },
      {
        question: "API Access",
        answer: "Access our trading API for automated trading and data analysis. Generate API keys in your profile settings. Rate limits and documentation are available in the Developer Portal."
      }
    ]
  },
  {
    title: "Getting Started",
    icon: FaQuestionCircle,
    items: [
      {
        question: "How to fund your account?",
        answer: "Deposit funds using cryptocurrency or bank transfer. Crypto deposits are credited after network confirmation. Bank transfers typically process within 1-2 business days."
      },
      {
        question: "Understanding market types",
        answer: "We offer binary markets (Yes/No outcomes), scalar markets (range of values), and categorical markets (multiple choices). Each type has specific trading and settlement rules."
      },
      {
        question: "Risk management tips",
        answer: "Start with small positions to learn the platform. Use stop-loss orders to limit potential losses. Diversify across different market categories and time horizons."
      },
      {
        question: "Community guidelines",
        answer: "Participate in market discussions respectfully. Don't share non-public information or manipulate markets. Report suspicious activity to maintain market integrity."
      },
      {
        question: "Educational resources",
        answer: "Access our trading tutorials, market guides, and strategy articles in the Learn section. Join weekly webinars for trading tips and platform updates."
      }
    ]
  }
];

const contactMethods = [
  {
    title: "Email Support",
    icon: FaEnvelope,
    description: "Get help from our dedicated support team within 24 hours",
    link: "mailto:support@forecast254.com",
    buttonText: "Contact Support"
  },
  {
    title: "Discord Community",
    icon: FaDiscord,
    description: "Join our trading community for real-time discussion and help",
    link: "https://discord.gg/forecast254",
    buttonText: "Join Community"
  },
  {
    title: "Twitter Updates",
    icon: FaTwitter,
    description: "Follow for market updates and platform announcements",
    link: "https://twitter.com/forecast254",
    buttonText: "Follow Updates"
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;

    const query = searchQuery.toLowerCase();
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      )
    })).filter(section => section.items.length > 0);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <FaQuestionCircle className="text-3xl bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Help Center
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-12">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            className="w-full px-4 py-3 pl-12 rounded-lg bg-background/95 border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredSections.length > 0 ? (
            filteredSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-md border border-border/40 p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <section.icon className="text-2xl text-purple-500" />
                  <h2 className="text-xl font-semibold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="space-y-2">
                      <h3 className="font-medium text-foreground">
                        {item.question}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No results found for &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-purple-500 hover:text-purple-600"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Contact Methods */}
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Need More Help?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-md border border-border/40 p-6 text-center"
            >
              <method.icon className="text-3xl text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {method.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {method.description}
              </p>
              <Link
                href={method.link}
                className="inline-block px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors"
              >
                {method.buttonText}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
