import { User } from '../modules/auth/interfaces/user.interface';
import { Workspace, WorkspaceMember } from '../modules/database/interfaces/workspace.interface';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: User;
      workspace?: Workspace;
      membership?: WorkspaceMember;
    }
  }
}

export {};
