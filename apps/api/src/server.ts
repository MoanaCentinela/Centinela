import Fastify from "fastify";
import { transactionRoutes } from "./modules/ingestion/controllers/transaction.routes.js";

const app = Fastify({
  logger: true,
});

app.register(transactionRoutes);

const start = async () => {
  const port = Number(process.env.PORT ?? 3000);

  try {
    await app.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`API ejecutándose en http://0.0.0.0:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();