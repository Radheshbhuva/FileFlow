import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isTest = env.NODE_ENV === 'test';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 100, // Limit each IP to 100 requests per window (or 10000 in test environment)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errors: [],
  },
  standardHeaders: true, // Send RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});
