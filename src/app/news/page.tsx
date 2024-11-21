'use client';

import { useState } from 'react';
import NewsSection from '@/components/News/NewsSection';

const categories = [
  'politics',
  'business',
  'lifestyle',
  'sports',
  'entertainment',
];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('politics');

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">News</h1>
      
      {/* Category Selection */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent hover:bg-accent/80'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* News Content */}
      <div className="bg-background/60 p-6 rounded-lg shadow-lg">
        <NewsSection category={selectedCategory} limit={10} />
      </div>
    </main>
  );
}
