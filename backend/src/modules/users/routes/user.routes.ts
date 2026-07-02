import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import {
  updateProfileSchema,
  updateAvatarSchema,
  changePasswordSchema,
} from '../validators/user.validators';

const router = Router();
const controller = new UserController();

// Require JWT authorization for all user profile endpoints
router.use(protect);

router.get('/me', controller.getMe);
router.put('/profile', validate(updateProfileSchema), controller.updateProfile);
router.put('/avatar', validate(updateAvatarSchema), controller.updateAvatar);
router.put('/change-password', validate(changePasswordSchema), controller.changePassword);
router.get('/storage', controller.getStorage);
router.get('/activity-summary', controller.getActivitySummary);

export const userRouter = router;
