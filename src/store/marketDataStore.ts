export type OHLC = {
  openTime: number
  closeTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type MarketSeries = {
  symbol: string
  timeframe: string
  candles: OHLC[]
}

class MarketDataStore {
  // All OHLCV series loaded from mock or external source
  private data: MarketSeries[] = []

  // L1 price feed
  private prices: Record<string, number> = {}

  // List of supported symbols
  public symbols: string[] = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"]

  // Store OHLCV for a symbol & timeframe
  set(symbol: string, timeframe: string, candles: OHLC[]) {
    const existing = this.data.find(
      (d) => d.symbol === symbol && d.timeframe === timeframe
    )

    if (existing) {
      existing.candles = candles
    } else {
      this.data.push({ symbol, timeframe, candles })
    }

    // Initialize L1 price from last candle
    if (candles.length > 0) {
      const last = candles[candles.length - 1]
      this.prices[symbol] = last.close
    }
  }

  // Return OHLCV for a symbol & timeframe
  get(symbol: string, timeframe: string): OHLC[] {
    const entry = this.data.find(
      (d) => d.symbol === symbol && d.timeframe === timeframe
    )
    return entry ? entry.candles : []
  }

  // Get last OHLCV candle
  getLast(symbol: string, timeframe: string): OHLC | null {
    const candles = this.get(symbol, timeframe)
    return candles.length ? candles[candles.length - 1] : null
  }

  // Update live price (L1)
  updatePrice(symbol: string, price: number) {
    this.prices[symbol] = price
  }

  // Fetch live price (L1)
  getPrice(symbol: string): number {
    return this.prices[symbol] ?? 0
  }
}

export const marketDataStore = new MarketDataStore()
