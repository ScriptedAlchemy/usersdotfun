 import fs from 'fs/promises';
import path from 'path';
import { z } from "zod";

// This list will be the single source of truth for which plugins are active.
const pluginsToRegister = {
    'simple-transform': "SimpleTransformer",
    'object-transform': "ObjectTransformer",
    'masa-source': "MasaSource"
};

const registry = {};

console.log('Starting registry generation...');

for (const [pluginName, schemaPrefix] of Object.entries(pluginsToRegister)) {
    console.log(`Processing plugin: ${pluginName}`);
    // Assumes the script is run from the root of the monorepo
    const pluginPath = path.resolve(process.cwd(), `plugins/${pluginName}`);
    const schemaPath = path.join(pluginPath, 'src/schemas/index.ts');
    const packageJsonPath = path.join(pluginPath, 'package.json');
    const rspackConfigPath = path.join(pluginPath, 'rspack.config.cjs');

    try {
        const schemas = await import(schemaPath);
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const rspackConfig = await import(rspackConfigPath);
        const port = rspackConfig.default.devServer.port;

        const configSchema = schemas[`${schemaPrefix}ConfigSchema`];
        const inputSchema = schemas[`${schemaPrefix}InputSchema`];
        const outputSchema = schemas[`${schemaPrefix}OutputSchema`];

        if (!configSchema || !inputSchema || !outputSchema) {
            throw new Error(`One or more schemas are missing from plugins/${pluginName}/schemas/index.ts`);
        }

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
