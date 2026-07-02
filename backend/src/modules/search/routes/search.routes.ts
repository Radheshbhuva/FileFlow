import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { validate } from '../../../middleware/validation.middleware';
import { protect } from '../../../middleware/protect';
import { searchSchema, searchSuggestionsSchema } from '../validators/search.validators';

const router = Router();
const controller = new SearchController();

router.use(protect);

router.get('/files', validate(searchSchema), controller.searchFiles);
router.get('/recent', controller.getRecentSearches);
router.get('/suggestions', validate(searchSuggestionsSchema), controller.getSuggestions);
router.get('/discover', controller.getDiscoveryResults);
router.get('/trending', controller.getTrendingFiles);
router.get('/', validate(searchSchema), controller.globalSearch);

export const searchRouter = router;
