export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type MarketSeries = {
  symbol: string
  timeframe: string
  candles: Candle[]
}

class MarketDataStore {
  private data: MarketSeries[] = []

  set(symbol: string, timeframe: string, candles: Candle[]) {
    const existing = this.data.find(
      (d) => d.symbol === symbol && d.timeframe === timeframe
    )

    if (existing) {
      existing.candles = candles
    } else {
      this.data.push({
        symbol,
        timeframe,
        candles
      })
    }
  }

  get(symbol: string, timeframe: string): Candle[] {
    const entry = this.data.find(
      (d) => d.symbol === symbol && d.timeframe === timeframe
    )

    if (!entry) return []

    return entry.candles
  }

  getLast(symbol: string, timeframe: string): Candle | null {
    const candles = this.get(symbol, timeframe)
    if (!candles.length) return null
    return candles[candles.length - 1]
  }
}

export const marketDataStore = new MarketDataStore()
