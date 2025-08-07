import { z } from 'zod';
import type { MasaSearchOptions, PlatformConfig } from '../../types';

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
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'), // past-to-present (ascending) and present-to-past (descending)

  // Add all the other operators
  url: z.string().optional(),
  list: z.string().optional(),
  fromVerified: z.boolean().optional(),
  fromBlueVerified: z.boolean().optional(),
  fromFollows: z.boolean().optional(),
  near: z.string().optional(),
  within: z.string().optional(),
  geocode: z.string().optional(),
  place: z.string().optional(),
  sinceTime: z.string().optional(),
  untilTime: z.string().optional(),
  sinceTimeUnix: z.number().optional(),
  untilTimeUnix: z.number().optional(),
  maxId: z.string().optional(),
  withinTime: z.string().optional(),
  nativeRetweets: z.boolean().optional(),
  includeNativeRetweets: z.boolean().optional(),
  retweets: z.boolean().optional(),
  selfThreads: z.boolean().optional(),
  conversationId: z.string().optional(),
  quoteTweets: z.boolean().optional(),
  quotedTweetId: z.string().optional(),
  quotedUserId: z.string().optional(),
  cardName: z.string().optional(),
  hasEngagement: z.boolean().optional(),
  maxRetweets: z.number().int().positive().optional(),
  maxLikes: z.number().int().positive().optional(),
  maxReplies: z.number().int().positive().optional(),
  hasMedia: z.boolean().optional(),
  hasTwitterImage: z.boolean().optional(),
  hasImages: z.boolean().optional(),
  hasVideos: z.boolean().optional(),
  hasPeriscope: z.boolean().optional(),
  hasNativeVideo: z.boolean().optional(),
  hasVine: z.boolean().optional(),
  hasConsumerVideo: z.boolean().optional(),
  hasProVideo: z.boolean().optional(),
  hasSpaces: z.boolean().optional(),
  hasMentions: z.boolean().optional(),
  hasNews: z.boolean().optional(),
  isSafe: z.boolean().optional(),
  hasHashtags: z.boolean().optional(),
  source: z.string().optional(),
  cardDomain: z.string().optional(),
  cardUrl: z.string().optional(),
}).strict();

// Prepare Twitter arguments from generic search options
export const prepareTwitterArgs = (options: MasaSearchOptions): Record<string, unknown> => {
  const { query, pageSize, platformArgs, type, ...rest } = options;

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
