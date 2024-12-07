/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrderType = 'limit' | 'market'
export type OrderSide = 'buy' | 'sell'
export type OrderPosition = 'yes' | 'no'
export type OrderStatus = 'open' | 'filled' | 'partial' | 'cancelled'

export type Database = {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string
          title: string
          content: string
          summary: string | null
          image_url: string | null
          status: 'draft' | 'published' | 'archived'
          ai_generated: boolean
          created_at: string
          updated_at: string
          author_id: string | null
          category: string | null
          tags: string[] | null
          slug: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          summary?: string | null
          image_url?: string | null
          status?: 'draft' | 'published' | 'archived'
          ai_generated?: boolean
          created_at?: string
          updated_at?: string
          author_id?: string | null
          category?: string | null
          tags?: string[] | null
          slug?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          summary?: string | null
          image_url?: string | null
          status?: 'draft' | 'published' | 'archived'
          ai_generated?: boolean
          created_at?: string
          updated_at?: string
          author_id?: string | null
          category?: string | null
          tags?: string[] | null
          slug?: string
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          balance: number
          created_at: string
          updated_at: string
          username: string | null
          email: string | null
          role: 'user' | 'validator' | 'admin'
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
          username?: string | null
          email?: string | null
          role?: 'user' | 'validator' | 'admin'
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
          username?: string | null
          email?: string | null
          role?: 'user' | 'validator' | 'admin'
        }
      }
      news_articles: {
        Row: {
          id: string
          title: string
          content: string
          url: string
          category: string
          published_at: string
          created_at: string
          updated_at: string
          has_market: boolean
          status: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          url: string
          category: string
          published_at: string
          created_at?: string
          updated_at?: string
          has_market?: boolean
          status?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          url?: string
          category?: string
          published_at?: string
          created_at?: string
          updated_at?: string
          has_market?: boolean
          status?: string
        }
      }
      markets: {
        Row: {
          id: string
          creator_id: string | null
          title: string | null
          description: string | null
          category: string
          resolution_source: string | null
          closing_date: string | null
          resolution_date: string | null
          status: string
          outcome: string | null
          total_volume: number
          liquidity_pool: number
          created_at: string
          updated_at: string
          source_article_id: string | null
          end_date: string | null
          question: string | null
          resolution_criteria: string | null
          resolved_value: boolean | null
          probability_yes: number
          probability_no: number
          views: number
          trades: number
          trending_score: number | null
          min_amount: number
          max_amount: number
          total_yes_amount: number
          total_no_amount: number
          source_url: string | null
          yes_price: number
          no_price: number
          last_trade_price: number | null
          last_trade_time: string | null
          active: boolean
        }
        Insert: {
          id?: string
          creator_id?: string | null
          title?: string | null
          description?: string | null
          category?: string
          resolution_source?: string | null
          closing_date?: string | null
          resolution_date?: string | null
          status?: string
          outcome?: string | null
          total_volume?: number
          liquidity_pool?: number
          created_at?: string
          updated_at?: string
          source_article_id?: string | null
          end_date?: string | null
          question?: string | null
          resolution_criteria?: string | null
          resolved_value?: boolean | null
          probability_yes?: number
          probability_no?: number
          views?: number
          trades?: number
          trending_score?: number | null
          min_amount?: number
          max_amount?: number
          total_yes_amount?: number
          total_no_amount?: number
          source_url?: string | null
          yes_price?: number
          no_price?: number
          last_trade_price?: number | null
          last_trade_time?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          creator_id?: string | null
          title?: string | null
          description?: string | null
          category?: string
          resolution_source?: string | null
          closing_date?: string | null
          resolution_date?: string | null
          status?: string
          outcome?: string | null
          total_volume?: number
          liquidity_pool?: number
          created_at?: string
          updated_at?: string
          source_article_id?: string | null
          end_date?: string | null
          question?: string | null
          resolution_criteria?: string | null
          resolved_value?: boolean | null
          probability_yes?: number
          probability_no?: number
          views?: number
          trades?: number
          trending_score?: number | null
          min_amount?: number
          max_amount?: number
          total_yes_amount?: number
          total_no_amount?: number
          source_url?: string | null
          yes_price?: number
          no_price?: number
          last_trade_price?: number | null
          last_trade_time?: string | null
          active?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          market_id: string | null
          user_id: string | null
          order_type: string | null
          side: string | null
          position: string | null
          price: number | null
          amount: number | null
          filled_amount: number
          remaining_amount: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          market_id?: string | null
          user_id?: string | null
          order_type?: string | null
          side?: string | null
          position?: string | null
          price?: number | null
          amount?: number | null
          filled_amount?: number
          remaining_amount?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          market_id?: string | null
          user_id?: string | null
          order_type?: string | null
          side?: string | null
          position?: string | null
          price?: number | null
          amount?: number | null
          filled_amount?: number
          remaining_amount?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          user_id: string
          market_id: string
          shares: number
          avg_price: number
          average_price: number
          position_type: string
          realized_pnl: number | null
          created_at: string
          updated_at: string
          market?: {
            title: string
            status: string
          }
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          shares: number
          avg_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          shares?: number
          avg_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          market_id: string | null
          transaction_type: string | null
          amount: number | null
          shares: number | null
          price: number | null
          position_type: string | null
          mpesa_reference: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          market_id?: string | null
          transaction_type?: string | null
          amount?: number | null
          shares?: number | null
          price?: number | null
          position_type?: string | null
          mpesa_reference?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          market_id?: string | null
          transaction_type?: string | null
          amount?: number | null
          shares?: number | null
          price?: number | null
          position_type?: string | null
          mpesa_reference?: string | null
          status?: string
          created_at?: string
        }
      }
      market_comments: {
        Row: {
          id: string
          user_id: string
          market_id: string
          content: string
          created_at: string
          updated_at: string
          parent_id: string | null
          likes_count: number
          is_edited: boolean
          profiles: {
            username: string | null
            avatar_url: string | null
          }
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          content: string
          created_at?: string
          updated_at?: string
          parent_id?: string | null
          likes_count?: number
          is_edited?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          parent_id?: string | null
          likes_count?: number
          is_edited?: boolean
        }
      }
      market_comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
      }
      leaderboard_stats: {
        Row: {
          id: string
          user_id: string
          total_profit: number
          total_trades: number
          total_volume: number
          profit_loss: number
          win_rate: number
          rank: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_profit?: number
          total_trades?: number
          total_volume?: number
          profit_loss?: number
          win_rate?: number
          rank?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_profit?: number
          total_trades?: number
          total_volume?: number
          profit_loss?: number
          win_rate?: number
          rank?: number
          updated_at?: string
        }
      }
      analytics_page_views: {
        Row: {
          id: string;
          path: string;
          timestamp: string;
          user_id: string | null;
          session_id: string;
          referrer: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          path: string;
          timestamp?: string;
          user_id?: string | null;
          session_id: string;
          referrer?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          path?: string;
          timestamp?: string;
          user_id?: string | null;
          session_id?: string;
          referrer?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_role: {
        Args: {
          user_id: string
          new_role: string
        }
        Returns: {
          id: string
          role: string
        }
      }
      update_market_active_status: {
        Args: {
          market_id: string
          new_status: boolean
        }
        Returns: {
          id: string
          active: boolean
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
