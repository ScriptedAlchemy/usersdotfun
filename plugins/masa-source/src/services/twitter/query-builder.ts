import type { z } from 'zod';
import type { TwitterOptionsSchema } from './config';

type TwitterQueryOptions = z.infer<typeof TwitterOptionsSchema>;

/**
 * Builds a Twitter search query string from the provided options.
 * This function constructs a query that can be used with Twitter's search API
 * by combining various search parameters into a single query string.
 */
export function buildTwitterQuery(options: TwitterQueryOptions): string {
  const queryParts: string[] = [];

  // Basic text search
  if (options.allWords) {
    queryParts.push(options.allWords);
  }

  if (options.exactPhrase) {
    queryParts.push(`"${options.exactPhrase}"`);
  }

  if (options.anyWords) {
    const words = options.anyWords.split(' ').filter(word => word.trim());
    if (words.length > 0) {
      queryParts.push(`(${words.join(' OR ')})`);
    }
  }

  if (options.noneWords) {
    const words = options.noneWords.split(' ').filter(word => word.trim());
    words.forEach(word => {
      queryParts.push(`-${word}`);
    });
  }

  // Hashtags
  if (options.hashtags && options.hashtags.length > 0) {
    options.hashtags.forEach(tag => {
      const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
      queryParts.push(formattedTag);
    });
  }

  // Account-based searches
  if (options.fromAccounts && options.fromAccounts.length > 0) {
    options.fromAccounts.forEach(account => {
      const username = account.startsWith('@') ? account.substring(1) : account;
      queryParts.push(`from:${username}`);
    });
  }

  if (options.toAccounts && options.toAccounts.length > 0) {
    options.toAccounts.forEach(account => {
      const username = account.startsWith('@') ? account.substring(1) : account;
      queryParts.push(`to:${username}`);
    });
  }

  if (options.mentioningAccounts && options.mentioningAccounts.length > 0) {
    options.mentioningAccounts.forEach(account => {
      const username = account.startsWith('@') ? account.substring(1) : account;
      queryParts.push(`@${username}`);
    });
  }

  // Content filters
  if (options.onlyReplies) {
    queryParts.push('filter:replies');
  } else if (options.includeReplies === false) {
    queryParts.push('-filter:replies');
  }

  if (options.onlyLinks) {
    queryParts.push('filter:links');
  }

  // Engagement filters
  if (options.minReplies && options.minReplies > 0) {
    queryParts.push(`min_replies:${options.minReplies}`);
  }

  if (options.minLikes && options.minLikes > 0) {
    queryParts.push(`min_faves:${options.minLikes}`);
  }

  if (options.minRetweets && options.minRetweets > 0) {
    queryParts.push(`min_retweets:${options.minRetweets}`);
  }

  // Date filters
  if (options.sinceDate) {
    queryParts.push(`since:${options.sinceDate}`);
  }

  if (options.untilDate) {
    queryParts.push(`until:${options.untilDate}`);
  }

  // ID-based pagination
  if (options.sinceId) {
    queryParts.push(`since_id:${options.sinceId}`);
  }

  // Language filter
  if (options.language) {
    queryParts.push(`lang:${options.language}`);
  }

  // Join all parts and return
  const query = queryParts.filter(part => part.length > 0).join(' ');

  // If no query parts were added, return a minimal query to avoid empty searches
  return query || '*';
}
