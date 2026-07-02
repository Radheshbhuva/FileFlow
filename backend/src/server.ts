import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import http from 'http';
import { eventBusService } from './modules/realtime/services/event-bus.service';

const server = http.createServer(app);

// Initialize real-time Event Bus attached to http server
eventBusService.initialize(server).catch((err) => {
  logger.error('Failed to initialize eventBusService:', err);
});

const startServer = () => {
  server.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`👉 Healthcheck: http://localhost:${env.PORT}/health`);
  });
};

const handleShutdown = (signal: string) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  eventBusService.shutdown().catch((err) => {
    logger.error('Error shutting down eventBusService:', err);
  });

  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown if connections are kept open for too long (10s limit)
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcefully exiting.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

startServer();
