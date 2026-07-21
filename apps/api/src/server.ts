import Fastify from "fastify";
import { transactionRoutes } from "./modules/ingestion/controllers/transaction.routes.js";

const app = Fastify({
  logger: true,
});

app.register(transactionRoutes);

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });

    console.log("API ejecutándose en http://localhost:3000");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();