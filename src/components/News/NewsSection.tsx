'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  category: string;
  source: string;
}

interface NewsSectionProps {
  category: string;
  limit: number;
}

export default function NewsSection({ category, limit }: NewsSectionProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/news-markets?category=${category}&limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        setNews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [category, limit]);

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(limit).fill(0).map((_, i) => (
          <Card key={i} className="bg-background/60">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.map((item, index) => (
        <Card key={index} className="bg-background/60 hover:bg-background/80 transition-colors">
          <CardContent className="p-4">
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <h3 className="font-semibold text-foreground hover:text-primary mb-2">
                {item.title}
              </h3>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{item.source}</span>
                <span>{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}</span>
              </div>
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}