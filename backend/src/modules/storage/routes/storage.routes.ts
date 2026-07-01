import express, { Router } from 'express';
import { StorageController } from '../controllers/storage.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import {
  presignedUploadSchema,
  presignedDownloadSchema,
  fileKeyQuerySchema,
  moveCopySchema,
  directUploadSchema,
  renameSchema,
} from '../validators/storage.validators';

const router = Router();
const controller = new StorageController();

// --- Public Mock S3 upload/download endpoints ---
router.put('/mock-s3/:key(*)', express.raw({ type: '*/*', limit: '100mb' }), controller.mockS3Upload);
router.get('/mock-s3/:key(*)', controller.mockS3Download);

// Secure all storage routes under JWT authorization
router.use(protect);

router.post('/upload', validate(directUploadSchema), controller.uploadFile);
router.get('/download', validate(fileKeyQuerySchema), controller.downloadFile);
router.delete('/file', validate(fileKeyQuerySchema), controller.deleteFile);
router.get('/metadata', validate(fileKeyQuerySchema), controller.getFileMetadata);
router.post('/presigned-upload', validate(presignedUploadSchema), controller.generateUploadUrl);
router.post('/presigned-download', validate(presignedDownloadSchema), controller.generateDownloadUrl);
router.post('/copy', validate(moveCopySchema), controller.copyFile);
router.post('/move', validate(moveCopySchema), controller.moveFile);
router.post('/rename', validate(renameSchema), controller.renameFile);

export const storageRouter = router;
