/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import Parser from 'rss-parser';
import axios from 'axios';
import { retry } from '@lifeomic/attempt';
import { logger } from '@/utils/logger';
import NodeCache from 'node-cache';

// Initialize cache with a checkperiod of 600 seconds
const cache = new NodeCache({ 
  checkperiod: 600,
  useClones: false,
  stdTTL: 3600 // Cache for 1 hour
});

// Initialize Supabase admin client
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

interface RSSFeed {
  url: string;
  source: string;
  type: 'rss';
}

interface NewsSource {
  category: string;
  feeds: RSSFeed[];
}

export class DataCollectionService {
  private static instance: DataCollectionService;
  private parser: Parser;
  private sources: NewsSource[];
  private isCollecting: boolean = false;

  private constructor() {
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
      }
    ];
  }

  public static getInstance(): DataCollectionService {
    if (!DataCollectionService.instance) {
      DataCollectionService.instance = new DataCollectionService();
    }
    return DataCollectionService.instance;
  }

  private async fetchRSSFeed(feed: RSSFeed, category: string): Promise<NewsItem[]> {
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

  public async collectData(): Promise<void> {
    if (this.isCollecting) {
      logger.warn('Data collection already in progress');
      return;
    }

    this.isCollecting = true;
    try {
      for (const source of this.sources) {
        const allNews: NewsItem[] = [];
        
        for (const feed of source.feeds) {
          const news = await this.fetchRSSFeed(feed, source.category);
          allNews.push(...news);
        }

        if (allNews.length > 0) {
          await this.saveToDatabase(allNews);
        }
      }
    } catch (error) {
      logger.error('Error during data collection:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  private async saveToDatabase(news: NewsItem[]): Promise<void> {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('news_articles')
        .upsert(
          news.map(item => ({
            title: item.title,
            content: item.content || '',  // Ensure content is not undefined
            url: item.link,
            category: item.category,
            published_at: new Date(item.pubDate).toISOString(),
            created_at: now,
            updated_at: now,
            has_market: false,
            status: 'published'
          })),
          { onConflict: 'url' }
        );

      if (error) {
        throw error;
      }

      logger.info(`Successfully saved ${news.length} articles to database`);
    } catch (error) {
      logger.error('Error saving news to database:', error);
      throw error;
    }
  }
}

export const dataCollectionService = DataCollectionService.getInstance();
