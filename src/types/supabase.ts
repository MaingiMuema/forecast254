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
      markets: {
        Row: {
          id: string
          creator_id: string | null
          title: string
          description: string | null
          category: string
          resolution_source: string | null
          closing_date: string
          resolution_date: string
          status: 'open' | 'closed' | 'resolved' | 'cancelled'
          outcome: string | null
          total_volume: number
          liquidity_pool: number
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
          closing_date: string
          resolution_date: string
          status?: 'open' | 'closed' | 'resolved' | 'cancelled'
          outcome?: string | null
          total_volume?: number
          liquidity_pool?: number
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
          closing_date?: string
          resolution_date?: string
          status?: 'open' | 'closed' | 'resolved' | 'cancelled'
          outcome?: string | null
          total_volume?: number
          liquidity_pool?: number
          created_at?: string
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          user_id: string
          market_id: string
          position_type: 'yes' | 'no'
          shares: number
          average_price: number
          realized_pnl: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          position_type: 'yes' | 'no'
          shares?: number
          average_price: number
          realized_pnl?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          position_type?: 'yes' | 'no'
          shares?: number
          average_price?: number
          realized_pnl?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          market_id: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'trade' | 'settlement'
          amount: number
          shares: number | null
          price: number | null
          position_type: 'yes' | 'no' | null
          mpesa_reference: string | null
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          market_id?: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'trade' | 'settlement'
          amount: number
          shares?: number | null
          price?: number | null
          position_type?: 'yes' | 'no' | null
          mpesa_reference?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          market_id?: string | null
          transaction_type?: 'deposit' | 'withdrawal' | 'trade' | 'settlement'
          amount?: number
          shares?: number | null
          price?: number | null
          position_type?: 'yes' | 'no' | null
          mpesa_reference?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
      }
      market_comments: {
        Row: {
          id: string
          market_id: string
          user_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          market_id: string
          user_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          market_id?: string
          user_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      leaderboard_stats: {
        Row: {
          id: string
          user_id: string
          total_trades: number
          successful_predictions: number
          total_volume: number
          profit_loss: number
          win_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_trades?: number
          successful_predictions?: number
          total_volume?: number
          profit_loss?: number
          win_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_trades?: number
          successful_predictions?: number
          total_volume?: number
          profit_loss?: number
          win_rate?: number
          created_at?: string
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
