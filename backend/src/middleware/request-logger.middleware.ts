import morgan from 'morgan';
import { Request } from 'express';
import { logger } from '../config/logger';

morgan.token('req-id', (req: Request) => req.requestId || 'unknown');

const morganFormat = ':remote-addr :method :url :status :res[content-length] - :response-time ms [ReqID: :req-id]';

const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const requestLogger = morgan(morganFormat, { stream });
