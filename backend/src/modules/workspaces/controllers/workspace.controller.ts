import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspace.service';
import { UnauthorizedError } from '../../../utils/app-error';

export class WorkspaceController {
  private workspaceService: WorkspaceService;

  constructor(workspaceService: WorkspaceService = new WorkspaceService()) {
    this.workspaceService = workspaceService;
  }

  public createWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { name, slug, description } = req.body;
      const workspace = await this.workspaceService.createWorkspace(userId, { name, slug, description });

      res.status(201).json({
        success: true,
        message: 'Workspace created successfully',
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  };

  public getWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const workspaces = await this.workspaceService.getUserWorkspaces(userId);

      res.status(200).json({
        success: true,
        message: 'Workspaces retrieved successfully',
        data: workspaces,
      });
    } catch (error) {
      next(error);
    }
  };

  public getWorkspaceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const workspace = await this.workspaceService.getWorkspaceById(id);

      res.status(200).json({
        success: true,
        message: 'Workspace retrieved successfully',
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { id } = req.params;
      const updates = req.body;
      const workspace = await this.workspaceService.updateWorkspace(id, userId, updates);

      res.status(200).json({
        success: true,
        message: 'Workspace updated successfully',
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { id } = req.params;
      await this.workspaceService.deleteWorkspace(id, userId);

      res.status(200).json({
        success: true,
        message: 'Workspace deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Member Management
  // =========================================================================

  public getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const members = await this.workspaceService.getMembers(id);

      res.status(200).json({
        success: true,
        message: 'Members retrieved successfully',
        data: members,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { id, memberId } = req.params;
      const { role } = req.body;
      const member = await this.workspaceService.updateMemberRole(id, userId, memberId, role);

      res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: member,
      });
    } catch (error) {
      next(error);
    }
  };

  public removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { id, memberId } = req.params;
      await this.workspaceService.removeMember(id, userId, memberId);

      res.status(200).json({
        success: true,
        message: 'Member removed successfully from workspace',
      });
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Invitation Flow
  // =========================================================================

  public inviteMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { id } = req.params;
      const { email, role } = req.body;
      const invite = await this.workspaceService.inviteMember(id, userId, email, role);

      res.status(200).json({
        success: true,
        message: 'Member invited successfully',
        data: invite,
      });
    } catch (error) {
      next(error);
    }
  };

  public acceptInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      if (!userId || !userEmail) {
        throw new UnauthorizedError('Unauthorized');
      }

      const { token } = req.body;
      const member = await this.workspaceService.acceptInvitation(userId, userEmail, token);

      res.status(200).json({
        success: true,
        message: 'Invitation accepted successfully, welcome to the workspace!',
        data: member,
      });
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Dashboard & Analytics
  // =========================================================================

  public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dashboard = await this.workspaceService.getWorkspaceDashboard(id);

      res.status(200).json({
        success: true,
        message: 'Workspace dashboard data retrieved successfully',
        data: dashboard,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const analytics = await this.workspaceService.getWorkspaceAnalytics(id);

      res.status(200).json({
        success: true,
        message: 'Workspace analytics data retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  };
}
