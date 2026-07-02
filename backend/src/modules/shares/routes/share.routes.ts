import { Router } from 'express';
import { ShareController } from '../controllers/share.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import {
  createShareSchema,
  updateShareSchema,
  extendExpirySchema,
  verifyPasswordSchema,
} from '../validators/share.validators';

const router = Router();
const controller = new ShareController();

// --- Public / Unauthenticated Routes ---
router.get('/public/:token', controller.getPublicShare);
router.post('/public/:token/verify', validate(verifyPasswordSchema), controller.verifyPublicSharePassword);
router.post('/public/:token/download', controller.downloadPublicShare);
router.get('/public/:token/download', controller.downloadPublicShare);

// --- Protected Routes (Require JWT Auth) ---
router.use(protect);

router.post('/', validate(createShareSchema), controller.createShare);
router.get('/', controller.listShares);
router.get('/analytics', controller.getShareAnalytics); // Placed before /:id to prevent route clashing
router.get('/:id', controller.getShare);
router.patch('/:id', validate(updateShareSchema), controller.updateShare);
router.patch('/:id/revoke', controller.revokeShare);
router.patch('/:id/extend', validate(extendExpirySchema), controller.extendShare);
router.delete('/:id', controller.deleteShare);

export const shareRouter = router;
