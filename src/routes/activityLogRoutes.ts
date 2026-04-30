import { FastifyInstance } from "fastify";
import { activityLogStore } from "../store/activityLogStore";

export default async function activityLogRoutes(fastify: FastifyInstance) {
  fastify.get("/activity-logs", async () => {
    return { logs: activityLogStore.getAll() };
  });
}
