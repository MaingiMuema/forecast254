'use client';

import { useState } from 'react';
import { FaHeart, FaComment, FaShare, FaChartLine, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Author {
  name: string;
  username: string;
  avatar: string;
}

interface MarketRef {
  title: string;
  probability: string;
  trend: 'up' | 'down';
}

interface Post {
  id: number;
  author: Author;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  marketRef?: MarketRef;
}

interface FeedPostProps {
  post: Post;
}

export default function FeedPost({ post }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 shadow-sm border border-border"
    >
      {/* Author Info */}
      <div className="flex items-start space-x-3">
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{post.author.name}</span>
            <span className="text-sm text-muted-foreground">{post.author.username}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{post.timestamp}</span>
          </div>
          <p className="mt-2 text-foreground">{post.content}</p>
        </div>
      </div>

      {/* Market Reference */}
      {post.marketRef && (
        <div className="mt-3 flex items-center space-x-2 bg-accent/50 rounded-lg p-3">
          <FaChartLine className="text-primary" />
          <div className="flex-1">
            <p className="font-medium">{post.marketRef.title}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-muted-foreground">Current probability:</span>
              <span className={`text-sm font-medium ${
                post.marketRef.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {post.marketRef.probability}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Buttons */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={handleLike}
          className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            className={isLiked ? 'text-primary' : ''}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
          </motion.div>
          <span className="text-sm">{likes}</span>
        </button>

        <button className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
          <FaComment />
          <span className="text-sm">{post.comments}</span>
        </button>

        <button className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
          <FaShare />
          <span className="text-sm">{post.shares}</span>
        </button>
      </div>
    </motion.div>
  );
}
