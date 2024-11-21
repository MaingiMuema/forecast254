import { kenyanNewsService } from './KenyanNewsService';
import { MarketGenerationService } from './MarketGenerationService';
import { logger } from '@/utils/logger';

class NewsMarketOrchestrator {
  private static instance: NewsMarketOrchestrator;
  private isProcessing: boolean = false;

  private constructor() {}

  public static getInstance(): NewsMarketOrchestrator {
    if (!NewsMarketOrchestrator.instance) {
      NewsMarketOrchestrator.instance = new NewsMarketOrchestrator();
    }
    return NewsMarketOrchestrator.instance;
  }

  public async processNewsAndGenerateMarkets(): Promise<number> {
    if (this.isProcessing) {
      logger.info('Already processing news and markets');
      return 0;
    }

    this.isProcessing = true;
    let totalMarketsCreated = 0;

    try {
      logger.info('Starting news and market processing');

      // Get all supported categories
      const categories = ['politics', 'business', 'sports', 'entertainment', 'lifestyle'];
      
      // Process each category
      for (const category of categories) {
        try {
          logger.info(`Processing category: ${category}`);
          
          // 1. Fetch news
          const news = await kenyanNewsService.getNewsByCategory(category);
          if (news.length === 0) {
            logger.info(`No news found for category: ${category}`);
            continue;
          }
          logger.info(`Found ${news.length} news items for category: ${category}`);

          // 2. Save to database
          await kenyanNewsService.saveToDatabase(news);

          // 3. Generate markets
          const marketService = MarketGenerationService.getInstance();
          const marketsCreated = await marketService.generateMarketsFromArticles(news);
          totalMarketsCreated += marketsCreated;
          
          logger.info(`Created ${marketsCreated} markets from ${category} news`);
        } catch (error) {
          logger.error(`Error processing category ${category}:`, error);
          // Continue with next category even if one fails
        }
      }

      logger.info(`Completed news and market processing. Total markets created: ${totalMarketsCreated}`);
      return totalMarketsCreated;
    } catch (error) {
      logger.error('Error in news and market processing:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}

export const newsMarketOrchestrator = NewsMarketOrchestrator.getInstance();
