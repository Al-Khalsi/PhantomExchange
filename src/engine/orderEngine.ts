import { marketStore } from "../store/marketStore";
import { orderStore, OrderSide } from "../store/orderStore";
import { portfolioStore } from "../store/portfolioStore";

export function executeMarketOrder(
  symbol: string,
  side: OrderSide,
  quantity: number
) {
  const ticker = marketStore.get(symbol);

  if (!ticker) {
    throw new Error("Symbol not found");
  }

  const price = ticker.price;

  const order = orderStore.create({
    symbol,
    side,
    quantity,
    price,
  });

  // --- Portfolio Logic ---
  if (side === "BUY") {
    portfolioStore.openPosition(symbol, "LONG", price, quantity);
  } else if (side === "SELL") {
    portfolioStore.closePosition(symbol, price);
  }

  return order;
}
