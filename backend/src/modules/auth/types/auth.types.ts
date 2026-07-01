import { UserRole, PlanType } from '../interfaces/user.interface';

export interface TokenPayload {
  sub: string; // Cognito sub compatible user id
  email: string;
  role: UserRole;
  planType: PlanType;
}
