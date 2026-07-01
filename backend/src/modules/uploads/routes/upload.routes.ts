import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import { createUploadSchema, trackProgressSchema } from '../validators/upload.validators';

const router = Router();
const controller = new UploadController();

// Secure all upload routes with JWT protect middleware
router.use(protect);

// Upload routes
router.post('/', validate(createUploadSchema), controller.createUpload);
router.post('/presigned-url', validate(createUploadSchema), controller.createPresignedUrl);
router.get('/', controller.listUploads);
router.get('/analytics', controller.getUploadAnalytics);
router.get('/history', controller.getUploadHistory);
router.get('/:id', controller.getUpload);
router.delete('/:id', controller.deleteUpload);
router.patch('/:id/progress', validate(trackProgressSchema), controller.trackProgress);
router.patch('/:id/retry', controller.retryUpload);
router.patch('/:id/cancel', controller.cancelUpload);

export const uploadRouter = router;
