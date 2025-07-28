import { Context, Redacted } from 'effect';

export interface QueueConfig {
  readonly redisUrl: Redacted.Redacted<string>;
}

export const QueueConfig = Context.GenericTag<QueueConfig>('QueueConfig');