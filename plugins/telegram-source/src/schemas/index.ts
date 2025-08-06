import {
  createConfigSchema,
  createSourceInputSchema,
  createSourceOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

// The state we persist between runs
export const TelegramStateSchema = z.object({
  lastUpdateId: z.number().describe("The ID of the last update processed."),
});

// The configuration for the Telegram source in a workflow.
export const TelegramSearchOptionsSchema = z.object({
  chatId: z.string().describe("ID of the specific Telegram chat to listen to."),
}).catchall(z.unknown());

// The schema for the plugin's configuration, including secrets.
export const TelegramSourceConfigSchema = createConfigSchema(
  z.object({
    // No non-secret variables needed for this plugin
  }),
  z.object({
    botToken: z.string().min(1, "Telegram bot token is required."),
  })
);

// The schema for a single Telegram message, simplified for our use.
// This defines the structure of the `raw` property in a SourceItem.
export const TelegramMessageSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    date: z.number(),
    text: z.string().optional(),
    chat: z.object({
      id: z.number(),
      username: z.string().optional(),
      first_name: z.string().optional(),
    }),
    from: z.object({
      id: z.number(),
      is_bot: z.boolean(),
      first_name: z.string().optional(),
      username: z.string().optional(),
    }),
  }).catchall(z.unknown()),
}).catchall(z.unknown());

// The schema for the input to the `execute` function.
export const TelegramSourceInputSchema = createSourceInputSchema(
  TelegramSearchOptionsSchema,
  TelegramStateSchema
);

// The schema for the output of the `execute` function.
export const TelegramSourceOutputSchema = createSourceOutputSchema(
  TelegramMessageSchema,
  TelegramStateSchema
);

// Exporting the inferred TypeScript types for use in other files.
export type TelegramSourceConfig = z.infer<typeof TelegramSourceConfigSchema>;
export type TelegramSearchOptions = z.infer<typeof TelegramSearchOptionsSchema>;
export type TelegramSourceInput = z.infer<typeof TelegramSourceInputSchema>;
export type TelegramSourceOutput = z.infer<typeof TelegramSourceOutputSchema>;
export type TelegramState = z.infer<typeof TelegramStateSchema>;
export type TelegramMessage = z.infer<typeof TelegramMessageSchema>;
