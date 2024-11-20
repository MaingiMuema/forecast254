'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import BlogCard from '@/components/blog/BlogCard';
import FeaturedPost from '@/components/blog/FeaturedPost';

// Mock data - Replace with actual data from your API
const mockPosts = [
  {
    slug: 'introduction-to-predictive-markets',
    title: 'Introduction to Predictive Markets: A Beginner\'s Guide',
    excerpt: 'Learn how predictive markets work and why they\'re becoming increasingly popular in forecasting future events.',
    coverImage: '/images/blog/predictive-markets.jpg',
    author: 'Mark Maingi',
    date: 'Jan 15, 2024',
    readTime: '5 min',
    category: 'Market Analysis',
  },
  {
    slug: 'market-validation-process',
    title: 'The Market Validation Process: Ensuring Accurate Outcomes',
    excerpt: 'Dive deep into how we ensure market outcomes are validated accurately and fairly.',
    coverImage: '/images/blog/market-validation.jpg',
    author: 'Sarah Johnson',
    date: 'Jan 12, 2024',
    readTime: '7 min',
    category: 'Platform Updates',
  },
  {
    slug: 'forecast254-success-stories',
    title: 'Success Stories: How Users Are Winning on Forecast254',
    excerpt: 'Real stories from our users about their successful predictions and strategies.',
    coverImage: '/images/blog/success-stories.jpg',
    author: 'David Kimani',
    date: 'Jan 10, 2024',
    readTime: '6 min',
    category: 'Success Stories',
  },
];

const categories = [
  'All',
  'Market Analysis',
  'Success Stories',
  'Platform Updates',
  'Tips & Strategies',
  'Community',
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredPost = mockPosts[0];
  const regularPosts = mockPosts.slice(1);

  const filteredPosts = regularPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-emerald-50/30 py-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-800">
            Latest Updates
          </span>
          <h1 className="mb-4 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-4xl font-bold text-transparent md:text-5xl lg:text-6xl">
            Forecast254 Blog
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Insights, updates, and stories from the world of predictive markets. Stay informed about the latest trends and strategies.
          </p>
        </motion.div>

        {/* Featured Post */}
        <div className="mb-12">
          <FeaturedPost post={featuredPost} />
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 flex flex-col space-y-6 rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur-sm md:flex-row md:items-center md:justify-between md:space-y-0"
        >
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 md:w-64"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-emerald-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Blog Posts Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredPosts.map((post) => (
            <motion.div key={post.slug} variants={item}>
              <BlogCard post={post} />
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-12 rounded-2xl bg-white/80 p-12 text-center shadow-lg backdrop-blur-sm"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <FaSearch className="text-3xl text-emerald-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">No Posts Found</h3>
            <p className="text-gray-600">
              No posts found matching your criteria. Try adjusting your search or filters.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
