/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase admin client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
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
  private genAI: GoogleGenerativeAI;
  private retryQueue: { article: any; retryAfter: number }[] = [];
  private isProcessingQueue = false;
  private isGenerating: boolean = false;

  private constructor() {
    console.log('Initializing MarketGenerationService...');
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
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
    // Default retry time for Gemini API rate limits
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

        Required JSON format:
        {
          "title": "Will X happen by Y date?",
          "description": "Detailed context and background",
          "category": "One of: politics, sports, entertainment, business, tech, education (lowercase only)",
          "end_date": "YYYY-MM-DD",
          "resolution_source": "Specific source or criteria for resolving this market"
        }

        Important: Return ONLY the JSON object, with no additional text, explanations or markdown formatting.
      `;

      console.log('Sending request to LLM...');
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      console.log('LLM Response:', response);

      if (!response) {
        console.log('No response from LLM');
        return null;
      }

      try {
        // Clean the response - remove any markdown formatting or extra text
        const cleanedResponse = response.replace(/```json\n|\n```|```/g, '').trim();
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
      // Handle Gemini API rate limits
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
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

    // Validate end date
    const endDate = new Date(market.end_date);
    const now = new Date();
    if (isNaN(endDate.getTime()) || endDate <= now) {
      console.log('Invalid end date:', market.end_date);
      return false;
    }

    // Validate category (case-insensitive)
    const validCategories = ['politics', 'sports', 'entertainment', 'business', 'tech', 'education'];
    if (!validCategories.includes(market.category.toLowerCase())) {
      console.log('Invalid category:', market.category);
      return false;
    }

    console.log('Market validation passed');
    return true;
  }

  private async createMarketInDatabase(market: MarketTemplate & { source_article_id: string }): Promise<boolean> {
    try {
      console.log('Creating market in database:', market);
      const { data, error } = await supabase
        .from('markets')
        .insert({
          title: market.title,
          description: market.description,
          category: market.category,
          start_date: new Date().toISOString(),
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

  public async generateMarketsFromArticles(): Promise<number> {
    if (this.isGenerating) {
      console.log('Already generating markets');
      return 0;
    }

    this.isGenerating = true;
    let marketsCreated = 0;

    try {
      console.log('Starting market generation...');
      // Get articles without markets
      const { data: articles, error } = await supabase
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
