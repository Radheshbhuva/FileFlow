import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from '../validators/notification.validators';

const router = Router();
const controller = new NotificationController();

// Secure all notification endpoints with JWT protect middleware
router.use(protect);

router.get('/unread', controller.getUnreadNotifications);
router.get('/summary', controller.getSummary);
router.get('/', validate(listNotificationsQuerySchema), controller.getNotifications);
router.get('/:id', validate(notificationIdParamsSchema), controller.getNotification);

router.patch('/read-all', controller.markAllAsRead);
router.patch('/:id/read', validate(notificationIdParamsSchema), controller.markAsRead);
router.patch('/:id/archive', validate(notificationIdParamsSchema), controller.archiveNotification);

export const notificationsRouter = router;
