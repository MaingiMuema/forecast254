/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Initialize admin client for database operations
const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Define news sources
const KENYAN_NEWS_SOURCES = [
  'nation.africa',
  'standardmedia.co.ke',
  'the-star.co.ke',
  'capitalfm.co.ke'
];

// Define categories and their keywords
const CATEGORIES = {
  sports: ['sports', 'football', 'rugby', 'athletics', 'cricket', 'basketball'],
  politics: ['politics', 'government', 'election', 'parliament', 'president', 'democracy'],
  entertainment: ['entertainment', 'music', 'movie', 'celebrity', 'arts', 'culture'],
  business: ['business', 'economy', 'market', 'finance', 'trade', 'investment'],
  tech: ['technology', 'tech', 'innovation', 'digital', 'software', 'startup'],
  education: ['education', 'school', 'university', 'student', 'learning', 'academic']
};

interface NewsArticle {
  title: string;
  content: string;
  url: string;
  category: string;
  published_at: Date;
  source: string;
  author: string;
  description: string;
  image_url: string | null;
}

class DataCollectionService {
  private static instance: DataCollectionService;
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;

  private constructor() {
    // Initialize the cron job to run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.collectData();
    });
  }

  public static getInstance(): DataCollectionService {
    if (!DataCollectionService.instance) {
      DataCollectionService.instance = new DataCollectionService();
    }
    return DataCollectionService.instance;
  }

  private async fetchArticlesForSource(source: string): Promise<any[]> {
    try {
      console.log(`Fetching articles from ${source}`);
      const response = await fetch(
        `https://newsapi.org/v2/everything?domains=${source}&apiKey=${process.env.NEWS_API_KEY}&pageSize=100&language=en`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched ${data.articles?.length || 0} articles from ${source}`);
      return data.articles || [];
    } catch (error) {
      console.error(`Error fetching articles from ${source}:`, error);
      return [];
    }
  }

  private async processArticles(articles: any[], source: string): Promise<any[]> {
    console.log(`Found ${articles.length} articles from ${source}`);
    const validArticles = articles.map(article => {
      const category = this.categorizeArticle(article);
      const publishedAt = new Date(article.publishedAt || new Date()).toISOString();
      console.log(`Processing article: ${article.title}, Published at: ${publishedAt}`);
      
      return {
        title: article.title,
        url: article.url,
        source: source,
        author: article.author || 'Unknown',
        description: article.description || '',
        content: article.content || '',
        published_at: publishedAt,
        image_url: article.urlToImage || null,
        category: category
      };
    });
    console.log(`Processed ${validArticles.length} valid articles from ${source}`);
    return validArticles;
  }

  private categorizeArticle(article: any): string {
    const text = `${article.title} ${article.description}`.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    return 'general'; // Default category if no match found
  }

  private async collectData(): Promise<void> {
    if (this.isRunning) {
      console.log('Data collection already in progress');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    console.log(`Starting data collection at ${startTime.toISOString()}`);

    try {
      const articles: NewsArticle[] = [];

      // Fetch articles from each source
      for (const source of KENYAN_NEWS_SOURCES) {
        console.log(`Processing source: ${source}`);
        try {
          const fetchedArticles = await this.fetchArticlesForSource(source);
          const processedArticles = await this.processArticles(fetchedArticles, source);
          articles.push(...processedArticles);
        } catch (error) {
          console.error(`Error processing source ${source}:`, error);
          continue;
        }
      }

      console.log(`Total articles collected: ${articles.length}`);

      // Store articles in Supabase
      let insertedCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;
      for (const article of articles) {
        try {
          // Check for existing article with same URL
          const { data: existing, error: queryError } = await adminClient
            .from('news_articles')
            .select('id, published_at')
            .eq('url', article.url)
            .single();

          if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error checking for existing article:', queryError);
            continue;
          }

          if (!existing) {
            // Insert new article
            const { error: insertError } = await adminClient
              .from('news_articles')
              .insert([{
                ...article,
                published_at: new Date(article.published_at).toISOString()
              }]);

            if (insertError) {
              console.error('Error inserting article:', insertError);
              continue;
            }
            insertedCount++;
          } else {
            // If article exists but is older than the new one, update it
            const existingDate = new Date(existing.published_at);
            const articleDate = new Date(article.published_at);
            
            if (articleDate > existingDate) {
              // Update the existing article
              const { error: updateError } = await adminClient
                .from('news_articles')
                .update({
                  ...article,
                  published_at: new Date(article.published_at).toISOString()
                })
                .eq('id', existing.id);

              if (updateError) {
                console.error('Error updating article:', updateError);
                continue;
              }
              updatedCount++;
              console.log(`Updated article: ${article.title}`);
            } else {
              skippedCount++;
            }
          }
        } catch (error) {
          console.error('Error storing article:', error);
          continue;
        }
      }

      this.lastRunTime = new Date();
      console.log(`Data collection completed at ${new Date().toISOString()}`);
      console.log(`Results: ${insertedCount} articles inserted, ${updatedCount} updated, ${skippedCount} skipped (already existed)`);
    } catch (error) {
      console.error('Error in data collection service:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Method to manually trigger data collection
  public async triggerDataCollection(): Promise<void> {
    await this.collectData();
  }

  // Method to get last run time
  public getLastRunTime(): Date | null {
    return this.lastRunTime;
  }

  // Method to check if collection is running
  public isCollectionRunning(): boolean {
    return this.isRunning;
  }
}

export default DataCollectionService;
