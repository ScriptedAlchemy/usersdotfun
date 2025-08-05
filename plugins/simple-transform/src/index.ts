import type { Plugin } from '@usersdotfun/core-sdk';
import Mustache from 'mustache';
import {
  SimpleTransformerConfig,
  SimpleTransformerConfigSchema,
  SimpleTransformerInput,
  SimpleTransformerInputSchema,
  SimpleTransformerOutput,
  SimpleTransformerOutputSchema,
} from './schemas';

export default class SimpleTransformer
  implements
    Plugin<
      typeof SimpleTransformerInputSchema,
      typeof SimpleTransformerOutputSchema,
      typeof SimpleTransformerConfigSchema
    >
{
  readonly id = '@curatedotfun/simple-transform' as const;
  readonly type = 'transformer' as const;
  readonly inputSchema = SimpleTransformerInputSchema;
  readonly outputSchema = SimpleTransformerOutputSchema;
  readonly configSchema = SimpleTransformerConfigSchema;
  private template: string = '{{content}}'; // Simple default template

  async initialize(config: SimpleTransformerConfig): Promise<void> {
    if (config?.variables?.template) {
      this.template = config.variables.template;
    }
  }

  async execute(
    input: SimpleTransformerInput,
  ): Promise<SimpleTransformerOutput> {
    try {
      const result = Mustache.render(this.template, input);
      return { success: true, data: { content: result } };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      return {
        success: false,
        errors: [{ message: err.message, stack: err.stack }],
      };
    }
  }

  async shutdown(): Promise<void> {
    // No cleanup needed
  }
}
