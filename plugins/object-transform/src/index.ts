import {
  type Plugin,
  PluginLoggerTag,
  ConfigurationError,
  PluginExecutionError,
} from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import { format } from 'date-fns';
import Mustache from 'mustache';
import {
  ObjectTransformerConfig,
  ObjectTransformerConfigSchema,
  ObjectTransformerInput,
  ObjectTransformerInputSchema,
  ObjectTransformerOutput,
  ObjectTransformerOutputSchema,
} from './schemas';

// Default template generators
type TemplateGenerator = (formatStr?: string) => string | number;

const defaultTemplates: Record<string, TemplateGenerator> = {
  timestamp: () => {
    // Explicitly return a number
    return Number(Date.now());
  },
  date: (formatStr = "yyyy-MM-dd") => {
    try {
      return format(new Date(), formatStr || "yyyy-MM-dd");
    } catch (error) {
      console.error(`Error formatting date with format "${formatStr}":`, error);
      return format(new Date(), "yyyy-MM-dd");
    }
  },
  time: (formatStr = "HH:mm:ss") => {
    try {
      return format(new Date(), formatStr || "HH:mm:ss");
    } catch (error) {
      console.error(`Error formatting time with format "${formatStr}":`, error);
      return format(new Date(), "HH:mm:ss");
    }
  },
};

// Schema for the configuration
export class ObjectTransformerPlugin
  implements
    Plugin<
      typeof ObjectTransformerInputSchema,
      typeof ObjectTransformerOutputSchema,
      typeof ObjectTransformerConfigSchema
    >
{
  readonly id = '@curatedotfun/object-transform' as const;
  readonly type = 'transformer' as const;
  readonly inputSchema = ObjectTransformerInputSchema;
  readonly outputSchema = ObjectTransformerOutputSchema;
  readonly configSchema = ObjectTransformerConfigSchema;
  private config: ObjectTransformerConfig | null = null;

  initialize(config: ObjectTransformerConfig): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Initializing Object transformer plugin', { pluginId: self.id });
      self.config = config;
      yield* Effect.void;
    });
  }

  execute(
    input: ObjectTransformerInput,
  ): Effect.Effect<ObjectTransformerOutput, PluginExecutionError, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;

      if (!self.config) {
        yield* logger.logError('Plugin not initialized', new Error('Call initialize() first'));
        return yield* Effect.fail(new PluginExecutionError('Plugin not initialized. Call initialize() first.', false));
      }

      // Inject default templates into input data
      const enhancedInput = self.injectDefaultTemplates(input);
      const output: Record<string, unknown> = {};

      // Recursive function to process mappings, including nested objects
      const processMapping = (
        template: any,
        inputData: Record<string, unknown>,
      ): unknown => {
        // Helper function to process template value
        const processTemplate = (template: string) => {
          const originalEscape = Mustache.escape;
          Mustache.escape = (text) => text;
          const rendered = Mustache.render(template, inputData);
          Mustache.escape = originalEscape;

          // If the template references a field that's an array or object, return it directly
          const fieldMatch = template.match(/^\{\{([^}]+)\}\}$/);
          if (fieldMatch) {
            const field = fieldMatch[1];
            const value = field
              .split(".")
              .reduce((obj: any, key) => obj?.[key], inputData);
            if (
              Array.isArray(value) ||
              (typeof value === "object" && value !== null)
            ) {
              return value;
            }
          }

          // Try parsing as JSON if it looks like an array
          if (rendered.startsWith("[") && rendered.endsWith("]")) {
            try {
              return JSON.parse(rendered);
            } catch {
              return rendered;
            }
          }

          return rendered;
        };

        // Process based on template type
        if (typeof template === "string") {
          const result = processTemplate(template);
          // For string templates, preserve empty arrays but convert undefined to empty string
          return Array.isArray(result) ? result : (result ?? "");
        } else if (Array.isArray(template)) {
          const results = template.map(processTemplate);
          return results.reduce((acc: unknown[], result) => {
            if (result === undefined || result === "") {
              return acc;
            }
            if (Array.isArray(result)) {
              result.forEach((item) => acc.push(item));
            } else {
              acc.push(result);
            }
            return acc;
          }, []);
        } else if (typeof template === "object" && template !== null) {
          // Handle nested object
          const nestedOutput: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(template)) {
            nestedOutput[key] = processMapping(value as any, inputData);
          }
          return nestedOutput;
        }

        return template;
      };

      // Process each top-level mapping
      for (const [outputField, template] of Object.entries(
        self.config.variables?.mappings ?? {},
      )) {
        output[outputField] = processMapping(template, enhancedInput);
      }

      return { success: true, data: output };
    });
  }

  // Inject default templates into input data
  private injectDefaultTemplates(
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = { ...input };

    // Find all template patterns in the mappings
    const templatePatterns: Map<string, string> = new Map();

    const findTemplates = (value: any) => {
      if (typeof value === "string") {
        // Extract all {{template}} or {{template:format}} patterns
        const matches = value.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
          matches.forEach((match) => {
            const templateContent = match.substring(2, match.length - 2);
            // Store the full template content
            templatePatterns.set(
              templateContent.toLowerCase(),
              templateContent,
            );
          });
        }
      } else if (Array.isArray(value)) {
        value.forEach((item) => findTemplates(item));
      } else if (typeof value === "object" && value !== null) {
        Object.values(value).forEach((item) => findTemplates(item));
      }
    };

    // Find all templates used in mappings
    findTemplates(this.config?.variables?.mappings);

    // Process each template pattern
    templatePatterns.forEach((originalPattern, lowerCasePattern) => {
      // Split by colon to handle format specifiers
      const colonIndex = originalPattern.indexOf(":");
      const templateName =
        colonIndex > -1
          ? originalPattern.substring(0, colonIndex)
          : originalPattern;
      const formatStr =
        colonIndex > -1 ? originalPattern.substring(colonIndex + 1) : undefined;

      const lowerCaseTemplateName = templateName.toLowerCase();

      // Check if this is a default template
      if (defaultTemplates[lowerCaseTemplateName]) {
        try {
          // Generate the value with optional format
          let value = defaultTemplates[lowerCaseTemplateName](formatStr);

          // Ensure timestamp is a number
          if (
            lowerCaseTemplateName === "timestamp" &&
            typeof value === "string"
          ) {
            value = Number(value);
          }

          // Store the value using the original template name (preserving case)
          result[templateName] = value;
        } catch (error) {
          console.error(
            `Error generating value for template "${templateName}":`,
            error,
          );
        }
      }
    });

    return result;
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    const self = this;
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      yield* logger.logInfo('Shutting down Object transformer plugin', { pluginId: self.id });
    });
  }
}
