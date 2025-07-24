import type { Plugin } from '@usersdotfun/core-sdk';
import Mustache from 'mustache';
import { z } from 'zod';
import {
  SimpleTransformerConfigSchema,
  SimpleTransformerInputSchema,
  SimpleTransformerOutputSchema,
} from './schemas';

// Derived Types
type SimpleTransformerConfig = z.infer<typeof SimpleTransformerConfigSchema>;
type SimpleTransformerInput = z.infer<typeof SimpleTransformerInputSchema>;
type SimpleTransformerOutput = z.infer<typeof SimpleTransformerOutputSchema>;

export default class SimpleTransformer
  implements
  Plugin<
    SimpleTransformerInput,
    SimpleTransformerOutput,
    SimpleTransformerConfig
  > {
  readonly type = 'transformer' as const;
  private template: string = '{{content}}'; // Simple default template

  async initialize(config?: SimpleTransformerConfig): Promise<void> {
    if (config?.variables?.template) {
      this.template = config.variables.template;
    }
  }

  async execute(
    input: SimpleTransformerInput,
  ): Promise<SimpleTransformerOutput> {
    try {
      const result = Mustache.render(this.template, input);
      return { success: true, data: result };
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
