import { z } from "zod";

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export const jwtPayloadSchema = z.object({
  id: z.string(),
  isAnonymous: z.boolean(),
  role: z.nativeEnum(UserRole),
  banned: z.boolean().optional(),
  iat: z.number(),
  exp: z.number(),
});

export const authenticatedContextSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    role: z.nativeEnum(UserRole),
    isAnonymous: z.boolean().optional(),
    banned: z.boolean().optional(),
  }),
  session: z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.date(),
    token: z.string(),
  }),
});
