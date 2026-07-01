import { Router } from 'express';
import { v1Router } from './v1';

const router = Router();

// Versioned routes
router.use('/v1', v1Router);

// Future Versioning Placeholder (e.g. router.use('/v2', v2Router))

export const apiRouter = router;
