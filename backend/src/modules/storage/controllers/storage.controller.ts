import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storage.service';
import { UnauthorizedError, BadRequestError } from '../../../utils/app-error';

export class StorageController {
  private storageService: StorageService;

  constructor(storageService: StorageService = new StorageService()) {
    this.storageService = storageService;
  }

  public uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { key, fileBase64, mimeType } = req.body;
      const fileBuffer = Buffer.from(fileBase64, 'base64');

      if (fileBuffer.length > 10 * 1024 * 1024) {
        throw new BadRequestError('Payload size exceeds 10MB limit. Use presigned S3 URLs.');
      }

      const result = await this.storageService.uploadFile(key, fileBuffer, mimeType);
      res.status(201).json({
        success: true,
        message: 'File uploaded successfully to storage',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public downloadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const key = req.query.key as string;
      const result = await this.storageService.downloadFile(key);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.size);
      res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
      res.status(200).send(result.fileBuffer);
    } catch (error) {
      next(error);
    }
  };

  public deleteFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const key = req.query.key as string;
      await this.storageService.deleteFile(key);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully from storage',
      });
    } catch (error) {
      next(error);
    }
  };

  public getFileMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const key = req.query.key as string;
      const metadata = await this.storageService.getFileMetadata(key);

      res.status(200).json({
        success: true,
        message: 'File metadata retrieved successfully from storage',
        data: metadata,
      });
    } catch (error) {
      next(error);
    }
  };

  public generateUploadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { key, expiresIn } = req.body;
      const uploadUrl = await this.storageService.generateUploadUrl(key, expiresIn);

      res.status(200).json({
        success: true,
        message: 'Presigned upload URL generated successfully',
        data: { uploadUrl, key, expiresIn: expiresIn || 900 },
      });
    } catch (error) {
      next(error);
    }
  };

  public generateDownloadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { key, expiresIn } = req.body;
      const downloadUrl = await this.storageService.generateDownloadUrl(key, expiresIn);

      res.status(200).json({
        success: true,
        message: 'Presigned download URL generated successfully',
        data: { downloadUrl, key, expiresIn: expiresIn || 900 },
      });
    } catch (error) {
      next(error);
    }
  };

  public copyFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { sourceKey, destKey } = req.body;
      await this.storageService.copyFile(sourceKey, destKey);

      res.status(200).json({
        success: true,
        message: 'File copied successfully within storage',
      });
    } catch (error) {
      next(error);
    }
  };

  public moveFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { sourceKey, destKey } = req.body;
      await this.storageService.moveFile(sourceKey, destKey);

      res.status(200).json({
        success: true,
        message: 'File moved successfully within storage',
      });
    } catch (error) {
      next(error);
    }
  };

  public renameFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { sourceKey, destKey } = req.body;
      await this.storageService.renameFile(sourceKey, destKey);

      res.status(200).json({
        success: true,
        message: 'File renamed successfully within storage',
      });
    } catch (error) {
      next(error);
    }
  };

  public mockS3Upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = req.params.key;
      const fileBuffer = req.body;
      if (!Buffer.isBuffer(fileBuffer)) {
        throw new BadRequestError('Upload payload must be binary file data.');
      }
      const mimeType = req.headers['content-type'] || 'application/octet-stream';
      await this.storageService.uploadFile(key, fileBuffer, mimeType);

      res.status(200).json({
        success: true,
        message: 'Mock file uploaded successfully to storage',
      });
    } catch (error) {
      next(error);
    }
  };

  public mockS3Download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = req.params.key;
      const result = await this.storageService.downloadFile(key);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.size);
      res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);
      res.status(200).send(result.fileBuffer);
    } catch (error) {
      next(error);
    }
  };
}
