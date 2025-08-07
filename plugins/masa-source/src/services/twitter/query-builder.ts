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

  // Add all the other operators
  if (options.url) {
    queryParts.push(`url:${options.url}`);
  }
  if (options.list) {
    queryParts.push(`list:${options.list}`);
  }
  if (options.fromVerified) {
    queryParts.push('filter:verified');
  }
  if (options.fromBlueVerified) {
    queryParts.push('filter:blue_verified');
  }
  if (options.fromFollows) {
    queryParts.push('filter:follows');
  }
  if (options.near) {
    queryParts.push(`near:${options.near}`);
  }
  if (options.within) {
    queryParts.push(`within:${options.within}`);
  }
  if (options.geocode) {
    queryParts.push(`geocode:${options.geocode}`);
  }
  if (options.place) {
    queryParts.push(`place:${options.place}`);
  }
  if (options.sinceTime) {
    queryParts.push(`since:${options.sinceTime}`);
  }
  if (options.untilTime) {
    queryParts.push(`until:${options.untilTime}`);
  }
  if (options.sinceTimeUnix) {
    queryParts.push(`since_time:${options.sinceTimeUnix}`);
  }
  if (options.untilTimeUnix) {
    queryParts.push(`until_time:${options.untilTimeUnix}`);
  }
  if (options.maxId) {
    queryParts.push(`max_id:${options.maxId}`);
  }
  if (options.withinTime) {
    queryParts.push(`within_time:${options.withinTime}`);
  }
  if (options.nativeRetweets) {
    queryParts.push('filter:nativeretweets');
  }
  if (options.includeNativeRetweets) {
    queryParts.push('include:nativeretweets');
  }
  if (options.retweets) {
    queryParts.push('filter:retweets');
  }
  if (options.selfThreads) {
    queryParts.push('filter:self_threads');
  }
  if (options.conversationId) {
    queryParts.push(`conversation_id:${options.conversationId}`);
  }
  if (options.quoteTweets) {
    queryParts.push('filter:quote');
  }
  if (options.quotedTweetId) {
    queryParts.push(`quoted_tweet_id:${options.quotedTweetId}`);
  }
  if (options.quotedUserId) {
    queryParts.push(`quoted_user_id:${options.quotedUserId}`);
  }
  if (options.cardName) {
    queryParts.push(`card_name:${options.cardName}`);
  }
  if (options.hasEngagement) {
    queryParts.push('filter:has_engagement');
  }
  if (options.maxRetweets) {
    queryParts.push(`-min_retweets:${options.maxRetweets}`);
  }
  if (options.maxLikes) {
    queryParts.push(`-min_faves:${options.maxLikes}`);
  }
  if (options.maxReplies) {
    queryParts.push(`-min_replies:${options.maxReplies}`);
  }
  if (options.hasMedia) {
    queryParts.push('filter:media');
  }
  if (options.hasTwitterImage) {
    queryParts.push('filter:twimg');
  }
  if (options.hasImages) {
    queryParts.push('filter:images');
  }
  if (options.hasVideos) {
    queryParts.push('filter:videos');
  }
  if (options.hasPeriscope) {
    queryParts.push('filter:periscope');
  }
  if (options.hasNativeVideo) {
    queryParts.push('filter:native_video');
  }
  if (options.hasVine) {
    queryParts.push('filter:vine');
  }
  if (options.hasConsumerVideo) {
    queryParts.push('filter:consumer_video');
  }
  if (options.hasProVideo) {
    queryParts.push('filter:pro_video');
  }
  if (options.hasSpaces) {
    queryParts.push('filter:spaces');
  }
  if (options.hasMentions) {
    queryParts.push('filter:mentions');
  }
  if (options.hasNews) {
    queryParts.push('filter:news');
  }
  if (options.isSafe) {
    queryParts.push('filter:safe');
  }
  if (options.hasHashtags) {
    queryParts.push('filter:hashtags');
  }
  if (options.source) {
    queryParts.push(`source:${options.source}`);
  }
  if (options.cardDomain) {
    queryParts.push(`card_domain:${options.cardDomain}`);
  }
  if (options.cardUrl) {
    queryParts.push(`card_url:${options.cardUrl}`);
  }

  // Join all parts and return
  const query = queryParts.filter(part => part.length > 0).join(' ');

  // If no query parts were added, return a minimal query to avoid empty searches
  return query || '*';
}
