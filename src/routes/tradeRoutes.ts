import { FastifyInstance } from "fastify";
import { tradeStore } from "../store/tradeStore";

export async function tradeRoutes(fastify: FastifyInstance) {
  // Get all trades
  fastify.get("/trades", async (request, reply) => {
    const { symbol, limit } = request.query as {
      symbol?: string;
      limit?: string;
    };
    
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const trades = tradeStore.getAll(symbol, limitNum);
    
    return { trades };
  });
  
  // Get trades for specific order
  fastify.get("/trades/order/:orderId", async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const trades = tradeStore.getByOrderId(orderId);
    
    return { trades };
  });
}