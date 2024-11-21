/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { FaImage, FaPoll, FaChartLine } from 'react-icons/fa';
import MarketSelector from './MarketSelector';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';

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

interface NewPost {
  content: string;
  marketRef?: MarketRef;
  image?: string;
  poll?: {
    question: string;
    options: string[];
  };
}

interface CreatePostProps {
  onPost: (post: NewPost) => void;
}

export default function CreatePost({ onPost }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketRef | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    onPost({
      content,
      marketRef: selectedMarket || undefined
    });

    setContent('');
    setSelectedMarket(null);
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
      <div className="flex gap-4 p-4">
        <Image
          src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'anon'}`}
          alt="Profile"
          width={48}
          height={48}
          className="rounded-full"
        />
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in the markets?"
              className="w-full bg-background rounded-lg p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            
            {selectedMarket && (
              <div className="mt-2 flex items-center space-x-2 bg-accent/50 rounded-lg p-2">
                <FaChartLine className="text-primary" />
                <span className="text-sm">{selectedMarket.title}</span>
                <button
                  type="button"
                  onClick={() => setSelectedMarket(null)}
                  className="ml-auto text-sm text-muted-foreground hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  type="button"
                  className="text-primary hover:text-primary/80"
                  title="Add image"
                >
                  <FaImage />
                </button>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80"
                  title="Create poll"
                >
                  <FaPoll />
                </button>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80"
                  onClick={() => setShowMarketSelector(true)}
                  title="Link market"
                >
                  <FaChartLine />
                </button>
              </div>
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </div>

      {showMarketSelector && (
        <MarketSelector
          onSelect={(market) => {
            setSelectedMarket(market);
            setShowMarketSelector(false);
          }}
          onClose={() => setShowMarketSelector(false)}
        />
      )}
    </div>
  );
}
