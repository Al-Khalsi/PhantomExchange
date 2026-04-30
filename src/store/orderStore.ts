import { v4 as uuidv4 } from "uuid";

export type OrderSide = "BUY" | "SELL";

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  timestamp: string;
  status: "FILLED";
}

class OrderStore {
  private orders: Order[] = [];

  create(order: Omit<Order, "id" | "timestamp" | "status">): Order {
    const newOrder: Order = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: "FILLED",
      ...order,
    };

    this.orders.push(newOrder);
    return newOrder;
  }

  getAll() {
    return this.orders;
  }

  getById(id: string) {
    return this.orders.find((o) => o.id === id);
  }
}

export const orderStore = new OrderStore();
