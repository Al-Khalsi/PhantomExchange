import { FastifyInstance } from "fastify";
import { placeOrder, cancelOrder, getOpenOrders, getOrderById } from "../engine/orderEngine";
import { OrderSide, OrderType } from "../store/orderStore";
import { orderStore } from "../store/orderStore";

export async function orderRoutes(app: FastifyInstance) {
  app.post("/orders", async (req, reply) => {
    const body = req.body as {
      symbol: string;
      side: OrderSide;
      type: OrderType;
      quantity: number;
      price?: number;
      leverage?: number;
      reduceOnly?: boolean;
    };

    if (!body.symbol || !body.side || !body.type || !body.quantity) {
      return reply.status(400).send({ error: "Missing required fields: symbol, side, type, quantity" });
    }

    if (body.type === "LIMIT" && !body.price) {
      return reply.status(400).send({ error: "price is required for LIMIT orders" });
    }

    if (body.leverage && (body.leverage < 1 || body.leverage > 100)) {
      return reply.status(400).send({ error: "Leverage must be between 1 and 100" });
    }

    try {
      const order = placeOrder(
        body.symbol.toUpperCase(),
        body.side,
        body.type,
        body.quantity,
        body.price,
        body.leverage || 10,
        body.reduceOnly || false
      );

      return order;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  app.get("/orders", async () => {
    return orderStore.getAll();
  });

  app.get("/orders/open", async () => {
    return { orders: getOpenOrders() };
  });

  app.get("/orders/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const order = getOrderById(id);
    
    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }
    
    return order;
  });

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