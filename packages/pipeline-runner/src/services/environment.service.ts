import { Context, Effect, Layer, Redacted } from "effect";
import Mustache from "mustache";
import type { JSONSchemaType } from "ajv/dist/2020";
import { PluginError } from "../pipeline/errors";
import { SecretsConfigTag } from "./secrets.config";

type JsonPath = string;

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
        const stringifiedConfig = yield* Effect.try({
          try: () => JSON.stringify(config),
          catch: (error) =>
            new PluginError({
              message: `Failed to hydrate secrets: ${
                error instanceof Error ? error.message : String(error)
              }`,
              operation: "hydrate-secrets",
              pluginName: "environment-service",
              cause: error instanceof Error ? error : new Error(String(error)),
            }),
        });

        const tokens = Mustache.parse(stringifiedConfig);
        const templateVars = new Set(
          tokens
            .filter((token) => token[0] === "name")
            .map((token) => token[1])
        );

        yield* validateRequiredSecrets(
          templateVars,
          schema,
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

        const populatedConfigString = Mustache.render(stringifiedConfig, view);

        console.log("populatedConfigString", populatedConfigString);

        return yield* Effect.try({
          try: () => JSON.parse(populatedConfigString) as T,
          catch: (error) =>
            new PluginError({
              message: `Failed to hydrate secrets: ${
                error instanceof Error ? error.message : String(error)
              }`,
              operation: "hydrate-secrets",
              pluginName: "environment-service",
              cause: error instanceof Error ? error : new Error(String(error)),
            }),
        });
      }),
  };
};

// Helper function to traverse the schema and find all paths to required fields.
const getRequiredPaths = (
  schema: JSONSchemaType<any>,
  currentPath: string = "",
  paths: Set<JsonPath> = new Set()
): Set<JsonPath> => {
  if (schema.required && Array.isArray(schema.required)) {
    for (const prop of schema.required) {
      // Append the property to the current path
      const newPath = currentPath ? `${currentPath}.${prop}` : prop;
      paths.add(newPath);
    }
  }

  // Recursively check properties if they are objects
  if (schema.properties && typeof schema.properties === "object") {
    for (const key in schema.properties) {
      const propSchema = schema.properties[key] as JSONSchemaType<any>;
      if (
        propSchema &&
        (propSchema.type === "object" || propSchema.type === undefined)
      ) {
        const nextPath = currentPath ? `${currentPath}.${key}` : key;
        getRequiredPaths(propSchema, nextPath, paths);
      }
    }
  }

  // Also handle array items if they contain objects with required fields
  if (
    schema.items &&
    typeof schema.items === "object" &&
    !Array.isArray(schema.items)
  ) {
    const itemSchema = schema.items as JSONSchemaType<any>;
    if (
      itemSchema.type === "object" ||
      itemSchema.type === undefined ||
      (itemSchema.oneOf || itemSchema.anyOf || itemSchema.allOf)
    ) {
      getRequiredPaths(itemSchema, `${currentPath}`, paths);
    }
  }

  return paths;
};

// Validate that required secrets are available
const validateRequiredSecrets = (
  templateVars: Set<string>,
  schema: JSONSchemaType<any>,
  secrets: string[]
): Effect.Effect<void, PluginError> =>
  Effect.gen(function* () {
    const requiredSchemaPaths = getRequiredPaths(schema);
    const missingRequiredSecrets: string[] = [];

    // For simplicity, we'll check if any template variable is missing from secrets
    // A more sophisticated approach would map template variables to specific schema paths
    for (const templateVar of templateVars) {
      // If we have required paths and this template var might be used in a required field
      if (requiredSchemaPaths.size > 0 && !secrets.includes(templateVar)) {
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
          availableSecrets: secrets,
          templateVars: Array.from(templateVars),
          requiredPaths: Array.from(requiredSchemaPaths)
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
