import Fastify from "fastify";

const app = Fastify({
  logger: true
});

app.get("/", async () => {
  return { status: "mock exchange running" };
});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log("server running on 3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
