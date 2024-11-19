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

export class MarketGenerationService {
  private static instance: MarketGenerationService;
  private groq: Groq;
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

  private async generateMarketFromArticle(article: any): Promise<MarketTemplate | null> {
    try {
      const prompt = `
        Given this news article, create a prediction market question. The market should be:
        1. Binary (yes/no) question
        2. Clear and unambiguous
        3. Have a specific end date
        4. Include clear resolution criteria

        Article Title: ${article.title}
        Article Content: ${article.content}
        Category: ${article.category}

        Output Format (JSON):
        {
          "question": "Will X happen by Y date?",
          "description": "Detailed context and background",
          "category": "One of: politics, sports, entertainment, business, tech, education",
          "endDate": "YYYY-MM-DD",
          "resolutionCriteria": "Specific criteria for resolving this market"
        }
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a market generation assistant. Create clear, unambiguous prediction market questions from news articles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 5000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return null;

      try {
        const market = JSON.parse(response);
        return this.validateMarket(market) ? market : null;
      } catch (error) {
        console.error('Error parsing market JSON:', error);
        return null;
      }
    } catch (error) {
      console.error('Error generating market:', error);
      return null;
    }
  }

  private validateMarket(market: MarketTemplate): boolean {
    // Basic validation rules
    if (!market.question || !market.description || !market.category || !market.endDate || !market.resolutionCriteria) {
      return false;
    }

    // Validate end date
    const endDate = new Date(market.endDate);
    const now = new Date();
    if (isNaN(endDate.getTime()) || endDate <= now) {
      return false;
    }

    // Validate category
    const validCategories = ['politics', 'sports', 'entertainment', 'business', 'tech', 'education'];
    if (!validCategories.includes(market.category.toLowerCase())) {
      return false;
    }

    return true;
  }

  private async createMarketInDatabase(market: MarketTemplate & { source_article_id: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('markets')
        .insert({
          creator_id: process.env.SYSTEM_USER_ID!,
          question: market.question,
          description: market.description,
          category: market.category,
          end_date: new Date(market.endDate).toISOString(),
          status: 'open',
          resolved_value: null,
          source_article_id: market.source_article_id
        });

      if (error) {
        console.error('Error creating market:', error);
        return false;
      }

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
      // Get articles from the last 48 hours that don't have markets yet
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
      
      console.log('Fetching articles for market generation...');
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          markets!left (
            id
          )
        `)
        .gt('published_at', fortyEightHoursAgo.toISOString())
        .is('markets.id', null)  // Only get articles that don't have markets
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        return marketsCreated;
      }

      if (!articles || articles.length === 0) {
        console.log('No new articles found for market generation');
        return marketsCreated;
      }

      console.log(`Found ${articles.length} articles without markets`);

      // Generate markets for each article
      for (const article of articles) {
        try {
          console.log(`Generating market for article: ${article.title}`);
          const market = await this.generateMarketFromArticle(article);
          
          if (market) {
            const created = await this.createMarketInDatabase({
              ...market,
              source_article_id: article.id
            });
            
            if (created) {
              console.log(`Created market from article: ${article.title}`);
              marketsCreated++;
            } else {
              console.log(`Failed to create market for article: ${article.title}`);
            }
          } else {
            console.log(`Could not generate market for article: ${article.title}`);
          }
        } catch (error) {
          console.error(`Error processing article ${article.id}:`, error);
          continue;
        }
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
