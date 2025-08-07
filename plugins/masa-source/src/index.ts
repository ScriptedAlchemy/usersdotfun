import {
  type SourcePlugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
  ContentType,
  type LastProcessedState,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
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

  initialize(config: MasaSourceConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!config?.secrets?.apiKey) {
        const error = new ConfigurationError('Masa API key is required.');
        yield* logger.logError('Configuration error: Masa API key is missing.', error);
        return yield* Effect.fail(error);
      }

      self.masaClient = new MasaClient({
        apiKey: config.secrets.apiKey,
        baseUrl: config.variables?.baseUrl,
      });

      self.serviceManager = new ServiceManager(self.masaClient);
      yield* logger.logInfo('Masa source plugin initialized successfully', { pluginId: self.id });
    });
  }

  execute(
    input: MasaSourceInput
  ): Effect.Effect<MasaSourceOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      const { searchOptions, lastProcessedState } = input;

      const service = self.serviceManager.getService(
        searchOptions.type as keyof ServiceMap
      );
      const config = self.serviceManager.getConfig(searchOptions.type);

      if (!service || !config) {
        return yield* Effect.fail(
          new PluginExecutionError(
            `Unsupported platform type: ${searchOptions.type}`,
            false
          )
        );
      }

      const platformArgs = config.preparePlatformArgs(searchOptions);

      const validatedArgs = yield* Effect.try({
        try: () => config.optionsSchema.parse(platformArgs),
        catch: (error) => {
          const message =
            error instanceof Error ? error.message : 'Unknown validation error';
          return new PluginExecutionError(
            `Invalid platform arguments: ${message}`,
            false
          );
        },
      });

      const typedState =
        lastProcessedState as LastProcessedState<MasaPlatformState> | null;

      const result = yield* service.search(validatedArgs, typedState).pipe(
        Effect.mapError(
          (error) =>
            new PluginExecutionError(
              error.message,
              true // Assuming polling errors are retryable
            )
        )
      );

      const items: MasaPluginSourceItem[] = result.items.map(
        (masaResult: MasaSearchResult) => ({
          externalId: masaResult.id,
          content: masaResult.content,
          contentType:
            searchOptions.type === 'twitter-scraper'
              ? ContentType.POST
              : ContentType.UNKNOWN,
          createdAt: masaResult.metadata?.created_at || masaResult.created_at,
          url: masaResult.metadata?.url,
          authors: masaResult.metadata?.username
            ? [
                {
                  id: masaResult.metadata?.user_id,
                  username: masaResult.metadata?.username,
                  displayName: masaResult.metadata?.username,
                },
              ]
            : undefined,
          raw: masaResult,
        })
      );

      return {
        success: true,
        data: {
          items,
          nextLastProcessedState: result.nextStateData,
        },
      };
    });
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Shutting down Masa source plugin', { pluginId: self.id });
    });
  }
}

export default MasaSourcePlugin;
