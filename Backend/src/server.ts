import { createApp } from './app.js';
import { closeDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Health: http://localhost:${env.PORT}/health`);
});

let isShuttingDown = false;

function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received, shutting down...`);

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Failed to close HTTP server cleanly');
      process.exitCode = 1;
    }

    void closeDatabase()
      .then(() => {
        logger.info('Server closed');
      })
      .catch((closeError: unknown) => {
        logger.error({ err: closeError }, 'Failed to close database connection');
        process.exitCode = 1;
      });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
