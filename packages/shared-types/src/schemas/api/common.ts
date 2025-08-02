import { z } from "zod";

// ============================================================================
// COMMON API RESPONSE SCHEMAS
// ============================================================================

export const ApiResponseBaseSchema = z.object({
  statusCode: z.number().int().min(100).max(599).default(200),
  message: z.string().optional(),
  code: z.string().optional(),
  timestamp: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataType: T) =>
  ApiResponseBaseSchema.extend({
    success: z.literal(true),
    data: dataType.optional(),
  });

export const ApiErrorResponseSchema = ApiResponseBaseSchema.extend({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
});

export const SimpleMessageDataSchema = z.object({
  message: z.string().describe("A success or informational message"),
});

export const NoContentDataSchema = z
  .undefined()
  .describe("Represents no data payload");

// ============================================================================
// COMMON QUERY OPTIONS
// ============================================================================

export const QueryOptionsSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).optional()),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(0).optional()),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const PaginatedDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    totalPages: z.number().int().min(0).optional(), // Calculated: Math.ceil(total / limit)
    hasNextPage: z.boolean().optional(),
    hasPrevPage: z.boolean().optional(),
  });

// ============================================================================
// COMMON PARAMETER SCHEMAS
// ============================================================================

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const StatusQuerySchema = z.object({
  status: z.string().optional(),
});

export const LimitQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(1000).optional()),
});
