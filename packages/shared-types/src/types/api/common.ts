import { z } from "zod";
import {
  ApiResponseBaseSchema,
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
  SimpleMessageDataSchema,
  QueryOptionsSchema,
  PaginatedDataSchema,
  IdParamSchema,
  StatusQuerySchema,
  LimitQuerySchema,
} from '../../schemas/api/common';

// ============================================================================
// COMMON API TYPES
// ============================================================================

export type ApiResponseBase = z.infer<typeof ApiResponseBaseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type SimpleMessageData = z.infer<typeof SimpleMessageDataSchema>;

// ============================================================================
// GENERIC API SUCCESS RESPONSE TYPE
// ============================================================================

export type ApiSuccessResponse<T> = Omit<ApiResponseBase, "message"> & {
  success: true;
  data?: T;
};

// ============================================================================
// COMMON QUERY TYPES
// ============================================================================

export type BaseStringQueryOptions = z.infer<typeof QueryOptionsSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type StatusQuery = z.infer<typeof StatusQuerySchema>;
export type LimitQuery = z.infer<typeof LimitQuerySchema>;

// ============================================================================
// PAGINATED DATA TYPE
// ============================================================================

export type PaginatedData<T> = z.infer<
  ReturnType<typeof PaginatedDataSchema<z.ZodType<T>>>
>;
