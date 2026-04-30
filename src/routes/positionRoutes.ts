import { FastifyInstance } from "fastify";
import { portfolioStore } from "../store/portfolioStore";

export default async function positionRoutes(fastify: FastifyInstance) {
  fastify.get("/positions/open", async () => {
    return { positions: portfolioStore.getOpenPositions() };
  });

  fastify.get("/positions/history", async () => {
    return { history: portfolioStore.getClosedPositions() };
  });
}
