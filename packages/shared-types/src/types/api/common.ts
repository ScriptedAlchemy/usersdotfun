import { z } from "zod";
import {
  ApiResponseBaseSchema,
  ApiErrorResponseSchema,
  SimpleMessageDataSchema,
  QueryOptionsSchema,
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
// COMMON QUERY TYPES
// ============================================================================

export type BaseStringQueryOptions = z.infer<typeof QueryOptionsSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type StatusQuery = z.infer<typeof StatusQuerySchema>;
export type LimitQuery = z.infer<typeof LimitQuerySchema>;

// ============================================================================
// GENERIC API SUCCESS RESPONSE TYPE
// ============================================================================

export type ApiSuccessResponse<T> = Omit<ApiResponseBase, "message"> & {
  success: true;
  data?: T;
};

// ============================================================================
// PAGINATED DATA TYPE
// ============================================================================

export type PaginatedData<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};
