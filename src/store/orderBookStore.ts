import { OrderBook, OrderLevel } from "../types/orderbook";

class OrderBookStore {

  private books: Map<string, OrderBook> = new Map();

  get(symbol: string): OrderBook | null {
    return this.books.get(symbol) || null;
  }

  set(book: OrderBook) {
    this.books.set(book.symbol, book);
  }

  generate(symbol: string, price: number, depth: number = 20): OrderBook {

    const bids: OrderLevel[] = [];
    const asks: OrderLevel[] = [];

    for (let i = 0; i < depth; i++) {

      const bidPrice = +(price - i * 5).toFixed(2);
      const askPrice = +(price + i * 5).toFixed(2);

      const bidSize = +(Math.random() * 2).toFixed(4);
      const askSize = +(Math.random() * 2).toFixed(4);

      bids.push([bidPrice, bidSize]);
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
}

export const orderBookStore = new OrderBookStore();
