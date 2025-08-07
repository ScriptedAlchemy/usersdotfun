import type {
  PlatformState,
  AsyncJobProgress,
  PluginSourceItem,
  LastProcessedState,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import { z } from 'zod';
import {
  MasaSearchOptionsSchema,
  MasaApiResponseSchema,
} from './schemas';

// Masa-specific platform state
export interface MasaPlatformState extends PlatformState {
  latestProcessedId?: string;
  currentAsyncJob?: AsyncJobProgress | null;
}

export type MasaSearchResult = z.infer<typeof MasaApiResponseSchema>;
export type MasaSearchOptions = z.infer<typeof MasaSearchOptionsSchema>;
export type MasaPluginSourceItem = PluginSourceItem<MasaSearchResult>;

// Service interface for platform implementations
export interface IPlatformSearchService {
  search(
    options: MasaSearchOptions,
    currentState: LastProcessedState<MasaPlatformState> | null
  ): Effect.Effect<{
    items: MasaSearchResult[];
    nextStateData: MasaPlatformState | null;
  }, Error>;
}

// Platform configuration
export interface PlatformConfig {
  optionsSchema: z.ZodSchema<any>;
  preparePlatformArgs: (options: MasaSearchOptions) => Record<string, unknown>;
}
