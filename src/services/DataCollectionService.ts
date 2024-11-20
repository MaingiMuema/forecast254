/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase admin client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NewsArticle {
  title: string;
  content: string;
  url: string;
  category: string;
  published_at: string;
}

interface NewsSource {
  name: string;
  url: string;
  apiUrl: string;
  category: string;
  lastFetched?: Date;
  consecutiveFailures?: number;
}

export class DataCollectionService {
  private static instance: DataCollectionService;
  private isCollecting: boolean = false;
  private retryDelays: { [key: string]: number } = {};
  private maxRetries = 3;
  private requestDelay = 2000; // 2 seconds between requests
  private sourceDelay = 5000;  // 5 seconds between sources
  private maxConsecutiveFailures = 3;
  private rateLimitCooldown = 60 * 60 * 1000; // 1 hour cooldown
  private sources: NewsSource[] = [];
  private lastSourceUpdate: Date = new Date(0);
  private sourceUpdateInterval = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.initializeSources();
  }

  public static getInstance(): DataCollectionService {
    if (!DataCollectionService.instance) {
      DataCollectionService.instance = new DataCollectionService();
    }
    return DataCollectionService.instance;
  }

  private initializeSources(): void {
    this.sources = [
      {
        name: 'nation.africa',
        url: 'https://nation.africa',
        apiUrl: 'https://newsapi.org/v2/everything?domains=nation.africa&language=en&pageSize=5&sortBy=publishedAt',
        category: 'news',
        consecutiveFailures: 0
      },
      {
        name: 'standardmedia.co.ke',
        url: 'https://www.standardmedia.co.ke',
        apiUrl: 'https://newsapi.org/v2/everything?domains=standardmedia.co.ke&language=en&pageSize=5&sortBy=publishedAt',
        category: 'news',
        consecutiveFailures: 0
      },
      {
        name: 'the-star.co.ke',
        url: 'https://www.the-star.co.ke',
        apiUrl: 'https://newsapi.org/v2/everything?domains=the-star.co.ke&language=en&pageSize=5&sortBy=publishedAt',
        category: 'news',
        consecutiveFailures: 0
      },
      {
        name: 'capitalfm.co.ke',
        url: 'https://www.capitalfm.co.ke',
        apiUrl: 'https://newsapi.org/v2/everything?domains=capitalfm.co.ke&language=en&pageSize=5&sortBy=publishedAt',
        category: 'news',
        consecutiveFailures: 0
      }
    ];
  }

  private shouldUpdateSources(): boolean {
    return Date.now() - this.lastSourceUpdate.getTime() > this.sourceUpdateInterval;
  }

  private async updateSourceStatus(): Promise<void> {
    this.lastSourceUpdate = new Date();
    
    // Reset sources that have been in cooldown for long enough
    for (const source of this.sources) {
      if (source.lastFetched && Date.now() - source.lastFetched.getTime() > this.rateLimitCooldown) {
        source.consecutiveFailures = 0;
        delete source.lastFetched;
      }
    }
  }

  private getAvailableSources(): NewsSource[] {
    return this.sources.filter(source => 
      !source.lastFetched || 
      Date.now() - source.lastFetched.getTime() > this.rateLimitCooldown
    );
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, options: RequestInit, source: NewsSource, retryCount = 0): Promise<Response> {
    try {
      // Check if source is in cooldown
      if (source.lastFetched && Date.now() - source.lastFetched.getTime() < this.rateLimitCooldown) {
        const remainingCooldown = Math.ceil((this.rateLimitCooldown - (Date.now() - source.lastFetched.getTime())) / 1000);
        console.log(`${source.name} is in cooldown. ${remainingCooldown}s remaining.`);
        throw new Error(`Rate limit cooldown for ${source.name}. Try again in ${remainingCooldown}s`);
      }

      // Add delay between requests
      const delay = retryCount > 0 
        ? Math.min(2 ** retryCount * 2000 + Math.random() * 1000, 30000) 
        : this.requestDelay;
      
      console.log(`Waiting ${Math.round(delay / 1000)}s before ${retryCount > 0 ? 'retry ' + retryCount : 'request'}...`);
      await this.wait(delay);

      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limit hit
        if (retryCount >= this.maxRetries) {
          source.consecutiveFailures = (source.consecutiveFailures || 0) + 1;
          source.lastFetched = new Date();
          this.retryDelays[source.name] = Date.now() + this.rateLimitCooldown;
          console.log(`Rate limit exceeded for ${source.name}. Cooling down for ${this.rateLimitCooldown / 1000}s`);
          throw new Error(`Rate limit exceeded for ${source.name}`);
        }

        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(2 ** retryCount * 2000 + Math.random() * 1000, 30000);
        
        console.log(`Rate limit hit for ${source.name}. Retrying in ${Math.round(waitTime / 1000)}s...`);
        await this.wait(waitTime);
        return this.fetchWithRetry(url, options, source, retryCount + 1);
      }

      // Reset consecutive failures and retry delay on successful request
      source.consecutiveFailures = 0;
      delete this.retryDelays[source.name];
      return response;
    } catch (error) {
      source.consecutiveFailures = (source.consecutiveFailures || 0) + 1;
      throw error;
    }
  }

  private async fetchArticlesForSource(source: NewsSource): Promise<NewsArticle[]> {
    try {
      console.log(`Fetching articles from ${source.name}`);

      if (source.consecutiveFailures && source.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.log(`Skipping ${source.name} due to too many consecutive failures`);
        return [];
      }

      const response = await this.fetchWithRetry(
        source.apiUrl,
        {
          headers: {
            'X-Api-Key': process.env.NEWS_API_KEY!
          }
        },
        source
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      source.lastFetched = new Date();

      if (!data.articles || !Array.isArray(data.articles)) {
        console.log(`No valid articles found for ${source.name}`);
        return [];
      }

      console.log(`Found ${data.articles.length} articles from ${source.name}`);

      return data.articles
        .filter((article: any) => article.title && article.content && article.url)
        .map((article: any) => ({
          title: article.title,
          content: article.content || article.description,
          url: article.url,
          category: source.category,
          published_at: article.publishedAt
        }));
    } catch (error) {
      console.error(`Error fetching articles from ${source.name}:`, error);
      return [];
    }
  }

  private async insertArticle(article: NewsArticle): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('news_articles')
        .insert({
          title: article.title,
          content: article.content,
          url: article.url,
          category: article.category,
          published_at: article.published_at,
          has_market: false,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          return false; // Article already exists
        }
        console.error('Error inserting article:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error inserting article:', error);
      return false;
    }
  }

  private async collectData(): Promise<{ inserted: number; updated: number; skipped: number }> {
    console.log(`Starting data collection at ${new Date().toISOString()}`);
    
    if (this.shouldUpdateSources()) {
      await this.updateSourceStatus();
    }

    const availableSources = this.getAvailableSources();
    console.log(`Found ${availableSources.length} available sources`);

    let inserted = 0;
    const updated = 0;
    let skipped = 0;

    for (const source of availableSources) {
      try {
        console.log(`Processing source: ${source.name}`);
        const articles = await this.fetchArticlesForSource(source);
        
        let validArticles = 0;
        for (const article of articles) {
          const wasInserted = await this.insertArticle(article);
          if (wasInserted) {
            inserted++;
            validArticles++;
          } else {
            skipped++;
          }
        }

        console.log(`Processed ${validArticles} valid articles from ${source.name}`);
        
        // Add delay between sources
        if (availableSources.indexOf(source) < availableSources.length - 1) {
          console.log(`Waiting ${this.sourceDelay / 1000}s between sources...`);
          await this.wait(this.sourceDelay);
        }
      } catch (error) {
        console.error(`Error processing source ${source.name}:`, error);
      }
    }

    console.log(`Total articles collected: ${inserted + updated}`);
    console.log(`Data collection completed at ${new Date().toISOString()}`);
    return { inserted, updated, skipped };
  }

  public async triggerDataCollection(): Promise<{ inserted: number; updated: number; skipped: number }> {
    if (this.isCollecting) {
      console.log('Data collection already in progress');
      return { inserted: 0, updated: 0, skipped: 0 };
    }

    this.isCollecting = true;
    try {
      return await this.collectData();
    } finally {
      this.isCollecting = false;
    }
  }
}
