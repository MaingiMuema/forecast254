"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  FaBars,
  FaTimes,
  FaChartLine,
  FaSearch,
  FaBook,
  FaTrophy,
  FaQuestionCircle,
} from "react-icons/fa";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <FaChartLine className="text-emerald-400 text-2xl" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Forecast254
            </span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center flex-1 mx-8">
            <div className="relative w-full max-w-xl">
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/markets"
              className="flex items-center space-x-1 hover:text-emerald-400 transition-colors"
            >
              <FaChartLine className="text-sm" />
              <span>Markets</span>
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center space-x-1 hover:text-emerald-400 transition-colors"
            >
              <FaTrophy className="text-sm" />
              <span>Leaderboard</span>
            </Link>
            <Link
              href="/learn"
              className="flex items-center space-x-1 hover:text-emerald-400 transition-colors"
            >
              <FaBook className="text-sm" />
              <span>Learn</span>
            </Link>
            <Link
              href="/help"
              className="flex items-center space-x-1 hover:text-emerald-400 transition-colors"
            >
              <FaQuestionCircle className="text-sm" />
              <span>Help</span>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/login"
                className="flex items-center space-x-1 hover:text-emerald-400 transition-colors"
              >
                <span>Login</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center space-x-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col space-y-4">
              <Link
                href="/markets"
                className="flex items-center space-x-2 hover:text-emerald-400 transition-colors"
              >
                <FaChartLine />
                <span>Markets</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center space-x-2 hover:text-emerald-400 transition-colors"
              >
                <FaTrophy />
                <span>Leaderboard</span>
              </Link>
              <Link
                href="/learn"
                className="flex items-center space-x-2 hover:text-emerald-400 transition-colors"
              >
                <FaBook />
                <span>Learn</span>
              </Link>
              <Link
                href="/help"
                className="flex items-center space-x-2 hover:text-emerald-400 transition-colors"
              >
                <FaQuestionCircle />
                <span>Help</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center space-x-2 hover:text-emerald-400 transition-colors"
              >
                <span>Login</span>
              </Link>
              <Link
                href="/signup"
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
