import { Request, Response, NextFunction } from 'express';
import { RepositoryRegistry } from '../modules/database/repositories/registry';
import { ForbiddenError, UnauthorizedError, BadRequestError } from '../utils/app-error';
import { WorkspaceRole } from '../modules/database/interfaces/workspace.interface';

export const ROLE_PERMISSIONS: Record<WorkspaceRole, string[]> = {
  OWNER: [
    'workspace.manage',
    'workspace.invite',
    'workspace.remove',
    'workspace.settings',
    'files.upload',
    'files.delete',
    'files.share',
    'files.download',
    'files.manage',
    'members.manage',
    'analytics.view',
  ],
  ADMIN: [
    'workspace.invite',
    'workspace.remove',
    'workspace.settings',
    'files.upload',
    'files.delete',
    'files.share',
    'files.download',
    'files.manage',
    'members.manage',
    'analytics.view',
  ],
  MANAGER: [
    'workspace.invite',
    'workspace.remove',
    'files.upload',
    'files.delete',
    'files.share',
    'files.download',
    'files.manage',
    'members.manage',
    'analytics.view',
  ],
  EDITOR: [
    'files.upload',
    'files.delete',
    'files.share',
    'files.download',
    'files.manage',
  ],
  MEMBER: [
    'files.upload',
    'files.share',
    'files.download',
  ],
  VIEWER: [
    'files.download',
  ],
};

/**
 * Checks if a user has a specific permission in a workspace
 */
export function hasPermission(role: WorkspaceRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Middleware to require a specific workspace permission
 */
export function requireWorkspacePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User is not authenticated');
      }

      // Try to extract workspaceId from request parameters, body or query string
      const workspaceId =
        req.params.workspaceId ||
        req.params.id ||
        req.body.workspaceId ||
        (req.query.workspaceId as string);

      if (!workspaceId) {
        throw new BadRequestError('Workspace ID is required for authorization');
      }

      const workspaceRepo = RepositoryRegistry.getWorkspaceRepository();
      
      // Verify workspace exists
      const workspace = await workspaceRepo.findById(workspaceId);
      if (!workspace) {
        throw new BadRequestError(`Workspace with ID ${workspaceId} not found`);
      }

      // Verify user's membership and retrieve role
      const member = await workspaceRepo.findMember(workspaceId, userId);
      if (!member || member.status !== 'ACTIVE') {
        throw new ForbiddenError('You do not have access to this workspace');
      }

      // Check permissions
      if (!hasPermission(member.role, permission)) {
        throw new ForbiddenError(`Forbidden: Missing required permission '${permission}'`);
      }

      // Attach workspace and membership information to request for downstream usage
      req.workspace = workspace;
      req.membership = member;

      next();
    } catch (error) {
      next(error);
    }
  };
}
