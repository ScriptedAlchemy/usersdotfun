import type { LastProcessedState, SourcePlugin } from '@usersdotfun/core-sdk';
import { ConfigurationError, ContentType } from '@usersdotfun/core-sdk';

import { MasaClient } from './masa-client';
import {
  MasaSourceConfig,
  MasaSourceConfigSchema,
  MasaSourceInput,
  MasaSourceInputSchema,
  MasaSourceOutput,
  MasaSourceOutputSchema,
} from './schemas';
import { ServiceManager, ServiceMap } from './services';
import type {
  MasaPlatformState,
  MasaPluginSourceItem,
  MasaSearchResult
} from './types';

export class MasaSourcePlugin
  implements
  SourcePlugin<
    typeof MasaSourceInputSchema,
    typeof MasaSourceOutputSchema,
    typeof MasaSourceConfigSchema
  > {
  readonly id = '@curatedotfun/masa-source' as const;
  readonly type = 'source' as const;
  readonly inputSchema = MasaSourceInputSchema;
  readonly outputSchema = MasaSourceOutputSchema;
  readonly configSchema = MasaSourceConfigSchema;

  private masaClient!: MasaClient;
  private serviceManager!: ServiceManager;

  async initialize(config: MasaSourceConfig): Promise<void> {
    if (!config?.secrets?.apiKey) {
      throw new ConfigurationError('Masa API key is required.');
    }

    this.masaClient = new MasaClient({
      apiKey: config.secrets.apiKey,
      baseUrl: config.variables?.baseUrl,
    });

    this.serviceManager = new ServiceManager(this.masaClient);
  }

  async execute(input: MasaSourceInput): Promise<MasaSourceOutput> {
    const { searchOptions, lastProcessedState } = input;

    console.log('MasaSourcePlugin: execute called with:', {
      type: searchOptions.type,
      hasState: !!lastProcessedState
    });

    try {
      const service = this.serviceManager.getService(searchOptions.type as keyof ServiceMap);
      const config = this.serviceManager.getConfig(searchOptions.type);

      if (!service || !config) {
        return {
          success: false,
          errors: [{ message: `Unsupported platform type: ${searchOptions.type}` }],
        };
      }

      // Prepare platform-specific arguments
      const platformArgs = config.preparePlatformArgs(searchOptions);

      // Validate platform arguments
      const validatedArgs = config.optionsSchema.parse(platformArgs);

      // Cast the state to our specific type
      const typedState = lastProcessedState as LastProcessedState<MasaPlatformState> | null;

      // Execute service
      const result = await service.search(validatedArgs, typedState);

      // Transform results to plugin items
      const items: MasaPluginSourceItem[] = result.items.map((masaResult: MasaSearchResult) => ({
        externalId: masaResult.id,
        content: masaResult.content,
        contentType: searchOptions.type === 'twitter-scraper' ? ContentType.POST : ContentType.UNKNOWN,
        createdAt: masaResult.Metadata?.created_at || masaResult.created_at,
        url: masaResult.Metadata?.url,
        authors: masaResult.Metadata?.username ? [{
          id: masaResult.Metadata?.user_id,
          username: masaResult.Metadata?.username,
          displayName: masaResult.Metadata?.username,
        }] : undefined,
        raw: masaResult,
      }));

      return {
        success: true,
        data: {
          items,
          nextLastProcessedState: result.nextStateData,
        },
      };

    } catch (error) {
      console.error("MasaSourcePlugin: Error in execute:", error);
      return {
        success: false,
        errors: [{ message: (error as Error).message }],
      };
    }
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}

export default MasaSourcePlugin;
