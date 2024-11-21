/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase admin client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

if (!process.env.AWAN_API_KEY) {
  throw new Error('Missing AWAN_API_KEY environment variable');
}

interface MarketTemplate {
  title: string;
  description: string;
  category: string;
  end_date: string;
  resolution_source: string;
}

class RateLimitError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class MarketGenerationService {
  private static instance: MarketGenerationService;
  private retryQueue: { article: any; retryAfter: number }[] = [];
  private isProcessingQueue = false;
  private isGenerating: boolean = false;
  private requestCount: number = 0;
  private lastRequestReset: Date = new Date();

  private constructor() {
    console.log('Initializing MarketGenerationService...');
    // Reset request count daily
    setInterval(() => {
      const now = new Date();
      if (now.getDate() !== this.lastRequestReset.getDate()) {
        this.requestCount = 0;
        this.lastRequestReset = now;
        console.log('Daily request count reset');
      }
    }, 60000); // Check every minute
    console.log('MarketGenerationService initialized');
  }

  public static getInstance(): MarketGenerationService {
    if (!MarketGenerationService.instance) {
      console.log('Creating new MarketGenerationService instance');
      MarketGenerationService.instance = new MarketGenerationService();
    }
    return MarketGenerationService.instance;
  }

  private parseRetryAfter(error: any): number {
    return 120000; // 2 minutes
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
          console.error(`Failed to generate market for article after retry:`, error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async generateMarketFromArticle(article: any): Promise<MarketTemplate | null> {
    try {
      // Check if we've exceeded daily request limit
      if (this.requestCount >= 190) { // Leave buffer for other operations
        throw new RateLimitError('Daily request limit reached', 24 * 60 * 60 * 1000); // Retry after 24 hours
      }

      console.log(`Generating market for article: ${article.title}`);
      
      const prompt = `
        Given this news article, create a prediction market question. Return ONLY a JSON object with no additional text or markdown formatting. The market should be:
        1. Binary (yes/no) question
        2. Clear and unambiguous
        3. Have a specific end date
        4. Include clear resolution criteria

        Article Title: ${article.title}
        Article Content: ${article.content}
        Category: ${article.category}

        IMPORTANT RULES:
        1. End date MUST be between ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} and ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
        2. Category MUST be one of: politics, business, sports, entertainment, lifestyle (exactly as written)
        3. For health-related articles, use the "lifestyle" category
        4. For technology articles, use the "business" category
        5. For general news, use the "politics" category

        Required JSON format:
        {
          "title": "Will X happen by Y date?",
          "description": "Detailed context and background",
          "category": "MUST be one of: politics, business, sports, entertainment, lifestyle",
          "end_date": "YYYY-MM-DD (must be at least 3 months in future)",
          "resolution_source": "Specific source or criteria for resolving this market"
        }

        Important: Return ONLY the JSON object, with no additional text or markdown formatting.
      `;

      console.log('Sending request to LLM...');
      const response = await axios.post('https://api.awanllm.com/v1/chat/completions', {
        model: "Meta-Llama-3.1-70B-Instruct",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates prediction market questions based on news articles. You should return only a JSON object with the specified format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.AWAN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      this.requestCount++;
      console.log(`API request count: ${this.requestCount}/200`);

      const llmResponse = response.data.choices[0].message.content;
      console.log('LLM Response:', llmResponse);

      if (!llmResponse) {
        console.log('No response from LLM');
        return null;
      }

      try {
        // Clean the response - remove any markdown formatting or extra text
        const cleanedResponse = llmResponse.replace(/```json\n|\n```|```/g, '').trim();
        console.log('Cleaned response:', cleanedResponse);
        
        const market = JSON.parse(cleanedResponse);
        
        // Convert category to lowercase
        market.category = market.category.toLowerCase();
        
        const isValid = this.validateMarket(market);
        console.log('Market validation result:', isValid);
        return isValid ? market : null;
      } catch (error) {
        console.error('Error parsing market JSON:', error);
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 429 || error.message?.includes('rate limit')) {
        const retryAfter = this.parseRetryAfter(error);
        throw new RateLimitError('Rate limit exceeded', retryAfter);
      }
      throw error;
    }
  }

  private validateMarket(market: MarketTemplate): boolean {
    console.log('Validating market:', market);
    
    // Basic validation rules
    if (!market.title || !market.description || !market.category || !market.end_date || !market.resolution_source) {
      console.log('Market missing required fields');
      return false;
    }

    // Validate end date is between 3 months and Dec 31, 2024
    const endDate = new Date(market.end_date);
    const minEndDate = new Date();
    minEndDate.setMonth(minEndDate.getMonth() + 3);
    const maxEndDate = new Date('2024-12-31');
    
    if (isNaN(endDate.getTime()) || endDate < minEndDate || endDate > maxEndDate) {
      console.log('Invalid end date:', market.end_date, 'Must be between', minEndDate.toISOString().split('T')[0], 'and', maxEndDate.toISOString().split('T')[0]);
      return false;
    }

    // Validate category (case-insensitive)
    const validCategories = ['politics', 'business', 'sports', 'entertainment', 'lifestyle'];
    const normalizedCategory = market.category.toLowerCase().trim();
    if (!validCategories.includes(normalizedCategory)) {
      console.log('Invalid category:', market.category, 'Must be one of:', validCategories.join(', '));
      return false;
    }

    // Update the category to the normalized version
    market.category = normalizedCategory;

    console.log('Market validation passed');
    return true;
  }

  private async createMarketInDatabase(market: MarketTemplate & { source_article_id: string }): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      console.log('Creating market in database:', market);
      const { data, error } = await supabase
        .from('markets')
        .insert({
          title: market.title,
          description: market.description,
          category: market.category,
          start_date: now,
          end_date: market.end_date,
          status: 'open',
          creator_id: process.env.SYSTEM_USER_ID || null,
          resolution_source: market.resolution_source,
          source_article_id: market.source_article_id
        });

      if (error) {
        console.error('Error creating market:', error);
        return false;
      }

      console.log('Market created successfully:', data);
      return true;
    } catch (error) {
      console.error('Error creating market:', error);
      return false;
    }
  }

  public async generateMarketsFromArticles(articles?: any[]): Promise<number> {
    if (this.isGenerating) {
      console.log('Already generating markets');
      return 0;
    }

    this.isGenerating = true;
    let marketsCreated = 0;

    try {
      console.log('Starting market generation...');
      
      // If articles are provided, use them directly
      if (articles && articles.length > 0) {
        console.log(`Processing ${articles.length} provided articles`);
      } else {
        // Otherwise, fetch articles from database
        console.log('No articles provided, fetching from database...');
        const { data: dbArticles, error } = await supabase
          .from('news_articles')
          .select('*')
          .eq('has_market', false)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching articles:', error);
          throw error;
        }

        articles = dbArticles;
      }

      if (!articles || articles.length === 0) {
        console.log('No articles found for market generation');
        return 0;
      }

      console.log(`Found ${articles.length} articles for market generation`);

      for (const article of articles) {
        try {
          console.log(`Processing article: ${article.title}`);
          const market = await this.generateMarketFromArticle(article);
          
          if (market) {
            console.log('Generated market:', market);
            const success = await this.createMarketInDatabase({
              ...market,
              source_article_id: article.id
            });

            if (success) {
              // Update article to mark that it has a market
              const { error: updateError } = await supabase
                .from('news_articles')
                .update({ has_market: true })
                .eq('id', article.id);

              if (updateError) {
                console.error('Error updating article has_market status:', updateError);
              } else {
                marketsCreated++;
                console.log(`Successfully created market for article: ${article.title}`);
              }
            }
          }
        } catch (error: any) {
          if (error instanceof RateLimitError) {
            this.retryQueue.push({
              article,
              retryAfter: Date.now() + error.retryAfter
            });
            console.log(`Rate limit hit, queued for retry in ${Math.round(error.retryAfter / 1000)}s`);
          } else {
            console.error(`Failed to generate market for article:`, error);
          }
        }
      }

      // Process retry queue
      if (this.retryQueue.length > 0) {
        await this.processRetryQueue();
      }

      console.log(`Market generation completed. Created ${marketsCreated} markets`);
      return marketsCreated;

    } catch (error) {
      console.error('Error in market generation:', error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }
}
