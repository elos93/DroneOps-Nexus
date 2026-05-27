export type UserRole = 'admin' | 'dispatcher' | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest {
  headers: { authorization?: string };
  user?: AuthUser;
}
