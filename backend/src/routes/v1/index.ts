import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from '../../modules/auth/routes/auth.routes';
import { userRouter } from '../../modules/users/routes/user.routes';
import { fileRouter } from '../../modules/files/routes/file.routes';
import { uploadRouter } from '../../modules/uploads/routes/upload.routes';
import { shareRouter } from '../../modules/shares/routes/share.routes';
import { activityRouter } from '../../modules/activity/routes/activity.routes';
import { dashboardRouter } from '../../modules/dashboard/routes/dashboard.routes';
import { collectionsRouter } from '../../modules/collections/routes/collection.routes';
import { notificationsRouter } from '../../modules/notifications/routes/notification.routes';
import { searchRouter } from '../../modules/search/routes/search.routes';
import { storageRouter } from '../../modules/storage/routes/storage.routes';
import { realtimeRouter } from '../../modules/realtime/routes/realtime.routes';
import { workspaceRouter } from '../../modules/workspaces/routes/workspace.routes';

const router = Router();

// Register v1 sub-routers
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/files', fileRouter);
router.use('/uploads', uploadRouter);
router.use('/shares', shareRouter);
router.use('/activity', activityRouter);
router.use('/dashboard', dashboardRouter);
router.use('/collections', collectionsRouter);
router.use('/notifications', notificationsRouter);
router.use('/search', searchRouter);
router.use('/storage', storageRouter);
router.use('/realtime', realtimeRouter);
router.use('/workspaces', workspaceRouter);

export const v1Router = router;





