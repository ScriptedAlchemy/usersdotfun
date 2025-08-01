Project Path: usersdotfun

Source Tree:

```txt
usersdotfun
├── README.md
├── TODO.md
├── apps
│   ├── app
│   │   ├── Dockerfile
│   │   ├── README.md
│   │   ├── auth-schema.ts
│   │   ├── components.json
│   │   ├── package.json
│   │   ├── public
│   │   │   ├── android-chrome-192x192.png
│   │   │   ├── android-chrome-512x512.png
│   │   │   ├── apple-touch-icon.png
│   │   │   ├── favicon-16x16.png
│   │   │   ├── favicon-32x32.png
│   │   │   ├── favicon.ico
│   │   │   ├── favicon.png
│   │   │   └── site.webmanifest
│   │   ├── src
│   │   │   ├── api
│   │   │   │   ├── jobs.ts
│   │   │   │   └── queues.ts
│   │   │   ├── components
│   │   │   │   ├── DefaultCatchBoundary.tsx
│   │   │   │   ├── NotFound.tsx
│   │   │   │   ├── ProjectError.tsx
│   │   │   │   ├── UserError.tsx
│   │   │   │   ├── common
│   │   │   │   │   └── common-sheet.tsx
│   │   │   │   ├── jobs
│   │   │   │   │   ├── job-actions.tsx
│   │   │   │   │   ├── job-details-sheet.tsx
│   │   │   │   │   ├── job-dialog.tsx
│   │   │   │   │   ├── job-list.tsx
│   │   │   │   │   ├── job-monitoring.tsx
│   │   │   │   │   ├── job-runs.tsx
│   │   │   │   │   ├── job-sheet.tsx
│   │   │   │   │   ├── json-editor.tsx
│   │   │   │   │   ├── pipeline-viewer.tsx
│   │   │   │   │   ├── status-badge.tsx
│   │   │   │   │   └── step-details.tsx
│   │   │   │   ├── mode-toggle.tsx
│   │   │   │   ├── queues
│   │   │   │   │   ├── all-jobs-table.tsx
│   │   │   │   │   ├── queue-actions.tsx
│   │   │   │   │   ├── queue-item-details-sheet.tsx
│   │   │   │   │   ├── queue-item-list.tsx
│   │   │   │   │   └── queue-overview.tsx
│   │   │   │   └── ui
│   │   │   │       ├── alert-dialog.tsx
│   │   │   │       ├── alert.tsx
│   │   │   │       ├── badge.tsx
│   │   │   │       ├── button.tsx
│   │   │   │       ├── card.tsx
│   │   │   │       ├── dialog.tsx
│   │   │   │       ├── dropdown-menu.tsx
│   │   │   │       ├── input.tsx
│   │   │   │       ├── label.tsx
│   │   │   │       ├── select.tsx
│   │   │   │       ├── sheet.tsx
│   │   │   │       ├── sonner.tsx
│   │   │   │       ├── table.tsx
│   │   │   │       ├── tabs.tsx
│   │   │   │       └── textarea.tsx
│   │   │   ├── db
│   │   │   │   └── index.ts
│   │   │   ├── lib
│   │   │   │   ├── auth-client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── gateway.ts
│   │   │   │   ├── query-keys.ts
│   │   │   │   ├── queue-utils.ts
│   │   │   │   ├── utils.ts
│   │   │   │   ├── websocket.tsx
│   │   │   │   └── ws-event-handlers.ts
│   │   │   ├── routeTree.gen.ts
│   │   │   ├── router.tsx
│   │   │   ├── routes
│   │   │   │   ├── __root.tsx
│   │   │   │   ├── _pathlessLayout
│   │   │   │   │   ├── _nested-layout
│   │   │   │   │   │   ├── route-a.tsx
│   │   │   │   │   │   └── route-b.tsx
│   │   │   │   │   └── _nested-layout.tsx
│   │   │   │   ├── _pathlessLayout.tsx
│   │   │   │   ├── admin
│   │   │   │   │   ├── _dashboard
│   │   │   │   │   │   ├── index.tsx
│   │   │   │   │   │   └── jobs
│   │   │   │   │   │       └── index.tsx
│   │   │   │   │   └── _dashboard.tsx
│   │   │   │   ├── api
│   │   │   │   │   ├── $.ts
│   │   │   │   │   ├── auth
│   │   │   │   │   │   └── $.ts
│   │   │   │   │   ├── users.$userId.ts
│   │   │   │   │   └── users.ts
│   │   │   │   ├── customScript[.]js.ts
│   │   │   │   ├── deferred.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── jobs.tsx
│   │   │   │   ├── projects.$projectId.tsx
│   │   │   │   ├── projects.index.tsx
│   │   │   │   ├── projects.tsx
│   │   │   │   ├── projects_.$projectId.deep.tsx
│   │   │   │   ├── queues.tsx
│   │   │   │   ├── redirect.tsx
│   │   │   │   ├── users.$userId.tsx
│   │   │   │   ├── users.index.tsx
│   │   │   │   └── users.tsx
│   │   │   ├── server.ts
│   │   │   ├── styles
│   │   │   │   └── app.css
│   │   │   └── utils
│   │   │       ├── loggingMiddleware.tsx
│   │   │       ├── projects.tsx
│   │   │       ├── seo.ts
│   │   │       └── users.tsx
│   │   ├── tailwind.config.mjs
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── gateway
│   │   ├── Dockerfile
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── constants
│   │   │   ├── db
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   ├── lib
│   │   │   │   └── auth.ts
│   │   │   ├── middleware
│   │   │   │   ├── auth.ts
│   │   │   │   ├── error.ts
│   │   │   │   └── logger.ts
│   │   │   ├── routes
│   │   │   │   ├── jobs.ts
│   │   │   │   ├── queues.ts
│   │   │   │   └── websocket.ts
│   │   │   ├── runtime.ts
│   │   │   ├── services
│   │   │   │   ├── config.service.ts
│   │   │   │   ├── job-lifecycle-adapter.service.ts
│   │   │   │   ├── job-lifecycle.service.ts
│   │   │   │   ├── job-monitoring-adapter.service.ts
│   │   │   │   ├── job-monitoring.service.ts
│   │   │   │   ├── job.service.ts
│   │   │   │   ├── queue-adapter.service.ts
│   │   │   │   └── websocket-manager.service.ts
│   │   │   ├── types
│   │   │   │   └── hono.ts
│   │   │   └── utils
│   │   │       └── error-handlers.ts
│   │   └── tsconfig.json
│   └── job-scheduler
│       ├── Dockerfile
│       ├── README.md
│       ├── jobs.json
│       ├── package.json
│       ├── src
│       │   ├── config.ts
│       │   ├── jobs.ts
│       │   ├── main.ts
│       │   └── workers
│       │       ├── pipeline.worker.ts
│       │       └── source.worker.ts
│       └── tsconfig.json
├── bun.lock
├── docker-compose.yml
├── package.json
├── packages
│   ├── core-sdk
│   │   ├── README.md
│   │   ├── bun.lock
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── errors.ts
│   │   │   ├── index.ts
│   │   │   ├── plugin.ts
│   │   │   └── source.ts
│   │   └── tsconfig.json
│   ├── pipeline-runner
│   │   ├── README.md
│   │   ├── bun.lock
│   │   ├── index.ts
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   ├── pipeline
│   │   │   │   ├── errors.ts
│   │   │   │   ├── interfaces.ts
│   │   │   │   ├── runner.ts
│   │   │   │   ├── services.ts
│   │   │   │   ├── step.ts
│   │   │   │   └── validation.ts
│   │   │   └── services
│   │   │       ├── environment.service.ts
│   │   │       ├── mf.service.ts
│   │   │       ├── plugin.service.ts
│   │   │       ├── secrets.config.ts
│   │   │       └── state.service.ts
│   │   └── tsconfig.json
│   ├── registry-builder
│   │   ├── README.md
│   │   ├── generate-registry.ts
│   │   ├── package.json
│   │   ├── registry.json
│   │   └── tsconfig.json
│   ├── shared-db
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   ├── README.md
│   │   ├── drizzle.config.ts
│   │   ├── migrations
│   │   │   ├── 0000_robust_wasp.sql
│   │   │   ├── 0001_handy_skaar.sql
│   │   │   ├── 0002_low_whistler.sql
│   │   │   └── meta
│   │   │       ├── 0000_snapshot.json
│   │   │       ├── 0001_snapshot.json
│   │   │       ├── 0002_snapshot.json
│   │   │       └── _journal.json
│   │   ├── package.json
│   │   ├── scripts
│   │   │   ├── overwrite-vars.ts
│   │   │   ├── seed-dev.ts
│   │   │   └── seed-remote.ts
│   │   ├── src
│   │   │   ├── errors.ts
│   │   │   ├── index.ts
│   │   │   ├── migrations
│   │   │   ├── schema
│   │   │   │   ├── auth.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── jobs.ts
│   │   │   │   └── pipeline-steps.ts
│   │   │   └── services
│   │   │       ├── db.service.ts
│   │   │       ├── index.ts
│   │   │       └── job.service.ts
│   │   └── tsconfig.json
│   ├── shared-queue
│   │   ├── README.md
│   │   ├── bun.lock
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── config.ts
│   │   │   ├── constants
│   │   │   │   ├── keys.ts
│   │   │   │   └── queues.ts
│   │   │   ├── index.ts
│   │   │   ├── queue-status.service.ts
│   │   │   ├── queue.service.ts
│   │   │   ├── redis-config.service.ts
│   │   │   └── state.service.ts
│   │   └── tsconfig.json
│   └── shared-types
│       ├── README.md
│       ├── package.json
│       ├── src
│       │   ├── index.ts
│       │   ├── schemas
│       │   │   ├── api
│       │   │   │   ├── common.ts
│       │   │   │   ├── index.ts
│       │   │   │   ├── jobs.ts
│       │   │   │   ├── queues.ts
│       │   │   │   └── websocket.ts
│       │   │   ├── auth.ts
│       │   │   ├── index.ts
│       │   │   ├── jobs.ts
│       │   │   ├── queues.ts
│       │   │   └── websocket.ts
│       │   └── types
│       │       ├── api
│       │       │   ├── common.ts
│       │       │   ├── index.ts
│       │       │   ├── jobs.ts
│       │       │   ├── queues.ts
│       │       │   └── websocket.ts
│       │       ├── auth.ts
│       │       ├── index.ts
│       │       ├── jobs.ts
│       │       ├── queues.ts
│       │       └── websocket.ts
│       └── tsconfig.json


```

`usersdotfun/README.md`:

```md
# usersdotfun

To install dependencies:

```bash
bun install
```

To run, run the plugin:

```bash
bun run dev:plugins
```

Then, in another terminal, run the pipeline script

```bash
bun run pipeline

```


`usersdotfun/docker-compose.yml`:

```yml
services:
  redis:
    image: redis:alpine
    container_name: usersdotfun_redis_dev
    ports:
      - '6379:6379'
  postgres:
    image: postgres:15
    container_name: usersdotfun_postgres_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: usersdotfun
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
  # handles data migration and database seeding
  db-migrate-dev:
    build:
      context: .
      dockerfile: packages/shared-db/Dockerfile.dev
    environment:
      DATABASE_URL: postgresql://postgres:postgres@usersdotfun_postgres_dev:5432/usersdotfun
    depends_on:
      postgres:
        condition: service_healthy
    profiles: ["dev"]

volumes:
  postgres_data:

```

`usersdotfun/package.json`:

```json
{
  "name": "usersdotfun",
  "module": "index.ts",
  "type": "module",
  "private": true,
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "scripts": {
    "init": "sh scripts/init-dev.sh",
    "build:packages": "bun run --filter \"./packages/*\" build",
    "build:apps": "bun run --filter \"./apps/*\" build",
    "build": "bun run build:packages && bun run build:apps",
    "dev": "bun run --filter \"./apps/*\" dev",
    "build:sdk": "bun run --filter @usersdotfun/core-sdk build",
    "build:registry": "bun run build:sdk && bun run packages/registry-builder/generate-registry.ts",
    "dev:plugins": "bun run --filter \"./plugins/*\" dev",
    "pipeline": "cd packages/pipeline-runner && bun run start",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:clear": "docker-compose down -v",
    "docker:build:gateway": "docker build -f apps/gateway/Dockerfile -t usersdotfun-gateway .",
    "docker:build:job-scheduler": "docker build -f apps/job-scheduler/Dockerfile -t usersdotfun-job-scheduler .",
    "docker:build:shared-db": "docker build -f packages/shared-db/Dockerfile -t usersdotfun-shared-db .",
    "docker:build:shared-db:dev": "docker build -f packages/shared-db/Dockerfile.dev -t usersdotfun-shared-db:dev ."
  },
  "workspaces": [
    "packages/**",
    "plugins/**",
    "apps/**"
  ]
}

```

`usersdotfun/packages/core-sdk/README.md`:

```md
# core-sdk

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.14. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

```


`usersdotfun/packages/core-sdk/package.json`:

```json
{
  "name": "@usersdotfun/core-sdk",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -b"
  },
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "zod": "^4.0.8"
  }
}

```

`usersdotfun/packages/core-sdk/src/errors.ts`:

```ts
// Plugin execution errors
export class PluginExecutionError extends Error {
  constructor(message: string, public readonly retryable: boolean = true) {
    super(message);
    this.name = 'PluginExecutionError';
  }
}

export class ConfigurationError extends PluginExecutionError {
  constructor(message: string) {
    super(message, false); // Configuration errors are not retryable
    this.name = 'ConfigurationError';
  }
}

```

`usersdotfun/packages/core-sdk/src/index.ts`:

```ts
export * from './plugin.js';
export * from './source.js';
export * from './errors.js';

```

`usersdotfun/packages/core-sdk/src/plugin.ts`:

```ts
import type { JSONSchemaType } from "ajv/dist/2020";
import { z } from 'zod';

// Helpers
export const createOutputSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    errors: z.array(ErrorDetailsSchema).optional(),
  });

export function createConfigSchema(): z.ZodObject<{
  variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  secrets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}>;
export function createConfigSchema<V extends z.ZodTypeAny>(
  variablesSchema?: V
): z.ZodObject<{
  variables: z.ZodOptional<V>;
  secrets: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}>;
export function createConfigSchema<
  V extends z.ZodTypeAny,
  S extends z.ZodTypeAny
>(
  variablesSchema?: V,
  secretsSchema?: S
): z.ZodObject<{
  variables: z.ZodOptional<V>;
  secrets: z.ZodOptional<S>;
}>;
export function createConfigSchema<
  V extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>,
  S extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
>(variablesSchema?: V, secretsSchema?: S) {
  return z.object({
    variables: (variablesSchema ?? z.record(z.string(), z.unknown())).optional(),
    secrets: (secretsSchema ?? z.record(z.string(), z.unknown())).optional(),
  });
}

export function createInputSchema<I extends z.ZodTypeAny>(
  inputSchema: I,
) {
  return inputSchema;
}

// Core schemas
export const ErrorDetailsSchema = z.object({
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  stack: z.string().optional(),
});

export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;

export type Config<
  V extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>,
  S extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
> = z.infer<ReturnType<typeof createConfigSchema<V, S>>>;

export type Input<
  I extends z.ZodTypeAny
> = z.infer<ReturnType<typeof createInputSchema<I>>>;

export type Output<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof createOutputSchema<T>>
>;

// Plugin interface
export interface Plugin<
  InputType extends Input<z.ZodAny>,
  OutputType extends Output<z.ZodAny>,
  ConfigType extends Config,
> {
  readonly type: PluginType;
  initialize(config?: ConfigType): Promise<void>;
  execute(input: InputType): Promise<OutputType>;
  shutdown(): Promise<void>;
}

export type PluginType = "transformer" | "distributor" | "source";

export interface PluginMetadata {
  remoteUrl: string;
  type?: PluginType;
  configSchema: JSONSchemaType<any>;
  inputSchema: JSONSchemaType<any>;
  outputSchema: JSONSchemaType<any>;
  version?: string;
  description?: string;
}

export interface PluginRegistry {
  [pluginName: string]: PluginMetadata;
}

```

`usersdotfun/packages/core-sdk/src/source.ts`:

```ts
import { z } from 'zod';
import type { Config, Input, Output, Plugin } from './plugin.js';
import { ErrorDetailsSchema } from './plugin.js';

/**
 * Zod schema for the Author interface
 */
export const authorSchema = z.object({
  id: z.string().optional(),
  username: z.string().optional(),
  displayName: z.string().optional(),
  url: z.string().optional(),
});

/**
 * Zod schema for PluginSourceItem - defines the structure that plugins must return
 */
export const pluginSourceItemSchema = z.object({
  externalId: z.string(),
  content: z.string(),
  contentType: z.string().optional(),
  createdAt: z.string().optional(),
  url: z.string().optional(),
  authors: z.array(authorSchema).optional(),
  raw: z.unknown(),
});

/**
 * Standard content types supported by the system.
 * Plugins can extend this with custom types.
 */
export const ContentType = {
  POST: 'post',
  ARTICLE: 'article',
  VIDEO: 'video',
  PODCAST: 'podcast',
  WEBSITE: 'website',
  FEED: 'feed',
  DATABASE_ENTRY: 'database-entry',
  UNKNOWN: 'unknown',
} as const;

export type ContentType = typeof ContentType[keyof typeof ContentType];

/**
 * Represents a single author - derived from the authorSchema
 */
export type Author = z.infer<typeof authorSchema>;

/**
 * Base PluginSourceItem type derived from schema (with unknown raw type)
 */
export type BasePluginSourceItem = z.infer<typeof pluginSourceItemSchema>;

/**
 * This is the data structure a plugin is responsible for creating.
 * It's generic over the raw data type.
 */
export interface PluginSourceItem<TRaw = Record<string, any>> extends Omit<BasePluginSourceItem, 'raw'> {
  // The raw, untouched data from the source API
  raw: TRaw;
}

/**
 * This is the final, canonical data structure used within the system.
 * It extends PluginSourceItem with system-generated fields.
 */
export interface SourceItem<TRaw = Record<string, any>> extends PluginSourceItem<TRaw> {
  id: string; // Unique internal ID, generated by the worker
  createdAt: string; // Guaranteed to exist (worker provides a default)

  // System-injected metadata for traceability
  metadata: {
    sourcePlugin: string;
    jobId: string;
    runId: string;
    [key: string]: any;
  };
}

/**
 * Defines the progress of a job submitted to an external asynchronous service (e.g., Masa).
 */
export interface AsyncJobProgress {
  jobId: string;
  status: "submitted" | "pending" | "processing" | "done" | "error" | "timeout";
  submittedAt: string; // ISO timestamp
  lastCheckedAt?: string; // ISO timestamp
  errorMessage?: string;
  // Optionally, store the original query or parameters for this job
  // queryDetails?: Record<string, any>;
}

/**
 * Generic platform-specific state for managing resumable searches and long-running jobs.
 */
export interface PlatformState {
  // For overall resumable search (across multiple jobs/chunks)
  // This cursor can be a string, number, or a more complex object
  // depending on the platform's pagination/cursor mechanism.
  latestProcessedId?: string | number | Record<string, any>;

  // For the currently active job (e.g., a Masa search job for one chunk)
  currentAsyncJob?: AsyncJobProgress | null;

  // Allows for other platform-specific state variables
  [key: string]: any;
}

/**
 * State passed between search calls to enable resumption.
 * TData is expected to be an object conforming to PlatformState or a derivative.
 */
export interface LastProcessedState<
  TData extends PlatformState = PlatformState,
> {
  // The `data` field holds the strongly-typed, platform-specific state.
  data: TData;
  // Optional: A unique identifier for this state object itself, if needed for storage/retrieval.
  // id?: string;
  // Optional: Timestamp of when this state was generated.
  // timestamp?: number;
}

// Source-specific plugin types that extend the base plugin types
export type SourceConfig<
  V extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>,
  S extends z.ZodTypeAny = z.ZodRecord<z.ZodString, z.ZodUnknown>
> = Config<V, S>;

export interface SourceInput<TSearchOptions extends z.ZodTypeAny = z.ZodTypeAny> extends Input<z.ZodAny> {
  searchOptions: TSearchOptions;
  lastProcessedState?: LastProcessedState<PlatformState> | null;
}

export interface PluginSourceInput<TSearchOptions = Record<string, unknown>> extends Input<z.ZodAny> {
  searchOptions: TSearchOptions;
  lastProcessedState?: LastProcessedState<PlatformState> | null;
}

export interface PluginSourceOutputData<TItem extends PluginSourceItem = PluginSourceItem> {
  items: TItem[];
  nextLastProcessedState?: PlatformState | null;
}

// The output from a source plugin's execute method
export interface PluginSourceOutput<TItem extends PluginSourceItem = PluginSourceItem> extends Output<z.ZodAny> {
  success: boolean;
  data?: PluginSourceOutputData<TItem>;
  errors?: Array<{ message: string; details?: Record<string, unknown>; stack?: string }>;
}

// The final output data after system enrichment (used internally by workers)
export interface SourceOutputData {
  items: SourceItem[];
  nextLastProcessedState?: PlatformState | null;
}

// The final output after system enrichment (used internally by workers)
export interface SourceOutput extends Output<z.ZodAny> {
  success: boolean;
  data?: SourceOutputData;
  errors?: Array<{ message: string; details?: Record<string, unknown>; stack?: string }>;
}

// Source plugin interface that extends the base Plugin interface
export interface SourcePlugin<
  TInput extends PluginSourceInput | SourceInput = PluginSourceInput,
  TOutput extends PluginSourceOutput = PluginSourceOutput,
  TConfig extends SourceConfig = SourceConfig
> extends Plugin<TInput, TOutput, TConfig> {
  readonly type: 'source';
}

// Source-specific schema creators
export const createSourceInputSchema = <TSearchOptions extends z.ZodTypeAny>(
  searchOptionsSchema: TSearchOptions
) =>
  z.object({
    searchOptions: searchOptionsSchema,
    lastProcessedState: z.object({
      data: z.record(z.string(), z.unknown()),
      // TODO: expand to include a timestamp
    }).optional().nullable(),
  });

export const createSourceOutputSchema = <TItem extends z.ZodTypeAny>(
  itemData: TItem
) => {
  const pluginSourceItemSchema = z.object({
    externalId: z.string(),
    content: z.string(),
    contentType: z.string().optional(),
    createdAt: z.string().optional(),
    url: z.string().optional(),
    authors: z.array(authorSchema).optional(),
    raw: itemData,
  });

  return z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(pluginSourceItemSchema),
      nextLastProcessedState: z.record(z.string(), z.unknown()).optional().nullable(),
    }).optional(),
    errors: z.array(ErrorDetailsSchema).optional(),
  });
};

```

`usersdotfun/packages/core-sdk/tsconfig.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,

    // Bundler mode
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}

```

`usersdotfun/packages/pipeline-runner/README.md`:

```md
# usersdotfun

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```



```


`usersdotfun/packages/pipeline-runner/index.ts`:

```ts
import { BunTerminal } from "@effect/platform-bun";
import { Effect, Layer, Logger, LogLevel } from "effect";
import { runPromise } from "effect-errors";
import { executePipeline } from "./src/pipeline/runner";
import type { Pipeline } from "./src/pipeline/interfaces";
import { PluginLoaderLive } from "./src/pipeline/services";

const program = Effect.gen(function* () {
  const pipeline: Pipeline = {
    id: "test-pipeline",
    name: "Simple Transform Pipeline",
    steps: [
      {
        pluginName: "@curatedotfun/simple-transform",
        config: { variables: { template: "hello {{content}}" } },
        stepId: "transform-1"
      },
      {
        pluginName: "@curatedotfun/object-transform",
        config: { variables: { mappings: { "content": "goodbye {{content}}" } } },
        stepId: "transform-2"
      },
      {
        pluginName: "@curatedotfun/simple-transform",
        config: { variables: { template: "hello {{content}}" } },
        stepId: "transform-3"
      },
    ]
  };

  const input = {
    content: "world"
  };

  yield* Effect.log("Starting pipeline execution...");

  const result = yield* executePipeline(pipeline, input);

  yield* Effect.log(`Pipeline completed successfully`);
  yield* Effect.log(`Result: ${JSON.stringify(result, null, 2)}`);

  return result;
});


const LoggingLive = Layer.mergeAll(
  BunTerminal.layer,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info)
);

const AppLive = Layer.mergeAll(
  PluginLoaderLive,
  LoggingLive
);

const runnable = program.pipe(
  Effect.provide(AppLive)
)

runPromise(runnable).then(result => {
  process.exit(0);
}).catch(error => {
  console.error("❌ Pipeline failed - see errors above");
  process.exit(1);
});

```

`usersdotfun/packages/pipeline-runner/package.json`:

```json
{
  "name": "@usersdotfun/pipeline-runner",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "type": "module",
  "private": true,
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "files": [
    "dist"
  ],
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "scripts": {
    "start": "bun index.ts"
  },
  "dependencies": {
    "@effect/platform-bun": "^0.77.0",
    "@module-federation/enhanced": "^0.17.1",
    "@usersdotfun/shared-types": "workspace:*",
    "@usersdotfun/core-sdk": "workspace:*",
    "@usersdotfun/shared-db": "workspace:*",
    "@usersdotfun/shared-queue": "workspace:*",
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1",
    "effect": "^3.17.1",
    "effect-errors": "^1.10.14",
    "mustache": "^4.2.0",
    "zod": "^4.0.5"
  }
}

```

`usersdotfun/packages/pipeline-runner/src/index.ts`:

```ts
export * from "./pipeline/runner";
export * from "./pipeline/interfaces";
export * from "./pipeline/services";
export * from "./pipeline/errors";
export * from "./pipeline/step";
export * from "./pipeline/validation";
export * from "./services/mf.service";
export * from "./services/plugin.service";
export * from "./services/state.service";
export * from "./services/environment.service";
export * from "./services/secrets.config";

```

`usersdotfun/packages/pipeline-runner/src/pipeline/errors.ts`:

```ts
import {
  DbError,
  JobNotFoundError,
  PipelineStepNotFoundError,
  ValidationError as DbValidationError,
} from "@usersdotfun/shared-db";
import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly data?: unknown;
  readonly cause?: unknown;
  readonly validationDetails?: string;
}> {}

export class PluginError extends Data.TaggedError("PluginError")<{
  readonly message: string;
  readonly pluginName: string;
  readonly operation:
    | "load"
    | "initialize"
    | "execute"
    | "validate"
    | "register"
    | "hydrate-secrets";
  readonly cause?: unknown;
  readonly retryable?: boolean;
  readonly context?: Record<string, unknown>;
}> {}

export class PipelineError extends Data.TaggedError("PipelineError")<{
  readonly message: string;
  readonly pipelineId: string;
  readonly stepId?: string;
  readonly cause: StepError | Error;
  readonly context?: Record<string, unknown>;
}> {}

export type StepError =
  | ValidationError
  | PluginError
  | DbError
  | DbValidationError
  | JobNotFoundError
  | PipelineStepNotFoundError;
export type PipelineExecutionError = PipelineError | StepError;

```

`usersdotfun/packages/pipeline-runner/src/pipeline/interfaces.ts`:

```ts
import type { Config, Input, Output, Plugin } from "@usersdotfun/core-sdk";

export type PipelinePlugin = Plugin<Input<any>, Output<any>, Config>;
export interface PipelineExecutionContext {
  runId: string;
  itemIndex: number;
  sourceJobId: string;
  jobId: string;
  env: {
    secrets: string[];
  };
}
```

`usersdotfun/packages/pipeline-runner/src/pipeline/runner.ts`:

```ts
import { JobService } from "@usersdotfun/shared-db";
import { Effect } from "effect";
import { type PipelineExecutionError } from "./errors";
import { PluginLoaderTag } from "./services";
import { executeStep } from "./step";
import type { StateService } from "@usersdotfun/shared-queue";
import { type EnvironmentService } from "../services/environment.service";
import type { PipelineExecutionContext } from "./interfaces";
import type { JobDefinitionPipeline } from "@usersdotfun/shared-types/types";

export const executePipeline = (
  pipeline: JobDefinitionPipeline,
  initialInput: Record<string, unknown>,
  context: PipelineExecutionContext,
): Effect.Effect<unknown, PipelineExecutionError, PluginLoaderTag | JobService | StateService | EnvironmentService> =>
  Effect.gen(function* () {
    let currentInput: Record<string, unknown> = initialInput;

    for (const step of pipeline.steps) {
      yield* Effect.logDebug(`Executing step "${step.stepId}" for item ${context.itemIndex} (run: ${context.runId}) with input:`, currentInput);
      const output = yield* executeStep(step, currentInput, context);
      currentInput = output.data as Record<string, unknown>;
    }

    return currentInput;
  });

// Parallel execution variant
export const executePipelineParallel = (
  pipeline: JobDefinitionPipeline,
  initialInput: Record<string, unknown>,
  context: PipelineExecutionContext,
): Effect.Effect<unknown[], PipelineExecutionError, PluginLoaderTag | JobService | StateService | EnvironmentService> =>
  Effect.all(
    pipeline.steps.map((step) => executeStep(step, initialInput, context)),
    { concurrency: "unbounded" }
  );

```

`usersdotfun/packages/pipeline-runner/src/pipeline/services.ts`:

```ts
import { Context, Effect, Layer } from "effect";
import { ModuleFederationLive } from "../services/mf.service";
import { createPluginCache, loadPlugin } from "../services/plugin.service";
import { PluginError } from "./errors";
import registryData from "../../../registry-builder/registry.json" with { type: "json" };
import type { PluginMetadata, PluginRegistry } from "@usersdotfun/core-sdk";

const getPluginMetadata = (pluginName: string): PluginMetadata | undefined =>
  (registryData as PluginRegistry)[pluginName];

export class PluginLoaderTag extends Context.Tag("PluginLoader")<
  PluginLoaderTag,
  ReturnType<ReturnType<typeof loadPlugin>>
>() { }

export const PluginLoaderLive = Layer.effect(
  PluginLoaderTag,
  Effect.gen(function* () {
    const moduleCache = yield* createPluginCache();
    return loadPlugin(getPluginMetadata)(moduleCache);
  })
).pipe(Layer.provide(ModuleFederationLive));

// Helper for getting plugin metadata
export const getPlugin = (pluginName: string): Effect.Effect<PluginMetadata, PluginError> =>
  Effect.gen(function* () {
    const plugin = getPluginMetadata(pluginName);
    if (!plugin) {
      return yield* Effect.fail(new PluginError({
        message: `Plugin ${pluginName} not found in registry`,
        pluginName,
        operation: "load"
      }));
    }
    return plugin;
  });

```

`usersdotfun/packages/pipeline-runner/src/pipeline/step.ts`:

```ts
import { JobService } from "@usersdotfun/shared-db";
import { RedisKeys } from "@usersdotfun/shared-queue";
import type { PipelineStep } from "@usersdotfun/shared-types/types";
import { Effect } from "effect";
import { EnvironmentServiceTag, type EnvironmentService } from "../services/environment.service";
import { StateServiceTag, type StateService } from "../services/state.service";
import { PluginError, type StepError } from "./errors";
import type { PipelineExecutionContext } from './interfaces';
import { getPlugin, PluginLoaderTag } from "./services";
import { SchemaValidator } from "./validation";

export const executeStep = (
  step: PipelineStep,
  input: Record<string, unknown>,
  context: PipelineExecutionContext,
): Effect.Effect<Record<string, unknown>, StepError, PluginLoaderTag | JobService | StateService | EnvironmentService> =>
  Effect.gen(function* () {
    const jobService = yield* JobService;
    const stateService = yield* StateServiceTag;
    const environmentService = yield* EnvironmentServiceTag;
    const startTime = new Date();

    // Create deterministic step ID using context
    const stepId = `${context.runId}:${step.stepId}:${context.itemIndex}`;

    // Store step data in Redis for real-time monitoring
    yield* stateService.set(RedisKeys.pipelineItem(context.runId, context.itemIndex), {
      id: stepId,
      jobId: context.jobId,
      stepId: step.stepId,
      pluginName: step.pluginName,
      config: step.config,
      input,
      output: null,
      error: null,
      status: "processing",
      startedAt: startTime.toISOString(),
      completedAt: null,
    }).pipe(
      Effect.mapError((error) => new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Failed to store step state in Redis: ${error.message}`,
        cause: error,
      }))
    );

    yield* jobService.createPipelineStep({
      id: stepId,
      jobId: context.jobId,
      stepId: step.stepId,
      pluginName: step.pluginName,
      config: step.config,
      status: "processing",
      startedAt: startTime,
      input,
    });

    const loadPlugin = yield* PluginLoaderTag;
    const pluginMeta = yield* getPlugin(step.pluginName);

    // 1. Initial Validation of Raw Config
    const validatedRawConfig = yield* SchemaValidator.validate(
      pluginMeta.configSchema,
      step.config,
      `Step "${step.stepId}" raw config for plugin "${step.pluginName}"`
    );

    // 2. Secret Hydration
    const hydratedConfig = yield* environmentService.hydrateSecrets(
      validatedRawConfig,
      pluginMeta.configSchema
    ).pipe(
      Effect.mapError((error) => new PluginError({
        pluginName: step.pluginName,
        operation: "hydrate-secrets",
        message: `Failed to hydrate secrets for plugin ${step.pluginName} config: ${error.message}`,
        cause: error,
      }))
    );

    // 3. Post-Hydration Validation of Config
    const finalValidatedConfig = yield* SchemaValidator.validate(
      pluginMeta.configSchema,
      hydratedConfig,
      `Step "${step.stepId}" hydrated config for plugin "${step.pluginName}"`
    );

    const plugin = yield* loadPlugin(step.pluginName, finalValidatedConfig, pluginMeta.version);

    const validatedInput = yield* SchemaValidator.validate(
      pluginMeta.inputSchema,
      input,
      `Step "${step.stepId}" input for plugin "${step.pluginName}`
    );

    const output = yield* Effect.tryPromise({
      try: () => plugin.execute(validatedInput),
      catch: (error) => new PluginError({
        pluginName: step.pluginName,
        cause: error,
        operation: "execute",
        message: `Failed to execute plugin ${step.pluginName}`,
      })
    }).pipe(
      Effect.mapError((error) => {
        jobService.updatePipelineStep(stepId, {
          status: "failed",
          error,
          completedAt: new Date(),
        });
        return error;
      })
    );

    if (output === undefined || output === null) {
      jobService.updatePipelineStep(stepId, {
        status: "failed",
        error: { message: `Plugin returned ${output === null ? 'null' : 'undefined'} output` },
        completedAt: new Date(),
      });
      return yield* Effect.fail(new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Plugin ${step.pluginName} returned ${output === null ? 'null' : 'undefined'} output`,
        // cause: new Error(`Expected object output, got ${output === null ? 'null' : 'undefined'}`)
      }));
    }

    const validatedOutput = yield* SchemaValidator.validate(
      pluginMeta.outputSchema,
      output as Record<string, unknown>,
      `Step "${step.stepId}" output for plugin "${step.pluginName}`
    );

    if (!validatedOutput.success) {
      const error = new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Plugin ${step.pluginName} execution failed`,
        context: {
          errors: validatedOutput.errors,
        }
      });
      jobService.updatePipelineStep(stepId, {
        status: "failed",
        error,
        completedAt: new Date(),
      });
      return yield* Effect.fail(error);
    }

    const completedAt = new Date();

    yield* jobService.updatePipelineStep(stepId, {
      status: "completed",
      output: validatedOutput,
      completedAt,
    });

    // Update Redis state with completion
    yield* stateService.set(RedisKeys.pipelineItem(context.runId, context.itemIndex), {
      id: stepId,
      jobId: context.jobId,
      stepId: step.stepId,
      pluginName: step.pluginName,
      config: step.config,
      input,
      output: validatedOutput,
      error: null,
      status: "completed",
      startedAt: startTime.toISOString(),
      completedAt: completedAt.toISOString(),
    }).pipe(
      Effect.mapError((error) => new PluginError({
        pluginName: step.pluginName,
        operation: "execute",
        message: `Failed to update step completion state in Redis: ${error.message}`,
        cause: error,
      }))
    );

    return validatedOutput;
  }).pipe(
    Effect.withSpan(`pipeline-step-${step.stepId}`, {
      attributes: {
        pluginName: step.pluginName,
        stepId: step.stepId,
      },
    })
  );

```

`usersdotfun/packages/pipeline-runner/src/pipeline/validation.ts`:

```ts
import addFormats from "ajv-formats";
import Ajv2020, { type JSONSchemaType } from "ajv/dist/2020";
import { Effect } from "effect";
import { ValidationError } from "./errors";

const ajv = new Ajv2020({
  allErrors: true,
  verbose: true,
});
addFormats(ajv);

export class SchemaValidator {
  static validate(
    schema: JSONSchemaType<any>, // 2020-12
    data: Record<string, unknown>,
    context?: string
  ): Effect.Effect<Record<string, unknown>, ValidationError> {
    return Effect.gen(function* () {
      const validate = ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        return yield* Effect.fail(new ValidationError({
          message: `${context || 'Unknown context'}: Schema validation failed`,
          cause: new Error(
            `${context || 'Unknown context'}: Validation failed\n` +
            `Expected: ${JSON.stringify(schema.properties || schema, null, 2)}\n` +
            `Received: ${JSON.stringify(data, null, 2)}\n` +
            `Details: ${ajv.errorsText(validate.errors)}`
          ),
          data: data,
          validationDetails: ajv.errorsText(validate.errors)
        }));
      }

      return data;
    });
  }
}

```

`usersdotfun/packages/pipeline-runner/src/services/environment.service.ts`:

```ts
import type { JSONSchemaType } from "ajv/dist/2020";
import { Context, Effect, Layer, Redacted } from "effect";
import Mustache from "mustache";
import { PluginError } from "../pipeline/errors";
import { SecretsConfigTag } from "./secrets.config";

export interface EnvironmentService {
  readonly hydrateSecrets: <T>(
    config: T,
    schema: JSONSchemaType<any>
  ) => Effect.Effect<T, PluginError>;
}

export const EnvironmentServiceTag = Context.GenericTag<EnvironmentService>(
  "EnvironmentService"
);

export const createEnvironmentService = (
  secretsToHydrate: ReadonlyArray<string>
): EnvironmentService => {
  // Build the envMapping once when the service is created
  const envMapping: Record<string, Redacted.Redacted<string>> = {};
  for (const secretName of secretsToHydrate) {
    const value = process.env[secretName];
    if (value !== undefined) {
      envMapping[secretName] = Redacted.make(value);
    }
  }
  const availableSecretNames = Object.keys(envMapping);

  return {
    hydrateSecrets: <T>(
      config: T,
      schema: JSONSchemaType<any>
    ): Effect.Effect<T, PluginError> =>
      Effect.gen(function* () {
        console.log("HYDRATING");

        // Check if config has a secrets property
        const configObj = config as any;
        if (!configObj || typeof configObj !== 'object' || !configObj.secrets) {
          // No secrets to hydrate, return config as-is
          return config;
        }

        const stringifiedSecrets = yield* Effect.try({
          try: () => JSON.stringify(configObj.secrets),
          catch: (error) =>
            new PluginError({
              message: `Failed to hydrate secrets: ${error instanceof Error ? error.message : String(error)
                }`,
              operation: "hydrate-secrets",
              pluginName: "environment-service",
              cause: error instanceof Error ? error : new Error(String(error)),
            }),
        });

        const tokens = Mustache.parse(stringifiedSecrets);
        const templateVars = new Set(
          tokens
            .filter((token) => token[0] === "name")
            .map((token) => token[1])
        );

        yield* validateRequiredSecrets(
          templateVars,
          availableSecretNames
        );

        const view: Record<string, any> = {};
        for (const templateVar of templateVars) {
          if (availableSecretNames.includes(templateVar) && envMapping[templateVar]) {
            view[templateVar] = Redacted.value(envMapping[templateVar]);
          } else {
            view[templateVar] = `{{${templateVar}}}`;
          }
        }

        const populatedSecretsString = Mustache.render(stringifiedSecrets, view);

        const hydratedSecrets = yield* Effect.try({
          try: () => JSON.parse(populatedSecretsString),
          catch: (error) =>
            new PluginError({
              message: `Failed to hydrate secrets: ${error instanceof Error ? error.message : String(error)
                }`,
              operation: "hydrate-secrets",
              pluginName: "environment-service",
              cause: error instanceof Error ? error : new Error(String(error)),
            }),
        });

        // Return the config with only the secrets hydrated
        return {
          ...configObj,
          secrets: hydratedSecrets
        } as T;
      }),
  };
};

// Validate that required secrets are available
const validateRequiredSecrets = (
  templateVars: Set<string>,
  availableSecrets: string[]
): Effect.Effect<void, PluginError> =>
  Effect.gen(function* () {
    const missingRequiredSecrets: string[] = [];

    // Check if any template variable is missing from available secrets
    for (const templateVar of templateVars) {
      if (!availableSecrets.includes(templateVar)) {
        missingRequiredSecrets.push(templateVar);
      }
    }

    if (missingRequiredSecrets.length > 0) {
      return yield* Effect.fail(new PluginError({
        message: `Missing required secrets: ${missingRequiredSecrets.join(', ')}`,
        operation: "hydrate-secrets",
        pluginName: "environment-service",
        context: {
          missingSecrets: missingRequiredSecrets,
          availableSecrets: availableSecrets,
          templateVars: Array.from(templateVars)
        }
      }));
    }
  });

export const EnvironmentServiceLive = Layer.effect(
  EnvironmentServiceTag,
  Effect.gen(function* () {
    const config = yield* SecretsConfigTag;
    return createEnvironmentService(config.secretNames);
  })
);

```

`usersdotfun/packages/pipeline-runner/src/services/mf.service.ts`:

```ts
import { init, getInstance } from "@module-federation/enhanced/runtime";
import { Context, Effect, Layer } from "effect";

type ModuleFederation = ReturnType<typeof init>;

export class ModuleFederationTag extends Context.Tag("ModuleFederation")<
  ModuleFederationTag,
  ModuleFederation
>() {}

// Cached effect that ensures single instance creation
const createModuleFederationInstance = Effect.cached(
  Effect.sync(() => {
    try {
      let instance = getInstance();
      
      if (!instance) {
        instance = init({
          name: "host",
          remotes: [],
        });
      }
      
      return instance;
    } catch (error) {
      throw new Error(`Failed to initialize Module Federation: ${error}`);
    }
  })
);

export const ModuleFederationLive = Layer.effect(
  ModuleFederationTag,
  Effect.flatten(createModuleFederationInstance)
);

```

`usersdotfun/packages/pipeline-runner/src/services/plugin.service.ts`:

```ts

import type { Config, PluginMetadata } from "@usersdotfun/core-sdk";
import { ConfigurationError } from "@usersdotfun/core-sdk";
import { Cache, Duration, Effect, Schedule } from "effect";
import {
  PluginError
} from "../pipeline/errors";
import type {
  PipelinePlugin,
} from "../pipeline/interfaces";
import { ModuleFederationTag } from "./mf.service";

const retrySchedule = Schedule.exponential(Duration.millis(100)).pipe(
  Schedule.compose(Schedule.recurs(2))
);

const loadModuleInternal = (
  pluginName: string,
  url: string
): Effect.Effect<new () => PipelinePlugin, PluginError, ModuleFederationTag> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(url, { method: "HEAD" }),
      catch: () => new PluginError({
        message: `Network error while fetching plugin ${pluginName} from ${url}`,
        pluginName,
        operation: "load",
        // cause: error,
      }),
    });

    if (!response.ok) {
      return yield* Effect.fail(new PluginError({
        message: `Plugin ${pluginName} not found at ${url}`,
        pluginName,
        operation: "load",
      }));
    }

    const mf = yield* ModuleFederationTag;
    const remoteName = pluginName.toLowerCase().replace("@", "").replace("/", "_");

    yield* Effect.try({
      try: () => mf.registerRemotes([{ name: remoteName, entry: url }]),
      catch: (error): PluginError =>
        new PluginError({
          message: `Failed to register ${pluginName}`,
          pluginName,
          operation: "register",
          cause: error instanceof Error ? error : new Error(String(error)),
        }),
    });

    const modulePath = `${remoteName}/plugin`;

    return yield* Effect.tryPromise({
      try: async () => {
        const container: any = mf.loadRemote(modulePath).then((container) => {
          if (!container) {
            throw new Error(`No container returned for ${modulePath}`);
          }

          const Constructor = typeof container === "function" ? container : (container as any)?.default;

          if (!Constructor || typeof Constructor !== "function") {
            throw new Error(`No valid constructor found. Container type: ${typeof container}, has default: ${!!(container as any)?.default}`);
          }

          return Constructor;
        });
        return container;
      },
      catch: (error): PluginError => {
        if (error instanceof PluginError) {
          return error;
        }

        return new PluginError({
          message: `Failed to load ${pluginName} from ${modulePath}: ${error instanceof Error ? error.message : String(error)}`,
          pluginName,
          operation: "load",
          // cause: error instanceof Error ? error : new Error(String(error)),
        });
      },
    });
  });

// Create the cache with integrated loading logic
export const createPluginCache = (): Effect.Effect<
  Cache.Cache<string, new () => PipelinePlugin, PluginError>,
  never,
  ModuleFederationTag
> =>
  Cache.make({
    capacity: 50,
    timeToLive: Duration.minutes(30),
    lookup: (cacheKey: string): Effect.Effect<new () => PipelinePlugin, PluginError, ModuleFederationTag> => {
      // Parse cache key: "pluginName:url"
      const colonIndex = cacheKey.indexOf(":");
      if (colonIndex === -1) {
        return Effect.fail(
          new PluginError({
            message: `Invalid cache key format: ${cacheKey}`,
            pluginName: cacheKey,
            operation: "load",
          })
        );
      }

      const pluginName = cacheKey.substring(0, colonIndex);
      const url = cacheKey.substring(colonIndex + 1);

      return loadModuleInternal(pluginName, url);
    },
  });

// Plugin loader using combinators
export const loadPlugin = (
  getPluginMetadata: (name: string) => PluginMetadata | undefined
) => (
  moduleCache: Cache.Cache<string, new () => PipelinePlugin, PluginError>
) => <TConfig extends Config>(
  pluginName: string,
  config?: TConfig,
  version?: string
): Effect.Effect<PipelinePlugin, PluginError> => {

      // Get metadata or fail
      const getMetadata: Effect.Effect<PluginMetadata, PluginError> = Effect.sync(() => {
        const metadata = getPluginMetadata(pluginName);
        if (!metadata) {
          throw new PluginError({
            message: `Plugin ${pluginName} not found`,
            pluginName,
            operation: "load"
          });
        }
        return metadata;
      })

      // Build cache key
      const getCacheKey = getMetadata.pipe(
        Effect.map(metadata => ({
          metadata,
          url: resolveUrl(metadata.remoteUrl, version),
          cacheKey: `${pluginName}:${resolveUrl(metadata.remoteUrl, version)}`
        }))
      );

      // Get constructor from cache
      const getConstructor: Effect.Effect<new () => PipelinePlugin, PluginError> = getCacheKey.pipe(
        Effect.flatMap(({ cacheKey }) =>
          moduleCache.get(cacheKey).pipe(
            Effect.mapError((error): PluginError => {
              if (error instanceof PluginError) {
                return error;
              }
              return new PluginError({
                message: `Cache error for ${pluginName}`,
                pluginName,
                operation: "load",
                cause: error,
              });
            })
          )
        )
      );

      // Create and initialize instance
      const createAndInitialize: Effect.Effect<
        PipelinePlugin,
        PluginError
      > = getConstructor.pipe(
        Effect.flatMap((PluginConstructor: new () => PipelinePlugin) =>
          // Create instance
          Effect.try({
            try: () => new PluginConstructor(),
            catch: (error) =>
              new PluginError({
                message: `Failed to instantiate plugin: ${pluginName}`,
                pluginName,
                operation: "load",
                cause: error,
              }),
          }).pipe(
            // Initialize with retry
            Effect.flatMap((instance) => {
              const initialize: Effect.Effect<void, PluginError> = Effect.tryPromise({
                try: () => instance.initialize(config),
                catch: (error): PluginError => {
                  if (error instanceof ConfigurationError) {
                    return new PluginError({
                      message: `Configuration error in ${pluginName}: ${error.message}`,
                      pluginName,
                      operation: "initialize",
                      cause: error,
                      retryable: false,
                    });
                  }
                  
                  return new PluginError({
                    message: `Failed to initialize ${pluginName}`,
                    pluginName,
                    operation: "initialize",
                    cause: error,
                    retryable: true,
                  });
                },
              }).pipe(
                Effect.catchAll((pluginError) => {
                  // Only retry if the error is retryable
                  if (pluginError.retryable) {
                    return Effect.fail(pluginError).pipe(Effect.retry(retrySchedule));
                  } else {
                    return Effect.fail(pluginError);
                  }
                })
              );

              // Return instance after successful initialization
              return initialize.pipe(Effect.map(() => instance));
            })
          )
        )
      );

      return createAndInitialize;
    };

const resolveUrl = (baseUrl: string, version?: string): string =>
  version && version !== "latest"
    ? baseUrl.replace("@latest", `@${version}`)
    : baseUrl;

```

`usersdotfun/packages/pipeline-runner/src/services/secrets.config.ts`:

```ts
import { Config, Context, Layer } from "effect";

export interface SecretsConfig {
  readonly secretNames: ReadonlyArray<string>;
}

export const SecretsConfigTag = Context.GenericTag<SecretsConfig>('SecretsConfig');

export const SecretsConfigSchema = Config.all({
  secretNames: Config.array(Config.string(), "PIPELINE_SECRETS_TO_HYDRATE"),
});

export const SecretsConfigLive = Layer.effect(
  SecretsConfigTag,
  SecretsConfigSchema
);

```

`usersdotfun/packages/pipeline-runner/src/services/state.service.ts`:

```ts
import type { StateService as RedisStateService } from "@usersdotfun/shared-queue";
import { Context } from 'effect';

export type StateService = RedisStateService;

export const StateServiceTag = Context.GenericTag<StateService>('StateService');

```

`usersdotfun/packages/pipeline-runner/tsconfig.json`:

```json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "composite": true,

    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  },
  "references": [{ "path": "../core-sdk" }, {"path": "../shared-db"}]
}

```



`usersdotfun/packages/shared-db/Dockerfile`:

```
FROM oven/bun:1.2-alpine AS base

FROM base AS pruner
WORKDIR /app
COPY package.json bun.lock ./
COPY tsconfig.json ./
COPY apps/ /app/apps/
COPY packages/ /app/packages/

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app .
RUN bun install
ENV NODE_ENV="production"
RUN bun run build --filter "@usersdotfun/shared-db"

FROM oven/bun:1.2-alpine AS production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./package.json
COPY --from=builder --chown=app:app /app/bun.lock ./bun.lock
COPY --from=builder --chown=app:app /app/packages/shared-db ./packages/shared-db

USER app
WORKDIR /app/packages/shared-db

# Run the migration and then go to sleep
ENTRYPOINT ["/bin/sh", "-c", "bun run db:migrate && sleep infinity"]

```

`usersdotfun/packages/shared-db/Dockerfile.dev`:

```dev
FROM oven/bun:1.2-alpine AS base

FROM base AS pruner
WORKDIR /app
COPY package.json bun.lock ./
COPY tsconfig.json ./
COPY apps/ /app/apps/
COPY packages/ /app/packages/

FROM base AS builder
WORKDIR /app
COPY --from=pruner /app .
RUN bun install
ENV NODE_ENV="development"
RUN bun run build --filter "@usersdotfun/shared-db"

FROM oven/bun:1.2-alpine AS production
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json ./package.json
COPY --from=builder --chown=app:app /app/bun.lock ./bun.lock
COPY --from=builder --chown=app:app /app/packages/shared-db ./packages/shared-db

USER app
WORKDIR /app/packages/shared-db

# The entrypoint is just 'bun run', commands will be appended
ENTRYPOINT ["bun", "run"]

# The default command to run when nothing is specified
CMD ["db:migrate"]

```

`usersdotfun/packages/shared-db/README.md`:

```md
# shared-db

Defines the database schema and Zod validators for the core data entities. It provides a single source of truth for how this data is structured, usable by any service needing to interact with the main database (primarily the Gateway itself, and potentially Bot Workers for read-only access).

```

`usersdotfun/packages/shared-db/drizzle.config.ts`:

```ts
import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

export default {
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Ensure DATABASE_URL is set in your .env file at the monorepo root
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;

```

`usersdotfun/packages/shared-db/package.json`:

```json
{
  "name": "@usersdotfun/shared-db",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -b",
    "lint": "eslint . --ext .ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "seed:dev": "bun ./scripts/seed-dev.ts",
    "seed:remote": "bun ./scripts/seed-remote.ts",
    "overwrite-vars:up": "bun run ./scripts/overwrite-vars.ts up",
    "overwrite-vars:down": "bun run ./scripts/overwrite-vars.ts down"
  },
  "dependencies": {
    "@usersdotfun/shared-types": "workspace:*",
    "drizzle-orm": "^0.44.3",
    "effect": "^3.17.2",
    "postgres": "^3.4.7",
    "zod": "^4.0.10"
  },
  "devDependencies": {
    "dotenv": "^16.5.0",
    "drizzle-kit": "^0.31.2",
    "eslint": "^9.29.0",
    "pg": "^8.16.2",
    "pg-connection-string": "^2.9.1",
    "typescript": "^5.8.3"
  },
  "peerDependencies": {
    "drizzle-orm": "^0.44.3",
    "typescript": "^5.0.0"
  },
  "publishConfig": {
    "access": "public"
  },
  "files": [
    "dist",
    "package.json"
  ]
}

```

`usersdotfun/packages/shared-db/scripts/overwrite-vars.ts`:

```ts
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as path from "path";
import { Client } from "pg";
import { feeds } from "../src/schema/feeds";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Define your list of transformations
const replacements = [{ oldValue: "curator.notes", newValue: "curatorNotes" }];

async function performUpOperation(db: NodePgDatabase) {
  for (const { oldValue, newValue } of replacements) {
    console.log(`Applying replacement: "${oldValue}" -> "${newValue}"`);
    await db.execute(sql`
        UPDATE ${feeds}
        SET
            config = REPLACE(config::text, ${oldValue}, ${newValue})::jsonb
        WHERE
            config::text LIKE ${`%${oldValue}%`};
      `);
  }
  console.log("All JSONB string replacements applied.");
}

async function performDownOperation(db: NodePgDatabase) {
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { oldValue, newValue } = replacements[i];
    console.log(`Reverting replacement: "${newValue}" -> "${oldValue}"`);
    await db.execute(sql`
        UPDATE ${feeds}
        SET
            config = REPLACE(config::text, ${newValue}, ${oldValue})::jsonb
        WHERE
            config::text LIKE ${`%${newValue}%`};
      `);
  }
  console.log("All JSONB string replacements reverted.");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Error: DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const operation = process.argv[2];
  if (operation !== "up" && operation !== "down") {
    console.error(
      "Error: Please specify 'up' or 'down' as a command line argument.",
    );
    console.log(
      "Usage: bun run packages/shared-db/scripts/overwrite-vars.ts <up|down>",
    );
    process.exit(1);
  }

  const dbClient = new Client({ connectionString: databaseUrl });

  try {
    console.log(`Connecting to remote database specified by DATABASE_URL...`);
    await dbClient.connect();
    const dbInstance = drizzle(dbClient);

    if (operation === "up") {
      console.log("Running UP operation...");
      await performUpOperation(dbInstance);
    } else {
      // operation === 'down'
      console.log("Running DOWN operation...");
      await performDownOperation(dbInstance);
    }
    console.log(`Operation '${operation}' completed successfully.`);
  } catch (error) {
    console.error(`Error during '${operation}' operation:`, error);
    process.exit(1);
  } finally {
    if (dbClient) {
      console.log("Closing database connection.");
      await dbClient.end();
    }
  }
}

main();

```

`usersdotfun/packages/shared-db/scripts/seed-dev.ts`:

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/schema";

async function main() {
  console.log("Seeding dev database... ", process.env.DATABASE_URL);

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    console.log("Inserting data...");

    // await db.insert(schema.feeds).values([...]).onConflictDoNothing();
    // await db.insert(schema.users).values([...]).onConflictDoUpdate(...);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Failed to seed database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("An error occurred while seeding:", err);
    process.exit(1);
  });

```

`usersdotfun/packages/shared-db/scripts/seed-remote.ts`:

```ts
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as dotenv from "dotenv";
import { parse } from "pg-connection-string";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const execAsync = promisify(exec);

async function seedRemote() {
  console.log("Starting remote seeding process...");

  // --- Configure your Database URLs ---
  const SOURCE_DATABASE_URL = process.env.SOURCE_DATABASE_URL;
  const TARGET_DATEBASE_URL = process.env.DATABASE_URL;

  if (!SOURCE_DATABASE_URL) {
    console.error(
      "Error: SOURCE_DATABASE_URL environment variable is required.",
    );
    process.exit(1);
  }

  if (!TARGET_DATEBASE_URL) {
    console.error(
      "Error: TARGET_DATEBASE_URL environment variable is required.",
    );
    console.error(
      "Please set the DATABASE_URL environment variable for your local database.",
    );
    process.exit(1);
  }

  let dumpFilePath;

  try {
    // --- Parse Database URLs ---
    const railwayConfig = parse(SOURCE_DATABASE_URL);
    const localConfig = parse(TARGET_DATEBASE_URL);

    // Validate parsed configurations
    if (
      !railwayConfig.host ||
      !railwayConfig.user ||
      !railwayConfig.password ||
      !railwayConfig.database
    ) {
      console.error("Error: Could not parse SOURCE_DATABASE_URL correctly.");
      process.exit(1);
    }
    if (
      !localConfig.host ||
      !localConfig.user ||
      !localConfig.password ||
      !localConfig.database
    ) {
      console.error(
        "Error: Could not parse TARGET_DATEBASE_URL (DATABASE_URL) correctly.",
      );
      process.exit(1);
    }

    const dumpFileName = "railway_dump.sql";
    dumpFilePath = path.join(__dirname, dumpFileName);

    // --- Step 1: Dump data from Railway database ---
    console.log(
      `Dumping data from Railway database '${railwayConfig.database}'...`,
    );
    const dumpCommand = `PGPASSWORD="${railwayConfig.password}" pg_dump -h ${railwayConfig.host} -p ${railwayConfig.port || "5432"} -U ${railwayConfig.user} -d ${railwayConfig.database} -Fp > ${dumpFilePath}`;
    console.log(`Executing dump command: ${dumpCommand}`); // Log command for debugging
    await execAsync(dumpCommand);
    console.log(`Dump created at ${dumpFilePath}`);

    // --- Step 2: Clear local database (optional but recommended for a fresh sync) ---
    console.log(`Clearing local database '${localConfig.database}'...`);
    // You might want to be more selective here, or drop/recreate the database entirely
    // For simplicity, we'll just TRUNCATE common tables. Customize as needed.
    const truncateCommand = `PGPASSWORD="${localConfig.password}" psql -h ${localConfig.host} -p ${localConfig.port || "5432"} -U ${localConfig.user} -d ${localConfig.database} -c "
      TRUNCATE TABLE feeds CASCADE;
      TRUNCATE TABLE submissions CASCADE;
      TRUNCATE TABLE submission_feeds CASCADE;
      TRUNCATE TABLE moderation_history CASCADE;
      TRUNCATE TABLE feed_plugins CASCADE;
      TRUNCATE TABLE submission_counts CASCADE;
      TRUNCATE TABLE twitter_cookies CASCADE;
      TRUNCATE TABLE twitter_cache CASCADE;
    "`;
    console.log(`Executing truncate command: ${truncateCommand}`); // Log command for debugging
    await execAsync(truncateCommand);
    console.log("Local database cleared.");

    // --- Step 3: Restore data to local database ---
    console.log(
      `Restoring data to local database '${localConfig.database}'...`,
    );
    // *** FIX: Use psql -f for restoring plain text dumps ***
    const restoreCommand = `PGPASSWORD="${localConfig.password}" psql -h ${localConfig.host} -p ${localConfig.port || "5432"} -U ${localConfig.user} -d ${localConfig.database} -f ${dumpFilePath}`;
    console.log(`Executing restore command: ${restoreCommand}`); // Log command for debugging
    await execAsync(restoreCommand);
    console.log("Data restored to local database.");

    console.log("Remote seeding process completed successfully!");
  } catch (error: unknown) {
    console.error("Error during remote seeding:", error.message);
    console.error("Details:", error);
    process.exit(1);
  } finally {
    // Clean up the dump file
    try {
      if (fs.existsSync(dumpFilePath)) {
        fs.unlinkSync(dumpFilePath);
        console.log(`Cleaned up dump file: ${dumpFilePath}`);
      }
    } catch (cleanuperror: unknown) {
      console.error("Error cleaning up dump file:", cleanupError.message);
    }
  }
}

seedRemote();

```

`usersdotfun/packages/shared-db/src/errors.ts`:

```ts
import { Data } from "effect";
import * as Zod from "zod";

export class DbError extends Data.TaggedError("DbError")<{
  readonly cause: unknown;
  readonly message?: string;
}> { }

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly errors: Zod.ZodError;
  readonly message: string;
}> { }
```

`usersdotfun/packages/shared-db/src/index.ts`:

```ts
export { DbError, ValidationError } from "./errors";
export { Database, DatabaseConfig, DatabaseLive, JobService, JobServiceLive } from "./services";
export {
  JobNotFoundError,
  PipelineStepNotFoundError
} from "./services/job.service";
export { schema } from "./schema";
export type { DB } from "./schema";

```

`usersdotfun/packages/shared-db/src/schema/auth.ts`:

```ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  isAnonymous: boolean("is_anonymous"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

```

`usersdotfun/packages/shared-db/src/schema/index.ts`:

```ts
export * from "./auth";
export * from "./jobs";
export * from "./pipeline-steps";

export {
  selectJobSchema,
  insertJobSchema,
  updateJobSchema,
  type SelectJob,
  type InsertJobData,
  type UpdateJobData,
} from "./jobs";

export {
  selectPipelineStepSchema,
  insertPipelineStepSchema,
  updatePipelineStepSchema,
  type SelectPipelineStep,
  type InsertPipelineStepData,
  type UpdatePipelineStepData,
} from "./pipeline-steps";

import * as auth from "./auth";
import * as jobs from "./jobs";
import * as pipelineSteps from "./pipeline-steps";

export const schema = { ...auth, ...jobs, ...pipelineSteps };

export type DB = typeof schema;


```

`usersdotfun/packages/shared-db/src/schema/jobs.ts`:

```ts
import { relations } from "drizzle-orm";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { pipelineSteps } from "./pipeline-steps";

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  schedule: varchar("schedule", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull(),
  sourcePlugin: varchar("source_plugin", { length: 255 }).notNull(),
  sourceConfig: jsonb("source_config"),
  sourceSearch: jsonb("source_search"),
  pipeline: jsonb("pipeline"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
});

export const jobsRelations = relations(jobs, ({ many }) => ({
  steps: many(pipelineSteps),
}));

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export const selectJobSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  schedule: z.string().nullable(),
  status: z.string(),
  sourcePlugin: z.string(),
  sourceConfig: z.any().nullable(),
  sourceSearch: z.any().nullable(),
  pipeline: z.any().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertJobSchema = z.object({
  id: z.uuid("Invalid UUID format for job ID").optional(),
  name: z.string().min(1),
  schedule: z.string().min(1).optional().nullable(),
  status: z.string().min(1).optional(),
  sourcePlugin: z.string().min(1),
  sourceConfig: z.any().optional().nullable(),
  sourceSearch: z.any().optional().nullable(),
  pipeline: z.any().optional().nullable(),
});

export const updateJobSchema = insertJobSchema.omit({ id: true }).partial();

export type SelectJob = z.infer<typeof selectJobSchema>;
export type InsertJobData = z.infer<typeof insertJobSchema>;
export type UpdateJobData = z.infer<typeof updateJobSchema>;

```

`usersdotfun/packages/shared-db/src/schema/pipeline-steps.ts`:

```ts
import { relations } from "drizzle-orm";
import { json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { jobs } from "./jobs";

export const pipelineSteps = pgTable("pipeline_steps", {
  id: varchar("id", { length: 255 }).primaryKey(),
  jobId: varchar("job_id", { length: 255 })
    .notNull()
    .references(() => jobs.id),
  stepId: varchar("step_id", { length: 255 }).notNull(),
  pluginName: varchar("plugin_name", { length: 255 }).notNull(),
  config: json("config"),
  input: json("input"),
  output: json("output"),
  error: json("error"),
  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
  completedAt: timestamp("completed_at", { mode: "date", withTimezone: true })
});

export const pipelineStepsRelations = relations(pipelineSteps, ({ one }) => ({
  job: one(jobs, {
    fields: [pipelineSteps.jobId],
    references: [jobs.id],
  }),
}));

export type PipelineStep = typeof pipelineSteps.$inferSelect;
export type NewPipelineStep = typeof pipelineSteps.$inferInsert;

export const selectPipelineStepSchema = z.object({
  id: z.string().min(1),
  jobId: z.uuid(),
  stepId: z.string().min(1),
  pluginName: z.string().min(1),
  config: z.any().nullable(),
  input: z.any().nullable(),
  output: z.any().nullable(),
  error: z.any().nullable(),
  status: z.string().min(1),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
});

export const insertPipelineStepSchema = z.object({
  id: z.string().min(1),
  jobId: z.uuid(),
  stepId: z.string().min(1),
  pluginName: z.string().min(1),
  config: z.any().optional().nullable(),
  input: z.any().optional().nullable(),
  output: z.any().optional().nullable(),
  error: z.any().optional().nullable(),
  status: z.string().min(1),
  startedAt: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
});

export const updatePipelineStepSchema = insertPipelineStepSchema.omit({ id: true }).partial();

export type SelectPipelineStep = z.infer<typeof selectPipelineStepSchema>;
export type InsertPipelineStepData = z.infer<typeof insertPipelineStepSchema>;
export type UpdatePipelineStepData = z.infer<typeof updatePipelineStepSchema>;

```

`usersdotfun/packages/shared-db/src/services/db.service.ts`:

```ts
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer } from "effect";
import { Pool } from "pg";
import { schema } from "../schema";

export interface DatabaseData {
  readonly db: NodePgDatabase<typeof schema>;
}

export const Database = Context.GenericTag<DatabaseData>("Database");

export interface DatabaseConfigData {
  readonly connectionString: string;
}

export const DatabaseConfig = Context.GenericTag<DatabaseConfigData>("DatabaseConfig");

export const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const config = yield* DatabaseConfig;

    const pool = yield* Effect.acquireRelease(
      Effect.sync(() => {
        console.log("Database pool created.");
        return new Pool({ connectionString: config.connectionString });
      }),
      (pool) =>
        Effect.promise(() => {
          console.log("Database pool closing...");
          return pool.end();
        }).pipe(
          Effect.catchAllDefect((error) =>
            Effect.logError(`Error closing database pool: ${error}`)
          )
        )
    );

    const db = drizzle(pool, { schema, casing: "snake_case" });
    return { db };
  })
);
```

`usersdotfun/packages/shared-db/src/services/index.ts`:

```ts
export * from "./job.service";
export * from "./db.service";

```

`usersdotfun/packages/shared-db/src/services/job.service.ts`:

```ts
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";
import * as Zod from "zod";

import {
  createJobDefinitionSchema
} from "@usersdotfun/shared-types/schemas";
import {
  type CreateJobDefinition,
  type JobDefinition,
  type UpdateJobDefinition,
} from "@usersdotfun/shared-types/types";
import { DbError, ValidationError } from "../errors";
import { schema } from "../schema";
import {
  type InsertJobData,
  type SelectJob,
  type UpdateJobData,
  insertJobSchema,
  selectJobSchema,
  updateJobSchema,
} from "../schema/jobs";
import {
  type InsertPipelineStepData,
  type SelectPipelineStep,
  type UpdatePipelineStepData,
  insertPipelineStepSchema,
  selectPipelineStepSchema,
  updatePipelineStepSchema,
} from "../schema/pipeline-steps";
import { Database } from "./db.service";

export class JobNotFoundError extends Data.TaggedError("JobNotFoundError")<{
  readonly jobId: string;
}> { }

export class PipelineStepNotFoundError extends Data.TaggedError(
  "PipelineStepNotFoundError"
)<{
  readonly stepId: string;
  readonly jobId?: string;
}> { }

const validateData = <A>(
  zodSchema: Zod.ZodSchema<A>,
  data: unknown
): Effect.Effect<A, ValidationError> =>
  Effect.try({
    try: () => {
      const result = zodSchema.parse(data);
      return result;
    },
    catch: (error) => {
      console.log('Validation failed - Raw Zod error:', error);
      const zodError = error as Zod.ZodError;
      console.log('Zod error details:', {
        name: zodError.name,
        message: zodError.message,
        issues: zodError.issues
      });

      const validationError = new ValidationError({
        errors: zodError,
        message: "Validation failed",
      });

      console.log('Created ValidationError:', {
        validationError,
        errorType: validationError.constructor.name,
        tag: validationError._tag,
        errors: validationError.errors,
        message: validationError.message
      });

      return validationError;
    },
  });

const requireRecord = <T, E>(
  record: T | undefined,
  notFoundError: E
): Effect.Effect<T, E> =>
  record ? Effect.succeed(record) : Effect.fail(notFoundError);

const requireNonEmptyArray = <T, E>(
  records: T[],
  notFoundError: E
): Effect.Effect<void, E> =>
  records.length > 0 ? Effect.void : Effect.fail(notFoundError);

// Mapping functions between JobDefinition and database format
const mapDbJobToJobDefinition = (dbJob: SelectJob): JobDefinition => ({
  id: dbJob.id,
  name: dbJob.name,
  schedule: dbJob.schedule ?? undefined,
  source: {
    plugin: dbJob.sourcePlugin,
    config: dbJob.sourceConfig,
    search: dbJob.sourceSearch,
  },
  pipeline: dbJob.pipeline,
});

const mapJobDefinitionToDbJob = (jobDef: CreateJobDefinition): InsertJobData => ({
  name: jobDef.name,
  schedule: jobDef.schedule,
  sourcePlugin: jobDef.source.plugin,
  sourceConfig: jobDef.source.config,
  sourceSearch: jobDef.source.search,
  pipeline: jobDef.pipeline,
  status: 'pending',
});

const mapUpdateJobDefinitionToDbJob = (jobDef: UpdateJobDefinition): UpdateJobData => {
  const result: UpdateJobData = {};

  if (jobDef.name !== undefined) result.name = jobDef.name;
  if (jobDef.schedule !== undefined) result.schedule = jobDef.schedule;
  if (jobDef.source !== undefined) {
    result.sourcePlugin = jobDef.source.plugin;
    result.sourceConfig = jobDef.source.config;
    result.sourceSearch = jobDef.source.search;
  }
  if (jobDef.pipeline !== undefined) result.pipeline = jobDef.pipeline;

  return result;
};

export interface JobService {
  readonly getJobById: (
    id: string
  ) => Effect.Effect<SelectJob, JobNotFoundError | DbError>;
  readonly getJobs: () => Effect.Effect<Array<SelectJob>, DbError>;
  readonly createJob: (
    data: InsertJobData
  ) => Effect.Effect<SelectJob, ValidationError | DbError>;
  readonly createJobDefinition: (
    data: CreateJobDefinition
  ) => Effect.Effect<SelectJob, ValidationError | DbError>;
  readonly updateJob: (
    id: string,
    data: UpdateJobData
  ) => Effect.Effect<
    SelectJob,
    JobNotFoundError | ValidationError | DbError
  >;
  readonly deleteJob: (
    id: string
  ) => Effect.Effect<void, JobNotFoundError | DbError>;
  readonly retryJob: (
    id: string
  ) => Effect.Effect<void, JobNotFoundError | DbError>;
  readonly getStepById: (
    id: string
  ) => Effect.Effect<
    SelectPipelineStep,
    PipelineStepNotFoundError | DbError
  >;
  readonly getStepsForJob: (
    jobId: string
  ) => Effect.Effect<Array<SelectPipelineStep>, DbError>;
  readonly createPipelineStep: (
    data: InsertPipelineStepData
  ) => Effect.Effect<SelectPipelineStep, ValidationError | DbError>;
  readonly updatePipelineStep: (
    id: string,
    data: UpdatePipelineStepData
  ) => Effect.Effect<
    SelectPipelineStep,
    PipelineStepNotFoundError | ValidationError | DbError
  >;
  readonly retryPipelineStep: (
    id: string
  ) => Effect.Effect<void, PipelineStepNotFoundError | DbError>;
}

export const JobService = Context.GenericTag<JobService>("JobService");

export const JobServiceLive = Layer.effect(
  JobService,
  Effect.gen(function* () {
    const { db } = yield* Database;

    // Internal helper methods that work with database format
    const getDbJobById = (id: string): Effect.Effect<SelectJob, JobNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () => db.query.jobs.findFirst({ where: eq(schema.jobs.id, id) }),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to get job by id" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result, new JobNotFoundError({ jobId: id }))
        ),
        Effect.flatMap((job) =>
          validateData(selectJobSchema, job).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid job data in database",
                })
            )
          )
        )
      );

    const getDbJobs = (): Effect.Effect<Array<SelectJob>, DbError> =>
      Effect.tryPromise({
        try: () => db.query.jobs.findMany(),
        catch: (cause) => new DbError({ cause, message: "Failed to get jobs" }),
      }).pipe(
        Effect.flatMap((jobs) =>
          validateData(Zod.array(selectJobSchema), jobs).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid jobs data in database",
                })
            )
          )
        )
      );

    const createDbJob = (data: InsertJobData): Effect.Effect<SelectJob, ValidationError | DbError> =>
      validateData(insertJobSchema, data).pipe(
        Effect.flatMap((validatedData) => {
          const newJob = {
            ...validatedData,
            id: randomUUID(),
            status: validatedData.status || 'pending'
          };

          return Effect.tryPromise({
            try: () =>
              db.insert(schema.jobs).values(newJob).returning(),
            catch: (cause) =>
              new DbError({ cause, message: "Failed to create job" }),
          });
        }),
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new DbError({
              cause: new Error("No record returned after insert"),
              message: "Failed to create job",
            })
          )
        ),
        Effect.flatMap((newJob) =>
          validateData(selectJobSchema, newJob).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid created job data",
                })
            )
          )
        )
      );

    const updateDbJob = (
      id: string,
      data: UpdateJobData
    ): Effect.Effect<SelectJob, JobNotFoundError | ValidationError | DbError> =>
      validateData(updateJobSchema, data).pipe(
        Effect.flatMap((validatedData) =>
          Effect.tryPromise({
            try: () =>
              db
                .update(schema.jobs)
                .set({ ...validatedData, updatedAt: new Date() })
                .where(eq(schema.jobs.id, id))
                .returning(),
            catch: (cause) =>
              new DbError({ cause, message: "Failed to update job" }),
          })
        ),
        Effect.flatMap((result) =>
          requireRecord(result[0], new JobNotFoundError({ jobId: id }))
        ),
        Effect.flatMap((updatedJob) =>
          validateData(selectJobSchema, updatedJob).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid updated job data",
                })
            )
          )
        )
      );

    // Public methods - GET methods return database format, create methods support both formats
    const getJobById = (id: string): Effect.Effect<SelectJob, JobNotFoundError | DbError> =>
      getDbJobById(id);

    const getJobs = (): Effect.Effect<Array<SelectJob>, DbError> =>
      getDbJobs();

    const createJob = (data: InsertJobData): Effect.Effect<SelectJob, ValidationError | DbError> =>
      createDbJob(data);

    const createJobDefinition = (data: CreateJobDefinition): Effect.Effect<SelectJob, ValidationError | DbError> =>
      validateData(createJobDefinitionSchema, data).pipe(
        Effect.flatMap((validatedData) => {
          const dbJobData = mapJobDefinitionToDbJob(validatedData);
          return createDbJob(dbJobData);
        })
      );

    const updateJob = (
      id: string,
      data: UpdateJobData
    ): Effect.Effect<SelectJob, JobNotFoundError | ValidationError | DbError> =>
      updateDbJob(id, data);

    const deleteJob = (id: string): Effect.Effect<void, JobNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db.delete(schema.jobs).where(eq(schema.jobs.id, id)).returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to delete job" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireNonEmptyArray(result, new JobNotFoundError({ jobId: id }))
        )
      );

    const getStepById = (id: string): Effect.Effect<SelectPipelineStep, PipelineStepNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.pipelineSteps.findFirst({
            where: eq(schema.pipelineSteps.id, id),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get pipeline step by id",
          }),
      }).pipe(
        Effect.flatMap((result) =>
          requireRecord(result, new PipelineStepNotFoundError({ stepId: id }))
        ),
        Effect.flatMap((step) =>
          validateData(selectPipelineStepSchema, step).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid pipeline step data in database",
                })
            )
          )
        )
      );

    const getStepsForJob = (jobId: string): Effect.Effect<Array<SelectPipelineStep>, DbError> =>
      Effect.tryPromise({
        try: () =>
          db.query.pipelineSteps.findMany({
            where: eq(schema.pipelineSteps.jobId, jobId),
            orderBy: (steps, { asc }) => asc(steps.startedAt),
          }),
        catch: (cause) =>
          new DbError({
            cause,
            message: "Failed to get pipeline steps for job",
          }),
      }).pipe(
        Effect.flatMap((steps) =>
          validateData(Zod.array(selectPipelineStepSchema), steps).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid pipeline steps data in database",
                })
            )
          )
        )
      );

    const createPipelineStep = (data: InsertPipelineStepData): Effect.Effect<SelectPipelineStep, ValidationError | DbError> =>
      validateData(insertPipelineStepSchema, data).pipe(
        Effect.flatMap((validatedData) =>
          Effect.tryPromise({
            try: () =>
              db
                .insert(schema.pipelineSteps)
                .values(validatedData)
                .returning(),
            catch: (cause) =>
              new DbError({
                cause,
                message: "Failed to create pipeline step",
              }),
          })
        ),
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new DbError({
              cause: new Error("No record returned after insert"),
              message: "Failed to create pipeline step",
            })
          )
        ),
        Effect.flatMap((newStep) =>
          validateData(selectPipelineStepSchema, newStep).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid created pipeline step data",
                })
            )
          )
        )
      );

    const updatePipelineStep = (
      id: string,
      data: UpdatePipelineStepData
    ): Effect.Effect<SelectPipelineStep, PipelineStepNotFoundError | ValidationError | DbError> =>
      validateData(updatePipelineStepSchema, data).pipe(
        Effect.flatMap((validatedData) =>
          Effect.tryPromise({
            try: () =>
              db
                .update(schema.pipelineSteps)
                .set(validatedData)
                .where(eq(schema.pipelineSteps.id, id))
                .returning(),
            catch: (cause) =>
              new DbError({
                cause,
                message: "Failed to update pipeline step",
              }),
          })
        ),
        Effect.flatMap((result) =>
          requireRecord(
            result[0],
            new PipelineStepNotFoundError({ stepId: id })
          )
        ),
        Effect.flatMap((updatedStep) =>
          validateData(selectPipelineStepSchema, updatedStep).pipe(
            Effect.mapError(
              (err) =>
                new DbError({
                  cause: err.errors,
                  message: "Invalid updated pipeline step data",
                })
            )
          )
        )
      );

    const retryJob = (id: string): Effect.Effect<void, JobNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db
            .update(schema.jobs)
            .set({ status: 'pending', updatedAt: new Date() })
            .where(eq(schema.jobs.id, id))
            .returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to retry job" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireNonEmptyArray(result, new JobNotFoundError({ jobId: id }))
        )
      );

    const retryPipelineStep = (id: string): Effect.Effect<void, PipelineStepNotFoundError | DbError> =>
      Effect.tryPromise({
        try: () =>
          db
            .update(schema.pipelineSteps)
            .set({
              status: 'pending',
              error: null,
              output: null,
              completedAt: null
            })
            .where(eq(schema.pipelineSteps.id, id))
            .returning(),
        catch: (cause) =>
          new DbError({ cause, message: "Failed to retry pipeline step" }),
      }).pipe(
        Effect.flatMap((result) =>
          requireNonEmptyArray(result, new PipelineStepNotFoundError({ stepId: id }))
        )
      );

    return {
      getJobById,
      getJobs,
      createJob,
      createJobDefinition,
      updateJob,
      deleteJob,
      retryJob,
      getStepById,
      getStepsForJob,
      createPipelineStep,
      updatePipelineStep,
      retryPipelineStep,
    };
  })
);

```

`usersdotfun/packages/shared-db/tsconfig.json`:

```json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "composite": true,

    // Enable declaration files for shared packages
    "declaration": true,
    "declarationMap": true,

    // Bundler mode
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": false,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Performance optimizations for complex types
    "disableSourceOfProjectReferenceRedirect": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false,

    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.spec.ts"],
  "references": [{ "path": "../shared-types" }]
}

```

`usersdotfun/packages/shared-queue/README.md`:

```md
# usersdotfun

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```



```

`usersdotfun/packages/shared-queue/package.json`:

```json
{
  "name": "@usersdotfun/shared-queue",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "type": "module",
  "private": true,
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "files": [
    "dist"
  ],
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  },
  "scripts": {
    "build": "tsc -b",
    "start": "bun index.ts"
  },
  "dependencies": {
    "@usersdotfun/shared-types": "workspace:*",
    "effect": "^3.17.1",
    "zod": "^4.0.5",
    "ioredis": "^5.4.1",
    "bullmq": "^5.34.0"
  }
}

```

`usersdotfun/packages/shared-queue/src/config.ts`:

```ts
import { Context, Redacted } from 'effect';

export interface QueueConfig {
  readonly redisUrl: Redacted.Redacted<string>;
}

export const QueueConfig = Context.GenericTag<QueueConfig>('QueueConfig');
```

`usersdotfun/packages/shared-queue/src/constants/keys.ts`:

```ts
import type { JobRunInfo, PipelineStep, JobError, QueueStatus } from '@usersdotfun/shared-types/types';

/**
 * A type-safe representation of a Redis key.
 * The `_value` property is a "phantom type" used solely for type inference
 * and does not exist at runtime.
 */
export type RedisKey<T> = {
  readonly __type: 'RedisKey';
  readonly value: string;
  readonly _value: T;
};

// ============================================================================
// Redis Key Factories for specific data types
// These functions enforce consistent key naming and associate them with data types.
// ============================================================================

export const RedisKeys = {
  /**
   * Generates a RedisKey for a job's state.
   * Example: `job:JOB_ID:state`
   * @param jobId The ID of the job.
   */
  jobState: <T>(jobId: string): RedisKey<T> => ({
    __type: 'RedisKey',
    value: `job:${jobId}:state`,
    _value: undefined as T,
  }),

  /**
   * Generates a RedisKey for a specific job run's information.
   * Example: `job:JOB_ID:run:RUN_ID`
   * @param jobId The ID of the source job.
   * @param runId The ID of the specific run.
   */
  jobRun: (jobId: string, runId: string): RedisKey<JobRunInfo> => ({
    __type: 'RedisKey',
    value: `job:${jobId}:run:${runId}`,
    _value: undefined as unknown as JobRunInfo,
  }),

  /**
   * Generates a RedisKey for the history of runs for a given job.
   * Example: `job:JOB_ID:runs:history`
   * Stores string[] (list of runIds)
   * @param jobId The ID of the job.
   */
  jobRunHistory: (jobId: string): RedisKey<string[]> => ({
    __type: 'RedisKey',
    value: `job:${jobId}:runs:history`,
    _value: undefined as unknown as string[],
  }),

  /**
   * Generates a RedisKey for a specific pipeline item within a run.
   * Example: `pipeline:RUN_ID:item:ITEM_INDEX`
   * @param runId The ID of the job run.
   * @param itemIndex The index of the item within the pipeline.
   */
  pipelineItem: (runId: string, itemIndex: number): RedisKey<PipelineStep> => ({
    __type: 'RedisKey',
    value: `pipeline:${runId}:item:${itemIndex}`,
    _value: undefined as unknown as PipelineStep,
  }),

  /**
   * Generates a RedisKey for job errors.
   * Example: `job-error:JOB_ID`
   * @param jobId The ID of the job.
   */
  jobError: (jobId: string): RedisKey<JobError> => ({
    __type: 'RedisKey',
    value: `job-error:${jobId}`,
    _value: undefined as unknown as JobError,
  }),

  /**
   * Generates a RedisKey for queue status.
   * Example: `queue:QUEUE_NAME:status`
   * @param queueName The name of the queue.
   */
  queueStatus: (queueName: string): RedisKey<QueueStatus> => ({
    __type: 'RedisKey',
    value: `queue:${queueName}:status`,
    _value: undefined as unknown as QueueStatus,
  }),
} as const;

// Helper for generic keys (e.g., for arbitrary data)
export const createRedisKey = <T>(key: string): RedisKey<T> => ({
  __type: 'RedisKey',
  value: key,
  _value: undefined as T,
});

```

`usersdotfun/packages/shared-queue/src/constants/queues.ts`:

```ts
import type { SourceJobData, PipelineJobData } from '@usersdotfun/shared-types/types';

export const QUEUE_NAMES = {
  SOURCE_JOBS: 'source-jobs',
  PIPELINE_JOBS: 'pipeline-jobs',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const VALID_QUEUE_NAMES = Object.values(QUEUE_NAMES);

export interface JobDataMapping {
  [QUEUE_NAMES.SOURCE_JOBS]: SourceJobData;
  [QUEUE_NAMES.PIPELINE_JOBS]: PipelineJobData;
}

export type JobData = JobDataMapping[QueueName];

```

`usersdotfun/packages/shared-queue/src/index.ts`:

```ts
export * from './redis-config.service';
export * from './state.service';
export * from './queue.service';
export * from './queue-status.service';
export * from './config';
export * from './constants/keys';
export * from './constants/queues';

```

`usersdotfun/packages/shared-queue/src/queue-status.service.ts`:

```ts
import { Context, Effect, Layer } from 'effect';
import { Queue } from 'bullmq';
import { RedisConfig } from './redis-config.service';
import type { QueueName } from './constants/queues';
import type { QueueStatus, JobStatus } from '@usersdotfun/shared-types/types';

export interface QueueStatusService {
  readonly getQueueStatus: (queueName: QueueName) => Effect.Effect<QueueStatus, Error>;
  readonly getActiveJobs: (queueName: QueueName) => Effect.Effect<JobStatus[], Error>;
  readonly getWaitingJobs: (queueName: QueueName) => Effect.Effect<JobStatus[], Error>;
  readonly getCompletedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getFailedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getDelayedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getJobById: (queueName: QueueName, jobId: string) => Effect.Effect<JobStatus | null, Error>;
}

export const QueueStatusService = Context.GenericTag<QueueStatusService>('QueueStatusService');

const mapBullJobToJobStatus = (job: any): JobStatus => ({
  id: job.id,
  name: job.name,
  data: job.data,
  progress: job.progress || 0,
  attemptsMade: job.attemptsMade || 0,
  timestamp: job.timestamp,
  processedOn: job.processedOn,
  finishedOn: job.finishedOn,
  failedReason: job.failedReason,
  returnvalue: job.returnvalue,
});

export const QueueStatusServiceLive = Layer.scoped(
  QueueStatusService,
  Effect.gen(function* () {
    const redisConfig = yield* RedisConfig;

    const connectionConfig = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      username: redisConfig.username,
      db: redisConfig.db,
    };

    const sourceQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('source-jobs', { connection: connectionConfig })),
      (q) => Effect.promise(() => q.close())
    );

    const pipelineQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('pipeline-jobs', { connection: connectionConfig })),
      (q) => Effect.promise(() => q.close())
    );

    const queues = new Map<string, Queue>([
      ['source-jobs', sourceQueue],
      ['pipeline-jobs', pipelineQueue],
    ]);

    const getQueue = (name: string): Effect.Effect<Queue, Error> => {
      const queue = queues.get(name);
      return queue
        ? Effect.succeed(queue)
        : Effect.fail(new Error(`Queue ${name} not found`));
    };

    return {
      getQueueStatus: (queueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
                queue.getWaiting(),
                queue.getActive(),
                queue.getCompleted(),
                queue.getFailed(),
                queue.getDelayed(),
                queue.isPaused(),
              ]);

              return {
                name: queueName,
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length,
                delayed: delayed.length,
                paused,
              };
            },
            catch: (error) => new Error(`Failed to get queue status for ${queueName}: ${error}`),
          })
        ),

      getActiveJobs: (queueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getActive();
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get active jobs for ${queueName}: ${error}`),
          })
        ),

      getWaitingJobs: (queueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getWaiting();
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get waiting jobs for ${queueName}: ${error}`),
          })
        ),

      getCompletedJobs: (queueName, start = 0, end = 99) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getCompleted(start, end);
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get completed jobs for ${queueName}: ${error}`),
          })
        ),

      getFailedJobs: (queueName, start = 0, end = 99) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getFailed(start, end);
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get failed jobs for ${queueName}: ${error}`),
          })
        ),

      getDelayedJobs: (queueName, start = 0, end = 99) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getDelayed(start, end);
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get delayed jobs for ${queueName}: ${error}`),
          })
        ),

      getJobById: (queueName, jobId) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const job = await queue.getJob(jobId);
              return job ? mapBullJobToJobStatus(job) : null;
            },
            catch: (error) => new Error(`Failed to get job ${jobId} from ${queueName}: ${error}`),
          })
        ),
    };
  })
);

```

`usersdotfun/packages/shared-queue/src/queue.service.ts`:

```ts
import { Job, Queue, Worker, type RepeatableJob, type RepeatOptions } from 'bullmq';
import { Context, Effect, Layer, Runtime, Scope } from 'effect';
import type { JobData, QueueName } from './constants/queues';
import type { JobType } from '@usersdotfun/shared-types/types';
import { RedisConfig } from './redis-config.service';

export interface QueueService {
  readonly add: <T extends JobData>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: {
      delay?: number;
      attempts?: number;
      backoff?: {
        type: 'exponential' | 'fixed';
        delay: number;
      };
    }
  ) => Effect.Effect<Job<T>, Error>;

  readonly addRepeatable: <T extends JobData>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options: RepeatOptions
  ) => Effect.Effect<Job<T>, Error>;

  readonly getRepeatableJobs: (
    queueName: QueueName
  ) => Effect.Effect<Array<RepeatableJob>, Error>;

  readonly addRepeatableIfNotExists: <T extends JobData>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options: RepeatOptions
  ) => Effect.Effect<{ added: boolean; job?: Job<T> }, Error>;

  readonly removeRepeatableJob: (
    queueName: QueueName,
    jobId: string,
    jobName?: string
  ) => Effect.Effect<{ removed: boolean; count: number }, Error>;

  readonly pauseQueue: (
    queueName: QueueName
  ) => Effect.Effect<void, Error>;

  readonly resumeQueue: (
    queueName: QueueName
  ) => Effect.Effect<void, Error>;

  readonly clearQueue: (
    queueName: QueueName,
    jobType?: JobType
  ) => Effect.Effect<{ removed: number }, Error>;

  readonly removeJob: (
    queueName: QueueName,
    jobId: string
  ) => Effect.Effect<{ removed: boolean; reason?: string }, Error>;

  readonly retryJob: (
    queueName: QueueName,
    jobId: string
  ) => Effect.Effect<{ retried: boolean; reason?: string }, Error>;

  readonly createWorker: <T extends JobData, E, R>(
    queueName: QueueName,
    processor: (job: Job<T>) => Effect.Effect<void, E, R>
  ) => Effect.Effect<Worker<T, any, string>, Error, R | Scope.Scope>;
}

export const QueueService = Context.GenericTag<QueueService>('QueueService');

export const QueueServiceLive = Layer.scoped(
  QueueService,
  Effect.gen(function* () {
    const redisConfig = yield* RedisConfig;

    // BullMQ Connection
    const connectionConfig = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      username: redisConfig.username,
      db: redisConfig.db,
    };

    // Create queues with proper resource management
    const sourceQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('source-jobs', {
        connection: connectionConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      })),
      (q) => Effect.promise(() => q.close())
    );

    const pipelineQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('pipeline-jobs', {
        connection: connectionConfig,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      })),
      (q) => Effect.promise(() => q.close())
    );

    const queues = new Map<string, Queue>([
      ['source-jobs', sourceQueue],
      ['pipeline-jobs', pipelineQueue],
    ]);

    const getQueue = (name: string): Effect.Effect<Queue, Error> => {
      const queue = queues.get(name);
      return queue
        ? Effect.succeed(queue)
        : Effect.fail(new Error(`Queue ${name} not found`));
    };

    return {
      add: <T extends JobData>(
        queueName: QueueName,
        jobName: string,
        data: T,
        options?: {
          delay?: number;
          attempts?: number;
          backoff?: { type: 'exponential' | 'fixed'; delay: number; };
        }
      ) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.add(jobName, data, options),
            catch: (error) => new Error(`Failed to add job: ${error}`)
          })
        ),

      addRepeatable: <T extends JobData>(
        queueName: QueueName,
        jobName: string,
        data: T,
        options: RepeatOptions
      ) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.add(jobName, data, {
              repeat: options,
            }),
            catch: (error) => new Error(`Failed to add repeatable job: ${error}`)
          })
        ),

      getRepeatableJobs: (queueName: QueueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.getRepeatableJobs(),
            catch: (error) => new Error(`Failed to get repeatable jobs: ${error}`)
          })
        ),


      addRepeatableIfNotExists: <T extends JobData>(
        queueName: QueueName,
        jobName: string,
        data: T,
        options: RepeatOptions
      ) =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);
          const existingJobs = yield* Effect.tryPromise({
            try: () => queue.getRepeatableJobs(),
            catch: (error) => new Error(`Failed to get repeatable jobs: ${error}`)
          });

          // Check if a job with the same name and pattern already exists
          // RepeatableJob has properties: key, name, id, endDate, tz, pattern, every
          const jobId = (data as JobData).jobId;
          const existingJob = existingJobs.find(job =>
            job.name === jobName &&
            job.pattern === options.pattern &&
            job.key.includes(jobId) // The key often contains job data info
          );

          if (existingJob) {
            // Job already exists with same schedule - no need to add
            return { added: false };
          }

          // Check if job exists with different schedule - remove old one first
          const jobWithDifferentSchedule = existingJobs.find(job =>
            job.name === jobName &&
            job.key.includes(jobId) &&
            job.pattern !== options.pattern
          );

          if (jobWithDifferentSchedule) {
            // Remove the old job with different schedule using the newer method
            yield* Effect.tryPromise({
              try: () => queue.removeJobScheduler(jobWithDifferentSchedule.key),
              catch: (error) => new Error(`Failed to remove old repeatable job: ${error}`)
            });
          }

          // Add the new job
          const job = yield* Effect.tryPromise({
            try: () => queue.add(jobName, data, { repeat: options }),
            catch: (error) => new Error(`Failed to add repeatable job: ${error}`)
          });

          return { added: true, job };
        }),

      removeRepeatableJob: (queueName: QueueName, jobId: string, jobName = 'scheduled-source-run') =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);
          const existingJobs = yield* Effect.tryPromise({
            try: () => queue.getRepeatableJobs(),
            catch: (error) => new Error(`Failed to get repeatable jobs: ${error}`)
          });

          // Find all jobs that match the jobId
          const jobsToRemove = existingJobs.filter(job =>
            job.name === jobName && job.key.includes(jobId)
          );

          if (jobsToRemove.length === 0) {
            return { removed: false, count: 0 };
          }

          // Remove all matching jobs
          let removedCount = 0;
          for (const job of jobsToRemove) {
            yield* Effect.tryPromise({
              try: async () => {
                await queue.removeJobScheduler(job.key);
                removedCount++;
              },
              catch: (error) => new Error(`Failed to remove repeatable job ${job.key}: ${error}`)
            });
          }

          return { removed: removedCount > 0, count: removedCount };
        }),

      pauseQueue: (queueName: QueueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.pause(),
            catch: (error) => new Error(`Failed to pause queue ${queueName}: ${error}`)
          })
        ),

      resumeQueue: (queueName: QueueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.resume(),
            catch: (error) => new Error(`Failed to resume queue ${queueName}: ${error}`)
          })
        ),

      clearQueue: (queueName: QueueName, jobType = 'all') =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);
          let totalRemoved = 0;

          if (jobType === 'completed' || jobType === 'all') {
            const completedRemoved = yield* Effect.tryPromise({
              try: () => queue.clean(0, 0, 'completed'),
              catch: (error) => new Error(`Failed to clean completed jobs: ${error}`)
            });
            totalRemoved += completedRemoved.length;
          }

          if (jobType === 'failed' || jobType === 'all') {
            const failedRemoved = yield* Effect.tryPromise({
              try: () => queue.clean(0, 0, 'failed'),
              catch: (error) => new Error(`Failed to clean failed jobs: ${error}`)
            });
            totalRemoved += failedRemoved.length;
          }

          if (jobType === 'all') {
            // Also clean delayed jobs (waiting jobs are handled differently)
            const delayedRemoved = yield* Effect.tryPromise({
              try: () => queue.clean(0, 0, 'delayed'),
              catch: (error) => new Error(`Failed to clean delayed jobs: ${error}`)
            });
            totalRemoved += delayedRemoved.length;

            // For waiting jobs, we need to remove them individually since clean() doesn't support 'waiting'
            const waitingJobs = yield* Effect.tryPromise({
              try: () => queue.getWaiting(),
              catch: (error) => new Error(`Failed to get waiting jobs: ${error}`)
            });

            for (const job of waitingJobs) {
              yield* Effect.tryPromise({
                try: () => job.remove(),
                catch: (error) => new Error(`Failed to remove waiting job ${job.id}: ${error}`)
              });
              totalRemoved++;
            }
          }

          return { removed: totalRemoved };
        }),

      removeJob: (queueName: QueueName, jobId: string) =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);

          // Get the job first to check its state
          const job = yield* Effect.tryPromise({
            try: () => queue.getJob(jobId),
            catch: (error) => new Error(`Failed to get job ${jobId}: ${error}`)
          });

          if (!job) {
            return { removed: false, reason: 'Job not found' };
          }

          // Check if job is active - don't allow removal of active jobs
          const activeJobs = yield* Effect.tryPromise({
            try: () => queue.getActive(),
            catch: (error) => new Error(`Failed to get active jobs: ${error}`)
          });

          const isActive = activeJobs.some(activeJob => activeJob.id === jobId);
          if (isActive) {
            return { removed: false, reason: 'Cannot remove active job' };
          }

          // Remove the job
          yield* Effect.tryPromise({
            try: () => job.remove(),
            catch: (error) => new Error(`Failed to remove job ${jobId}: ${error}`)
          });

          return { removed: true };
        }),

      retryJob: (queueName: QueueName, jobId: string) =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);

          // Get the job first
          const job = yield* Effect.tryPromise({
            try: () => queue.getJob(jobId),
            catch: (error) => new Error(`Failed to get job ${jobId}: ${error}`)
          });

          if (!job) {
            return { retried: false, reason: 'Job not found' };
          }

          // Check job state - only retry failed jobs or completed jobs that can be retried
          const jobState = yield* Effect.tryPromise({
            try: () => job.getState(),
            catch: (error) => new Error(`Failed to get job state: ${error}`)
          });

          if (jobState === 'active') {
            return { retried: false, reason: 'Cannot retry active job' };
          }

          if (jobState === 'waiting' || jobState === 'delayed') {
            return { retried: false, reason: 'Job is already queued' };
          }

          // Retry the job
          yield* Effect.tryPromise({
            try: () => job.retry(),
            catch: (error) => new Error(`Failed to retry job ${jobId}: ${error}`)
          });

          return { retried: true };
        }),

      createWorker: <T extends JobData, E, R>(
        queueName: QueueName,
        processor: (job: Job<T>) => Effect.Effect<void, E, R>
      ) =>
        Effect.gen(function* () {
          const runtime = yield* Effect.runtime<R>();

          const bullProcessor = async (job: Job<T>) => {
            try {
              await Runtime.runPromise(runtime)(processor(job));
            } catch (error) {
              // Let BullMQ handle retries
              throw error;
            }
          };

          const worker = yield* Effect.acquireRelease(
            Effect.sync(() => new Worker<T>(queueName, bullProcessor, {
              connection: connectionConfig,
              concurrency: 5, // Process up to 5 jobs concurrently
            })),
            (worker) => Effect.promise(() => worker.close())
          );

          worker.on('failed', (job, err) => {
            console.error(`Job ${job?.id} failed:`, err);
          });

          worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed`);
          });

          return worker;
        })
    };
  })
);

```

`usersdotfun/packages/shared-queue/src/redis-config.service.ts`:

```ts
import { Context, Effect, Layer, Redacted } from 'effect';

export interface RedisAppConfig {
  readonly redisUrl: Redacted.Redacted<string>;
}

export const RedisAppConfig = Context.GenericTag<RedisAppConfig>('RedisAppConfig');

export interface RedisConfig {
  readonly connectionString: string;
  readonly host: string;
  readonly port: number;
  readonly password?: string;
  readonly username?: string;
  readonly db: number;
}

export const RedisConfig = Context.GenericTag<RedisConfig>('RedisConfig');

const parseRedisUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      connectionString: url,
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1)) || 0 : 0,
    };
  } catch (error) {
    throw new Error(`Invalid Redis URL: ${url}`);
  }
};

export const RedisConfigLive = Layer.effect(
  RedisConfig,
  Effect.gen(function* () {
    const config = yield* RedisAppConfig;
    const redisUrl = Redacted.value(config.redisUrl);

    return yield* Effect.try({
      try: () => parseRedisUrl(redisUrl),
      catch: (error) => new Error(`Failed to parse Redis URL: ${error}`)
    });
  })
);
```

`usersdotfun/packages/shared-queue/src/state.service.ts`:

```ts
import { Context, Effect, Layer, Option } from 'effect';
import { Redis } from 'ioredis';
import { RedisConfig } from './redis-config.service';
import type { JobRunInfo, PipelineStep } from '@usersdotfun/shared-types/types';
import { RedisKeys } from './constants/keys';
import type { RedisKey } from './constants/keys';

export interface StateService {
  readonly get: <T>(key: RedisKey<T>) => Effect.Effect<Option.Option<T>, Error>;
  readonly set: <T>(key: RedisKey<T>, value: T) => Effect.Effect<void, Error>;
  readonly delete: (key: RedisKey<unknown>) => Effect.Effect<void, Error>;
  readonly getJobRun: (jobId: string, runId: string) => Effect.Effect<Option.Option<JobRunInfo>, Error>;
  readonly getJobRuns: (jobId: string) => Effect.Effect<string[], Error>;
  readonly getPipelineItem: (runId: string, itemIndex: number) => Effect.Effect<Option.Option<PipelineStep>, Error>;
  readonly exists: (key: RedisKey<unknown>) => Effect.Effect<boolean, Error>;
  readonly getKeys: (pattern: string) => Effect.Effect<string[], Error>;
  readonly addToRunHistory: (jobId: string, runId: string) => Effect.Effect<void, Error>;
  readonly getRunHistory: (jobId: string) => Effect.Effect<string[], Error>;
}

export const StateService = Context.GenericTag<StateService>('StateService');

export const StateServiceLive = Layer.scoped(
  StateService,
  Effect.gen(function* () {
    const prefix = 'job-state';
    const redisConfig = yield* RedisConfig;

    const redis = yield* Effect.acquireRelease(
      Effect.sync(() => new Redis(redisConfig.connectionString, { 
        keyPrefix: prefix, 
        maxRetriesPerRequest: 3 
      })),
      (redis) => Effect.promise(() => redis.quit())
    );

    return {
      get: <T>(key: RedisKey<T>) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(key.value);
            return result ? Option.some(JSON.parse(result)) : Option.none();
          },
          catch: (error) => new Error(`Failed to get state for ${key.value}: ${error}`),
        }),

      set: <T>(key: RedisKey<T>, value: T) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: async () => {
              await redis.set(key.value, JSON.stringify(value));
            },
            catch: (error) => new Error(`Failed to set state for ${key.value}: ${error}`),
          })
        ),

      delete: (key: RedisKey<unknown>) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: async () => {
              await redis.del(key.value);
            },
            catch: (error) => new Error(`Failed to delete state for ${key.value}: ${error}`),
          })
        ),

      getJobRun: (jobId, runId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(RedisKeys.jobRun(jobId, runId).value);
            return result ? Option.some(JSON.parse(result) as JobRunInfo) : Option.none();
          },
          catch: (error) => new Error(`Failed to get job run ${runId} for ${jobId}: ${error}`),
        }),

      getJobRuns: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.lrange(RedisKeys.jobRunHistory(jobId).value, 0, -1);
            return result || [];
          },
          catch: (error) => new Error(`Failed to get job runs for ${jobId}: ${error}`),
        }),

      getPipelineItem: (runId, itemIndex) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(RedisKeys.pipelineItem(runId, itemIndex).value);
            return result ? Option.some(JSON.parse(result) as PipelineStep) : Option.none();
          },
          catch: (error) => new Error(`Failed to get pipeline item ${itemIndex} for run ${runId}: ${error}`),
        }),

      exists: (key: RedisKey<unknown>) =>
        Effect.tryPromise({
          try: async () => {
            const exists = await redis.exists(key.value);
            return exists === 1;
          },
          catch: (error) => new Error(`Failed to check existence for ${key.value}: ${error}`),
        }),

      getKeys: (pattern) =>
        Effect.tryPromise({
          try: async () => {
            const keys = await redis.keys(pattern);
            return keys || [];
          },
          catch: (error) => new Error(`Failed to get keys for pattern ${pattern}: ${error}`),
        }),

      addToRunHistory: (jobId, runId) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: async () => {
              const historyKey = RedisKeys.jobRunHistory(jobId);
              await redis.lpush(historyKey.value, runId);
              // Keep only the last 50 runs
              await redis.ltrim(historyKey.value, 0, 49);
            },
            catch: (error) => new Error(`Failed to add run to history for ${jobId}: ${error}`),
          })
        ),

      getRunHistory: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.lrange(RedisKeys.jobRunHistory(jobId).value, 0, -1);
            return result || [];
          },
          catch: (error) => new Error(`Failed to get run history for ${jobId}: ${error}`),
        }),
    };
  })
);

```

`usersdotfun/packages/shared-queue/tsconfig.json`:

```json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "composite": true,

    // Enable declaration files for shared packages
    "declaration": true,
    "declarationMap": true,

    // Bundler mode
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": false,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Performance optimizations for complex types
    "disableSourceOfProjectReferenceRedirect": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false,

    "rootDir": "src",
    "outDir": "dist",
    "baseUrl": "."
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests", "**/*.test.ts", "**/*.spec.ts"],
  "references": [{ "path": "../shared-types" }]
}

```

`usersdotfun/packages/shared-types/README.md`:

```md
# usersdotfun

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```



```

`usersdotfun/packages/shared-types/package.json`:

```json
{
  "name": "@usersdotfun/shared-types",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "type": "module",
  "private": true,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./schemas": {
      "types": "./dist/schemas/index.d.ts",
      "default": "./dist/schemas/index.js"
    },
    "./schemas/*": {
      "types": "./dist/schemas/*.d.ts",
      "default": "./dist/schemas/*.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "default": "./dist/types/index.js"
    },
    "./types/*": {
      "types": "./dist/types/*.d.ts",
      "default": "./dist/types/*.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -b",
    "type-check": "tsc --noEmit",
    "start": "bun src/index.ts"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "cron-parser": "^5.3.0",
    "zod": "^4.0.10"
  }
}

```

`usersdotfun/packages/shared-types/src/index.ts`:

```ts
// Main entry point for shared types package
// Export all schemas
export * from './schemas';

// Export all types (these will include the inferred types from schemas)
export * from './types';

```

`usersdotfun/packages/shared-types/src/schemas/api/common.ts`:

```ts
import { z } from "zod";

// ============================================================================
// COMMON API RESPONSE SCHEMAS
// ============================================================================

export const ApiResponseBaseSchema = z.object({
  statusCode: z.number().int().min(100).max(599),
  message: z.string().optional(),
  code: z.string().optional(),
  timestamp: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataType: T) =>
  ApiResponseBaseSchema.extend({
    success: z.literal(true),
    data: dataType.optional(),
  });

export const ApiErrorResponseSchema = ApiResponseBaseSchema.extend({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
});

export const SimpleMessageDataSchema = z.object({
  message: z.string().describe("A success or informational message"),
});

export const NoContentDataSchema = z
  .undefined()
  .describe("Represents no data payload");

// ============================================================================
// COMMON QUERY OPTIONS
// ============================================================================

export const QueryOptionsSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).optional()),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(0).optional()),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const PaginatedDataSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    totalPages: z.number().int().min(0).optional(), // Calculated: Math.ceil(total / limit)
    hasNextPage: z.boolean().optional(),
    hasPrevPage: z.boolean().optional(),
  });

// ============================================================================
// COMMON PARAMETER SCHEMAS
// ============================================================================

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const StatusQuerySchema = z.object({
  status: z.string().optional(),
});

export const LimitQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(1000).optional()),
});

```

`usersdotfun/packages/shared-types/src/schemas/api/index.ts`:

```ts
export * from './common';
export * from './jobs';
export * from './queues';
export * from './websocket';

```

`usersdotfun/packages/shared-types/src/schemas/api/jobs.ts`:

```ts
import { z } from "zod";
import {
  createJobDefinitionSchema,
  jobDefinitionSchema,
  jobMonitoringDataSchema,
  jobRunDetailsSchema,
  jobRunInfoSchema,
  jobSchema,
  jobStatusSummarySchema,
  jobWithStepsSchema,
  updateJobDefinitionSchema
} from "../jobs";
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  IdParamSchema,
  LimitQuerySchema,
  SimpleMessageDataSchema,
  StatusQuerySchema
} from "./common";

// ============================================================================
// JOB API REQUEST SCHEMAS
// ============================================================================

// URL Parameters
export const JobIdParamSchema = IdParamSchema;
export const JobStepParamsSchema = z.object({
  id: z.string().min(1),
  stepId: z.string().min(1),
});
export const JobRunParamsSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
});

// Query Parameters
export const JobsListQuerySchema = StatusQuerySchema.merge(LimitQuerySchema);

// Request Bodies
export const CreateJobRequestBodySchema = createJobDefinitionSchema;
export const CreateJobDefinitionRequestBodySchema = createJobDefinitionSchema;
export const UpdateJobRequestBodySchema = updateJobDefinitionSchema;

// ============================================================================
// JOB API RESPONSE SCHEMAS
// ============================================================================

// Success Response Data Schemas
export const JobDataSchema = jobSchema;
export const JobDefinitionDataSchema = jobDefinitionSchema;
export const JobWithStepsDataSchema = jobWithStepsSchema;
export const JobRunInfoDataSchema = jobRunInfoSchema;
export const JobStatusSummaryDataSchema = jobStatusSummarySchema;
export const JobRunDetailsDataSchema = jobRunDetailsSchema;
export const JobMonitoringDataSchema = jobMonitoringDataSchema;
export const JobsListDataSchema = z.array(JobDataSchema);
export const JobRunsListDataSchema = z.array(JobRunInfoDataSchema);

// Cleanup Response Data
export const CleanupOrphanedJobsDataSchema = z.object({
  message: z.string(),
  cleaned: z.number(),
  details: z.object({
    orphanedJobs: z.array(z.string()),
    cleanupTime: z.iso.datetime(),
  }).optional(),
});

// ============================================================================
// COMPLETE API CONTRACT SCHEMAS
// ============================================================================

// GET /jobs
export const GetJobsRequestSchema = z.object({
  query: JobsListQuerySchema,
});
export const GetJobsResponseSchema = ApiSuccessResponseSchema(JobsListDataSchema);

// GET /jobs/:id
export const GetJobRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const GetJobResponseSchema = ApiSuccessResponseSchema(JobWithStepsDataSchema);

// POST /jobs
export const CreateJobRequestSchema = z.object({
  body: CreateJobRequestBodySchema,
});
export const CreateJobResponseSchema = ApiSuccessResponseSchema(JobDataSchema);

// POST /jobs/definition
export const CreateJobDefinitionRequestSchema = z.object({
  body: CreateJobDefinitionRequestBodySchema,
});
export const CreateJobDefinitionResponseSchema = ApiSuccessResponseSchema(JobDataSchema);

// PUT /jobs/:id
export const UpdateJobRequestSchema = z.object({
  params: JobIdParamSchema,
  body: UpdateJobRequestBodySchema,
});
export const UpdateJobResponseSchema = ApiSuccessResponseSchema(JobDataSchema);

// DELETE /jobs/:id
export const DeleteJobRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const DeleteJobResponseSchema = z.object({
  statusCode: z.literal(204),
  success: z.literal(true),
});

// GET /jobs/:id/status
export const GetJobStatusRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const GetJobStatusResponseSchema = ApiSuccessResponseSchema(JobStatusSummaryDataSchema);

// GET /jobs/:id/monitoring
export const GetJobMonitoringRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const GetJobMonitoringResponseSchema = ApiSuccessResponseSchema(JobMonitoringDataSchema);

// GET /jobs/:id/runs
export const GetJobRunsRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const GetJobRunsResponseSchema = ApiSuccessResponseSchema(JobRunsListDataSchema);

// GET /jobs/:id/runs/:runId
export const GetJobRunDetailsRequestSchema = z.object({
  params: JobRunParamsSchema,
});
export const GetJobRunDetailsResponseSchema = ApiSuccessResponseSchema(JobRunDetailsDataSchema);

// POST /jobs/:id/retry
export const RetryJobRequestSchema = z.object({
  params: JobIdParamSchema,
});
export const RetryJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /jobs/:id/steps/:stepId/retry
export const RetryJobStepRequestSchema = z.object({
  params: JobStepParamsSchema,
});
export const RetryJobStepResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /jobs/cleanup/orphaned
export const CleanupOrphanedJobsRequestSchema = z.object({});
export const CleanupOrphanedJobsResponseSchema = ApiSuccessResponseSchema(CleanupOrphanedJobsDataSchema);

// ============================================================================
// ERROR RESPONSE SCHEMAS
// ============================================================================

export const JobsApiErrorResponseSchema = ApiErrorResponseSchema;

```

`usersdotfun/packages/shared-types/src/schemas/api/queues.ts`:

```ts
import { z } from "zod";
import {
  jobTypeEnum,
  queueActionResultSchema,
  queueDetailsSchema,
  queueItemSchema,
  queueOverviewSchema,
  queueStatusSchema
} from "../queues";
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  PaginatedDataSchema,
  SimpleMessageDataSchema
} from "./common";

// ============================================================================
// QUEUE API REQUEST SCHEMAS
// ============================================================================

// URL Parameters
export const QueueNameParamSchema = z.object({
  queueName: z.string().min(1),
});

export const QueueJobParamsSchema = z.object({
  queueName: z.string().min(1),
  jobId: z.string().min(1),
});

// Query Parameters
export const QueuesStatusQuerySchema = z.object({});

export const QueueJobsQuerySchema = z.object({
  status: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(1000).optional()),
});

export const QueueItemsQuerySchema = z.object({
  status: z.string().default("waiting"),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).optional()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(100).optional()),
});

export const ClearQueueQuerySchema = z.object({
  type: jobTypeEnum.optional(),
});

// ============================================================================
// QUEUE API RESPONSE SCHEMAS
// ============================================================================

// Success Response Data Schemas
export const QueueStatusDataSchema = queueStatusSchema;
export const QueueOverviewDataSchema = queueOverviewSchema;
export const QueueDetailsDataSchema = queueDetailsSchema;
export const QueueItemDataSchema = queueItemSchema;
export const QueueActionResultDataSchema = queueActionResultSchema;

export const QueuesOverviewDataSchema = z.object({
  queues: z.record(z.string(), QueueOverviewDataSchema),
  timestamp: z.iso.datetime(),
});

export const AllQueueJobsDataSchema = z.object({
  jobs: z.array(
    QueueItemDataSchema.extend({
      queueName: z.string(),
      status: z.string(),
    })
  ),
  total: z.number(),
});

export const QueueItemsDataSchema = PaginatedDataSchema(QueueItemDataSchema);

export const QueueClearResultDataSchema = z.object({
  message: z.string(),
  itemsRemoved: z.number(),
});

// ============================================================================
// COMPLETE API CONTRACT SCHEMAS
// ============================================================================

// GET /queues/status
export const GetQueuesStatusRequestSchema = z.object({
  query: QueuesStatusQuerySchema,
});
export const GetQueuesStatusResponseSchema = ApiSuccessResponseSchema(QueuesOverviewDataSchema);

// GET /queues/jobs
export const GetAllQueueJobsRequestSchema = z.object({
  query: QueueJobsQuerySchema,
});
export const GetAllQueueJobsResponseSchema = ApiSuccessResponseSchema(AllQueueJobsDataSchema);

// GET /queues/:queueName
export const GetQueueDetailsRequestSchema = z.object({
  params: QueueNameParamSchema,
});
export const GetQueueDetailsResponseSchema = ApiSuccessResponseSchema(QueueDetailsDataSchema);

// GET /queues/:queueName/items
export const GetQueueItemsRequestSchema = z.object({
  params: QueueNameParamSchema,
  query: QueueItemsQuerySchema,
});
export const GetQueueItemsResponseSchema = ApiSuccessResponseSchema(QueueItemsDataSchema);

// POST /queues/:queueName/pause
export const PauseQueueRequestSchema = z.object({
  params: QueueNameParamSchema,
});
export const PauseQueueResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /queues/:queueName/resume
export const ResumeQueueRequestSchema = z.object({
  params: QueueNameParamSchema,
});
export const ResumeQueueResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// DELETE /queues/:queueName/clear
export const ClearQueueRequestSchema = z.object({
  params: QueueNameParamSchema,
  query: ClearQueueQuerySchema,
});
export const ClearQueueResponseSchema = ApiSuccessResponseSchema(QueueClearResultDataSchema);

// DELETE /queues/:queueName/purge
export const PurgeQueueRequestSchema = z.object({
  params: QueueNameParamSchema,
});
export const PurgeQueueResponseSchema = ApiSuccessResponseSchema(QueueClearResultDataSchema);

// DELETE /queues/:queueName/jobs/:jobId
export const RemoveQueueJobRequestSchema = z.object({
  params: QueueJobParamsSchema,
});
export const RemoveQueueJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// POST /queues/:queueName/jobs/:jobId/retry
export const RetryQueueJobRequestSchema = z.object({
  params: QueueJobParamsSchema,
});
export const RetryQueueJobResponseSchema = ApiSuccessResponseSchema(SimpleMessageDataSchema);

// ============================================================================
// ERROR RESPONSE SCHEMAS
// ============================================================================

export const QueuesApiErrorResponseSchema = ApiErrorResponseSchema;

```

`usersdotfun/packages/shared-types/src/schemas/api/websocket.ts`:

```ts
import { z } from "zod";
import { webSocketEventSchema } from "../websocket";

// ============================================================================
// WEBSOCKET CLIENT-TO-SERVER COMMAND SCHEMAS
// ============================================================================

export const webSocketCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscribe'),
    eventType: z.string(),
  }),
  z.object({
    type: z.literal('unsubscribe'),
    eventType: z.string(),
  }),
  z.object({
    type: z.literal('ping'),
    timestamp: z.number().optional(),
  }),
]);

// ============================================================================
// WEBSOCKET SERVER-TO-CLIENT EVENT SCHEMAS
// ============================================================================

// Re-export the existing event schema from the main websocket schema
export const webSocketServerEventSchema = webSocketEventSchema;

// Connection-specific events (not in the main event schema)
export const webSocketConnectionEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('connection:established'),
    data: z.object({
      connectionId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('subscription:confirmed'),
    data: z.object({
      eventType: z.string(),
    }),
  }),
  z.object({
    type: z.literal('subscription:removed'),
    data: z.object({
      eventType: z.string(),
    }),
  }),
  z.object({
    type: z.literal('pong'),
    data: z.object({
      timestamp: z.string(),
    }),
  }),
]);

// Combined schema for all server-to-client messages
export const webSocketServerMessageSchema = z.union([
  webSocketServerEventSchema,
  webSocketConnectionEventSchema,
]);

// ============================================================================
// WEBSOCKET HEALTH CHECK SCHEMAS
// ============================================================================

export const webSocketHealthResponseSchema = z.object({
  status: z.literal('healthy'),
  connections: z.number(),
  subscriptions: z.record(z.string(), z.number()),
});

```

`usersdotfun/packages/shared-types/src/schemas/auth.ts`:

```ts
import { z } from "zod";

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export const jwtPayloadSchema = z.object({
  id: z.string(),
  isAnonymous: z.boolean(),
  role: z.enum(UserRole),
  banned: z.boolean().optional(),
  iat: z.number(),
  exp: z.number(),
});

export const authenticatedContextSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    role: z.enum(UserRole),
    isAnonymous: z.boolean().optional(),
    banned: z.boolean().optional(),
  }),
  session: z.object({
    id: z.string(),
    userId: z.string(),
    expiresAt: z.date(),
    token: z.string(),
  }),
});

```

`usersdotfun/packages/shared-types/src/schemas/index.ts`:

```ts
export * from './jobs';
export * from './queues';
export * from './auth';
export * from './websocket';
export * from './api';

```

`usersdotfun/packages/shared-types/src/schemas/jobs.ts`:

```ts
import { z } from "zod";
import { CronExpressionParser } from "cron-parser";
import { queueStatusSchema } from './queues';

// ============================================================================
// PIPELINE & JOB SCHEMAS
// ============================================================================

// Pipeline step schema for database storage
export const pipelineStepSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  stepId: z.string(),
  pluginName: z.string(),
  config: z.any().nullable(),
  input: z.any().nullable(),
  output: z.any().nullable(),
  error: z.any().nullable(),
  status: z.string(),
  startedAt: z.preprocess(
    (arg) => (arg instanceof Date ? arg.toISOString() : arg),
    z.iso.datetime({ message: "Invalid datetime format" }).nullable()
  ),
  completedAt: z.preprocess(
    (arg) => (arg instanceof Date ? arg.toISOString() : arg),
    z.iso.datetime({ message: "Invalid datetime format" }).nullable()
  ),
});

// Pipeline schema for JobDefinition
export const jobDefinitionPipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  steps: z.array(pipelineStepSchema),
  env: z.object({
    secrets: z.array(z.string()),
  }).optional(),
});

// Source schema for JobDefinition
export const jobDefinitionSourceSchema = z.object({
  plugin: z.string(),
  config: z.any(),
  search: z.any(),
});

// JobDefinition schema - the primary interface for API operations
export const jobDefinitionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  schedule: z.string().refine(
    (val) => {
      try {
        CronExpressionParser.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: "Invalid cron expression" }
  ).optional(),
  source: jobDefinitionSourceSchema,
  pipeline: jobDefinitionPipelineSchema,
});

// Create JobDefinition schema (without id)
export const createJobDefinitionSchema = jobDefinitionSchema.omit({ id: true }).extend({
  pipeline: z.object({
    id: z.string(),
    name: z.string(),
    steps: z.array(
      pipelineStepSchema.omit({
        id: true,
        jobId: true,
        status: true,
        input: true,
        output: true,
        error: true,
        startedAt: true,
        completedAt: true,
      })
    ),
    env: z.object({
      secrets: z.array(z.string()),
    }).optional(),
  }),
});

// Update JobDefinition schema (partial)
export const updateJobDefinitionSchema = createJobDefinitionSchema.partial();

// Job schema for API operations (non-database specific)
export const jobSchema = z.object({
  id: z.string(),
  name: z.string(),
  schedule: z.string().nullable(),
  status: z.string(),
  sourcePlugin: z.string(),
  sourceConfig: z.any().nullable(),
  sourceSearch: z.any().nullable(),
  pipeline: z.any().nullable(),
  createdAt: z.preprocess(
    (arg) => (arg instanceof Date ? arg.toISOString() : arg),
    z.iso.datetime({ message: "Invalid datetime format" })
  ),
  updatedAt: z.preprocess(
    (arg) => (arg instanceof Date ? arg.toISOString() : arg),
    z.iso.datetime({ message: "Invalid datetime format" })
  ),
});

export const jobRunInfoSchema = z.object({
  runId: z.string(),
  status: z.string(),
  startedAt: z.preprocess(
    (arg) => (arg instanceof Date ? arg.toISOString() : arg),
    z.iso.datetime({ message: "Invalid datetime format" })
  ),
  completedAt: z.preprocess(
    (arg) => (arg instanceof Date ? arg.toISOString() : arg),
    z.iso.datetime({ message: "Invalid datetime format" }).optional()
  ),
  itemsProcessed: z.number(),
  itemsTotal: z.number(),
  state: z.any().optional(),
});

export const jobStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.any(),
  progress: z.number(),
  attemptsMade: z.number(),
  timestamp: z.number(),
  processedOn: z.number().optional(),
  finishedOn: z.number().optional(),
  failedReason: z.string().optional(),
  returnvalue: z.any().optional(),
});

export const jobStatusSummarySchema = z.object({
  status: z.string(),
  queuePosition: z.number().optional(),
  estimatedStartTime: z.date().optional(),
  currentRun: jobRunInfoSchema.optional(),
});

export const jobRunDetailsSchema = z.object({
  run: jobRunInfoSchema,
  pipelineItems: z.array(pipelineStepSchema),
});

export const jobMonitoringDataSchema = z.object({
  job: jobSchema,
  currentState: z.any().optional(),
  queueStatus: z.object({
    sourceQueue: z.lazy(() => queueStatusSchema),
    pipelineQueue: z.lazy(() => queueStatusSchema),
  }),
  activeJobs: z.object({
    sourceJobs: z.array(jobStatusSchema),
    pipelineJobs: z.array(jobStatusSchema),
  }),
  recentRuns: z.array(jobRunInfoSchema),
  pipelineSteps: z.array(pipelineStepSchema),
});

export const jobWithStepsSchema = jobSchema.extend({
  steps: z.array(pipelineStepSchema),
});

```

`usersdotfun/packages/shared-types/src/schemas/queues.ts`:

```ts
import { z } from "zod";

// ============================================================================
// QUEUE MANAGEMENT ENUMS
// ============================================================================

export const jobStatusEnum = z.enum([
  'active',
  'waiting',
  'completed',
  'failed',
  'delayed',
  'scheduled'
]);

export const queueStatusEnum = z.enum(['active', 'paused']);

export const jobTypeEnum = z.enum([
  'completed',
  'failed',
  'all'
]);

// ============================================================================
// QUEUE MANAGEMENT SCHEMAS
// ============================================================================

export const queueStatusSchema = z.object({
  name: z.string(),
  waiting: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
  delayed: z.number(),
  paused: z.boolean(),
});

export const queueOverviewSchema = z.object({
  name: z.string(),
  status: queueStatusEnum,
  waiting: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
  delayed: z.number(),
});

export const queueItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.any(),
  progress: z.number(),
  attemptsMade: z.number(),
  timestamp: z.number(),
  processedOn: z.number().optional(),
  finishedOn: z.number().optional(),
  failedReason: z.string().optional(),
  delay: z.number().optional(),
  priority: z.number().optional(),
  jobId: z.string().optional(),
});

export const queueDetailsSchema = queueOverviewSchema.extend({
  items: z.object({
    waiting: z.array(queueItemSchema),
    active: z.array(queueItemSchema),
    failed: z.array(queueItemSchema),
    delayed: z.array(queueItemSchema),
  }),
  performance: z.object({
    processingRate: z.number(),
    averageProcessTime: z.number(),
    errorRate: z.number(),
  }),
});

export const queueActionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  itemsRemoved: z.number().optional(),
});
```

`usersdotfun/packages/shared-types/src/schemas/websocket.ts`:

```ts
import { z } from "zod";
import { jobMonitoringDataSchema, pipelineStepSchema, jobRunInfoSchema, jobSchema } from './jobs';
import { queueStatusSchema, queueOverviewSchema, queueItemSchema } from './queues';

// ============================================================================
// WEBSOCKET EVENT SCHEMAS
// ============================================================================

export const webSocketEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('job:status-changed'),
    data: z.object({
      job: jobSchema,
      timestamp: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal('job:progress'),
    data: z.object({
      jobId: z.string(),
      progress: z.number(),
      currentStep: z.string().optional(),
      runId: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('job:monitoring-update'),
    data: jobMonitoringDataSchema,
  }),
  z.object({
    type: z.literal('queue:status-update'),
    data: z.object({
      sourceQueue: queueStatusSchema,
      pipelineQueue: queueStatusSchema,
    }),
  }),
  z.object({
    type: z.literal('pipeline:step-completed'),
    data: z.object({
      jobId: z.string(),
      runId: z.string(),
      step: pipelineStepSchema,
    }),
  }),
  z.object({
    type: z.literal('pipeline:step-failed'),
    data: z.object({
      jobId: z.string(),
      runId: z.string(),
      stepId: z.string(),
      error: z.string(),
      timestamp: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal('job:run-started'),
    data: z.object({
      jobId: z.string(),
      run: jobRunInfoSchema,
    }),
  }),
  z.object({
    type: z.literal('job:run-completed'),
    data: z.object({
      jobId: z.string(),
      run: jobRunInfoSchema,
    }),
  }),
  z.object({
    type: z.literal('queue:status-changed'),
    data: z.object({
      queueName: z.string(),
      overview: queueOverviewSchema,
    }),
  }),
  z.object({
    type: z.literal('queue:item-added'),
    data: z.object({
      queueName: z.string(),
      item: queueItemSchema,
    }),
  }),
  z.object({
    type: z.literal('queue:item-completed'),
    data: z.object({
      queueName: z.string(),
      itemId: z.string(),
      result: z.any().optional(),
    }),
  }),
  z.object({
    type: z.literal('queue:item-failed'),
    data: z.object({
      queueName: z.string(),
      itemId: z.string(),
      error: z.string(),
    }),
  }),
  z.object({
    type: z.literal('queue:paused'),
    data: z.object({
      queueName: z.string(),
      timestamp: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:resumed'),
    data: z.object({
      queueName: z.string(),
      timestamp: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:cleared'),
    data: z.object({
      queueName: z.string(),
      itemsRemoved: z.number(),
      timestamp: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal('job:deleted'),
    data: z.object({
      jobId: z.string(),
      queueName: z.string().optional(),
      timestamp: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:item-removed'),
    data: z.object({
      queueName: z.string(),
      itemId: z.string(),
      jobId: z.string().optional(),
      timestamp: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:job-removed'),
    data: z.object({
      queueName: z.string(),
      jobId: z.string(),
      timestamp: z.iso.datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:job-retried'),
    data: z.object({
      queueName: z.string(),
      job: jobSchema,
      timestamp: z.iso.datetime(),
    }),
  }),
]);

```

`usersdotfun/packages/shared-types/src/types/api/common.ts`:

```ts
import { z } from "zod";
import {
  ApiResponseBaseSchema,
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
  SimpleMessageDataSchema,
  QueryOptionsSchema,
  PaginatedDataSchema,
  IdParamSchema,
  StatusQuerySchema,
  LimitQuerySchema,
} from '../../schemas/api/common';

// ============================================================================
// COMMON API TYPES
// ============================================================================

export type ApiResponseBase = z.infer<typeof ApiResponseBaseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type SimpleMessageData = z.infer<typeof SimpleMessageDataSchema>;

// ============================================================================
// GENERIC API SUCCESS RESPONSE TYPE
// ============================================================================

export type ApiSuccessResponse<T> = Omit<ApiResponseBase, "message"> & {
  success: true;
  data?: T;
};

// ============================================================================
// COMMON QUERY TYPES
// ============================================================================

export type BaseStringQueryOptions = z.infer<typeof QueryOptionsSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type StatusQuery = z.infer<typeof StatusQuerySchema>;
export type LimitQuery = z.infer<typeof LimitQuerySchema>;

// ============================================================================
// PAGINATED DATA TYPE
// ============================================================================

export type PaginatedData<T> = z.infer<
  ReturnType<typeof PaginatedDataSchema<z.ZodType<T>>>
>;

```

`usersdotfun/packages/shared-types/src/types/api/index.ts`:

```ts
// ============================================================================
// API TYPES INDEX
// Re-export all API-related types
// ============================================================================

export * from './common';
export * from './jobs';
export * from './queues';
export * from './websocket';

```

`usersdotfun/packages/shared-types/src/types/api/jobs.ts`:

```ts
import { z } from "zod";
import {
  CleanupOrphanedJobsResponseSchema,
  CreateJobDefinitionRequestSchema,
  CreateJobDefinitionResponseSchema,
  CreateJobRequestSchema,
  CreateJobResponseSchema,
  DeleteJobResponseSchema,
  GetJobMonitoringResponseSchema,
  GetJobResponseSchema,
  GetJobRunDetailsResponseSchema,
  GetJobRunsResponseSchema,
  GetJobsResponseSchema,
  GetJobStatusResponseSchema,
  JobIdParamSchema,
  JobRunParamsSchema,
  JobsApiErrorResponseSchema,
  JobsListQuerySchema,
  JobStepParamsSchema,
  RetryJobResponseSchema,
  RetryJobStepResponseSchema,
  UpdateJobRequestSchema,
  UpdateJobResponseSchema
} from '../../schemas/api/jobs';

// ============================================================================
// API PARAMETER TYPES
// ============================================================================

export type JobIdParam = z.infer<typeof JobIdParamSchema>;
export type JobStepParams = z.infer<typeof JobStepParamsSchema>;
export type JobRunParams = z.infer<typeof JobRunParamsSchema>;
export type JobsListQuery = z.infer<typeof JobsListQuerySchema>;

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
export type CreateJobDefinitionRequest = z.infer<typeof CreateJobDefinitionRequestSchema>;
export type UpdateJobRequest = z.infer<typeof UpdateJobRequestSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type GetJobsResponse = z.infer<typeof GetJobsResponseSchema>;
export type GetJobResponse = z.infer<typeof GetJobResponseSchema>;
export type CreateJobResponse = z.infer<typeof CreateJobResponseSchema>;
export type CreateJobDefinitionResponse = z.infer<typeof CreateJobDefinitionResponseSchema>;
export type UpdateJobResponse = z.infer<typeof UpdateJobResponseSchema>;
export type DeleteJobResponse = z.infer<typeof DeleteJobResponseSchema>;
export type GetJobStatusResponse = z.infer<typeof GetJobStatusResponseSchema>;
export type GetJobMonitoringResponse = z.infer<typeof GetJobMonitoringResponseSchema>;
export type GetJobRunsResponse = z.infer<typeof GetJobRunsResponseSchema>;
export type GetJobRunDetailsResponse = z.infer<typeof GetJobRunDetailsResponseSchema>;
export type RetryJobResponse = z.infer<typeof RetryJobResponseSchema>;
export type RetryJobStepResponse = z.infer<typeof RetryJobStepResponseSchema>;
export type CleanupOrphanedJobsResponse = z.infer<typeof CleanupOrphanedJobsResponseSchema>;
export type JobsApiErrorResponse = z.infer<typeof JobsApiErrorResponseSchema>;

```

`usersdotfun/packages/shared-types/src/types/api/queues.ts`:

```ts
import { z } from "zod";
import {
  QueueNameParamSchema,
  QueueJobParamsSchema,
  QueuesStatusQuerySchema,
  QueueJobsQuerySchema,
  QueueItemsQuerySchema,
  ClearQueueQuerySchema,
  QueueStatusDataSchema,
  QueueOverviewDataSchema,
  QueueDetailsDataSchema,
  QueueItemDataSchema,
  QueueActionResultDataSchema,
  QueuesOverviewDataSchema,
  AllQueueJobsDataSchema,
  QueueItemsDataSchema,
  QueueClearResultDataSchema,
  GetQueuesStatusResponseSchema,
  GetAllQueueJobsResponseSchema,
  GetQueueDetailsResponseSchema,
  GetQueueItemsResponseSchema,
  PauseQueueResponseSchema,
  ResumeQueueResponseSchema,
  ClearQueueResponseSchema,
  PurgeQueueResponseSchema,
  RemoveQueueJobResponseSchema,
  RetryQueueJobResponseSchema,
  QueuesApiErrorResponseSchema,
} from '../../schemas/api/queues';

// ============================================================================
// API PARAMETER TYPES
// ============================================================================

export type QueueNameParam = z.infer<typeof QueueNameParamSchema>;
export type QueueJobParams = z.infer<typeof QueueJobParamsSchema>;
export type QueuesStatusQuery = z.infer<typeof QueuesStatusQuerySchema>;
export type QueueJobsQuery = z.infer<typeof QueueJobsQuerySchema>;
export type QueueItemsQuery = z.infer<typeof QueueItemsQuerySchema>;
export type ClearQueueQuery = z.infer<typeof ClearQueueQuerySchema>;

// ============================================================================
// API DATA TYPES
// ============================================================================

export type QueueStatusData = z.infer<typeof QueueStatusDataSchema>;
export type QueueOverviewData = z.infer<typeof QueueOverviewDataSchema>;
export type QueueDetailsData = z.infer<typeof QueueDetailsDataSchema>;
export type QueueItemData = z.infer<typeof QueueItemDataSchema>;
export type QueueActionResultData = z.infer<typeof QueueActionResultDataSchema>;
export type QueuesOverviewData = z.infer<typeof QueuesOverviewDataSchema>;
export type AllQueueJobsData = z.infer<typeof AllQueueJobsDataSchema>;
export type QueueItemsData = z.infer<typeof QueueItemsDataSchema>;
export type QueueClearResultData = z.infer<typeof QueueClearResultDataSchema>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type GetQueuesStatusResponse = z.infer<typeof GetQueuesStatusResponseSchema>;
export type GetAllQueueJobsResponse = z.infer<typeof GetAllQueueJobsResponseSchema>;
export type GetQueueDetailsResponse = z.infer<typeof GetQueueDetailsResponseSchema>;
export type GetQueueItemsResponse = z.infer<typeof GetQueueItemsResponseSchema>;
export type PauseQueueResponse = z.infer<typeof PauseQueueResponseSchema>;
export type ResumeQueueResponse = z.infer<typeof ResumeQueueResponseSchema>;
export type ClearQueueResponse = z.infer<typeof ClearQueueResponseSchema>;
export type PurgeQueueResponse = z.infer<typeof PurgeQueueResponseSchema>;
export type RemoveQueueJobResponse = z.infer<typeof RemoveQueueJobResponseSchema>;
export type RetryQueueJobResponse = z.infer<typeof RetryQueueJobResponseSchema>;
export type QueuesApiErrorResponse = z.infer<typeof QueuesApiErrorResponseSchema>;

```

`usersdotfun/packages/shared-types/src/types/api/websocket.ts`:

```ts
import { z } from "zod";
import {
  webSocketCommandSchema,
  webSocketServerEventSchema,
  webSocketConnectionEventSchema,
  webSocketServerMessageSchema,
  webSocketHealthResponseSchema,
} from '../../schemas/api/websocket';

// ============================================================================
// WEBSOCKET API TYPES
// ============================================================================

export type WebSocketCommand = z.infer<typeof webSocketCommandSchema>;
export type WebSocketServerEvent = z.infer<typeof webSocketServerEventSchema>;
export type WebSocketConnectionEvent = z.infer<typeof webSocketConnectionEventSchema>;
export type WebSocketServerMessage = z.infer<typeof webSocketServerMessageSchema>;
export type WebSocketHealthResponse = z.infer<typeof webSocketHealthResponseSchema>;

// ============================================================================
// SPECIFIC COMMAND TYPES
// ============================================================================

export type SubscribeCommand = Extract<WebSocketCommand, { type: 'subscribe' }>;
export type UnsubscribeCommand = Extract<WebSocketCommand, { type: 'unsubscribe' }>;
export type PingCommand = Extract<WebSocketCommand, { type: 'ping' }>;

// ============================================================================
// SPECIFIC CONNECTION EVENT TYPES
// ============================================================================

export type ConnectionEstablishedEvent = Extract<WebSocketConnectionEvent, { type: 'connection:established' }>;
export type SubscriptionConfirmedEvent = Extract<WebSocketConnectionEvent, { type: 'subscription:confirmed' }>;
export type SubscriptionRemovedEvent = Extract<WebSocketConnectionEvent, { type: 'subscription:removed' }>;
export type PongEvent = Extract<WebSocketConnectionEvent, { type: 'pong' }>;

```

`usersdotfun/packages/shared-types/src/types/auth.ts`:

```ts
import { z } from "zod";
import {
  jwtPayloadSchema,
  authenticatedContextSchema,
  UserRole,
} from '../schemas/auth';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export { UserRole };

export type JWTPayload = z.infer<typeof jwtPayloadSchema>;
export type AuthenticatedContext = z.infer<typeof authenticatedContextSchema>;

```

`usersdotfun/packages/shared-types/src/types/index.ts`:

```ts
// ============================================================================
// CONSOLIDATED TYPE EXPORTS
// This file serves as the single source of truth for all Zod-inferred types
// ============================================================================

// Re-export all types from individual type files
export * from './auth';
export * from './jobs';
export * from './queues';
export * from './websocket';
export * from './api';

```

`usersdotfun/packages/shared-types/src/types/jobs.ts`:

```ts
import { z } from "zod";
import {
  pipelineStepSchema,
  jobSchema,
  jobRunInfoSchema,
  jobStatusSchema,
  jobMonitoringDataSchema,
  jobWithStepsSchema,
  jobDefinitionPipelineSchema,
  jobDefinitionSourceSchema,
  jobDefinitionSchema,
  createJobDefinitionSchema,
  updateJobDefinitionSchema,
  jobStatusSummarySchema,
  jobRunDetailsSchema,
} from '../schemas/jobs';

// ============================================================================
// PIPELINE & JOB TYPES
// ============================================================================

export interface SourceJobData {
  jobId: string;
}

export interface PipelineJobData {
  jobDefinition: any;
  item: Record<string, unknown>;
  runId: string;
  jobId: string;
  itemIndex: number;
  sourceJobId: string;
}

export interface JobError {
  jobId: string;
  error: string;
  timestamp: Date;
  bullmqJobId?: string;
  attemptsMade: number;
  shouldRemoveFromQueue?: boolean;
}

export type JobDefinitionPipeline = z.infer<typeof jobDefinitionPipelineSchema>;
export type JobDefinitionSource = z.infer<typeof jobDefinitionSourceSchema>;
export type JobDefinition = z.infer<typeof jobDefinitionSchema>;
export type CreateJobDefinition = z.infer<typeof createJobDefinitionSchema>;
export type UpdateJobDefinition = z.infer<typeof updateJobDefinitionSchema>;
export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type JobRunInfo = z.infer<typeof jobRunInfoSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobStatusSummary = z.infer<typeof jobStatusSummarySchema>;
export type JobRunDetails = z.infer<typeof jobRunDetailsSchema>;
export type JobMonitoringData = z.infer<typeof jobMonitoringDataSchema>;
export type JobWithSteps = z.infer<typeof jobWithStepsSchema>;

export type Job = z.infer<typeof jobSchema>;

```

`usersdotfun/packages/shared-types/src/types/queues.ts`:

```ts
import { z } from "zod";
import {
  jobStatusEnum,
  queueStatusEnum,
  jobTypeEnum,
  queueStatusSchema,
  queueOverviewSchema,
  queueItemSchema,
  queueDetailsSchema,
  queueActionResultSchema,
} from '../schemas/queues';

// ============================================================================
// QUEUE MANAGEMENT ENUMS
// ============================================================================

export type JobStatusType = z.infer<typeof jobStatusEnum>;
export type QueueStatusType = z.infer<typeof queueStatusEnum>;
export type JobType = z.infer<typeof jobTypeEnum>;

// ============================================================================
// QUEUE MANAGEMENT TYPES
// ============================================================================

export type QueueStatus = z.infer<typeof queueStatusSchema>;
export type QueueOverview = z.infer<typeof queueOverviewSchema>;
export type QueueItem = z.infer<typeof queueItemSchema>;
export type QueueDetails = z.infer<typeof queueDetailsSchema>;
export type QueueActionResult = z.infer<typeof queueActionResultSchema>;

```

`usersdotfun/packages/shared-types/src/types/websocket.ts`:

```ts
import { z } from "zod";
import { webSocketEventSchema } from '../schemas/websocket';

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

export type WebSocketEvent = z.infer<typeof webSocketEventSchema>;

```

`usersdotfun/packages/shared-types/tsconfig.json`:

```json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "allowJs": true,
    "composite": true,

    // Bundler mode
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,

    // Path mapping for better imports
    "rootDir": "src",
    "outDir": "dist",
    "baseUrl": "src",
    "paths": {
      "@/schemas/*": ["./schemas/*"],
      "@/types/*": ["./types/*"],
      "@/utils/*": ["./utils/*"]
    },

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}

```