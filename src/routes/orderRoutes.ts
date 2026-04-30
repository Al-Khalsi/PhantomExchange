import { FastifyInstance } from "fastify";
import { executeMarketOrder } from "../engine/orderEngine";
import { OrderSide } from "../store/orderStore";
import { orderStore } from "../store/orderStore";

export async function orderRoutes(app: FastifyInstance) {
  app.post("/orders", async (req, reply) => {
    const body = req.body as {
      symbol: string;
      side: OrderSide;
      quantity: number;
    };

    if (!body.symbol || !body.side || !body.quantity) {
      return reply.status(400).send({ error: "Missing fields" });
    }

    try {
      const order = executeMarketOrder(
        body.symbol.toUpperCase(),
        body.side,
        body.quantity,
      );

      return order;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  app.get("/orders", async () => {
    return orderStore.getAll();
  });
}
