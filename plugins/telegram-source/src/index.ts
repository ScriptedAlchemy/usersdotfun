import {
  ConfigurationError,
  ContentType,
  type SourcePlugin,
  PluginLoggerTag,
  PluginExecutionError,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import TelegramBot from 'node-telegram-bot-api';
import {
  TelegramMessageSchema,
  TelegramSourceConfigSchema,
  TelegramSourceInputSchema,
  TelegramSourceOutputSchema,
} from './schemas';
import type {
  TelegramPluginSourceItem,
  TelegramSourceConfig,
  TelegramSourceInput,
  TelegramSourceOutput,
  TelegramState
} from './types';

const POLLING_LIMIT = 100;
const MAX_POLLING_LOOPS = 10;

export class TelegramSourcePlugin implements SourcePlugin<
  typeof TelegramSourceInputSchema,
  typeof TelegramSourceOutputSchema,
  typeof TelegramSourceConfigSchema
> {
  readonly id = '@curatedotfun/telegram-source' as const;
  readonly type = 'source' as const;
  readonly inputSchema = TelegramSourceInputSchema;
  readonly outputSchema = TelegramSourceOutputSchema;
  readonly configSchema = TelegramSourceConfigSchema;

  private bot?: TelegramBot;

  initialize(config: TelegramSourceConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;

    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      yield* logger.logInfo('Initializing Telegram source plugin', { pluginId: self.id });

      if (!config.secrets?.botToken) {
        yield* logger.logError('Telegram bot token is required', undefined, { config });
        return yield* Effect.fail(new ConfigurationError('Telegram bot token is required.'));
      }

      self.bot = new TelegramBot(config.secrets.botToken);
      yield* logger.logInfo('Telegram bot initialized successfully', { pluginId: self.id });
    });
  }

  execute(input: TelegramSourceInput): Effect.Effect<TelegramSourceOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;

    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!self.bot) {
        yield* logger.logError('Plugin not initialized', new Error('Call initialize() first'));
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized. Call initialize() first.', false));
      }

      yield* logger.logInfo('Starting Telegram message polling', { input });

      const { lastProcessedState, searchOptions } = input;
      const { chatId } = searchOptions;

      const allItems: TelegramPluginSourceItem[] = [];
      const typedState = lastProcessedState as { data: TelegramState } | null;
      let currentOffset = typedState?.data?.lastUpdateId
        ? typedState.data.lastUpdateId + 1
        : undefined;
      let newLastUpdateId = typedState?.data?.lastUpdateId;
      let loopCount = 0;

      try {
        while (loopCount < MAX_POLLING_LOOPS) {
          loopCount++;

          yield* logger.logDebug('Getting Telegram updates', {
            loopCount,
            currentOffset,
            chatId
          });

          const updates: TelegramBot.Update[] = yield* Effect.tryPromise({
            try: () => self.bot!.getUpdates({
              limit: POLLING_LIMIT,
              offset: currentOffset,
              // allowed_updates: ['message'],
            }),
            catch: (error) => {
              const message = error instanceof Error ? error.message : String(error);
              return new PluginExecutionError(`Failed to get Telegram updates: ${message}`, true);
            }
          });

          yield* logger.logDebug('Retrieved updates', {
            updateCount: updates.length,
            loopCount
          });

          if (updates.length === 0) {
            yield* logger.logInfo('No more messages, breaking loop', { loopCount });
            break;
          }

          const processedItems: TelegramPluginSourceItem[] = [];

          for (const update of updates) {
            const parseResult = TelegramMessageSchema.safeParse(update);
            if (!parseResult.success) {
              yield* logger.logWarning('Skipping unparsable update', {
                error: parseResult.error,
                updateId: update.update_id
              });
              continue;
            }

            const { message } = parseResult.data;

            // If a chatId is specified, filter out messages from other chats
            if (chatId && message.chat.id.toString() !== chatId) {
              continue;
            }

            processedItems.push({
              externalId: `${message.chat.id}-${message.message_id}`,
              content: message.text ?? 'nothing',
              contentType: ContentType.FEED,
              createdAt: new Date(message.date * 1000).toISOString(),
              authors: message.from ? [{
                id: message.from.id.toString(),
                username: message.from.username,
                displayName: message.from.first_name,
              }] : [],
              url: `https://t.me/c/${message.chat.id}/${message.message_id}`,
              raw: parseResult.data,
            });
          }

          allItems.push(...processedItems);

          const latestUpdateIdInBatch = Math.max(...updates.map((u) => u.update_id));
          if (newLastUpdateId === undefined || latestUpdateIdInBatch > newLastUpdateId) {
            newLastUpdateId = latestUpdateIdInBatch;
          }
          currentOffset = newLastUpdateId + 1;

          yield* logger.logInfo('Processed batch of messages', {
            batchSize: processedItems.length,
            totalItems: allItems.length,
            latestUpdateId: newLastUpdateId
          });

          if (updates.length < POLLING_LIMIT) {
            yield* logger.logInfo('Received fewer than max messages, finishing', {
              receivedCount: updates.length,
              maxCount: POLLING_LIMIT
            });
            break;
          }
        }

        const result: TelegramSourceOutput = {
          success: true,
          data: {
            items: allItems,
            nextLastProcessedState: newLastUpdateId
              ? { lastUpdateId: newLastUpdateId }
              : typedState?.data ?? null,
          },
        };

        yield* logger.logInfo('Telegram polling completed successfully', {
          totalItems: allItems.length,
          newLastUpdateId,
          loopCount
        });

        return result;
      } catch (error) {
        yield* logger.logError('Error during Telegram polling', error, {
          allItemsCount: allItems.length,
          loopCount,
          currentOffset
        });

        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return {
          success: false,
          errors: [{ message: errorMessage }],
        };
      }
    });
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Shutting down Telegram plugin', { pluginId: self.id });
      self.bot = undefined;
    });
  }
}

export default TelegramSourcePlugin;
