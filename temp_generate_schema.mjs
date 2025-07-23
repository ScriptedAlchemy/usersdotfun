import { SimpleTransformSchemas } from './src/schemas/plugins.ts';
import { z } from 'zod';
import fs from 'fs';

const registry = {
  "@curatedotfun/simple-transform": {
    "remoteUrl": "https://unpkg.com/@curatedotfun/simple-transform@latest/dist/remoteEntry.js",
    "configSchema": z.toJSONSchema(SimpleTransformSchemas.config),
    "inputSchema": z.toJSONSchema(SimpleTransformSchemas.input),
    "outputSchema": z.toJSONSchema(SimpleTransformSchemas.output),
    "version": "1.0.0",
    "description": "Simple data transformation plugin"
  }
};

fs.writeFileSync('src/pipeline/registry.json', JSON.stringify(registry, null, 2));
