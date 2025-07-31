import type { 
  PlatformState, 
  AsyncJobProgress, 
  PluginSourceItem,
  LastProcessedState 
} from '@usersdotfun/core-sdk';
import { z } from 'zod';
import { MasaSearchOptionsSchema, MasaSearchResultSchema } from './schemas';

// Masa-specific platform state
export interface MasaPlatformState extends PlatformState {
  latestProcessedId?: string;
  currentAsyncJob?: AsyncJobProgress | null;
}

export type MasaSearchResult = z.infer<typeof MasaSearchResultSchema>;

export type MasaSearchOptions = z.infer<typeof MasaSearchOptionsSchema>;

export type MasaPluginSourceItem = PluginSourceItem<MasaSearchResult>;

// Service interface for platform implementations
export interface IPlatformSearchService {
  search(
    options: Record<string, unknown>,
    currentState: LastProcessedState<MasaPlatformState> | null,
  ): Promise<{
    items: MasaSearchResult[];
    nextStateData: MasaPlatformState | null;
  }>;
}

// Platform configuration
export interface PlatformConfig {
  optionsSchema: z.ZodSchema<any>;
  preparePlatformArgs: (options: Record<string, unknown>) => Record<string, unknown>;
}
