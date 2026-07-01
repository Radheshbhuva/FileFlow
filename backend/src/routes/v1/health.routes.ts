import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'fileflow-backend',
    version: 'v1',
  });
});

export const healthRouter = router;
