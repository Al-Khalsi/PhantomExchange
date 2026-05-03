import { OHLC } from "../store/marketDataStore";

export function generateMockCandles(
  startPrice: number,
  count: number
): OHLC[] {
  const candles: OHLC[] = [];
  let price = startPrice;

  for (let i = 0; i < count; i++) {
    const open = price;
    const change = (Math.random() - 0.5) * 100;
    const close = Math.max(0.01, open + change);

    const high = Math.max(open, close) + Math.random() * 50;
    const low = Math.min(open, close) - Math.random() * 50;

    const volume = Math.random() * 2000;

    candles.push({
      openTime: Date.now() - (count - i) * 60000,
      closeTime: Date.now() - (count - i - 1) * 60000,
      open,
      high,
      low,
      close,
      volume
    });

    price = close;
  }

  return candles;
}