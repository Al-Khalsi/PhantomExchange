export type OrderLevel = [number, number]; // [price, size]

export interface OrderBook {
  symbol: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
}
