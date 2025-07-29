import { z } from "zod";
import {
  jwtPayloadSchema,
  authenticatedContextSchema,
  UserRole,
} from '../schemas/auth';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export { UserRole };

export type JWTPayload = z.infer<typeof jwtPayloadSchema>;
export type AuthenticatedContext = z.infer<typeof authenticatedContextSchema>;
