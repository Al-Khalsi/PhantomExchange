export interface Position {
  symbol: string;
  side: "LONG" | "SHORT";

  entryPrice: number;
  exitPrice?: number;      // Exit price (set when the position is closed)

  size: number;            // Asset amount / position size

  openedAt: string;        // ISO timestamp when the position was opened
  closedAt?: string;       // ISO timestamp when the position was closed

  lastUpdate: string;      // Last price update timestamp

  realizedPnl: number;     // Profit/Loss already realized after closing
  unrealizedPnl: number;   // PnL based on the latest market price

  status: "OPEN" | "CLOSED";
}
