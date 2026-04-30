import { FastifyInstance } from "fastify";
import { reportStore } from "../store/reportStore";

export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.get("/reports", async () => {
    return { reports: reportStore.getAll() };
  });

  fastify.get("/reports/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const report = reportStore.getById(id);

    if (!report) {
      return reply.status(404).send({ error: "Report not found" });
    }

    return { report };
  });
}
