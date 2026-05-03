export interface Ticker {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

const market: Record<string, Ticker> = {};

export const marketStore = {
  set(symbol: string, ticker: Ticker) {
    market[symbol] = ticker;
  },

  get(symbol: string) {
    return market[symbol];
  },

  getAll() {
    return Object.values(market);
  },

  getAllSymbols(): string[] {
    return Object.keys(market);
  }
};