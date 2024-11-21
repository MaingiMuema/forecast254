'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaSearch,
  FaChartLine,
  FaTrophy,
  FaBook,
  FaQuestionCircle,
  FaBars,
  FaTimes,
  FaSun,
  FaMoon,
  FaChartPie,
  FaNewspaper
} from "react-icons/fa";
import { XMarkIcon } from '@heroicons/react/24/outline';
import Spinner from '@/components/ui/Spinner';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await response.json();
          
          if (response.ok) {
            setSearchResults(data.markets);
            setShowResults(true);
          } else {
            console.error('Search error:', data.error);
          }
        } catch (error) {
          console.error('Failed to fetch search results:', error);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSignOut = async () => {
    try {
      setIsMenuOpen(false); // Close mobile menu if open
      
      // Disable the signout button to prevent double-clicks
      const button = document.activeElement;
      if (button) button.disabled = true;
      
      await signOut();
      
      // Re-enable the button
      if (button) button.disabled = false;
      
      // Force a re-render of the header
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
      // Re-enable the button in case of error
      const button = document.activeElement;
      if (button) button.disabled = false;
    }
  };

  // Effect to handle auth state changes
  useEffect(() => {
    if (!loading) {
      // Only log when loading completes
      console.log('Auth state in header:', { user, loading });
    }
  }, [user, loading]);

  // Effect to close mobile menu on navigation
  useEffect(() => {
    if (isMenuOpen) {
      const handleScroll = () => setIsMenuOpen(false);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMenuOpen]);

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
           {/* <Link href="/feeds" className="nav-link">
              <FaNewspaper className="text-sm" />
              <span>Feeds</span>
            </Link>
            */}
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
          <div className="hidden md:flex items-center flex-1 mx-8" ref={searchRef}>
            <div className="relative w-full max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg bg-secondary/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isSearching ? (
                    <Spinner className="text-muted-foreground" />
                  ) : (
                    <FaSearch className="text-muted-foreground" />
                  )}
                </div>
              </div>
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div 
                  className="absolute w-full mt-2 bg-background border border-border/40 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'hsl(var(--muted-foreground) / 0.2) transparent',
                    msOverflowStyle: 'thin',
                  }}
                >
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      width: 4px;
                    }
                    div::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    div::-webkit-scrollbar-thumb {
                      background: hsl(var(--muted-foreground) / 0.2);
                      border-radius: 20px;
                    }
                    div::-webkit-scrollbar-thumb:hover {
                      background: hsl(var(--muted-foreground) / 0.3);
                    }
                  `}</style>
                  {searchResults.map((market) => (
                    <Link
                      key={market.id}
                      href={`/markets/${market.id}`}
                      className="block p-4 hover:bg-accent border-b border-border/40 last:border-0"
                      onClick={() => setShowResults(false)}
                    >
                      <h3 className="font-medium text-foreground">{market.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {market.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                          {market.category}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* No Results Message */}
              {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="absolute w-full mt-2 bg-background border border-border/40 rounded-lg shadow-lg z-50 p-4">
                  <p className="text-muted-foreground text-center">No markets found</p>
                </div>
              )}
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
              {loading ? (
                <Spinner className="w-4 h-4" />
              ) : user ? (
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
          <div className={`
            md:hidden fixed inset-0 z-50
            bg-background/80 backdrop-blur-sm
            dark:bg-gray-900/80
            ${isMenuOpen ? 'block' : 'hidden'}
          `}>
            <div className="container mx-auto px-4 py-8 bg-background dark:bg-gray-900 min-h-screen relative">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/80 transition-colors"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-6 h-6 text-foreground" />
              </button>

              <div className="space-y-4 mt-8">
                <Link href="/markets" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                  <FaChartLine className="text-lg" />
                  <span>Markets</span>
                </Link>
                <Link
                  href="/news"
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaNewspaper className="text-lg" />
                  <span>Feeds</span>
                </Link>
                <Link href="/leaderboard" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                  <FaTrophy className="text-lg" />
                  <span>Leaderboard</span>
                </Link>
                <Link href="/learn" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                  <FaBook className="text-lg" />
                  <span>Learn</span>
                </Link>
                <Link href="/help" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>
                  <FaQuestionCircle className="text-lg" />
                  <span>Help</span>
                </Link>
              </div>

              <div className="pt-4 border-t border-border/40">
                {loading ? (
                  <Spinner className="w-4 h-4" />
                ) : user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2 py-2 text-foreground hover:text-primary transition-colors"
                    >
                      <FaChartPie className="w-4 h-4" />
                      <span>Dashboard</span>
                     
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
