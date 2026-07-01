import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/file.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class FileController {
  private fileService: FileService;

  constructor(fileService: FileService = new FileService()) {
    this.fileService = fileService;
  }

  public createFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const result = await this.fileService.createFile(ownerId, req.body);
      res.status(201).json({
        success: true,
        message: 'File created and upload URL generated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public listFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const result = await this.fileService.listFiles(ownerId, req.query);
      res.status(200).json({
        success: true,
        message: 'Files retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const file = await this.fileService.getFile(ownerId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'File retrieved successfully',
        data: { file },
      });
    } catch (error) {
      next(error);
    }
  };

  public getFileDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const details = await this.fileService.getFileDetails(ownerId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'File details retrieved successfully',
        data: details,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const file = await this.fileService.updateFile(ownerId, req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'File metadata updated successfully',
        data: { file },
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      await this.fileService.deleteFile(ownerId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public favoriteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const file = await this.fileService.favoriteFile(ownerId, req.params.id, req.body.favorite);
      res.status(200).json({
        success: true,
        message: 'File favorite status updated',
        data: { file },
      });
    } catch (error) {
      next(error);
    }
  };

  public archiveFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const file = await this.fileService.archiveFile(ownerId, req.params.id, req.body.archive);
      res.status(200).json({
        success: true,
        message: 'File status updated',
        data: { file },
      });
    } catch (error) {
      next(error);
    }
  };

  public getFileInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = req.user?.id;
      if (!ownerId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const insights = await this.fileService.getFileInsights(ownerId);
      res.status(200).json({
        success: true,
        message: 'File insights retrieved successfully',
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  };
}
