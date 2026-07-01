import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import { listActivitiesSchema } from '../validators/activity.validators';

const router = Router();
const controller = new ActivityController();

// Secure all activity endpoints with JWT protect middleware
router.use(protect);

router.get('/', validate(listActivitiesSchema), controller.listActivities);
router.get('/recent', controller.getRecentActivities);
router.get('/summary', controller.getActivitySummary);
router.get('/:id', controller.getActivity);
router.get('/user/:userId', validate(listActivitiesSchema), controller.getUserActivities);

export const activityRouter = router;
