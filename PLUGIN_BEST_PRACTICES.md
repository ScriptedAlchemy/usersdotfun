# Plugin Best Practices for Effect-Based Architecture

This document outlines best practices for developing robust, maintainable, and Effect-idiomatic plugins based on the Effect documentation and analysis of current plugin implementations.

## 1. Error Management & Type Safety

### Use Tagged Errors Instead of Generic Errors

Replace generic `Error` objects with tagged errors for better error handling and type safety:

```ts
// ❌ Avoid generic errors
return yield* Effect.fail(new PluginExecutionError('Plugin not initialized', false));

// ✅ Use tagged errors with Data.TaggedError
class PluginNotInitializedError extends Data.TaggedError("PluginNotInitializedError")<{
  readonly pluginId: string;
}> {}

class TemplateRenderingError extends Data.TaggedError("TemplateRenderingError")<{
  readonly template: string;
  readonly cause: unknown;
}> {}

class ConfigurationValidationError extends Data.TaggedError("ConfigurationValidationError")<{
  readonly field: string;
  readonly value: unknown;
  readonly reason: string;
}> {}
```

### Implement Structured Error Handling

Use `Effect.catchTag` and `Effect.catchTags` for precise error handling:

```ts
const processTemplate = (template: string, data: Record<string, unknown>) =>
  Effect.try({
    try: () => Mustache.render(template, data),
    catch: (error) => new TemplateRenderingError({ template, cause: error })
  }).pipe(
    Effect.catchTag("TemplateRenderingError", (error) => 
      Effect.logError(`Template rendering failed: ${error.template}`, error.cause).pipe(
        Effect.andThen(() => Effect.succeed("")) // Fallback to empty string
      )
    )
  );
```

### Use Effect.fn for Better Stack Traces

Wrap plugin methods with `Effect.fn` for enhanced debugging:

```ts
const processMapping = Effect.fn("processMapping")(function* (
  template: unknown,
  inputData: Record<string, unknown>
) {
  // Implementation with automatic span creation and better stack traces
  yield* Effect.annotateCurrentSpan("template", JSON.stringify(template));
  // ... rest of implementation
});
```

## 2. Resource Management

### Use acquireRelease for External Resources

When working with external resources, always use `Effect.acquireRelease`:

```ts
// ❌ Manual resource management
const processFile = (path: string) => {
  const file = fs.openSync(path, 'r');
  try {
    return processFileContent(file);
  } finally {
    fs.closeSync(file);
  }
};

// ✅ Effect resource management
const processFile = (path: string) =>
  Effect.acquireUseRelease(
    Effect.sync(() => fs.openSync(path, 'r')),
    (file) => Effect.sync(() => processFileContent(file)),
    (file) => Effect.sync(() => fs.closeSync(file))
  );
```

### Use Scoped Resources for Lifecycle Management

For resources that need lifecycle management:

```ts
const createTemporaryResource = Effect.gen(function* () {
  const resource = yield* Effect.acquireRelease(
    Effect.sync(() => createResource()),
    (resource) => Effect.sync(() => cleanupResource(resource))
  );
  
  yield* Effect.addFinalizer(() => 
    Effect.logInfo("Resource cleanup completed")
  );
  
  return resource;
});

// Use with Effect.scoped
const useResource = Effect.scoped(
  Effect.gen(function* () {
    const resource = yield* createTemporaryResource;
    return yield* processWithResource(resource);
  })
);
```

## 3. Service-Oriented Architecture

### Define Services for Dependencies

Create proper service abstractions instead of direct dependencies:

```ts
// ✅ Define services for testability and modularity
class TemplateService extends Effect.Service<TemplateService>()("TemplateService", {
  effect: Effect.gen(function* () {
    return {
      render: (template: string, data: Record<string, unknown>) =>
        Effect.try({
          try: () => Mustache.render(template, data),
          catch: (error) => new TemplateRenderingError({ template, cause: error })
        }),
      
      injectDefaults: (data: Record<string, unknown>) =>
        Effect.succeed({
          ...data,
          timestamp: Date.now(),
          date: format(new Date(), "yyyy-MM-dd")
        })
    };
  })
}) {}

class DateTimeService extends Effect.Service<DateTimeService>()("DateTimeService", {
  effect: Effect.gen(function* () {
    return {
      formatDate: (date: Date, formatStr: string) =>
        Effect.try({
          try: () => format(date, formatStr),
          catch: (error) => new DateFormattingError({ formatStr, cause: error })
        }),
      
      getCurrentTimestamp: () => Effect.sync(() => Date.now()),
      
      getCurrentDate: (formatStr = "yyyy-MM-dd") =>
        Effect.sync(() => format(new Date(), formatStr))
    };
  })
}) {}
```

### Use Effect.Service for Plugin Architecture

```ts
export class ObjectTransformerPlugin extends Effect.Service<ObjectTransformerPlugin>()(
  "ObjectTransformerPlugin", 
  {
    dependencies: [TemplateService.Default, DateTimeService.Default],
    effect: Effect.gen(function* () {
      const templateService = yield* TemplateService;
      const dateTimeService = yield* DateTimeService;
      
      return {
        initialize: (config: ObjectTransformerConfig) =>
          Effect.gen(function* () {
            yield* Effect.logInfo("Initializing plugin", { config });
            // Validate config using Schema
            yield* Schema.validateEffect(ObjectTransformerConfigSchema)(config);
          }),
        
        execute: (input: ObjectTransformerInput) =>
          Effect.gen(function* () {
            // Implementation using services
            const enhancedInput = yield* templateService.injectDefaults(input);
            return yield* processTransformation(enhancedInput);
          })
      };
    })
  }
) {}
```

## 4. Configuration Management

### Use Effect Config System

Leverage Effect's built-in configuration management:

```ts
const PluginConfig = {
  maxConcurrency: Config.integer("PLUGIN_MAX_CONCURRENCY").pipe(
    Config.withDefault(10)
  ),
  templateTimeout: Config.duration("TEMPLATE_TIMEOUT").pipe(
    Config.withDefault("30 seconds")
  ),
  enableDebugLogging: Config.boolean("PLUGIN_DEBUG").pipe(
    Config.withDefault(false)
  ),
  retryAttempts: Config.integer("PLUGIN_RETRY_ATTEMPTS").pipe(
    Config.withDefault(3)
  )
};

const loadConfig = Effect.all(PluginConfig);
```

### Use Schema for Configuration Validation

Enhance configuration with proper validation and error messages:

```ts
const ConfigSchema = Schema.Struct({
  variables: Schema.optional(
    Schema.Struct({
      mappings: Schema.Record({
        key: Schema.String,
        value: Schema.Unknown
      }).pipe(
        Schema.filter(
          (mappings) => Object.keys(mappings).length > 0,
          { message: "At least one mapping must be defined" }
        )
      )
    })
  ),
  concurrency: Schema.Number.pipe(
    Schema.positive(),
    Schema.int(),
    Schema.between(1, 100)
  ).annotations({
    title: "Concurrency Level",
    description: "Maximum number of concurrent operations"
  }),
  timeout: Schema.String.pipe(
    Schema.pattern(/^\d+\s*(ms|s|m|h)$/),
    Schema.transform(Schema.String, Schema.Duration, {
      strict: true,
      decode: (s) => Duration.decode(s),
      encode: (d) => Duration.format(d)
    })
  ).annotations({
    title: "Operation Timeout",
    description: "Maximum time to wait for operations"
  })
});
```

## 5. Concurrency & Performance

### Use Proper Concurrency Controls

Leverage Effect's concurrency features for better performance:

```ts
const processMultipleInputs = (inputs: Array<ObjectTransformerInput>) =>
  Effect.forEach(
    inputs,
    (input) => execute(input),
    { concurrency: 5 } // Control concurrency level
  );

// For batching operations
const processBatch = (items: Array<unknown>) =>
  Effect.withRequestBatching(
    Effect.forEach(items, processItem, { concurrency: "unbounded" })
  );
```

### Implement Timeouts and Retries

Add resilience with timeouts and retry policies:

```ts
const processWithResilience = (input: ObjectTransformerInput) =>
  execute(input).pipe(
    Effect.timeout("30 seconds"),
    Effect.retry(
      Schedule.exponential("100 millis").pipe(
        Schedule.intersect(Schedule.recurs(3))
      )
    ),
    Effect.catchAll((error) =>
      Effect.logError("Processing failed after retries", error).pipe(
        Effect.andThen(() => Effect.succeed({ success: false, error: error.message }))
      )
    )
  );
```

## 6. Observability & Logging

### Use Structured Logging

Replace console.log with Effect's structured logging:

```ts
// ❌ Avoid console.log
console.error(`Error formatting date with format "${formatStr}":`, error);

// ✅ Use Effect logging with context
yield* Effect.logError("Date formatting failed", {
  formatStr,
  error: error.message,
  pluginId: this.id,
  timestamp: Date.now()
});
```

### Add Tracing and Spans

Use spans for better observability:

```ts
const processMapping = (template: unknown, inputData: Record<string, unknown>) =>
  Effect.gen(function* () {
    yield* Effect.annotateCurrentSpan("template.type", typeof template);
    yield* Effect.annotateCurrentSpan("input.keys", Object.keys(inputData).join(","));
    
    // Processing logic here
    
  }).pipe(Effect.withSpan("processMapping"));
```

### Use Metrics for Performance Monitoring

```ts
const templateRenderingCounter = Metric.counter("template_renderings_total", {
  description: "Total number of template renderings"
});

const templateRenderingDuration = Metric.histogram("template_rendering_duration", 
  MetricBoundaries.exponential({ start: 1, factor: 2, count: 10 })
);

const renderTemplate = (template: string, data: Record<string, unknown>) =>
  Effect.gen(function* () {
    yield* templateRenderingCounter(Effect.succeed(1));
    
    return yield* Effect.try({
      try: () => Mustache.render(template, data),
      catch: (error) => new TemplateRenderingError({ template, cause: error })
    }).pipe(
      Metric.trackDuration(templateRenderingDuration)
    );
  });
```

## 7. Testing & Validation

### Use Schema for Input/Output Validation

Always validate inputs and outputs using schemas:

```ts
const validateAndExecute = (input: unknown) =>
  Effect.gen(function* () {
    // Validate input
    const validInput = yield* Schema.decodeUnknown(ObjectTransformerInputSchema)(input);
    
    // Process
    const result = yield* execute(validInput);
    
    // Validate output
    return yield* Schema.encode(ObjectTransformerOutputSchema)(result);
  });
```

### Create Testable Plugin Architecture

Structure plugins for easy testing:

```ts
// ✅ Testable plugin with dependency injection
export const createObjectTransformerPlugin = (
  templateService: TemplateService,
  dateTimeService: DateTimeService
) => ({
  execute: (input: ObjectTransformerInput) =>
    Effect.gen(function* () {
      const enhancedInput = yield* templateService.injectDefaults(input);
      return yield* processTransformation(enhancedInput);
    })
});

// Test with mock services
const mockTemplateService = TemplateService.of({
  render: () => Effect.succeed("mocked"),
  injectDefaults: (data) => Effect.succeed({ ...data, test: true })
});

const testPlugin = createObjectTransformerPlugin(mockTemplateService, mockDateTimeService);
```

## 8. Data Transformation Best Practices

### Use Schema Transformations

For complex data transformations, use Schema's transformation capabilities:

```ts
const TransformationSchema = Schema.transform(
  Schema.Struct({
    input: Schema.String,
    template: Schema.String
  }),
  Schema.Struct({
    output: Schema.String,
    metadata: Schema.Struct({
      processedAt: Schema.DateFromSelf,
      templateUsed: Schema.String
    })
  }),
  {
    strict: true,
    decode: ({ input, template }) => ({
      output: Mustache.render(template, { input }),
      metadata: {
        processedAt: new Date(),
        templateUsed: template
      }
    }),
    encode: ({ output, metadata }) => ({
      input: output,
      template: metadata.templateUsed
    })
  }
);
```

### Handle Async Transformations Properly

For async operations, use `Schema.transformOrFail`:

```ts
const AsyncTransformationSchema = Schema.transformOrFail(
  Schema.String,
  Schema.Struct({
    result: Schema.String,
    processedAt: Schema.DateFromSelf
  }),
  {
    strict: true,
    decode: (input) =>
      Effect.gen(function* () {
        const result = yield* processAsyncOperation(input);
        return {
          result,
          processedAt: new Date()
        };
      }),
    encode: ({ result }) => Effect.succeed(result)
  }
);
```

## 9. State Management

### Use Ref for Mutable State

When plugins need to maintain state, use `Ref`:

```ts
class StatefulPlugin extends Effect.Service<StatefulPlugin>()("StatefulPlugin", {
  effect: Effect.gen(function* () {
    const state = yield* Ref.make({
      processedCount: 0,
      lastProcessedAt: Option.none<Date>()
    });
    
    return {
      execute: (input: unknown) =>
        Effect.gen(function* () {
          // Update state atomically
          yield* Ref.update(state, (current) => ({
            processedCount: current.processedCount + 1,
            lastProcessedAt: Option.some(new Date())
          }));
          
          // Process input
          return yield* processInput(input);
        }),
      
      getStats: () => Ref.get(state)
    };
  })
}) {}
```

### Use SynchronizedRef for Complex State Updates

For state updates that require effects:

```ts
const createPluginWithAsyncState = Effect.gen(function* () {
  const state = yield* SynchronizedRef.make({
    cache: new Map<string, unknown>(),
    lastUpdated: new Date()
  });
  
  return {
    updateCache: (key: string, value: unknown) =>
      SynchronizedRef.updateEffect(state, (current) =>
        Effect.gen(function* () {
          // Async validation
          yield* validateCacheEntry(key, value);
          
          return {
            cache: new Map(current.cache).set(key, value),
            lastUpdated: new Date()
          };
        })
      )
  };
});
```

## 10. Plugin Lifecycle Management

### Implement Proper Initialization

```ts
export class RobustPlugin implements Plugin<InputSchema, OutputSchema, ConfigSchema> {
  private readonly state = Effect.gen(function* () {
    const config = yield* Ref.make<Config | null>(null);
    const isInitialized = yield* Ref.make(false);
    const resources = yield* Ref.make<Array<unknown>>([]);
    
    return { config, isInitialized, resources };
  });

  initialize(config: Config): Effect.Effect<void, ConfigurationError, PluginLoggerTag> {
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      const { config: configRef, isInitialized, resources } = yield* this.state;
      
      // Validate configuration
      yield* Schema.validateEffect(this.configSchema)(config);
      
      // Initialize resources
      const initializedResources = yield* Effect.forEach(
        config.requiredResources ?? [],
        (resource) => initializeResource(resource),
        { concurrency: 3 }
      );
      
      // Update state atomically
      yield* Ref.set(configRef, config);
      yield* Ref.set(resources, initializedResources);
      yield* Ref.set(isInitialized, true);
      
      yield* logger.logInfo("Plugin initialized successfully", {
        pluginId: this.id,
        resourceCount: initializedResources.length
      });
    });
  }

  execute(input: Input): Effect.Effect<Output, PluginExecutionError, PluginLoggerTag> {
    return Effect.gen(function* () {
      const { isInitialized } = yield* this.state;
      const initialized = yield* Ref.get(isInitialized);
      
      if (!initialized) {
        return yield* Effect.fail(
          new PluginNotInitializedError({ pluginId: this.id })
        );
      }
      
      // Validate input
      const validInput = yield* Schema.decodeUnknown(this.inputSchema)(input);
      
      // Process with timeout and retry
      const result = yield* this.processInput(validInput).pipe(
        Effect.timeout("30 seconds"),
        Effect.retry(Schedule.exponential("100 millis").pipe(
          Schedule.intersect(Schedule.recurs(3))
        ))
      );
      
      // Validate output
      return yield* Schema.encode(this.outputSchema)(result);
    });
  }

  shutdown(): Effect.Effect<void, never, PluginLoggerTag> {
    return Effect.gen(function* () {
      const logger = yield* PluginLoggerTag;
      const { resources, isInitialized } = yield* this.state;
      
      // Clean up resources
      const resourceList = yield* Ref.get(resources);
      yield* Effect.forEach(
        resourceList,
        (resource) => cleanupResource(resource),
        { concurrency: "unbounded" }
      );
      
      // Reset state
      yield* Ref.set(isInitialized, false);
      yield* Ref.set(resources, []);
      
      yield* logger.logInfo("Plugin shutdown completed", { pluginId: this.id });
    });
  }
}
```

## 11. Async Operations & Effects

### Use Effect.tryPromise for Promise Integration

```ts
// ❌ Direct Promise usage
const fetchData = async (url: string) => {
  const response = await fetch(url);
  return response.json();
};

// ✅ Effect-wrapped Promise with proper error handling
const fetchData = (url: string) =>
  Effect.tryPromise({
    try: () => fetch(url).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    }),
    catch: (error) => new NetworkError({ url, cause: error })
  });
```

### Use Effect.async for Callback-Based APIs

```ts
const processWithCallback = (data: unknown) =>
  Effect.async<string, ProcessingError>((resume) => {
    processData(data, (error, result) => {
      if (error) {
        resume(Effect.fail(new ProcessingError({ cause: error })));
      } else {
        resume(Effect.succeed(result));
      }
    });
  });
```

## 12. Performance Optimization

### Use Caching Effectively

```ts
const createCachedProcessor = Effect.gen(function* () {
  const cache = yield* Cache.make({
    capacity: 100,
    timeToLive: "5 minutes",
    lookup: (key: string) => processExpensiveOperation(key)
  });
  
  return {
    process: (key: string) => cache.get(key)
  };
});
```

### Implement Batching for Bulk Operations

```ts
const BatchedProcessor = RequestResolver.makeBatched(
  (requests: ReadonlyArray<ProcessRequest>) =>
    Effect.gen(function* () {
      const results = yield* processBatch(requests.map(req => req.data));
      
      yield* Effect.forEach(requests, (request, index) =>
        Request.completeEffect(request, Effect.succeed(results[index]))
      );
    })
);
```

## 13. Memory Management

### Avoid Memory Leaks in Long-Running Plugins

```ts
const processStream = (stream: Stream<unknown>) =>
  stream.pipe(
    Stream.mapEffect((item) => processItem(item)),
    Stream.buffer({ capacity: 100 }), // Prevent unbounded buffering
    Stream.take(1000), // Limit processing
    Stream.runCollect
  );
```

### Use Weak References for Caches

```ts
const createWeakCache = Effect.gen(function* () {
  const cache = yield* Ref.make(new WeakMap<object, unknown>());
  
  return {
    get: (key: object) =>
      Effect.gen(function* () {
        const cacheMap = yield* Ref.get(cache);
        return Option.fromNullable(cacheMap.get(key));
      }),
    
    set: (key: object, value: unknown) =>
      Ref.update(cache, (cacheMap) => {
        cacheMap.set(key, value);
        return cacheMap;
      })
  };
});
```

## 14. Plugin Composition & Modularity

### Design for Composability

```ts
// ✅ Composable plugin design
const createComposablePlugin = <A, B, C>(
  inputProcessor: (input: A) => Effect.Effect<B>,
  outputProcessor: (processed: B) => Effect.Effect<C>
) =>
  Effect.gen(function* () {
    return {
      execute: (input: A) =>
        Effect.gen(function* () {
          const processed = yield* inputProcessor(input);
          return yield* outputProcessor(processed);
        })
    };
  });

// Compose multiple processors
const complexPlugin = createComposablePlugin(
  validateInput,
  Effect.andThen(transformData),
  Effect.andThen(formatOutput)
);
```

### Use Layers for Plugin Dependencies

```ts
const PluginLayer = Layer.effect(
  ObjectTransformerPlugin,
  Effect.gen(function* () {
    const templateService = yield* TemplateService;
    const dateTimeService = yield* DateTimeService;
    const config = yield* loadConfig;
    
    return new ObjectTransformerPlugin(templateService, dateTimeService, config);
  })
).pipe(
  Layer.provide(TemplateService.Default),
  Layer.provide(DateTimeService.Default)
);
```

## 15. Error Recovery & Fallbacks

### Implement Graceful Degradation

```ts
const processWithFallback = (input: Input) =>
  primaryProcessor(input).pipe(
    Effect.orElse(() => 
      Effect.logWarning("Primary processor failed, using fallback").pipe(
        Effect.andThen(() => fallbackProcessor(input))
      )
    ),
    Effect.orElse(() =>
      Effect.logError("All processors failed, returning default").pipe(
        Effect.andThen(() => Effect.succeed(defaultOutput))
      )
    )
  );
```

### Use Circuit Breakers for External Dependencies

```ts
const createCircuitBreaker = Effect.gen(function* () {
  const failures = yield* Ref.make(0);
  const lastFailure = yield* Ref.make<Option<Date>>(Option.none());
  
  return {
    execute: <A>(effect: Effect.Effect<A>) =>
      Effect.gen(function* () {
        const failureCount = yield* Ref.get(failures);
        const lastFail = yield* Ref.get(lastFailure);
        
        // Check if circuit is open
        if (failureCount >= 5 && Option.isSome(lastFail)) {
          const timeSinceLastFailure = Date.now() - lastFail.value.getTime();
          if (timeSinceLastFailure < 60000) { // 1 minute
            return yield* Effect.fail(new CircuitBreakerOpenError());
          }
        }
        
        return yield* effect.pipe(
          Effect.tapError(() => 
            Ref.update(failures, n => n + 1).pipe(
              Effect.andThen(() => Ref.set(lastFailure, Option.some(new Date())))
            )
          ),
          Effect.tap(() => Ref.set(failures, 0)) // Reset on success
        );
      })
  };
});
```

## 16. Documentation & Annotations

### Use Rich Schema Annotations

```ts
const PluginConfigSchema = Schema.Struct({
  mappings: Schema.Record({
    key: Schema.String,
    value: Schema.Unknown
  }).annotations({
    title: "Template Mappings",
    description: "Key-value pairs for template transformations",
    examples: [
      { "user.name": "{{firstName}} {{lastName}}" },
      { "timestamp": "{{timestamp}}" }
    ]
  }),
  
  concurrency: Schema.Number.pipe(
    Schema.positive(),
    Schema.int()
  ).annotations({
    title: "Concurrency Level",
    description: "Maximum number of concurrent operations",
    default: 5,
    examples: [1, 5, 10]
  })
}).annotations({
  identifier: "PluginConfig",
  title: "Plugin Configuration",
  description: "Configuration schema for the object transformer plugin"
});
```

### Document Plugin Capabilities

```ts
export const PluginMetadata = {
  id: "@usersdotfun/object-transform",
  name: "Object Transformer",
  description: "Transforms objects using Mustache templates with built-in date/time helpers",
  version: "1.0.0",
  capabilities: [
    "Template-based object transformation",
    "Built-in date/time formatting",
    "Nested object processing",
    "Array handling and flattening"
  ],
  examples: [
    {
      input: { name: "John", age: 30 },
      config: { mappings: { greeting: "Hello {{name}}, you are {{age}} years old" } },
      output: { greeting: "Hello John, you are 30 years old" }
    }
  ]
} as const;
```

## 17. Plugin Interface Improvements

### Enhanced Plugin Interface

```ts
interface EnhancedPlugin<I, O, C> extends Plugin<I, O, C> {
  readonly metadata: PluginMetadata;
  readonly health: Effect.Effect<HealthStatus>;
  readonly metrics: Effect.Effect<PluginMetrics>;
  
  // Lifecycle hooks
  readonly onBeforeExecute?: (input: I) => Effect.Effect<void>;
  readonly onAfterExecute?: (output: O) => Effect.Effect<void>;
  readonly onError?: (error: unknown) => Effect.Effect<void>;
}

interface PluginMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly capabilities: ReadonlyArray<string>;
  readonly examples: ReadonlyArray<unknown>;
}

interface HealthStatus {
  readonly status: "healthy" | "degraded" | "unhealthy";
  readonly lastCheck: Date;
  readonly details?: Record<string, unknown>;
}

interface PluginMetrics {
  readonly executionCount: number;
  readonly errorCount: number;
  readonly averageExecutionTime: number;
  readonly lastExecutionTime?: Date;
}
```

## 18. Current Plugin Issues & Improvements

### Issues in Current Object Transform Plugin

1. **Direct console.error usage** instead of Effect logging
2. **Manual state management** instead of Ref/SynchronizedRef
3. **Generic error handling** instead of tagged errors
4. **No resource cleanup** in shutdown method
5. **Missing timeout and retry logic**
6. **No metrics or observability**
7. **Synchronous template processing** without proper error boundaries

### Recommended Refactoring

```ts
export class ImprovedObjectTransformerPlugin 
  extends Effect.Service<ImprovedObjectTransformerPlugin>()(
    "ObjectTransformerPlugin",
    {
      dependencies: [TemplateService.Default, DateTimeService.Default],
      effect: Effect.gen(function* () {
        const templateService = yield* TemplateService;
        const dateTimeService = yield* DateTimeService;
        const state = yield* Ref.make<PluginState>({
          config: Option.none(),
          isInitialized: false,
          metrics: {
            executionCount: 0,
            errorCount: 0,
            totalExecutionTime: 0
          }
        });

        return {
          initialize: (config: ObjectTransformerConfig) =>
            Effect.gen(function* () {
              yield* Effect.logInfo("Initializing Object Transformer Plugin");
              
              // Validate configuration
              const validConfig = yield* Schema.decodeUnknown(ObjectTransformerConfigSchema)(config);
              
              // Update state
              yield* Ref.update(state, (current) => ({
                ...current,
                config: Option.some(validConfig),
                isInitialized: true
              }));
              
              yield* Effect.logInfo("Plugin initialized successfully");
            }).pipe(
              Effect.catchAll((error) =>
                Effect.logError("Plugin initialization failed", error).pipe(
                  Effect.andThen(() => Effect.fail(
                    new PluginInitializationError({ pluginId: this.id, cause: error })
                  ))
                )
              )
            ),

          execute: (input: ObjectTransformerInput) =>
            Effect.gen(function* () {
              const startTime = yield* Effect.sync(() => Date.now());
              
              // Check initialization
              const currentState = yield* Ref.get(state);
              if (!currentState.isInitialized || Option.isNone(currentState.config)) {
                return yield* Effect.fail(
                  new PluginNotInitializedError({ pluginId: this.id })
                );
              }
              
              const config = currentState.config.value;
              
              // Validate input
              const validInput = yield* Schema.decodeUnknown(this.inputSchema)(input);
              
              // Process with services
              const enhancedInput = yield* templateService.injectDefaults(validInput);
              const result = yield* this.processTransformation(enhancedInput, config).pipe(
                Effect.timeout("30 seconds"),
                Effect.withSpan("object-transformation")
              );
              
              // Update metrics
              const endTime = yield* Effect.sync(() => Date.now());
              yield* Ref.update(state, (current) => ({
                ...current,
                metrics: {
                  ...current.metrics,
                  executionCount: current.metrics.executionCount + 1,
                  totalExecutionTime: current.metrics.totalExecutionTime + (endTime - startTime)
                }
              }));
              
              return result;
            }).pipe(
              Effect.catchAll((error) =>
                Effect.gen(function* () {
                  yield* Ref.update(state, (current) => ({
                    ...current,
                    metrics: {
                      ...current.metrics,
                      errorCount: current.metrics.errorCount + 1
                    }
                  }));
                  
                  yield* Effect.logError("Plugin execution failed", error);
                  return yield* Effect.fail(error);
                })
              )
            ),

          getMetrics: () =>
            Effect.gen(function* () {
              const currentState = yield* Ref.get(state);
              return currentState.metrics;
            }),

          getHealth: () =>
            Effect.gen(function* () {
              const currentState = yield* Ref.get(state);
              const errorRate = currentState.metrics.executionCount > 0 
                ? currentState.metrics.errorCount / currentState.metrics.executionCount 
                : 0;
              
              return {
                status: errorRate > 0.1 ? "degraded" : "healthy",
                lastCheck: new Date(),
                details: {
                  initialized: currentState.isInitialized,
                  errorRate,
                  totalExecutions: currentState.metrics.executionCount
                }
              } as HealthStatus;
            })
        };
      })
    }
  ) 
  implements EnhancedPlugin<
    typeof ObjectTransformerInputSchema,
    typeof ObjectTransformerOutputSchema,
    typeof ObjectTransformerConfigSchema
  > 
{
  readonly metadata = {
    id: "@usersdotfun/object-transform",
    name: "Object Transformer",
    description: "Transforms objects using Mustache templates with built-in date/time helpers",
    version: "1.0.0",
    capabilities: [
      "Mustache template processing",
      "Built-in date/time formatting",
      "Nested object transformation",
      "Array handling and flattening",
      "Default value injection"
    ],
    examples: [
      {
        input: { user: { name: "John", age: 30 } },
        config: { 
          variables: { 
            mappings: { 
              greeting: "Hello {{user.name}}, you are {{user.age}} years old",
              timestamp: "{{timestamp}}",
              date: "{{date:yyyy-MM-dd}}"
            } 
          } 
        },
        output: { 
          greeting: "Hello John, you are 30 years old",
          timestamp: 1642694400000,
          date: "2022-01-20"
        }
      }
    ]
  } as const;
}
```

## 19. Testing Best Practices

### Use TestClock for Time-Dependent Tests

```ts
const testTimeBasedPlugin = Effect.gen(function* () {
  const plugin = yield* ObjectTransformerPlugin;
  
  // Test with controlled time
  yield* TestClock.setTime(new Date("2022-01-01T00:00:00Z"));
  
  const result = yield* plugin.execute({
    template: "Current time: {{timestamp}}"
  });
  
  // Verify timestamp matches controlled time
  assert.strictEqual(result.data.timestamp, new Date("2022-01-01T00:00:00Z").getTime());
}).pipe(Effect.provide(TestContext.TestContext));
```

### Mock External Dependencies

```ts
const MockTemplateService = TemplateService.of({
  render: (template: string, data: Record<string, unknown>) =>
    Effect.succeed(`mocked: ${template}`),
  injectDefaults: (data: Record<string, unknown>) =>
    Effect.succeed({ ...data, mocked: true })
});

const testWithMocks = Effect.gen(function* () {
  const plugin = yield* ObjectTransformerPlugin;
  const result = yield* plugin.execute({ test: "data" });
  // Assertions here
}).pipe(
  Effect.provide(MockTemplateService),
  Effect.provide(TestContext.TestContext)
);
```

## 20. Security Considerations

### Sanitize Template Inputs

```ts
const sanitizeTemplate = (template: string) =>
  Effect.gen(function* () {
    // Validate template doesn't contain dangerous patterns
    const dangerousPatterns = [
      /\{\{\s*constructor\s*\}\}/,
      /\{\{\s*__proto__\s*\}\}/,
      /\{\{\s*prototype\s*\}\}/
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(template)) {
        return yield* Effect.fail(
          new UnsafeTemplateError({ template, pattern: pattern.source })
        );
      }
    }
    
    return template;
  });
```

### Validate Data Types

```ts
const validateDataSafety = (data: Record<string, unknown>) =>
  Effect.gen(function* () {
    // Ensure no prototype pollution
    const dangerousKeys = ["__proto__", "constructor", "prototype"];
    
    for (const key of Object.keys(data)) {
      if (dangerousKeys.includes(key)) {
        return yield* Effect.fail(
          new UnsafeDataError({ key, reason: "Potentially dangerous key" })
        );
      }
    }
    
    return data;
  });
```

## Summary

These best practices ensure that plugins:

1. **Handle errors gracefully** with typed errors and structured error handling
2. **Manage resources properly** using Effect's resource management primitives
3. **Are testable and modular** through service-oriented architecture
4. **Perform well** with proper concurrency and caching strategies
5. **Are observable** with structured logging, tracing, and metrics
6. **Are resilient** with timeouts, retries, and circuit breakers
7. **Are secure** with input validation and sanitization
8. **Follow Effect idioms** for maintainable and composable code

By following these practices, plugins will be more robust, maintainable, and integrate seamlessly with the Effect ecosystem.
