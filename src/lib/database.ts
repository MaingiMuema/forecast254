import { supabase } from './supabase';
import { Database } from '@/types/supabase';

export type Tables = Database['public']['Tables'];
export type Profile = Tables['profiles']['Row'];
export type Market = Tables['markets']['Row'];
export type Position = Tables['positions']['Row'];
export type Transaction = Tables['transactions']['Row'];
export type MarketComment = Tables['market_comments']['Row'];
export type LeaderboardStats = Tables['leaderboard_stats']['Row'];

// Profile operations
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Market operations
export async function getMarkets(filters?: Partial<Market>) {
  let query = supabase.from('markets').select('*');
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getMarket(marketId: string) {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', marketId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createMarket(market: Tables['markets']['Insert']) {
  const { data, error } = await supabase
    .from('markets')
    .insert(market)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateMarket(marketId: string, updates: Partial<Market>) {
  const { data, error } = await supabase
    .from('markets')
    .update(updates)
    .eq('id', marketId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Position operations
export async function getUserPositions(userId: string) {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
}

export async function getMarketPosition(userId: string, marketId: string) {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('user_id', userId)
    .eq('market_id', marketId);
  
  if (error) throw error;
  return data;
}

export async function createPosition(position: Tables['positions']['Insert']) {
  const { data, error } = await supabase
    .from('positions')
    .insert(position)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePosition(
  userId: string,
  marketId: string,
  updates: Partial<Position>
) {
  const { data, error } = await supabase
    .from('positions')
    .update(updates)
    .eq('user_id', userId)
    .eq('market_id', marketId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Transaction operations
export async function createTransaction(transaction: Tables['transactions']['Insert']) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserTransactions(userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Comment operations
export async function getMarketComments(marketId: string) {
  const { data, error } = await supabase
    .from('market_comments')
    .select('*, profiles(first_name, last_name, avatar_url)')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createComment(comment: Tables['market_comments']['Insert']) {
  const { data, error } = await supabase
    .from('market_comments')
    .insert(comment)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Leaderboard operations
export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_stats')
    .select('*, profiles(first_name, last_name, avatar_url)')
    .order('profit_loss', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return data;
}

export async function updateLeaderboardStats(
  userId: string,
  updates: Partial<LeaderboardStats>
) {
  const { data, error } = await supabase
    .from('leaderboard_stats')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
