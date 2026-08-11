import app from "./app.js";
import { connectDB } from "./config/database.js";
import { PORT, NODE_ENV } from "./config/env.js";
import logger from "./config/logger.js";

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    });

    const handleShutdown = (signal) => {
      logger.info(`${signal} signal received: closing HTTP server`);
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`, error);
    process.exit(1);
  }
};

startServer();
