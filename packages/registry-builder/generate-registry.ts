import { createConfigSchema, createInputSchema, createOutputSchema, createSourceInputSchema, createSourceOutputSchema, } from "@usersdotfun/core-sdk";
import fs from 'fs/promises';
import path from 'path';
import { z } from "zod";

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
        baseUrl: z.url().optional(),
      }),
      z.object({
        apiKey: z.string().min(1, "Masa API key is required"),
      })
    ),
    inputSchema: createSourceInputSchema(z.object({
      type: z.string(), // e.g., "twitter-scraper", "reddit-scraper"
      query: z.string().optional(), // General query string
      pageSize: z.number().optional(), // General hint for how many items to fetch per request
      platformArgs: z.record(z.string(), z.unknown()).optional(), // Platform-specific arguments
    }).catchall(z.unknown())),
    outputSchema: createSourceOutputSchema(z.object({
      // Required PluginSourceItem fields
      externalId: z.string(),
      content: z.string(),

      // Optional PluginSourceItem fields
      contentType: z.string().optional(), // Can be from ContentType enum or custom
      createdAt: z.string().optional(),
      url: z.string().optional(),
      authors: z.array(z.object({
        id: z.string().optional(),
        username: z.string().optional(),
        displayName: z.string().optional(),
        url: z.string().optional(),
      })).optional(),

      // Raw data from Masa API
      raw: z.unknown(),
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
