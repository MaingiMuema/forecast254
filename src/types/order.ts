export type OrderType = 'limit' | 'market';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'open' | 'filled' | 'cancelled' | 'partial';
export type Position = 'yes' | 'no';

export interface Order {
  id: string;
  market_id: string;
  user_id: string;
  order_type: OrderType;
  side: OrderSide;
  position: Position;
  price: number | null;
  amount: number;
  filled_amount: number;
  remaining_amount: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface OrderBook {
  bids: Order[]; // Buy orders sorted by price (highest first)
  asks: Order[]; // Sell orders sorted by price (lowest first)
}

export interface CreateOrderRequest {
  market_id: string;
  order_type: OrderType;
  side: OrderSide;
  position: Position;
  price?: number | null;
  amount: number;
  market_price?: number;
  calculated_price?: number;
}
