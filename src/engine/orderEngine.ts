import { marketStore } from "../store/marketStore";
import { orderStore, OrderSide, OrderType } from "../store/orderStore";
import { portfolioStore } from "../store/portfolioStore";
import { eventBus } from "../utils/eventBus";
import { matchOrder } from "./matchingEngine";

export function placeOrder(
  symbol: string,
  side: OrderSide,
  type: OrderType,
  quantity: number,
  price?: number // Required for LIMIT orders
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

  if (!["MARKET", "LIMIT"].includes(type)) {
const err = { type: "order:rejected", reason: "Invalid order type", invalidType: type };
    eventBus.emit("order:rejected", err);
    throw new Error("Invalid order type");
  }

  if (!quantity || quantity <= 0) {
    const err = { type: "order:rejected", reason: "Invalid quantity", quantity };
    eventBus.emit("order:rejected", err);
    throw new Error("Invalid quantity");
  }

  if (type === "LIMIT" && (!price || price <= 0)) {
    const err = { type: "order:rejected", reason: "Invalid limit price", price };
    eventBus.emit("order:rejected", err);
    throw new Error("Invalid limit price");
  }

  // 2) For MARKET orders, get current market price
  let orderPrice: number;
  if (type === "MARKET") {
    const ticker = marketStore.get(symbol);
    if (!ticker) {
      const err = { type: "order:rejected", reason: "Symbol not found", symbol };
      eventBus.emit("order:rejected", err);
      throw new Error("Symbol not found");
    }
    orderPrice = ticker.price;
  } else {
    orderPrice = price!;
  }

  // 3) Create Order
  const order = orderStore.create({
    symbol,
    side,
    type,
    quantity,
    price: orderPrice,
  });

  eventBus.emit("order:created", order);

  // 4) Match the order against existing orders
  matchOrder(order);

  // 5) Return Final Order Object
  return order;
}

// Keep legacy function for backward compatibility
export function executeMarketOrder(
  symbol: string,
  side: OrderSide,
  quantity: number
) {
  return placeOrder(symbol, side, "MARKET", quantity);
}

export function cancelOrder(orderId: string) {
  const order = orderStore.cancelOrder(orderId);
  
  if (!order) {
    const err = { type: "order:cancel:rejected", reason: "Order not found or cannot be cancelled", orderId };
    eventBus.emit("order:cancel:rejected", err);
    throw new Error("Order not found or cannot be cancelled");
  }
  
  eventBus.emit("order:cancelled", order);
  return order;
}

export function getOpenOrders() {
  return orderStore.getOpenOrders();
}

export function getOrderById(orderId: string) {
  return orderStore.getById(orderId);
}