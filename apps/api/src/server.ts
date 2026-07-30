import "dotenv/config";
import { buildApp } from "./app.js";

const start = async () => {
  const port = Number(process.env.PORT ?? 3000);
  
  // Construir e inicializar la aplicación con sus middlewares y rutas registradas.
  const app = await buildApp();

  try {
    await app.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`API ejecutándose en http://0.0.0.0:${port}`);
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

start();