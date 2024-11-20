"use client";

import { motion } from 'framer-motion';
import { FaBook, FaLightbulb, FaChartLine, FaUsers, FaQuestionCircle, FaChartBar, FaGraduationCap, FaGlobe } from 'react-icons/fa';

const guides = [
  {
    title: "Getting Started",
    description: "Learn the basics of prediction markets and how to use Forecast254",
    icon: FaLightbulb,
    link: "/learn/getting-started",
    color: "from-emerald-400 to-blue-500"
  },
  {
    title: "How Markets Work",
    description: "Understanding market mechanics, trading, and outcome resolution",
    icon: FaChartLine,
    link: "/learn/markets",
    color: "from-blue-400 to-blue-600"
  },
  {
    title: "Market Analysis",
    description: "Learn how to analyze markets using fundamental and technical analysis",
    icon: FaChartBar,
    link: "/learn/market-analysis",
    color: "from-orange-400 to-orange-600"
  },
  {
    title: "Trading Strategies",
    description: "Advanced techniques for successful market predictions",
    icon: FaUsers,
    link: "/learn/strategies",
    color: "from-purple-400 to-purple-600"
  },
  {
    title: "Advanced Trading",
    description: "Master complex trading concepts and portfolio management",
    icon: FaGraduationCap,
    link: "/learn/advanced-trading",
    color: "from-indigo-400 to-indigo-600"
  },
  {
    title: "Kenya Markets",
    description: "Understanding local market dynamics and opportunities",
    icon: FaGlobe,
    link: "/learn/kenya-markets",
    color: "from-green-400 to-green-600"
  },
  {
    title: "FAQ",
    description: "Common questions and answers about Forecast254",
    icon: FaQuestionCircle,
    link: "/learn/faq",
    color: "from-pink-400 to-pink-600"
  }
];

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <FaBook className="text-3xl bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Learn
          </h1>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <p className="text-lg text-muted-foreground">
            Welcome to the Forecast254 learning center. Here you'll find comprehensive guides and resources
            to help you understand prediction markets and make better forecasts.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <motion.a
                key={guide.title}
                href={guide.link}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group block p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-md border border-border/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${guide.color} text-white`}>
                    <Icon className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {guide.title}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      {guide.description}
                    </p>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
