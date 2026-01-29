import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import { config } from './config/index.js';
import { testConnection, closeConnections } from './config/database.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { initializeSocketServer } from './socket/index.js';

async function createApp(): Promise<Express> {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Compression
  app.use(compression());

  // Logging
  if (config.server.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // API routes
  app.use('/api', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function bootstrap(): Promise<void> {
  try {
    // Test database connection (continue even if it fails in dev mode)
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('⚠️ Database connection failed - running in degraded mode');
      logger.warn('⚠️ Some features requiring database will not work');
      // Don't exit - let the server start anyway for development
    }

    // Create Express app
    const app = await createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = initializeSocketServer(httpServer);

    // Start server
    httpServer.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📝 Environment: ${config.server.nodeEnv}`);
      logger.info(`🔌 Socket.io initialized`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      io.close();
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      await closeConnections();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
