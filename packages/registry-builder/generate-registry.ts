 import fs from 'fs/promises';
import path from 'path';
import { z } from "zod";

// Inline core-sdk functions to avoid workspace dependency issues
const ErrorDetailsSchema = z.object({
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  stack: z.string().optional(),
});

const createOutputSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    errors: z.array(ErrorDetailsSchema).optional(),
  });

function createConfigSchema<
  V extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>,
  S extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
>(variablesSchema?: V, secretsSchema?: S) {
  return z.object({
    variables: (variablesSchema ?? z.record(z.string(), z.unknown())).optional(),
    secrets: (secretsSchema ?? z.record(z.string(), z.unknown())).optional(),
  });
}

function createInputSchema<I extends z.ZodTypeAny>(inputSchema: I) {
  return inputSchema;
}

// Plugin schema definitions (avoiding imports from plugin files)
const pluginSchemas = {
  'simple-transform': {
    configSchema: createConfigSchema(z.object({ template: z.string() })),
    inputSchema: createInputSchema(z.object({ content: z.string() })),
    outputSchema: createOutputSchema(z.object({ content: z.string() }))
  },
  'object-transform': {
    configSchema: createConfigSchema(z.object({ 
      transformations: z.array(z.object({
        path: z.string(),
        operation: z.enum(['set', 'delete', 'rename']),
        value: z.unknown().optional(),
        newPath: z.string().optional()
      }))
    })),
    inputSchema: createInputSchema(z.object({ data: z.record(z.string(), z.unknown()) })),
    outputSchema: createOutputSchema(z.object({ data: z.record(z.string(), z.unknown()) }))
  },
  'masa-source': {
    configSchema: createConfigSchema(
      z.object({
        baseUrl: z.string().url().optional(),
      }),
      z.object({
        apiKey: z.string().min(1, "Masa API key is required"),
      })
    ),
    inputSchema: createInputSchema(z.object({
      searchOptions: z.record(z.string(), z.unknown()),
      lastProcessedState: z.record(z.string(), z.unknown()).optional().nullable(),
    })),
    outputSchema: createOutputSchema(z.object({
      items: z.array(z.object({
        ID: z.string(),
        ExternalID: z.string(),
        Content: z.string(),
        Metadata: z.record(z.string(), z.unknown()),
      })),
      nextLastProcessedState: z.record(z.string(), z.unknown()).optional().nullable(),
    }))
  }
} as const;

// This list will be the single source of truth for which plugins are active.
const pluginsToRegister = {
    'simple-transform': "SimpleTransformer",
    'object-transform': "ObjectTransformer", 
    'masa-source': "MasaSource"
} as const;

const registry: Record<string, any> = {};

console.log('Starting registry generation...');

for (const [pluginName, schemaPrefix] of Object.entries(pluginsToRegister)) {
    console.log(`Processing plugin: ${pluginName}`);
    // Assumes the script is run from the root of the monorepo
    const pluginPath = path.resolve(process.cwd(), `plugins/${pluginName}`);
    const packageJsonPath = path.join(pluginPath, 'package.json');
    const rspackConfigPath = path.join(pluginPath, 'rspack.config.cjs');

    try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const rspackConfig = await import(rspackConfigPath);
        const port = rspackConfig.default.devServer.port;

        const schemas = pluginSchemas[pluginName as keyof typeof pluginSchemas];
        if (!schemas) {
            throw new Error(`Schema definition not found for plugin: ${pluginName}`);
        }

        const { configSchema, inputSchema, outputSchema } = schemas;

        registry[packageJson.name] = {
            remoteUrl: `http://localhost:${port}/remoteEntry.js`,
            configSchema: z.toJSONSchema(configSchema),
            inputSchema: z.toJSONSchema(inputSchema),
            outputSchema: z.toJSONSchema(outputSchema),
            version: packageJson.version,
            description: packageJson.description
        };
        console.log(`Successfully processed plugin: ${pluginName}`);

    } catch (error) {
        console.error(`Failed to process plugin: ${pluginName}`, error);
    }
}

const registryPath = path.resolve(process.cwd(), 'packages/registry-builder/registry.json');
await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

console.log(`\nRegistry generated successfully at: ${registryPath}`);
