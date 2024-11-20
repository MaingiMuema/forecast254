/* eslint-disable @typescript-eslint/no-explicit-any */
import { Groq } from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase admin client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MarketTemplate {
  question: string;
  description: string;
  category: string;
  endDate: string;
  resolutionCriteria: string;
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
  private groq: Groq;
  private retryQueue: { article: any; retryAfter: number }[] = [];
  private isProcessingQueue = false;
  private isGenerating: boolean = false;

  private constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!
    });
  }

  public static getInstance(): MarketGenerationService {
    if (!MarketGenerationService.instance) {
      MarketGenerationService.instance = new MarketGenerationService();
    }
    return MarketGenerationService.instance;
  }

  private parseRetryAfter(error: any): number {
    try {
      const errorObj = JSON.parse(error.message);
      const message = errorObj.error.message;
      const match = message.match(/Please try again in (\d+)m([\d.]+)s/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        return (minutes * 60 + seconds) * 1000; // Convert to milliseconds
      }
    } catch (e) {
      console.error('Error parsing retry after time:', e);
    }
    return 120000; // Default to 2 minutes if parsing fails
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
          "question": "Will X happen by Y date?",
          "description": "Detailed context and background",
          "category": "One of: politics, sports, entertainment, business, tech, education (lowercase only)",
          "endDate": "YYYY-MM-DD",
          "resolutionCriteria": "Specific criteria for resolving this market"
        }

        Important: Return ONLY the JSON object, with no additional text, explanations or markdown formatting.
      `;

      console.log('Sending request to LLM...');
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a market generation assistant. Create clear, unambiguous prediction market questions from news articles. Return ONLY JSON objects with no additional text or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.7,
        max_tokens: 5000,
      });

      const response = completion.choices[0]?.message?.content;
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
      if (error.status === 429) {
        const retryAfter = this.parseRetryAfter(error);
        throw new RateLimitError('Rate limit exceeded', retryAfter);
      }
      throw error;
    }
  }

  private validateMarket(market: MarketTemplate): boolean {
    console.log('Validating market:', market);
    
    // Basic validation rules
    if (!market.question || !market.description || !market.category || !market.endDate || !market.resolutionCriteria) {
      console.log('Market missing required fields');
      return false;
    }

    // Validate end date
    const endDate = new Date(market.endDate);
    const now = new Date();
    if (isNaN(endDate.getTime()) || endDate <= now) {
      console.log('Invalid end date:', market.endDate);
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
      
      const endDate = new Date(market.endDate);
      
      // Create the market data object first for debugging
      const marketData = {
        creator_id: process.env.SYSTEM_USER_ID!,
        title: market.question,
        question: market.question,
        description: market.description,
        category: market.category,
        end_date: endDate.toISOString(),
        closing_date: endDate.toISOString(), // Set closing_date to match end_date
        resolution_date: endDate.toISOString(), // Set resolution_date to match end_date
        resolution_criteria: market.resolutionCriteria,
        status: 'open',
        resolved_value: null,
        source_article_id: market.source_article_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        probability_yes: 0.5, // Default starting probability
        probability_no: 0.5 // Default starting probability
      };

      console.log('Market data to insert:', marketData);

      const { error } = await supabase
        .from('markets')
        .insert([marketData]);

      if (error) {
        console.error('Error creating market:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        return false;
      }

      console.log('Successfully created market:', market.question);
      return true;
    } catch (error) {
      console.error('Error creating market:', error);
      return false;
    }
  }

  public async generateMarketsFromArticles(): Promise<number> {
    if (this.isGenerating) {
      console.log('Market generation already in progress');
      return 0;
    }

    this.isGenerating = true;
    let marketsCreated = 0;

    try {
      // Get recent articles
      console.log('Fetching recent articles...');
      const { data: articles, error: articlesError } = await supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100); // Limit to most recent 100 articles for efficiency

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        return marketsCreated;
      }

      if (!articles || articles.length === 0) {
        console.log('No articles found in database');
        return marketsCreated;
      }

      console.log(`Found ${articles.length} total articles in database`);
      
      // Process each article
      for (const article of articles) {
        try {
          // Check if market already exists for this article
          const { data: existingMarkets, error: marketError } = await supabase
            .from('markets')
            .select('id')
            .eq('source_article_id', article.id);

          if (marketError) {
            console.error('Error checking existing market:', marketError);
            continue;
          }

          if (existingMarkets && existingMarkets.length > 0) {
            console.log(`Market already exists for article: ${article.title}`);
            continue;
          }

          console.log(`Attempting to generate market for article: ${article.title}`);
          const market = await this.generateMarketFromArticle(article);
          
          if (market) {
            const created = await this.createMarketInDatabase({
              ...market,
              source_article_id: article.id
            });
            
            if (created) {
              console.log(`Successfully created market for article: ${article.title}`);
              marketsCreated++;
            } else {
              console.log(`Failed to create market for article: ${article.title}`);
            }
          } else {
            console.log(`Could not generate valid market for article: ${article.title}`);
          }
        } catch (error: any) {
          if (error instanceof RateLimitError) {
            console.log(`Rate limit hit, queuing article for retry in ${Math.round(error.retryAfter / 1000)}s`);
            this.retryQueue.push({
              article,
              retryAfter: Date.now() + error.retryAfter
            });
          } else {
            console.error(`Error processing article ${article.id}:`, error);
            continue;
          }
        }
      }

      // Start processing retry queue if not already processing
      if (this.retryQueue.length > 0 && !this.isProcessingQueue) {
        this.processRetryQueue();
      }

      console.log(`Market generation completed. Created ${marketsCreated} new markets`);
      return marketsCreated;
    } catch (error) {
      console.error('Error in market generation:', error);
      return marketsCreated;
    } finally {
      this.isGenerating = false;
    }
  }
}
