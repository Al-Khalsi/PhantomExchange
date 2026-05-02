export type Candle = {
  openTime: number
  closeTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Interval = "1m" | "5m" | "15m" | "1h"

class CandleStore {
  // candles[symbol][interval] = Candle[]
  private candles: Record<string, Record<Interval, Candle[]>> = {}

  // Initialize all intervals for new symbol
  initForSymbol(symbol: string) {
    this.candles[symbol] = {
      "1m": [],
      "5m": [],
      "15m": [],
      "1h": []
    }
  }

  // Append new candle
  addCandle(symbol: string, interval: Interval, candle: Candle) {
    this.candles[symbol][interval].push(candle)
  }

  // Get all candles for symbol/interval
  getCandles(symbol: string, interval: Interval) {
    return this.candles[symbol]?.[interval] || []
  }
}

export const candleStore = new CandleStore()
