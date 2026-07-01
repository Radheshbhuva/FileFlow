import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class SearchController {
  private searchService: SearchService;

  constructor(searchService: SearchService = new SearchService()) {
    this.searchService = searchService;
  }

  public globalSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { query, sortBy, sortOrder, page, limit, ...filters } = req.query as any;

      const result = await this.searchService.searchFiles(userId, {
        query,
        filters,
        sort: { field: sortBy, order: sortOrder },
        page,
        limit,
      });

      const suggestions = await this.searchService.getSuggestions(userId, query);

      res.status(200).json({
        success: true,
        message: 'Global workspace search completed',
        data: {
          ...result,
          collections: suggestions.suggestedCollections,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public searchFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { query, sortBy, sortOrder, page, limit, ...filters } = req.query as any;

      const result = await this.searchService.searchFiles(userId, {
        query,
        filters,
        sort: { field: sortBy, order: sortOrder },
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        message: 'Files searched successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getRecentSearches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const recent = await this.searchService.getRecentSearches(userId);

      res.status(200).json({
        success: true,
        message: 'Recent searches retrieved successfully',
        data: { recent },
      });
    } catch (error) {
      next(error);
    }
  };

  public getSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { query } = req.query as any;
      const suggestions = await this.searchService.getSuggestions(userId, query);

      res.status(200).json({
        success: true,
        message: 'Search suggestions retrieved successfully',
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  };

  public getDiscoveryResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const discovery = await this.searchService.getDiscoveryResults(userId);

      res.status(200).json({
        success: true,
        message: 'Discovery workspace feed retrieved successfully',
        data: discovery,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTrendingFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const trending = await this.searchService.getTrendingFiles(userId);

      res.status(200).json({
        success: true,
        message: 'Trending files retrieved successfully',
        data: trending,
      });
    } catch (error) {
      next(error);
    }
  };
}
