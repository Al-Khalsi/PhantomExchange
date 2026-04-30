import { marketStore } from "../store/marketStore";
import { orderStore, OrderSide } from "../store/orderStore";

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

  return order;
}
