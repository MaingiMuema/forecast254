"use client";

import { motion } from 'framer-motion';
import { FaQuestionCircle, FaEnvelope, FaDiscord, FaTwitter, FaSearch, FaExclamationTriangle, FaUserShield, FaTools } from 'react-icons/fa';
import Link from 'next/link';

const sections = [
  {
    title: "Account Issues",
    icon: FaUserShield,
    items: [
      {
        question: "How do I reset my password?",
        answer: "To reset your password, click the 'Forgot Password' link on the login page. Enter your email address, and we'll send you instructions to create a new password."
      },
      {
        question: "Why is my account locked?",
        answer: "Accounts may be locked due to multiple failed login attempts or suspicious activity. Contact support for assistance in unlocking your account."
      },
      {
        question: "How do I update my profile information?",
        answer: "Go to your profile settings by clicking your avatar in the top right corner. You can update your name, email, and other details there."
      }
    ]
  },
  {
    title: "Trading Issues",
    icon: FaExclamationTriangle,
    items: [
      {
        question: "Why can't I place a trade?",
        answer: "Common reasons include: insufficient funds, market is closed or resolved, or you've reached your position limit. Check your balance and market status."
      },
      {
        question: "How do I cancel a pending order?",
        answer: "Go to your 'Active Orders' tab in your portfolio, find the pending order, and click the 'Cancel' button next to it."
      },
      {
        question: "What happens if a market is voided?",
        answer: "If a market is voided, all trades are reversed and funds are returned to traders' accounts. You'll receive a notification explaining the reason."
      }
    ]
  },
  {
    title: "Technical Support",
    icon: FaTools,
    items: [
      {
        question: "The site is loading slowly",
        answer: "Try clearing your browser cache and cookies. If the issue persists, check your internet connection or try a different browser."
      },
      {
        question: "I'm seeing error messages",
        answer: "Take a screenshot of the error, note what you were doing when it occurred, and contact our support team with these details."
      },
      {
        question: "The charts aren't displaying correctly",
        answer: "Ensure your browser is up to date and JavaScript is enabled. Try refreshing the page or using a different browser."
      }
    ]
  }
];

const contactMethods = [
  {
    title: "Email Support",
    icon: FaEnvelope,
    description: "Get help via email within 24 hours",
    link: "mailto:support@forecast254.com",
    buttonText: "Send Email"
  },
  {
    title: "Discord Community",
    icon: FaDiscord,
    description: "Join our community for real-time help",
    link: "https://discord.gg/forecast254",
    buttonText: "Join Discord"
  },
  {
    title: "Twitter Support",
    icon: FaTwitter,
    description: "Follow us for updates and support",
    link: "https://twitter.com/forecast254",
    buttonText: "Follow Us"
  }
];

export default function HelpPage() {
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
            placeholder="Search for help..."
            className="w-full px-4 py-3 pl-12 rounded-lg bg-background/95 border border-border/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {sections.map((section, index) => (
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
          ))}
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
