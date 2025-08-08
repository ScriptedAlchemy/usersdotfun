import {
  type Plugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import { Client } from '@notionhq/client';
import {
  NotionDistributorConfig,
  NotionDistributorConfigSchema,
  NotionDistributorInput,
  NotionDistributorInputSchema,
  NotionDistributorOutput,
  NotionDistributorOutputSchema,
  NotionPropertyType,
} from './schemas';

type NotionPropertyValue = {
  title?: Array<{
    text: { content: string };
  }>;
  rich_text?: Array<{
    text: { content: string };
  }>;
  date?: {
    start: string;
  };
  number?: number;
  checkbox?: boolean;
  multi_select?: Array<{
    name: string;
  }>;
  url?: string;
  email?: string;
  phone_number?: string;
  select?: {
    name: string;
  };
};

export default class NotionDistributor
  implements
    Plugin<
      typeof NotionDistributorInputSchema,
      typeof NotionDistributorOutputSchema,
      typeof NotionDistributorConfigSchema
    >
{
  readonly id = '@curatedotfun/notion' as const;
  readonly type = 'distributor' as const;
  readonly inputSchema = NotionDistributorInputSchema;
  readonly outputSchema = NotionDistributorOutputSchema;
  readonly configSchema = NotionDistributorConfigSchema;
  
  private config: NotionDistributorConfig | null = null;
  private client: Client | null = null;

  initialize(config: NotionDistributorConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Initializing Notion distributor plugin', { pluginId: self.id });

      if (!config.secrets?.token) {
        return yield* Effect.fail(new ConfigurationError('Notion plugin requires token'));
      }
      if (!config.variables?.databaseId) {
        return yield* Effect.fail(new ConfigurationError('Notion plugin requires databaseId'));
      }

      self.config = config;
      self.client = new Client({ auth: config.secrets.token });

      // Validate credentials by attempting to query the database
      try {
        yield* Effect.tryPromise({
          try: () => self.client!.databases.retrieve({
            database_id: config.variables!.databaseId,
          }),
          catch: (error) => new ConfigurationError(
            `Failed to validate Notion credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
          ),
        });

        yield* logger.logDebug('Notion distributor plugin initialized successfully', {
          pluginId: self.id,
          databaseId: config.variables.databaseId,
          hasFields: !!config.variables.fields,
        });
      } catch (error) {
        yield* logger.logError('Failed to initialize Notion plugin', error instanceof Error ? error : new Error('Unknown error'));
        return yield* Effect.fail(new ConfigurationError('Failed to validate Notion credentials'));
      }
    });
  }

  execute(
    input: NotionDistributorInput,
  ): Effect.Effect<NotionDistributorOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!self.config || !self.client) {
        yield* logger.logError('Plugin not initialized', new Error('Call initialize() first'));
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized. Call initialize() first.', false));
      }

      yield* logger.logDebug('Executing Notion distributor plugin', { pluginId: self.id });

      try {
        const pageId = yield* self.createPage(input);
        yield* logger.logDebug('Successfully created Notion page', { pluginId: self.id, pageId });
        return { success: true, data: { pageId } };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        yield* logger.logError('Failed to create Notion page', error instanceof Error ? error : new Error(errorMessage));
        return yield* Effect.fail(new PluginExecutionError(`Failed to create Notion page: ${errorMessage}`, true));
      }
    });
  }

  private createPage(properties: Record<string, unknown>): Effect.Effect<string, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!self.client || !self.config) {
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized', false));
      }

      const formattedProperties: Record<string, NotionPropertyValue> = {};
      let titlePropertyKey: string | null = null;
      const fieldsConfig = self.config.variables?.fields || {};

      // Determine which properties to include
      let filteredProperties: Record<string, unknown> = properties;

      // If fields are specified in config, only include those fields
      if (Object.keys(fieldsConfig).length > 0) {
        filteredProperties = {};
        for (const [key, type] of Object.entries(fieldsConfig)) {
          if (key in properties) {
            filteredProperties[key] = properties[key];
          }
        }
      }

      // First, look for a property named "title" or "Title"
      for (const [key] of Object.entries(filteredProperties)) {
        if (key.toLowerCase() === "title") {
          titlePropertyKey = key;
          break;
        }
      }

      // If no title property found, use the first property as title
      if (!titlePropertyKey && Object.keys(filteredProperties).length > 0) {
        titlePropertyKey = Object.keys(filteredProperties)[0];
      } else if (!titlePropertyKey) {
        // If no properties at all, create a default title
        titlePropertyKey = "Title";
        filteredProperties[titlePropertyKey] = "New Item";
      }

      // Format properties based on config types or auto-detect
      for (const [key, value] of Object.entries(filteredProperties)) {
        if (key in fieldsConfig) {
          // Use the specified type from config
          formattedProperties[key] = self.formatPropertyWithType(value, fieldsConfig[key]);
        } else if (key === titlePropertyKey) {
          // Handle title property specially
          formattedProperties[key] = self.formatPropertyWithType(value, "title");
        } else {
          // Auto-detect type for properties not in config
          formattedProperties[key] = self.formatProperty(value);
        }
      }

      yield* logger.logDebug('Creating Notion page', {
        databaseId: self.config.variables!.databaseId,
        propertyCount: Object.keys(formattedProperties).length,
      });

      const result = yield* Effect.tryPromise({
        try: () => self.client!.pages.create({
          parent: {
            database_id: self.config!.variables!.databaseId,
          },
          properties: formattedProperties as any, // Type assertion needed due to Notion's complex types
        }),
        catch: (error) => new PluginExecutionError(
          `Failed to create Notion page: ${error instanceof Error ? error.message : 'Unknown error'}`,
          true
        ),
      });

      return (result as any).id;
    });
  }

  private formatProperty(value: unknown): NotionPropertyValue {
    if (typeof value === "string") {
      return {
        rich_text: [
          {
            text: {
              content: value.slice(0, 2000), // Notion's limit
            },
          },
        ],
      };
    }

    if (
      value instanceof Date ||
      (typeof value === "string" && !isNaN(Date.parse(value)))
    ) {
      return {
        date: {
          start: new Date(value).toISOString(),
        },
      };
    }

    if (typeof value === "number") {
      return {
        number: value,
      };
    }

    if (typeof value === "boolean") {
      return {
        checkbox: value,
      };
    }

    // For arrays (multi-select)
    if (Array.isArray(value)) {
      return {
        multi_select: value.map((item) => ({ name: String(item) })),
      };
    }

    // Default to rich_text for other types
    return {
      rich_text: [
        {
          text: {
            content: String(value).slice(0, 2000),
          },
        },
      ],
    };
  }

  private formatPropertyWithType(
    value: unknown,
    type: NotionPropertyType,
  ): NotionPropertyValue {
    const stringValue = String(value);
    const truncatedValue = stringValue.slice(0, 2000); // Notion's limit

    switch (type) {
      case "title":
        return {
          title: [
            {
              text: {
                content: truncatedValue,
              },
            },
          ],
        };
      case "rich_text":
        return {
          rich_text: [
            {
              text: {
                content: truncatedValue,
              },
            },
          ],
        };
      case "date":
        try {
          // Handle numeric timestamps that are passed as strings
          if (typeof value === "string" && /^\d+$/.test(value)) {
            return {
              date: {
                start: new Date(parseInt(value, 10)).toISOString(),
              },
            };
          }
          return {
            date: {
              start: new Date(value as string | number | Date).toISOString(),
            },
          };
        } catch (error) {
          console.warn(`Failed to parse date: ${value}. Using current date.`);
          return {
            date: {
              start: new Date().toISOString(),
            },
          };
        }
      case "number":
        const num = Number(value);
        return {
          number: isNaN(num) ? 0 : num,
        };
      case "checkbox":
        return {
          checkbox: Boolean(value),
        };
      case "multi_select":
        if (Array.isArray(value)) {
          return {
            multi_select: value.map((item) => ({ name: String(item) })),
          };
        }
        // If not an array, treat as comma-separated string
        return {
          multi_select: stringValue
            .split(",")
            .map((item) => ({ name: item.trim() })),
        };
      case "select":
        return {
          select: {
            name: truncatedValue,
          },
        };
      case "url":
        return {
          url: truncatedValue,
        };
      case "email":
        return {
          email: truncatedValue,
        };
      case "phone":
        return {
          phone_number: truncatedValue,
        };
      default:
        // Default to rich_text for unknown types
        return {
          rich_text: [
            {
              text: {
                content: truncatedValue,
              },
            },
          ],
        };
    }
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logDebug('Shutting down Notion distributor plugin', { pluginId: self.id });
      self.config = null;
      self.client = null;
    });
  }
}
