import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { protect } from '../../../middleware/protect';

const router = Router();
const controller = new DashboardController();

// Secure all dashboard endpoints with JWT protect middleware
router.use(protect);

router.get('/overview', controller.getWorkspaceOverview);
router.get('/storage', controller.getStorageIntelligence);
router.get('/security', controller.getSecurityIntelligence);
router.get('/productivity', controller.getProductivityInsights);
router.get('/recent-activity', controller.getRecentActivity);
router.get('/notifications', controller.getNotifications);
router.get('/insights', controller.getDashboardInsights);

export const dashboardRouter = router;
