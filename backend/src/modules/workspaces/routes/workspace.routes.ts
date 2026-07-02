import { Router } from 'express';
import { WorkspaceController } from '../controllers/workspace.controller';
import { protect } from '../../../middleware/protect';
import { validate } from '../../../middleware/validation.middleware';
import { requireWorkspacePermission } from '../../../middleware/rbac.middleware';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
} from '../validators/workspace.validators';

const router = Router();
const controller = new WorkspaceController();

// Require authenticated user for all workspace operations
router.use(protect);

router.post('/', validate(createWorkspaceSchema), controller.createWorkspace);
router.get('/', controller.getWorkspaces);
router.post('/accept', validate(acceptInvitationSchema), controller.acceptInvite);

router.get('/:id', requireWorkspacePermission('files.download'), controller.getWorkspaceById);
router.patch('/:id', requireWorkspacePermission('workspace.settings'), validate(updateWorkspaceSchema), controller.updateWorkspace);
router.delete('/:id', requireWorkspacePermission('workspace.manage'), controller.deleteWorkspace);

router.get('/:id/members', requireWorkspacePermission('files.download'), controller.getMembers);
router.post('/:id/invite', requireWorkspacePermission('workspace.invite'), validate(inviteMemberSchema), controller.inviteMember);
router.patch('/:id/members/:memberId', requireWorkspacePermission('members.manage'), validate(updateMemberRoleSchema), controller.updateMember);
router.delete('/:id/members/:memberId', requireWorkspacePermission('workspace.remove'), controller.removeMember);

router.get('/:id/dashboard', requireWorkspacePermission('analytics.view'), controller.getDashboard);
router.get('/:id/analytics', requireWorkspacePermission('analytics.view'), controller.getAnalytics);

export const workspaceRouter = router;
