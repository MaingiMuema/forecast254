'use client';

import React from 'react';
import Link from 'next/link';
import { FaTwitter, FaDiscord, FaTelegram, FaGithub, FaChartLine } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    markets: [
      { label: 'Featured Markets', href: '/markets/featured' },
      { label: 'Trending Markets', href: '/markets/trending' },
      { label: 'Create Market', href: '/markets/create' },
      { label: 'Market Rules', href: '/markets/rules' },
    ],
    resources: [
      { label: 'How It Works', href: '/learn' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Documentation', href: '/docs' },
      { label: 'API', href: '/api' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  };

  const socialLinks = [
    { icon: FaTwitter, href: 'https://twitter.com/forecast254', label: 'Twitter' },
    { icon: FaDiscord, href: 'https://discord.gg/forecast254', label: 'Discord' },
    { icon: FaTelegram, href: 'https://t.me/forecast254', label: 'Telegram' },
    { icon: FaGithub, href: 'https://github.com/forecast254', label: 'GitHub' },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
          <Link href="/" className="flex items-center space-x-2">
            <FaChartLine className="text-emerald-400 text-2xl" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Forecast254
            </span>
          </Link>
            <p className="text-muted-foreground mb-4">
              Kenya&apos;s first prediction market platform. Trade on future events and earn rewards
              for accurate predictions.
            </p>
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8 lg:col-span-4">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Markets</h3>
              <ul className="space-y-3">
                {footerLinks.markets.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} Forecast254. All rights reserved.
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Built in Nairobi 🇰🇪</span>
              <span className="text-primary">•</span>
              <span>Powered by Smatica</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
