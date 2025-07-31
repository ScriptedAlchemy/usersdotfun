import { z } from 'zod';
import type { PlatformConfig } from '../../types';

// Twitter-specific options schema
export const TwitterOptionsSchema = z.object({
  allWords: z.string().optional(),
  exactPhrase: z.string().optional(),
  anyWords: z.string().optional(),
  noneWords: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  fromAccounts: z.array(z.string()).optional(),
  toAccounts: z.array(z.string()).optional(),
  mentioningAccounts: z.array(z.string()).optional(),
  includeReplies: z.boolean().optional(),
  onlyReplies: z.boolean().optional(),
  onlyLinks: z.boolean().optional(),
  minReplies: z.number().int().positive().optional(),
  minLikes: z.number().int().positive().optional(),
  minRetweets: z.number().int().positive().optional(),
  sinceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  untilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sinceId: z.string().optional(),
  language: z.string().optional(),
  pageSize: z.number().optional(),
  query: z.string().optional(),
}).strict();

// Prepare Twitter arguments from generic search options
const prepareTwitterArgs = (options: Record<string, unknown>): Record<string, unknown> => {
  const { query, pageSize, platformArgs, ...rest } = options;

  // Safely handle platformArgs as it could be unknown
  const safePlatformArgs = platformArgs && typeof platformArgs === 'object' && !Array.isArray(platformArgs)
    ? platformArgs as Record<string, unknown>
    : {};

  const result = {
    ...safePlatformArgs,
    ...rest,
  };

  // Map generic query to allWords if not already specified
  if (query && typeof query === 'string' && !safePlatformArgs.allWords) {
    result.allWords = query;
  }

  // Map generic pageSize if not already specified
  if (pageSize && typeof pageSize === 'number' && !safePlatformArgs.pageSize) {
    result.pageSize = pageSize;
  }

  return result;
};

// Twitter service configuration
export const twitterServiceConfig: PlatformConfig = {
  optionsSchema: TwitterOptionsSchema,
  preparePlatformArgs: prepareTwitterArgs,
};
