import axios from 'axios';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import NodeCache from 'node-cache';
import { retry } from '@lifeomic/attempt';
import { logger } from '@/utils/logger';

// Initialize cache with a checkperiod of 600 seconds and disable clone
const cache = new NodeCache({ 
  checkperiod: 600,
  useClones: false,
  stdTTL: 3600 // Cache for 1 hour
});

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  category: string;
  source: string;
}

class KenyanNewsService {
  private parser: Parser;
  private sources: {
    category: string;
    feeds: { url: string; source: string; type: 'rss' }[];
  }[];

  constructor() {
    this.parser = new Parser({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      defaultRSS: 2.0,
      customFields: {
        item: ['media:content', 'content:encoded', 'description']
      }
    });

    this.sources = [
      {
        category: 'politics',
        feeds: [
          { url: 'https://www.capitalfm.co.ke/news/feed/', source: 'Capital FM', type: 'rss' }
        ]
      },
      {
        category: 'business',
        feeds: [
          { url: 'https://www.capitalfm.co.ke/business/feed/', source: 'Capital FM Business', type: 'rss' }
        ]
      },
      {
        category: 'sports',
        feeds: [
          { url: 'https://www.capitalfm.co.ke/sports/feed/', source: 'Capital FM Sports', type: 'rss' }
        ]
      },
      {
        category: 'entertainment',
        feeds: [
          { url: 'https://www.pulselive.co.ke/entertainment/rss', source: 'Pulse Live Entertainment', type: 'rss' }
        ]
      },
      {
        category: 'lifestyle',
        feeds: [
          { url: 'https://www.pulselive.co.ke/lifestyle/rss', source: 'Pulse Live Lifestyle', type: 'rss' }
        ]
      },
    ];
  }

  private async fetchRSSFeed(feed: { url: string; source: string }, category: string): Promise<NewsItem[]> {
    return retry(
      async () => {
        try {
          logger.info(`Fetching RSS feed: ${feed.source} for category: ${category}`);
          const response = await axios.get(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/rss+xml,application/xml;q=0.9',
              'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 15000
          });

          const feedData = await this.parser.parseString(response.data);
          const news = feedData.items.map(item => ({
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
            content: item.contentSnippet || item['content:encoded'] || item.description || '',
            category,
            source: feed.source
          }));

          logger.info(`Successfully fetched ${news.length} articles from RSS feed ${feed.source}`);
          return news;
        } catch (error) {
          logger.error(`Error fetching RSS feed from ${feed.source}:`, error);
          throw error;
        }
      },
      {
        maxAttempts: 3,
        delay: 1000,
        factor: 2,
        handleError: (error: Error, context: { attemptNum: number }) => {
          logger.error(`Failed to fetch RSS feed ${feed.source} after ${context.attemptNum} attempts: ${error.message}`);
          // Throw error on final attempt, otherwise continue retrying
          if (context.attemptNum === 3) {
            throw error;
          }
        }
      }
    ).catch(() => {
      logger.warn(`All retry attempts failed for RSS feed ${feed.source}. Returning empty array.`);
      return [];
    });
  }

  async getNewsByCategory(category: string, limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `news_${category}_${limit}`;
    const cachedNews = cache.get<NewsItem[]>(cacheKey);
    
    if (cachedNews) {
      return cachedNews;
    }

    try {
      const categorySource = this.sources.find(source => source.category.toLowerCase() === category.toLowerCase());
      
      if (!categorySource) {
        const availableCategories = this.sources.map(s => s.category).join(', ');
        throw new Error(`Category "${category}" not found. Available categories are: ${availableCategories}`);
      }

      const allNews: NewsItem[] = [];
      
      for (const feed of categorySource.feeds) {
        try {
          const items = await this.fetchRSSFeed(feed, category);
          allNews.push(...items);
        } catch (error) {
          console.error(`Error fetching feed ${feed.url}:`, error);
          continue;
        }
      }

      // Sort by date (newest first) and limit
      const sortedNews = allNews
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .slice(0, limit);

      cache.set(cacheKey, sortedNews);
      return sortedNews;
    } catch (error) {
      console.error('Error fetching news by category:', error);
      throw error;
    }
  }

  async saveToDatabase(news: NewsItem[]) {
    if (!news.length) {
      logger.info('No news items to save to database');
      return;
    }

    try {
      const { error } = await supabase
        .from('news_articles')
        .insert(
          news.map(item => ({
            title: item.title,
            content: item.content || '',
            url: item.link,
            category: item.category,
            source: item.source,
            published_at: item.pubDate
          }))
        );

      if (error) {
        logger.error('Error saving news to database:', error);
      } else {
        logger.info(`Successfully saved ${news.length} articles to database`);
      }
    } catch (error) {
      logger.error('Unexpected error while saving to database:', error);
    }
  }
}

export const kenyanNewsService = new KenyanNewsService();
