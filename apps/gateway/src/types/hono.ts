import type { User as BetterAuthUser, Session } from 'better-auth/types';

interface User extends BetterAuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  isAnonymous: boolean;
  banned: boolean;
}

export type AppType = {
  Variables: {
    user?: User;
    session?: Session;
    isAuthenticated: boolean;
    userId?: string;
    userRole?: string;
    isAnonymous?: boolean;
  }
}

export type { User };
