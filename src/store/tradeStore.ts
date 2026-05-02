export interface Trade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  quoteQty: number;      // price * quantity
  side: "BUY" | "SELL";
  buyerOrderId: string;
  sellerOrderId: string;
  timestamp: string;
  fee: number;
  feeAsset: string;
}

class TradeStore {
  private trades: Trade[] = [];

  add(trade: Omit<Trade, "id">): Trade {
    const newTrade: Trade = {
      id: `${trade.symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...trade
    };
    this.trades.push(newTrade);
    return newTrade;
  }

  getAll(symbol?: string, limit: number = 100): Trade[] {
    let result = this.trades;
    if (symbol) {
      result = result.filter(t => t.symbol === symbol);
    }
    return result.slice(-limit).reverse();
  }

  getByOrderId(orderId: string): Trade[] {
    return this.trades.filter(t => t.buyerOrderId === orderId || t.sellerOrderId === orderId);
  }
}

export const tradeStore = new TradeStore();