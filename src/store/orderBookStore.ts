import { OrderBook, OrderLevel } from "../types/orderbook";
import { orderStore } from "./orderStore";
import { marketStore } from "./marketStore";

class OrderBookStore {
  private books: Map<string, OrderBook> = new Map();

  get(symbol: string): OrderBook | null {
    return this.books.get(symbol) || null;
  }

  set(book: OrderBook) {
    this.books.set(book.symbol, book);
  }

  // Build real order book from open orders
  build(symbol: string, depth: number = 20): OrderBook {
    const buyOrders = orderStore.getBuyOpenOrders(symbol);
    const sellOrders = orderStore.getSellOpenOrders(symbol);
    
    // Aggregate bids (BUY orders) by price level
    const bidMap = new Map<number, number>();
    for (const order of buyOrders) {
      const remainingQty = order.quantity - order.filledQuantity;
      if (remainingQty <= 0) continue;
      
      const currentSize = bidMap.get(order.price) || 0;
      bidMap.set(order.price, currentSize + remainingQty);
    }
    
    // Aggregate asks (SELL orders) by price level
    const askMap = new Map<number, number>();
    for (const order of sellOrders) {
      const remainingQty = order.quantity - order.filledQuantity;
      if (remainingQty <= 0) continue;
      
      const currentSize = askMap.get(order.price) || 0;
      askMap.set(order.price, currentSize + remainingQty);
    }
    
    // Convert to OrderLevel arrays and sort
    let bids: OrderLevel[] = Array.from(bidMap.entries())
      .map(([price, size]) => [price, size] as OrderLevel)
      .sort((a, b) => b[0] - a[0]); // Highest price first
    
    let asks: OrderLevel[] = Array.from(askMap.entries())
      .map(([price, size]) => [price, size] as OrderLevel)
      .sort((a, b) => a[0] - b[0]); // Lowest price first
    
    // Limit to requested depth
    bids = bids.slice(0, depth);
    asks = asks.slice(0, depth);
    
    // If no orders, generate a mock book based on current price
    if (bids.length === 0 && asks.length === 0) {
      return this.generateMockBook(symbol, depth);
    }
    
    const book: OrderBook = {
      symbol,
      bids,
      asks,
      timestamp: Date.now()
    };
    
    this.set(book);
    return book;
  }
  
  // Legacy generate method (kept for backward compatibility)
  generate(symbol: string, price: number, depth: number = 20): OrderBook {
    const bids: OrderLevel[] = [];
    const asks: OrderLevel[] = [];

    for (let i = 0; i < depth; i++) {
      const bidPrice = +(price - i * 5).toFixed(2);
      const askPrice = +(price + i * 5).toFixed(2);
      const bidSize = +(Math.random() * 2).toFixed(4);
      const askSize = +(Math.random() * 2).toFixed(4);

      if (bidPrice > 0) {
        bids.push([bidPrice, bidSize]);
      }
      asks.push([askPrice, askSize]);
    }

    const book: OrderBook = {
      symbol,
      bids,
      asks,
      timestamp: Date.now()
    };

    this.set(book);
    return book;
  }
  
  // Fallback mock book when no orders exist
  private generateMockBook(symbol: string, depth: number): OrderBook {
    // Get current price from marketStore
    const ticker = marketStore.get(symbol);
    const basePrice = ticker ? ticker.price : symbol === "BTCUSDT" ? 65000 : 3000;
    
    const bids: OrderLevel[] = [];
    const asks: OrderLevel[] = [];
    
    // Generate realistic mock orderbook levels
    for (let i = 1; i <= depth; i++) {
      const bidPrice = +(basePrice - i * 10).toFixed(2);
      const askPrice = +(basePrice + i * 10).toFixed(2);
      
      // Decreasing size as we go deeper
      const bidSize = +((Math.random() * 0.5 + 0.1) / i).toFixed(4);
      const askSize = +((Math.random() * 0.5 + 0.1) / i).toFixed(4);
      
      if (bidPrice > 0) {
        bids.push([bidPrice, Math.max(0.001, bidSize)]);
      }
      asks.push([askPrice, Math.max(0.001, askSize)]);
    }
    
    return {
      symbol,
      bids,
      asks,
      timestamp: Date.now()
    };
  }
}

export const orderBookStore = new OrderBookStore();