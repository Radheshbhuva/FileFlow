import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/upload.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class UploadController {
  private uploadService: UploadService;

  constructor(uploadService: UploadService = new UploadService()) {
    this.uploadService = uploadService;
  }

  public createUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const result = await this.uploadService.createUpload(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Upload transaction initialized successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public createPresignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const result = await this.uploadService.createPresignedUrl(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Presigned upload URL generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public trackProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const upload = await this.uploadService.trackProgress(userId, req.params.id, req.body.uploadProgress);
      res.status(200).json({
        success: true,
        message: 'Upload progress updated successfully',
        data: { upload },
      });
    } catch (error) {
      next(error);
    }
  };

  public getUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const upload = await this.uploadService.getUpload(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Upload transaction retrieved successfully',
        data: { upload },
      });
    } catch (error) {
      next(error);
    }
  };

  public listUploads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const uploads = await this.uploadService.getUploadHistory(userId);
      res.status(200).json({
        success: true,
        message: 'Active uploads retrieved successfully',
        data: { uploads },
      });
    } catch (error) {
      next(error);
    }
  };

  public retryUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const upload = await this.uploadService.retryUpload(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Upload retried successfully',
        data: { upload },
      });
    } catch (error) {
      next(error);
    }
  };

  public cancelUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const upload = await this.uploadService.cancelUpload(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Upload cancelled successfully',
        data: { upload },
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      await this.uploadService.deleteUpload(userId, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Upload transaction removed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getUploadAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const analytics = await this.uploadService.getUploadAnalytics(userId);
      res.status(200).json({
        success: true,
        message: 'Upload analytics retrieved successfully',
        data: { analytics },
      });
    } catch (error) {
      next(error);
    }
  };

  public getUploadHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const history = await this.uploadService.getUploadHistory(userId);
      res.status(200).json({
        success: true,
        message: 'Upload history retrieved successfully',
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  };
}
