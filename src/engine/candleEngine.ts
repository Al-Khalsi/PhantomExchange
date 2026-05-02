import { candleStore, Candle, Interval } from "../store/candleStore"
import { marketDataStore } from "../store/marketDataStore"

const ONE_MINUTE = 60 * 1000

export function startCandleEngine() {
  // Init store for all symbols
  for (const symbol of marketDataStore.symbols) {
    candleStore.initForSymbol(symbol)
  }

  // Main loop: generate a new 1m candle every minute
  setInterval(() => {
    generate1mCandles()
    aggregateCandles("5m", 5)
    aggregateCandles("15m", 15)
    aggregateCandles("1h", 60)
  }, ONE_MINUTE)
}

// Generate real-time 1m candles using L1 price
function generate1mCandles() {
  const now = Date.now()

  for (const symbol of marketDataStore.symbols) {
    const price = marketDataStore.getPrice(symbol)

    const candle: Candle = {
      openTime: now - ONE_MINUTE,
      closeTime: now,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: Math.random() * 3
    }

    candleStore.addCandle(symbol, "1m", candle)
  }
}

// Aggregate small intervals into bigger ones
function aggregateCandles(target: Interval, multiplier: number) {
  for (const symbol of marketDataStore.symbols) {
    const candles = candleStore.getCandles(symbol, "1m")

    if (candles.length < multiplier) continue

    const chunk = candles.slice(-multiplier)

    const aggregated: Candle = {
      openTime: chunk[0].openTime,
      closeTime: chunk[chunk.length - 1].closeTime,
      open: chunk[0].open,
      close: chunk[chunk.length - 1].close,
      high: Math.max(...chunk.map(c => c.high)),
      low: Math.min(...chunk.map(c => c.low)),
      volume: chunk.reduce((sum, c) => sum + c.volume, 0)
    }

    candleStore.addCandle(symbol, target, aggregated)
  }
}
