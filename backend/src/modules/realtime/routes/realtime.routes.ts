import { Router } from 'express';
import { RealtimeController } from '../controllers/realtime.controller';

const router = Router();
const controller = new RealtimeController();

// Expose streaming endpoint for Server Sent Events
router.get('/stream', controller.establishStream);

export const realtimeRouter = router;
