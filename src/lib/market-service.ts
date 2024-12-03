import { supabase } from './supabase';

export const marketService = {
  async incrementViews(marketId: string) {
    try {
      // First get current views to ensure atomic update
      const { data: market, error: fetchError } = await supabase
        .from('markets')
        .select('views')
        .eq('id', marketId)
        .single();

      if (fetchError) throw fetchError;

      // Increment views atomically
      const { error: updateError } = await supabase
        .from('markets')
        .update({ 
          views: (market?.views || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', marketId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error incrementing market views:', error);
    }
  }
};
