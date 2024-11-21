'use client';

import NewsSection from './NewsSection';

const categories = [
  'politics',
  'business',
  'lifestyle',
  'sports',
  'entertainment'
];

export default function NewsGrid() {
  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Latest News</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div key={category} className="bg-background/60 p-4 rounded-lg shadow-lg">
            <NewsSection category={category} limit={3} />
          </div>
        ))}
      </div>
    </section>
  );
}
