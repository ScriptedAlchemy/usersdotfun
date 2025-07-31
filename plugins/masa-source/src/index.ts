import type {
  IPlatformSearchService,
  PlatformState,
  PluginSourceItem,
  PluginSourceOutput,
  SourcePlugin,
  SourcePluginSearchOptions
} from '@usersdotfun/core-sdk';
import { ConfigurationError, ContentType } from '@usersdotfun/core-sdk';
import { z } from 'zod';
import { MasaClient, MasaClientConfig, MasaSearchResult } from './masa-client';
import {
  MasaSourceConfigSchema,
  MasaSourceInputSchema,
  MasaSourceOutputSchema,
} from './schemas';
import { PlatformConfig, serviceRegistry } from './services';

// --- Derived Types ---
type MasaSourceConfig = z.infer<typeof MasaSourceConfigSchema>;
type MasaSourceInput = z.infer<typeof MasaSourceInputSchema>;
type MasaSourceOutput = z.infer<typeof MasaSourceOutputSchema>;

export class MasaSourcePlugin
  implements SourcePlugin<MasaSourceInput, PluginSourceOutput<PluginSourceItem<MasaSearchResult>>, MasaSourceConfig> {
  readonly type = 'source' as const;

  private masaClient!: MasaClient;
  private services: Map<
    string,
    IPlatformSearchService<any, any, PlatformState>
  > = new Map();
  private platformConfigs: Map<string, PlatformConfig<any, any>> = new Map();

  async initialize(config: MasaSourceConfig): Promise<void> {
    if (!config?.secrets?.apiKey) {
      throw new ConfigurationError('Masa API key is required.');
    }

    const clientConfig: MasaClientConfig = {
      apiKey: config.secrets.apiKey,
      baseUrl: config.variables?.baseUrl,
    };
    this.masaClient = new MasaClient(clientConfig);

    for (const entry of serviceRegistry) {
      const serviceInstance = entry.factory(this.masaClient);
      this.services.set(entry.platformType, serviceInstance);
      this.platformConfigs.set(entry.platformType, entry.config);
    }
  }

  async execute(input: MasaSourceInput): Promise<PluginSourceOutput<PluginSourceItem<MasaSearchResult>>> {
    const { searchOptions, lastProcessedState } = input;
    const searchPlatformType = searchOptions.type as string;

    console.log("RUNNING ON INPUT", input);

    if (!this.masaClient) {
      return {
        success: false,
        errors: [{ message: 'MasaSourcePlugin not initialized.' }],
      };
    }

    const service = this.services.get(searchPlatformType);
    if (!service) {
      return {
        success: false,
        errors: [
          {
            message: `No service registered for platform type: "${searchPlatformType}"`,
          },
        ],
      };
    }

    const platformConfig = this.platformConfigs.get(searchPlatformType);
    if (!platformConfig) {
      return {
        success: false,
        errors: [
          {
            message: `No platform configuration found for type: "${searchPlatformType}"`,
          },
        ],
      };
    }

    try {
      const rawServiceOptions = platformConfig.preparePlatformArgs(
        searchOptions as SourcePluginSearchOptions
      );
      const validatedServiceOptions =
        platformConfig.optionsSchema.parse(rawServiceOptions);

      const serviceResults = await service.search(
        validatedServiceOptions,
        lastProcessedState
      );

      // Transform MasaSearchResult[] to MasaPluginSourceItem[]
      const pluginSourceItems: PluginSourceItem<MasaSearchResult>[] = serviceResults.items.map((masaResult: MasaSearchResult) => ({
        externalId: masaResult.ExternalID,
        content: masaResult.Content,
        contentType: searchPlatformType === 'twitter-scraper' ? ContentType.POST : ContentType.UNKNOWN,
        createdAt: masaResult.Metadata?.created_at,
        url: masaResult.Metadata?.url,
        authors: masaResult.Metadata?.author ? [{
          id: masaResult.Metadata?.user_id,
          username: masaResult.Metadata?.author,
          displayName: masaResult.Metadata?.author,
        }] : undefined,
        raw: masaResult, // Store the entire Masa result as raw data
      }));

      return {
        success: true,
        data: {
          items: pluginSourceItems,
          nextLastProcessedState: serviceResults.nextStateData,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: [
            {
              message: `Invalid options for ${searchPlatformType}: ${error.issues
                .map((e) => `${e.path.join('.')} - ${e.message}`)
                .join(', ')}`,
            },
          ],
        };
      }
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
