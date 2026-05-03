import { marketStore } from "../store/marketStore";
import { orderStore, OrderSide, OrderType } from "../store/orderStore";
import { eventBus } from "../utils/eventBus";
import { matchOrder } from "./matchingEngine";

export function placeOrder(
  symbol: string,
  side: OrderSide,
  type: OrderType,
  quantity: number,
  price?: number,
  leverage: number = 10,
  reduceOnly: boolean = false
) {
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

  if (leverage < 1 || leverage > 100) {
    const err = { type: "order:rejected", reason: "Leverage must be between 1 and 100", leverage };
    eventBus.emit("order:rejected", err);
    throw new Error("Leverage must be between 1 and 100");
  }

  if (type === "LIMIT" && (!price || price <= 0)) {
    const err = { type: "order:rejected", reason: "Invalid limit price", price };
    eventBus.emit("order:rejected", err);
    throw new Error("Invalid limit price");
  }

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

  const order = orderStore.create({
    symbol,
    side,
    type,
    quantity,
    price: orderPrice,
    leverage,
    reduceOnly
  });

  eventBus.emit("order:created", order);

  matchOrder(order);

  return order;
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