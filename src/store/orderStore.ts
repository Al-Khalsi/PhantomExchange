import { v4 as uuidv4 } from "uuid";

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;           // For LIMIT orders, this is the limit price. For MARKET, this is the execution price.
  quantity: number;        // Original requested quantity
  filledQuantity: number;  // How much has been filled so far
  timestamp: string;
  status: OrderStatus;
}

class OrderStore {
  private orders: Map<string, Order> = new Map(); // id -> Order
  private openOrders: Map<string, Order> = new Map(); // id -> Order (only OPEN status)

  create(order: Omit<Order, "id" | "timestamp" | "filledQuantity" | "status">): Order {
    const newOrder: Order = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      filledQuantity: 0,
      status: "OPEN",
      ...order,
    };

    this.orders.set(newOrder.id, newOrder);
    this.openOrders.set(newOrder.id, newOrder);

    return newOrder;
  }

  getById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  getAll(): Order[] {
    return Array.from(this.orders.values());
  }

  getOpenOrders(): Order[] {
    return Array.from(this.openOrders.values());
  }

  getOpenOrdersBySymbol(symbol: string): Order[] {
    return this.getOpenOrders().filter((o) => o.symbol === symbol);
  }

  getBuyOpenOrders(symbol: string): Order[] {
    return this.getOpenOrdersBySymbol(symbol).filter((o) => o.side === "BUY");
  }

  getSellOpenOrders(symbol: string): Order[] {
    return this.getOpenOrdersBySymbol(symbol).filter((o) => o.side === "SELL");
  }

  updateOrder(order: Order): void {
    this.orders.set(order.id, order);
    
    if (order.status === "OPEN" || order.status === "PARTIALLY_FILLED") {
      this.openOrders.set(order.id, order);
    } else {
      this.openOrders.delete(order.id); // Remove from open orders if FILLED or CANCELLED
    }
  }

  cancelOrder(id: string): Order | null {
    const order = this.orders.get(id);
    
    if (!order) return null;
    if (order.status !== "OPEN" && order.status !== "PARTIALLY_FILLED") return null;
    
    order.status = "CANCELLED";
    this.updateOrder(order);
    
    return order;
  }
}

export const orderStore = new OrderStore();