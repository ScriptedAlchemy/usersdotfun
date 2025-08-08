import {
  type SourcePlugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
  ContentType,
  type LastProcessedState,
  type PluginSourceItem,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import { parse } from 'csv-parse/sync';
import {
  X23SourceConfig,
  X23SourceConfigSchema,
  X23SourceInput,
  X23SourceInputSchema,
  X23SourceOutput,
  X23SourceOutputSchema,
  X23PlatformState,
  X23Record,
  X23RecordSchema,
} from './schemas';

export class X23SourcePlugin
  implements SourcePlugin<
    typeof X23SourceInputSchema,
    typeof X23SourceOutputSchema,
    typeof X23SourceConfigSchema
  > {
  readonly id = '@curatedotfun/x23-source' as const;
  readonly type = 'source' as const;
  readonly inputSchema = X23SourceInputSchema;
  readonly outputSchema = X23SourceOutputSchema;
  readonly configSchema = X23SourceConfigSchema;

  private config: X23SourceConfig | null = null;

  initialize(config: X23SourceConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      self.config = config;
      yield* logger.logInfo('X23 source plugin initialized successfully', { 
        pluginId: self.id,
        baseUrl: config.variables?.baseUrl,
        timeout: config.variables?.timeout,
      });
    });
  }

  execute(input: X23SourceInput): Effect.Effect<X23SourceOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      const { searchOptions, lastProcessedState } = input;

      if (!self.config) {
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized', false));
      }

      yield* logger.logDebug('Executing X23 source plugin', { 
        searchOptions, 
        hasState: !!lastProcessedState 
      });

      const typedState = lastProcessedState as LastProcessedState<X23PlatformState> | null;
      const days = searchOptions.days || 7;

      // Check if we should skip this fetch to avoid too frequent requests
      if (typedState?.data?.lastFetchTime) {
        const now = new Date();
        const lastFetch = new Date(typedState.data.lastFetchTime);
        const timeSinceLastFetch = now.getTime() - lastFetch.getTime();
        const minInterval = self.config.variables?.minFetchInterval || 300000; // 5 minutes default

        const shouldSkip = timeSinceLastFetch < minInterval && 
                          typedState.data.lastSuccessfulDays === days;

        if (shouldSkip) {
          yield* logger.logInfo('Skipping fetch - too soon since last successful fetch', {
            timeSinceLastFetch,
            minInterval,
            lastSuccessfulDays: typedState.data.lastSuccessfulDays,
            requestedDays: days,
          });

          return {
            success: true,
            data: {
              items: [],
              nextLastProcessedState: typedState.data,
            },
          };
        }
      }

      // Fetch data from x23 API
      const baseUrl = self.config.variables?.baseUrl || 'http://api.x23.ai';
      const timeout = self.config.variables?.timeout || 30000;
      const userAgent = self.config.variables?.userAgent || 'curate.fun x23-source-plugin';
      const url = `${baseUrl}/logs/grantwire/${days}`;

      yield* logger.logDebug('Fetching data from X23 API', { url, timeout });

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Fetch CSV data
        const response = yield* Effect.tryPromise({
          try: () => fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/csv, text/plain, */*',
            },
            signal: controller.signal,
          }),
          catch: (error) => {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
              return new PluginExecutionError(`Request timeout after ${timeout}ms`, true);
            }
            return new PluginExecutionError(
              `Failed to fetch X23 data: ${error instanceof Error ? error.message : 'Unknown error'}`,
              true // Network errors are retryable
            );
          },
        });

        clearTimeout(timeoutId);

        // Validate response status
        if (!response.ok) {
          return yield* Effect.fail(new PluginExecutionError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status >= 500 // Retry server errors
          ));
        }

        // Log content type for debugging
        const contentType = response.headers.get('content-type');
        yield* logger.logDebug('Response received', { 
          status: response.status, 
          contentType 
        });

        // Get CSV text
        const csvText = yield* Effect.tryPromise({
          try: () => response.text(),
          catch: (error) => new PluginExecutionError(
            `Failed to read response text: ${error instanceof Error ? error.message : 'Unknown error'}`,
            false
          ),
        });

        yield* logger.logDebug('CSV data received', { 
          length: csvText.length,
          preview: csvText.substring(0, 200) 
        });

        // Parse CSV
        const rawRecords = yield* Effect.try({
          try: () => parse(csvText, {
            columns: true, // Use first row as column headers
            skip_empty_lines: true,
            trim: true,
            relaxColumnCount: true, // Allow inconsistent column counts
          }),
          catch: (error) => new PluginExecutionError(
            `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
            false
          ),
        });

        // Validate and filter records
        const validRecords: X23Record[] = [];
        for (const record of rawRecords) {
          const result = X23RecordSchema.safeParse(record);
          if (result.success) {
            validRecords.push(result.data);
          } else {
            yield* logger.logWarning('Invalid record skipped', { 
              record, 
              error: result.error.issues 
            });
          }
        }

        yield* logger.logInfo('CSV parsing completed', {
          totalRecords: rawRecords.length,
          validRecords: validRecords.length,
          skippedRecords: rawRecords.length - validRecords.length,
        });

        // Convert records to plugin source items
        const items: PluginSourceItem<X23Record>[] = validRecords.map((record: X23Record) => ({
          externalId: `x23-${record['App URL']}-${record.Posted}`,
          content: `${record.Title}\n\n${record.Headline}`,
          contentType: ContentType.ARTICLE,
          createdAt: self.parsePostedDate(record.Posted),
          url: record['Original URL'],
          authors: undefined, // x23 doesn't provide author information
          raw: record,
        }));

        // Update state
        const nextState: X23PlatformState = {
          lastFetchTime: new Date().toISOString(),
          lastSuccessfulDays: days,
        };

        yield* logger.logInfo('X23 source plugin executed successfully', {
          pluginId: self.id,
          itemCount: items.length,
          days,
        });

        return {
          success: true,
          data: {
            items,
            nextLastProcessedState: nextState,
          },
        };

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof PluginExecutionError) {
          return yield* Effect.fail(error);
        }

        const message = error instanceof Error ? error.message : String(error);
        return yield* Effect.fail(new PluginExecutionError(`An unexpected error occurred: ${message}`, false));
      }
    });
  }

  private parsePostedDate(postedStr: string): string {
    try {
      // Try to parse the date string and convert to ISO format
      const date = new Date(postedStr);
      if (isNaN(date.getTime())) {
        // If parsing fails, return the original string
        return postedStr;
      }
      return date.toISOString();
    } catch {
      // If any error occurs, return the original string
      return postedStr;
    }
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Shutting down X23 source plugin', { pluginId: self.id });
      self.config = null;
    });
  }
}

export default X23SourcePlugin;
