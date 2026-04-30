import { marketStore } from "../store/marketStore";
import { orderStore, OrderSide } from "../store/orderStore";
import { portfolioStore } from "../store/portfolioStore";
import { eventBus } from "../utils/eventBus";

export function executeMarketOrder(
  symbol: string,
  side: OrderSide,
  quantity: number
) {
  
  // 1) Input Validation
  if (!symbol || typeof symbol !== "string") {
    const err = { type: "order:rejected", reason: "Invalid symbol", symbol };
    eventBus.emit("order:rejected", err);
    throw new Error("Invalid symbol");
  }

  if (!["BUY", "SELL"].includes(side)) {
    const err = { type: "order:rejected", reason: "Invalid side", side };
    eventBus.emit("order:rejected", err);
    throw new Error("Invalid side");
  }

  if (!quantity || quantity <= 0) {
    const err = { type: "order:rejected", reason: "Invalid quantity", quantity };
    eventBus.emit("order:rejected", err);
    throw new Error("Invalid quantity");
  }

  // 2) Market Price Check
  const ticker = marketStore.get(symbol);

  if (!ticker) {
    const err = { type: "order:rejected", reason: "Symbol not found", symbol };
    eventBus.emit("order:rejected", err);
    throw new Error("Symbol not found");
  }

  const price = ticker.price;

  // 3) Create Order
  const order = orderStore.create({
    symbol,
    side,
    quantity,
    price,
  });

  eventBus.emit("order:created", order);

  // 4) Execute Order Immediately (Market Fill)
  order.status = "FILLED";
  eventBus.emit("order:filled", order);

  // 5) Update Portfolio
  if (side === "BUY") {
    const pos = portfolioStore.openPosition(symbol, "LONG", price, quantity);
    eventBus.emit("position:opened", pos);
  } else {
    const closed = portfolioStore.closePosition(symbol, price);

    if (closed) {
      eventBus.emit("position:closed", closed);
    }
  }

  // 6) Return Final Order Object
  return order;
}
