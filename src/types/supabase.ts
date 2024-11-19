export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
        }
      }
      markets: {
        Row: {
          id: string
          creator_id: string | null
          title: string
          description: string | null
          category: string
          resolution_source: string | null
          resolved_value: number | null
          start_date: string
          end_date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id?: string | null
          title: string
          description?: string | null
          category: string
          resolution_source?: string | null
          resolved_value?: number | null
          start_date: string
          end_date: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string | null
          title?: string
          description?: string | null
          category?: string
          resolution_source?: string | null
          resolved_value?: number | null
          start_date?: string
          end_date?: string
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
          created_at: string
          updated_at: string
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
