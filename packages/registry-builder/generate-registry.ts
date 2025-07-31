import fs from 'fs/promises';
import path from 'path';
import { z } from "zod";

import { MasaSourceConfigSchema, MasaSourceInputSchema, MasaSourceOutputSchema } from "../../plugins/masa-source/src/schemas/index.js";
import { SimpleTransformerConfigSchema, SimpleTransformerInputSchema, SimpleTransformerOutputSchema } from "../../plugins/simple-transform/src/schemas/index.js";
import { ObjectTransformerConfigSchema, ObjectTransformerInputSchema, ObjectTransformerOutputSchema } from "../../plugins/object-transform/src/schemas/index.js";

// Plugin schema definitions
const pluginSchemas = {
  'simple-transform': {
    configSchema: SimpleTransformerConfigSchema,
    inputSchema: SimpleTransformerInputSchema,
    outputSchema: SimpleTransformerOutputSchema
  },
  'object-transform': {
    configSchema: ObjectTransformerConfigSchema,
    inputSchema: ObjectTransformerInputSchema,
    outputSchema: ObjectTransformerOutputSchema
  },
  'masa-source': {
    configSchema: MasaSourceConfigSchema,
    inputSchema: MasaSourceInputSchema,
    outputSchema: MasaSourceOutputSchema
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
