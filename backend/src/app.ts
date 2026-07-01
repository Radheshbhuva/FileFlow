import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { apiRouter } from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { NotFoundError } from './utils/app-error';
import { ActivityListener } from './modules/activity/listeners/activity.listener';
import { NotificationListener } from './modules/notifications/listeners/notification.listener';
import { realtimeListener } from './modules/realtime/listeners/realtime.listener';

const app = express();

// Initialize Event-Driven listeners
const activityListener = new ActivityListener();
activityListener.initialize();

const notificationListener = new NotificationListener();
notificationListener.initialize();

realtimeListener.initialize();

// Security configuration
app.use(helmet());

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) ||
                        /^http:\/\/localhost:\d+$/.test(origin) ||
                        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
                        /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin) ||
                        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-share-token'],
    credentials: true,
  })
);

// Request parsing
app.use(express.json());

// Tracing and logging
app.use(requestIdMiddleware);
app.use(requestLogger);

// DDoS / Rate Limiting
app.use(rateLimiter);

// Root healthcheck (Direct access for Load Balancers)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'fileflow-backend',
    version: 'v1',
  });
});

// Primary routers mapping
app.use('/api', apiRouter);

// Fallback for missing routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Standard Error boundaries middleware
app.use(errorMiddleware);

export { app };
