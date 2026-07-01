import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const headerName = 'x-request-id';
  const requestId = (req.headers[headerName] as string) || uuidv4();

  // Attach request ID to request object for downstream usage
  req.requestId = requestId;

  // Propagate back to caller via header
  res.setHeader(headerName, requestId);

  next();
};
