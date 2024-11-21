/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import CreatePost from '@/components/Feed/CreatePost';
import FeedPost from '@/components/Feed/FeedPost';
import TrendingMarkets from '@/components/Feed/TrendingMarkets';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@supabase/supabase-js';

interface MarketRef {
  title: string;
  probability: string;
  trend: 'up' | 'down';
}

interface NewPost {
  content: string;
  marketRef?: MarketRef;
  image?: string;
  poll?: {
    question: string;
    options: string[];
  };
}

interface Post extends NewPost {
  id: number;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

export default function FeedsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: {
        name: 'John Doe',
        username: '@johndoe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
      },
      content: 'Just opened a position on the upcoming elections market. The odds are looking favorable! 📈 #KenyaElections',
      timestamp: '2h ago',
      likes: 24,
      comments: 12,
      shares: 5,
      marketRef: {
        title: 'Kenya Elections 2024',
        probability: '67%',
        trend: 'up'
      }
    },
    {
      id: 2,
      author: {
        name: 'Jane Smith',
        username: '@janesmith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
      },
      content: 'The tech sector is showing interesting movements. What are your thoughts on the Silicon Savannah market? 💭',
      timestamp: '4h ago',
      likes: 18,
      comments: 8,
      shares: 3,
      marketRef: {
        title: 'Silicon Savannah Growth',
        probability: '82%',
        trend: 'up'
      }
    }
  ]);

  const handleNewPost = (post: NewPost) => {
    setPosts([
      {
        id: Date.now(),
        author: {
          name: user?.user_metadata?.full_name || 'Anonymous',
          username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'anonymous',
          avatar: user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'anon'}`
        },
        ...post,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0
      },
      ...posts
    ]);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-8">
          <div className="space-y-6">
            <CreatePost onPost={handleNewPost} />
            <div className="space-y-4">
              {posts.map((post) => (
                <FeedPost key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <TrendingMarkets />
          </div>
        </div>
      </div>
    </main>
  );
}
