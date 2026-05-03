export interface Position {
  symbol: string;
  side: "LONG" | "SHORT";

  entryPrice: number;
  exitPrice?: number;      // Exit price (set when the position is closed)

  size: number;            // Asset amount / position size (in contracts/units)

  leverage: number;        // Leverage multiplier (e.g., 10)
  marginUsed: number;      // entryPrice * size / leverage
  liquidationPrice: number; // Price at which position gets liquidated

  openedAt: string;        // ISO timestamp when the position was opened
  closedAt?: string;       // ISO timestamp when the position was closed

  lastUpdate: string;      // Last price update timestamp

  realizedPnl: number;     // Profit/Loss already realized after closing
  unrealizedPnl: number;   // PnL based on the latest market price

  status: "OPEN" | "CLOSED";
}

export interface AccountSettings {
  maxLeverage: number;     // Global max leverage (e.g., 100)
  maintenanceMarginRate: number; // e.g., 0.005 (0.5%)
  liquidationFeeRate: number;    // Fee taken from remaining margin on liquidation
}