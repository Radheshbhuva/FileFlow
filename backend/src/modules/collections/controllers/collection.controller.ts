import { Request, Response, NextFunction } from 'express';
import { CollectionService } from '../services/collection.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class CollectionController {
  private collectionService: CollectionService;

  constructor(collectionService: CollectionService = new CollectionService()) {
    this.collectionService = collectionService;
  }

  public getCollectionsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const collections = await this.collectionService.getCollectionsList(userId);
      res.status(200).json({
        success: true,
        message: 'Smart collections metadata loaded successfully',
        data: { collections },
      });
    } catch (error) {
      next(error);
    }
  };

  public getRecentlyModified = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const days = req.query.days ? Number(req.query.days) : undefined;
      const files = await this.collectionService.getRecentlyModified(userId, days);
      
      res.status(200).json({
        success: true,
        message: 'Recently modified files retrieved successfully',
        data: { files, days: days || 7 },
      });
    } catch (error) {
      next(error);
    }
  };

  public getSharedRecently = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const days = req.query.days ? Number(req.query.days) : undefined;
      const files = await this.collectionService.getSharedRecently(userId, days);

      res.status(200).json({
        success: true,
        message: 'Recently shared files retrieved successfully',
        data: { files, days: days || 30 },
      });
    } catch (error) {
      next(error);
    }
  };

  public getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const favorites = await this.collectionService.getFavorites(userId);

      res.status(200).json({
        success: true,
        message: 'Favorited files retrieved successfully',
        data: favorites,
      });
    } catch (error) {
      next(error);
    }
  };

  public getLargeFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const thresholdMb = req.query.thresholdMb ? Number(req.query.thresholdMb) : undefined;
      const largeFiles = await this.collectionService.getLargeFiles(userId, thresholdMb);

      res.status(200).json({
        success: true,
        message: 'Large files retrieved successfully',
        data: largeFiles,
      });
    } catch (error) {
      next(error);
    }
  };

  public getNeedsAttention = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const files = await this.collectionService.getNeedsAttention(userId);

      res.status(200).json({
        success: true,
        message: 'Vulnerable and inactive files requiring attention compiled successfully',
        data: { files },
      });
    } catch (error) {
      next(error);
    }
  };

  public getCollectionSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const summary = await this.collectionService.getCollectionSummary(userId);

      res.status(200).json({
        success: true,
        message: 'Collections metrics summary retrieved successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // AI Prep Handlers (Future Phase Integrations)
  // ==========================================

  public getAIRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const recommendations = await this.collectionService.getAIRecommendations(userId);
      res.status(200).json({
        success: true,
        message: 'Future AI recommendations placeholder resolved',
        data: { recommendations },
      });
    } catch (error) {
      next(error);
    }
  };

  public getFrequentlyAccessed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const items = await this.collectionService.getFrequentlyAccessed(userId);
      res.status(200).json({
        success: true,
        message: 'Future Frequently Accessed files placeholder resolved',
        data: { files: items },
      });
    } catch (error) {
      next(error);
    }
  };

  public getArchiveCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const candidates = await this.collectionService.getArchiveCandidates(userId);
      res.status(200).json({
        success: true,
        message: 'Future Archive Candidates placeholder resolved',
        data: { candidates },
      });
    } catch (error) {
      next(error);
    }
  };

  public getSecurityRisks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const risks = await this.collectionService.getSecurityRisks(userId);
      res.status(200).json({
        success: true,
        message: 'Future Security Risks alerts placeholder resolved',
        data: { risks },
      });
    } catch (error) {
      next(error);
    }
  };

  public getTeamHotFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const files = await this.collectionService.getTeamHotFiles(userId);
      res.status(200).json({
        success: true,
        message: 'Future Team Hot Files collaborative stats placeholder resolved',
        data: { files },
      });
    } catch (error) {
      next(error);
    }
  };
}
