import { FastifyInstance } from "fastify";
import { placeOrder, cancelOrder, getOpenOrders, getOrderById } from "../engine/orderEngine";
import { OrderSide, OrderType } from "../store/orderStore";
import { orderStore } from "../store/orderStore";

export async function orderRoutes(app: FastifyInstance) {
  // Create order (MARKET or LIMIT)
  app.post("/orders", async (req, reply) => {
    const body = req.body as {
      symbol: string;
      side: OrderSide;
      type: OrderType;
      quantity: number;
      price?: number;
    };

    if (!body.symbol || !body.side || !body.type || !body.quantity) {
      return reply.status(400).send({ error: "Missing required fields: symbol, side, type, quantity" });
    }

    if (body.type === "LIMIT" && !body.price) {
      return reply.status(400).send({ error: "price is required for LIMIT orders" });
    }

    try {
      const order = placeOrder(
        body.symbol.toUpperCase(),
        body.side,
        body.type,
        body.quantity,
        body.price
      );

      return order;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Get all orders (history)
  app.get("/orders", async () => {
    return orderStore.getAll();
  });

  // Get open orders only
  app.get("/orders/open", async () => {
    return { orders: getOpenOrders() };
  });

  // Get order by ID
  app.get("/orders/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const order = getOrderById(id);
    
    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }
    
    return order;
  });

  // Cancel order
  app.delete("/orders/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    
    try {
      const cancelledOrder = cancelOrder(id);
      return cancelledOrder;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}