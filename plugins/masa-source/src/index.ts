import type { Plugin } from '@usersdotfun/core-sdk';
import { z } from 'zod';
import {
  MasaSourceConfigSchema,
  MasaSourceInputSchema,
  MasaSourceOutputSchema,
} from './schemas';
import { MasaClient, MasaClientConfig, MasaSearchResult } from './masa-client';
import { serviceRegistry, PlatformConfig } from './services';

// --- Local Interfaces to remove dependency on @curatedotfun/types ---

export interface LastProcessedState<TPlatformState> {
  data: TPlatformState;
}

export interface SourceItem {
    id: string;
    [key: string]: any;
}

export interface AsyncJobProgress {
    jobId: string;
    status: 'submitted' | 'processing' | 'pending' | 'done' | 'error' | 'timeout';
    errorMessage?: string;
    [key: string]: any;
}

export interface PlatformState {
    latestProcessedId?: string | number | Record<string, any>;
    currentAsyncJob?: AsyncJobProgress | null;
    [key: string]: any;
}

export interface IPlatformSearchService<
  TItem extends SourceItem,
  TPlatformOptions = Record<string, unknown>,
  TPlatformState extends PlatformState = PlatformState
> {
  initialize?(config?: any): Promise<void>;
  search(
    options: TPlatformOptions,
    currentState: LastProcessedState<TPlatformState> | null
  ): Promise<{
    items: TItem[];
    nextStateData: TPlatformState | null;
  }>;
  shutdown?(): Promise<void>;
}

// --- Derived Types ---
type MasaSourceConfig = z.infer<typeof MasaSourceConfigSchema>;
type MasaSourceInput = z.infer<typeof MasaSourceInputSchema>;
type MasaSourceOutput = z.infer<typeof MasaSourceOutputSchema>;

export class MasaSourcePlugin
  implements Plugin<MasaSourceInput, MasaSourceOutput, MasaSourceConfig>
{
  readonly type = 'source' as const;

  private masaClient!: MasaClient;
  private services: Map<
    string,
    IPlatformSearchService<any, any, PlatformState>
  > = new Map();
  private platformConfigs: Map<string, PlatformConfig<any, any>> = new Map();

  async initialize(config: MasaSourceConfig): Promise<void> {
    console.log("RECEIVED CONFIG", config);
    if (!config?.secrets?.apiKey) {
      throw new Error('Masa API key is required.');
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

  async execute(input: MasaSourceInput): Promise<MasaSourceOutput> {
    const { searchOptions, lastProcessedState } = input;
    const searchPlatformType = searchOptions.type as string;

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
        searchOptions
      );
      const validatedServiceOptions =
        platformConfig.optionsSchema.parse(rawServiceOptions);

      const serviceResults = await service.search(
        validatedServiceOptions,
        lastProcessedState as any
      );

      return {
        success: true,
        data: {
          items: serviceResults.items as MasaSearchResult[],
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
