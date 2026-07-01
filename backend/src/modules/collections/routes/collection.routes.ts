import { Router } from 'express';
import { CollectionController } from '../controllers/collection.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import {
  recentlyModifiedQuerySchema,
  sharedRecentlyQuerySchema,
  largeFilesQuerySchema,
} from '../validators/collection.validators';

const router = Router();
const controller = new CollectionController();

// Secure all smart collections endpoints with JWT protect filter
router.use(protect);

router.get('/', controller.getCollectionsList);
router.get('/recently-modified', validate(recentlyModifiedQuerySchema), controller.getRecentlyModified);
router.get('/shared-recently', validate(sharedRecentlyQuerySchema), controller.getSharedRecently);
router.get('/favorites', controller.getFavorites);
router.get('/large-files', validate(largeFilesQuerySchema), controller.getLargeFiles);
router.get('/needs-attention', controller.getNeedsAttention);
router.get('/summary', controller.getCollectionSummary);

// Future AI Preparation Endpoints
router.get('/ai-recommendations', controller.getAIRecommendations);
router.get('/frequently-accessed', controller.getFrequentlyAccessed);
router.get('/archive-candidates', controller.getArchiveCandidates);
router.get('/security-risks', controller.getSecurityRisks);
router.get('/team-hot-files', controller.getTeamHotFiles);

export const collectionsRouter = router;
