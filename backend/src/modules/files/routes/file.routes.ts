import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import {
  createFileSchema,
  updateFileSchema,
  favoriteFileSchema,
  archiveFileSchema,
} from '../validators/file.validators';

const router = Router();
const controller = new FileController();

// Secure all file routing under JWT authentication
router.use(protect);

router.post('/', validate(createFileSchema), controller.createFile);
router.get('/', controller.listFiles);
router.get('/insights', controller.getFileInsights); // Registered before /:id to prevent route clashing
router.get('/:id', controller.getFile);
router.get('/:id/details', controller.getFileDetails);
router.patch('/:id', validate(updateFileSchema), controller.updateFile);
router.delete('/:id', controller.deleteFile);
router.patch('/:id/favorite', validate(favoriteFileSchema), controller.favoriteFile);
router.patch('/:id/archive', validate(archiveFileSchema), controller.archiveFile);

export const fileRouter = router;
