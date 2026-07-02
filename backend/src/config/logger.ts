import winston from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Custom layout format for development console logging
const devFormat = printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
  const reqIdStr = requestId ? ` [ReqID: ${requestId}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]${reqIdStr}: ${stack || message}${metaStr}`;
});

const format = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SS' }),
  errors({ stack: true })
);

const transports: winston.transport[] = [];

if (process.env.NODE_ENV === 'production') {
  // Production CloudWatch log readiness — standard structured JSON objects
  transports.push(
    new winston.transports.Console({
      format: combine(format, json()),
    })
  );
} else {
  // Local developer-friendly readable logs
  transports.push(
    new winston.transports.Console({
      format: combine(format, colorize({ all: true }), devFormat),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  transports,
});
