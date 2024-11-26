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
          question: string
          description: string | null
          category: string
          resolution_source: string | null
          resolved_value: boolean | null
          start_date: string
          end_date: string
          status: string
          created_at: string
          updated_at: string
          source_article_id: string | null
          total_yes_amount: number
          total_no_amount: number
          total_volume: number
          trades: number
          probability_yes: number
          probability_no: number
        }
        Insert: {
          id?: string
          creator_id?: string | null
          question: string
          description?: string | null
          category: string
          resolution_source?: string | null
          resolved_value?: boolean | null
          start_date: string
          end_date: string
          status?: string
          created_at?: string
          updated_at?: string
          source_article_id?: string | null
          total_yes_amount?: number
          total_no_amount?: number
          total_volume?: number
          trades?: number
          probability_yes?: number
          probability_no?: number
        }
        Update: {
          id?: string
          creator_id?: string | null
          question?: string
          description?: string | null
          category?: string
          resolution_source?: string | null
          resolved_value?: boolean | null
          start_date?: string
          end_date?: string
          status?: string
          created_at?: string
          updated_at?: string
          source_article_id?: string | null
          total_yes_amount?: number
          total_no_amount?: number
          total_volume?: number
          trades?: number
          probability_yes?: number
          probability_no?: number
        }
      }
      orders: {
        Row: {
          id: string
          market_id: string
          user_id: string
          order_type: OrderType
          side: OrderSide
          position: OrderPosition
          price: number | null
          amount: number
          filled_amount: number
          remaining_amount: number
          status: OrderStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          market_id: string
          user_id: string
          order_type: OrderType
          side: OrderSide
          position: OrderPosition
          price?: number | null
          amount: number
          filled_amount?: number
          remaining_amount?: number
          status?: OrderStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          market_id?: string
          user_id?: string
          order_type?: OrderType
          side?: OrderSide
          position?: OrderPosition
          price?: number | null
          amount?: number
          filled_amount?: number
          remaining_amount?: number
          status?: OrderStatus
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
          transaction_type: string
          market: any
          mpesa_reference: string
          status: string
          id: string
          user_id: string
          market_id: string
          type: string
          shares: number
          price: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          type: string
          shares: number
          price: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          type?: string
          shares?: number
          price?: number
          total?: number
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
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          content?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
