import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`)
});

import http from 'http';
import app from "./app.js";
import { connectDB } from "./config/database.js";
import { PORT, NODE_ENV } from "./config/env.js";
import logger from "./config/logger.js";
import { initSocket } from "./config/socket.js";
import { ensureSuperAdminExists } from "./services/superadmin.seeder.js";

const startServer = async () => {
  try {
    await connectDB();
    await ensureSuperAdminExists();

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`AssetOwl Backend + WebSocket running in ${NODE_ENV} mode on port ${PORT}`);
    });

    const handleShutdown = (signal) => {
      logger.info(`${signal} signal received: closing HTTP & WebSocket server`);
      httpServer.close(() => {
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
