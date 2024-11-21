import cron from 'node-cron';
import { newsMarketOrchestrator } from '@/services/NewsMarketOrchestrator';
import { logger } from '@/utils/logger';

// Schedule news fetching and market generation every 3 hours
export const startNewsMarketCron = () => {
  logger.info('Starting news market cron job');
  
  cron.schedule('0 */3 * * *', async () => {
    try {
      logger.info('Running scheduled news market generation');
      const marketsCreated = await newsMarketOrchestrator.processNewsAndGenerateMarkets();
      logger.info(`Successfully created ${marketsCreated} markets from news articles`);
    } catch (error) {
      logger.error('Error in news market cron job:', error);
    }
  });
};
