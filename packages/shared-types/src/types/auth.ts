import { z } from "zod";
import {
  authenticatedContextSchema,
  jwtPayloadSchema,
  UserRole,
  userSchema
} from '../schemas/auth';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export { UserRole };

export type User = z.infer<typeof userSchema>;
export type JWTPayload = z.infer<typeof jwtPayloadSchema>;
export type AuthenticatedContext = z.infer<typeof authenticatedContextSchema>;
