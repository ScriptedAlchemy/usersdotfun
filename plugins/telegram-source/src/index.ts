import {
  ConfigurationError,
  ContentType,
  type SourcePlugin,
} from '@usersdotfun/core-sdk';
import { Telegraf } from 'telegraf';
import type { Update } from 'telegraf/types';
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
const MAX_POLLING_LOOPS = 10; // Safety break to prevent infinitely running jobs

export class TelegramSourcePlugin
  implements
  SourcePlugin<
    typeof TelegramSourceInputSchema,
    typeof TelegramSourceOutputSchema,
    typeof TelegramSourceConfigSchema
  > {
  readonly id = '@usersdotfun/telegram-source' as const;
  readonly type = 'source' as const;
  readonly inputSchema = TelegramSourceInputSchema;
  readonly outputSchema = TelegramSourceOutputSchema;
  readonly configSchema = TelegramSourceConfigSchema;

  private bot?: Telegraf;

  async initialize(config: TelegramSourceConfig): Promise<void> {
    if (!config.secrets?.botToken) {
      throw new ConfigurationError('Telegram bot token is required.');
    }
    this.bot = new Telegraf(config.secrets.botToken);
  }

  async execute(input: TelegramSourceInput): Promise<TelegramSourceOutput> {
    if (!this.bot) {
      throw new Error('Plugin not initialized. Call initialize() first.');
    }

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

        const updates: Update[] = await this.bot.telegram.getUpdates(
          30, // timeout
          POLLING_LIMIT,
          currentOffset ?? 0,
          ['message']
        );

        if (updates.length === 0) {
          break; // No more messages
        }

        const processedItems: TelegramPluginSourceItem[] = updates
          .map((update): TelegramPluginSourceItem | null => {
            const parseResult = TelegramMessageSchema.safeParse(update);
            if (!parseResult.success) {
              console.warn("TelegramSourcePlugin: Skipping unparsable update:", parseResult.error);
              return null;
            }
            const { message } = parseResult.data;

            // If a chatId is specified, filter out messages from other chats
            if (chatId && message.chat.id.toString() !== chatId) {
              return null;
            }

            return {
              externalId: `${message.chat.id}-${message.message_id}`,
              content: message.text ?? '',
              contentType: ContentType.FEED,
              createdAt: new Date(message.date * 1000).toISOString(),
              authors: message.from ? [{
                id: message.from.id.toString(),
                username: message.from.username,
                displayName: message.from.first_name,
              }] : [],
              url: `https://t.me/c/${message.chat.id}/${message.message_id}`,
              raw: parseResult.data,
            };
          })
          .filter((item): item is TelegramPluginSourceItem => item !== null);

        allItems.push(...processedItems);

        // Update the offset for the next potential loop
        const latestUpdateIdInBatch = Math.max(...updates.map((u) => u.update_id));
        if (newLastUpdateId === undefined || latestUpdateIdInBatch > newLastUpdateId) {
          newLastUpdateId = latestUpdateIdInBatch;
        }
        currentOffset = newLastUpdateId + 1;

        // If we received fewer than the max number of messages, we're done
        if (updates.length < POLLING_LIMIT) {
          break;
        }
      }

      return {
        success: true,
        data: {
          items: allItems,
          nextLastProcessedState: newLastUpdateId
            ? { lastUpdateId: newLastUpdateId }
            : typedState?.data ?? null,
        },
      };
    } catch (error) {
      console.error('TelegramSourcePlugin: Error in execute:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return {
        success: false,
        errors: [{ message: errorMessage }],
      };
    }
  }

  async shutdown(): Promise<void> {
    this.bot = undefined;
  }
}

export default TelegramSourcePlugin;
