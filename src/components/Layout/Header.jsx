"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  FaBars,
  FaTimes,
  FaChartLine,
  FaSearch,
  FaBook,
  FaTrophy,
  FaQuestionCircle,
  FaSun,
  FaMoon,
  FaUser,
  FaChartPie
} from "react-icons/fa";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <FaChartLine className="text-emerald-400 text-2xl" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Forecast254
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 px-5">
            <Link href="/markets" className="nav-link">
              <FaChartLine className="text-sm" />
              <span>Markets</span>
            </Link>
            <Link href="/leaderboard" className="nav-link">
              <FaTrophy className="text-sm" />
              <span>Leaderboard</span>
            </Link>
            <Link href="/learn" className="nav-link">
              <FaBook className="text-sm" />
              <span>Learn</span>
            </Link>
            <Link href="/help" className="nav-link">
              <FaQuestionCircle className="text-sm" />
              <span>Help</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 mx-8">
            <div className="relative w-full max-w-xl">
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-secondary/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <FaSearch className="absolute right-3 top-3 text-muted-foreground" />
            </div>
          </div>

          {/* Right Section: Theme Toggle, Login, Sign Up */}
          <div className="flex items-center space-x-4 px-5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-accent text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <FaSun className="w-5 h-5" />
              ) : (
                <FaMoon className="w-5 h-5" />
              )}
            </button>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
                  >
                    <FaChartPie className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-secondary/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <FaSearch className="absolute right-3 top-3 text-muted-foreground" />
            </div>

            <div className="flex flex-col space-y-4">
              <Link href="/markets" className="mobile-nav-link">
                <FaChartLine />
                <span>Markets</span>
              </Link>
              <Link href="/leaderboard" className="mobile-nav-link">
                <FaTrophy />
                <span>Leaderboard</span>
              </Link>
              <Link href="/learn" className="mobile-nav-link">
                <FaBook />
                <span>Learn</span>
              </Link>
              <Link href="/help" className="mobile-nav-link">
                <FaQuestionCircle />
                <span>Help</span>
              </Link>
              <div className="pt-4 border-t border-border/40">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 py-2 text-foreground hover:text-primary transition-colors"
                    >
                      <FaUser className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left py-2 text-foreground hover:text-primary transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block w-full text-center py-2 text-foreground hover:text-primary transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block w-full text-center mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
