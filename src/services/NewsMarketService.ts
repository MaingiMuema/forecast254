/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import axios from 'axios';
import NodeCache from 'node-cache';
import { kenyanNewsService } from './KenyanNewsService';

// Initialize Supabase admin client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MarketTemplate {
  question: string;
  description: string;
  category: string;
  end_date: string;
  resolution_source: string;
  source_article_id: string;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  link: string;
  pubDate: string;
}

class RateLimitError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class NewsMarketService {
  private static instance: NewsMarketService;
  private cache: NodeCache;
  private retryQueue: { article: NewsArticle; retryAfter: number }[] = [];
  private isProcessingQueue = false;
  private isGenerating = false;
  private dailyRequestCount = 0;
  private lastRequestReset = new Date().setHours(0, 0, 0, 0);
  private readonly MAX_DAILY_REQUESTS = 190;

  private constructor() {
    console.log('Initializing NewsMarketService...');
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.resetDailyRequestCount();
  }

  public static getInstance(): NewsMarketService {
    if (!NewsMarketService.instance) {
      NewsMarketService.instance = new NewsMarketService();
    }
    return NewsMarketService.instance;
  }

  private resetDailyRequestCount() {
    const now = new Date();
    const todayStart = now.setHours(0, 0, 0, 0);
    
    if (this.lastRequestReset < todayStart) {
      this.dailyRequestCount = 0;
      this.lastRequestReset = todayStart;
    }
  }

  private async checkRateLimit() {
    this.resetDailyRequestCount();
    
    if (this.dailyRequestCount >= this.MAX_DAILY_REQUESTS) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const waitTime = tomorrow.getTime() - now.getTime();
      
      throw new RateLimitError('Daily rate limit exceeded', waitTime);
    }
  }

  private async processRetryQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.retryQueue.length > 0) {
      const now = Date.now();
      const nextItem = this.retryQueue[0];

      if (now < nextItem.retryAfter) {
        const waitTime = nextItem.retryAfter - now;
        console.log(`Waiting ${Math.round(waitTime / 1000)}s before next retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const item = this.retryQueue.shift()!;
      try {
        await this.generateMarketFromArticle(item.article);
      } catch (error: any) {
        if (error instanceof RateLimitError) {
          this.retryQueue.push({
            article: item.article,
            retryAfter: Date.now() + error.retryAfter
          });
          console.log(`Rate limit hit, queued for retry in ${Math.round(error.retryAfter / 1000)}s`);
        } else {
          console.error('Failed to generate market for article after retry:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async generateMarketFromArticle(article: NewsArticle): Promise<MarketTemplate | null> {
    try {
      await this.checkRateLimit();

      const cacheKey = `market:${article.id}`;
      const cachedMarket = this.cache.get<MarketTemplate>(cacheKey);
      if (cachedMarket) {
        console.log('Returning cached market for article:', article.id);
        return cachedMarket;
      }

      console.log(`Generating market for article: ${article.title}`);
      console.log('Article content:', article.content?.substring(0, 100) + '...');
      
      if (!article.content || article.content.trim().length < 50) {
        console.log('Article content too short or empty, skipping market generation');
        return null;
      }

      const prompt = `Generate a prediction market based on this news article. 
        Title: ${article.title}
        Content: ${article.content}

        Rules:
        1. The question must be about a specific, verifiable future event
        2. The end date must be between 3 months and Dec 31, 2024
        3. The question must be answerable with yes/no
        4. The description must provide clear context and resolution criteria
        5. Must be relevant to Kenya
        6. The question should focus on significant events or outcomes mentioned in the article

        Return format:
        {
          "question": "Will [specific event] happen by [specific date]?",
          "description": "[detailed context and resolution criteria]",
          "category": "[article category]",
          "end_date": "YYYY-MM-DD",
          "resolution_source": "[specific source for resolution]"
        }

        Only return valid JSON, no other text.`;

      console.log('Making API request to generate market...');
      const response = await axios.post(
        'https://api.awanllm.com/v1',
        {
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AWAN_API_KEY}`
          },
          timeout: 30000 // 30 second timeout
        }
      );

      this.dailyRequestCount++;
      console.log('API response received:', response.data.choices[0].message.content);

      let market: MarketTemplate;
      try {
        market = JSON.parse(response.data.choices[0].message.content);
      } catch (error) {
        console.error('Failed to parse market response:', error);
        console.error('Raw response:', response.data.choices[0].message.content);
        return null;
      }

      if (!this.validateMarket(market)) {
        console.error('Invalid market generated:', market);
        console.error('Validation failed for article:', article.title);
        return null;
      }

      market.source_article_id = article.id;
      this.cache.set(cacheKey, market);
      console.log('Successfully generated and cached market:', market.question);

      return market;
    } catch (error: any) {
      console.error('Error in generateMarketFromArticle:', error.message);
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '3600') * 1000;
        console.warn(`Rate limit hit, retry after ${retryAfter}ms`);
        throw new RateLimitError('Rate limit exceeded', retryAfter);
      }
      if (error.response?.data) {
        console.error('API error response:', error.response.data);
      }
      throw error;
    }
  }

  private validateMarket(market: MarketTemplate): boolean {
    try {
      if (!market.question || typeof market.question !== 'string' || market.question.length < 10) {
        console.error('Invalid question:', market.question);
        return false;
      }
      if (!market.description || typeof market.description !== 'string' || market.description.length < 20) {
        console.error('Invalid description:', market.description);
        return false;
      }
      if (!market.category || typeof market.category !== 'string') {
        console.error('Invalid category:', market.category);
        return false;
      }
      if (!market.end_date || !this.isValidEndDate(market.end_date)) {
        console.error('Invalid end_date:', market.end_date);
        return false;
      }
      if (!market.resolution_source || typeof market.resolution_source !== 'string') {
        console.error('Invalid resolution_source:', market.resolution_source);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in validateMarket:', error);
      return false;
    }
  }

  private isValidEndDate(dateStr: string): boolean {
    try {
      const endDate = new Date(dateStr);
      const now = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      return endDate > now && endDate <= threeMonthsFromNow;
    } catch {
      return false;
    }
  }

  private async createMarketInDatabase(market: MarketTemplate): Promise<boolean> {
    try {
      const { data: existingMarket, error: checkError } = await supabase
        .from('markets')
        .select('id')
        .eq('source_article_id', market.source_article_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing market:', checkError);
        return false;
      }

      if (existingMarket) {
        console.log('Market already exists for this article');
        return false;
      }

      const { error: insertError } = await supabase
        .from('markets')
        .insert({
          question: market.question,
          description: market.description,
          category: market.category,
          start_date: new Date().toISOString(),
          end_date: market.end_date,
          status: 'open',
          creator_id: process.env.SYSTEM_USER_ID || null,
          resolution_source: market.resolution_source,
          source_article_id: market.source_article_id
        });

      if (insertError) {
        console.error('Error creating market:', insertError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in database operation:', error);
      return false;
    }
  }

  public async generateMarketsFromNews(): Promise<number> {
    if (this.isGenerating) {
      console.log('Already generating markets');
      return 0;
    }

    this.isGenerating = true;
    let marketsCreated = 0;

    try {
      // Only use categories that are available in KenyanNewsService
      const categories = ['politics', 'business', 'sports', 'entertainment', 'lifestyle'];
      
      for (const category of categories) {
        const articles = await kenyanNewsService.getNewsByCategory(category);
        
        for (const article of articles) {
          // Transform NewsItem into NewsArticle by adding an id - moved outside try block
          const articleWithId: NewsArticle = {
            ...article,
            id: crypto.randomUUID(), // Generate a unique ID
            content: article.content || '' // Provide a default empty string if content is undefined
          };
        
          try {
            const market = await this.generateMarketFromArticle(articleWithId);
            if (market && await this.createMarketInDatabase(market)) {
              marketsCreated++;
            }
          } catch (error) {
            if (error instanceof RateLimitError) {
              this.retryQueue.push({
                article: articleWithId, // Now articleWithId is in scope
                retryAfter: Date.now() + error.retryAfter
              });
              console.log(`Rate limit hit, queued for retry in ${Math.round(error.retryAfter / 1000)}s`);
              break;
            }
            console.error(`Error generating market for article: ${articleWithId.title}`, error);
          }
        }
      }

      if (this.retryQueue.length > 0) {
        this.processRetryQueue();
      }
    } finally {
      this.isGenerating = false;
    }

    return marketsCreated;
  }
}
