import { supabase } from './supabase';

export interface PageView {
  path: string;
  timestamp: string;
  user_id?: string;
  session_id: string;
  referrer?: string;
  user_agent?: string;
}

export interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
  topPages: { path: string; views: number }[];
  visitsOverTime: { date: string; count: number }[];
}

export const analyticsService = {
  async trackPageView(pageView: Omit<PageView, 'timestamp'>) {
    try {
      const { error } = await supabase.from('analytics_page_views').insert({
        ...pageView,
        timestamp: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  },

  async getAnalytics(startDate: Date, endDate: Date): Promise<AnalyticsData> {
    try {
      // Get page views within date range
      const { data: pageViews } = await supabase
        .from('analytics_page_views')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (!pageViews) return {
        pageViews: 0,
        uniqueVisitors: 0,
        averageSessionDuration: 0,
        topPages: [],
        visitsOverTime: []
      };

      // Calculate unique visitors by session_id
      const uniqueVisitors = new Set(pageViews.map(pv => pv.session_id)).size;

      // Calculate top pages
      const pageCount: Record<string, number> = {};
      pageViews.forEach(pv => {
        pageCount[pv.path] = (pageCount[pv.path] || 0) + 1;
      });

      const topPages = Object.entries(pageCount)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Calculate visits over time (daily)
      const dailyVisits: Record<string, number> = {};
      pageViews.forEach(pv => {
        const date = pv.timestamp.split('T')[0];
        dailyVisits[date] = (dailyVisits[date] || 0) + 1;
      });

      const visitsOverTime = Object.entries(dailyVisits)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        pageViews: pageViews.length,
        uniqueVisitors,
        averageSessionDuration: 0, // This would require additional session tracking
        topPages,
        visitsOverTime,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
};
