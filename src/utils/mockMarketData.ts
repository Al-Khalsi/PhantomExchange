import { Candle } from "../store/marketDataStore"

export function generateMockCandles(
  startPrice: number,
  count: number
): Candle[] {
  const candles: Candle[] = []
  let price = startPrice

  for (let i = 0; i < count; i++) {
    const open = price
    const change = (Math.random() - 0.5) * 100
    const close = open + change

    const high = Math.max(open, close) + Math.random() * 50
    const low = Math.min(open, close) - Math.random() * 50

    const volume = Math.random() * 2000

    candles.push({
      time: Date.now() - (count - i) * 60000,
      open,
      high,
      low,
      close,
      volume
    })

    price = close
  }

  return candles
}
