import { Effect } from "effect";
import { spawn } from "bun";
import path from "path";
import { PluginError, type StepError } from "./errors";
import type { PipelineStep } from "./interfaces";
import { getPlugin } from "./services";
import { SchemaValidator } from "./validation";
import { type PluginState, StateExpiredError } from "@usersdotfun/core-sdk";

const EXECUTOR_PATH = path.resolve(__dirname, "plugin-executor.ts");

type SandboxOperation =
  | {
      operation: "initialize";
      pluginName: string;
      remoteUrl: string;
      config: Record<string, unknown>;
    }
  | {
      operation: "execute";
      pluginName: string;
      remoteUrl: string;
      input: Record<string, unknown>;
      state?: PluginState;
    };

const runInSandbox = <T>(
  op: SandboxOperation
): Effect.Effect<T, PluginError | StateExpiredError> =>
  Effect.tryPromise({
    try: async () => {
      const child = spawn({
        cmd: ["bun", EXECUTOR_PATH],
        env: {
            "PATH": process.env.PATH
        }, // Provide PATH for bun executable
        stdio: ["pipe", "pipe", "pipe"], // stdin, stdout, stderr
      });

      // Write operation to child's stdin
      child.stdin.write(JSON.stringify(op));
      child.stdin.end();

      const stdout = await new Response(child.stdout).text();
      const stderr = await new Response(child.stderr).text();
      const exitCode = await child.exited;

      if (exitCode !== 0) {
        try {
            const errData = JSON.parse(stderr);
            if (errData.type === 'error') {
                const cause = new Error(errData.error.message);
                cause.name = errData.error.name;
                cause.stack = errData.error.stack;
                if (cause.name === "StateExpiredError") {
                    throw new StateExpiredError(cause.message);
                }
                throw new PluginError({
                    pluginName: op.pluginName,
                    operation: op.operation,
                    message: `Plugin execution failed in sandbox: ${cause.message}`,
                    cause,
                });
            }
        } catch (e) {
            // Stderr was not valid JSON, throw a generic error
            throw new PluginError({
                pluginName: op.pluginName,
                operation: op.operation,
                message: `Sandbox process exited with non-zero code: ${exitCode}. Stderr: ${stderr}`,
            });
        }
      }
      
      if (stdout) {
        const result = JSON.parse(stdout);
        if (result.type === 'result') {
            return result.data as T;
        }
      }

      // Should not be reached if stdout or stderr has content
      throw new PluginError({
        pluginName: op.pluginName,
        operation: op.operation,
        message: "Sandbox process exited without providing a result or an error.",
      });
    },
    catch: (error) => {
      if (error instanceof PluginError || error instanceof StateExpiredError) {
        return error;
      }
      return new PluginError({
        pluginName: op.pluginName,
        operation: op.operation,
        message: "An unknown error occurred while running the plugin sandbox.",
        cause: error,
      });
    },
  });

export const executeStep = (
  step: PipelineStep,
  input: Record<string, unknown>
): Effect.Effect<Record<string, unknown>, StepError> =>
  Effect.gen(function* () {
    const pluginMeta = yield* getPlugin(step.pluginName);

    const validatedConfig = yield* SchemaValidator.validate(
      pluginMeta.configSchema,
      step.config,
      `Step "${step.stepId}" config for plugin "${step.pluginName}"`
    );

    const state = yield* runInSandbox<PluginState>({
      operation: "initialize",
      pluginName: step.pluginName,
      remoteUrl: pluginMeta.remoteUrl,
      config: validatedConfig.data as Record<string, unknown>,
    }).pipe(
      Effect.catchAll((e) => {
        if (e instanceof StateExpiredError) {
          return Effect.fail(
            new PluginError({
              pluginName: step.pluginName,
              operation: "initialize",
              message: "State expired during initialization, this should not happen.",
              cause: e,
            })
          );
        }
        return Effect.fail(e);
      })
    );

    const validatedInput = yield* SchemaValidator.validate(
      pluginMeta.inputSchema,
      input,
      `Step "${step.stepId}" input for plugin "${step.pluginName}"`
    );

    const output = yield* runInSandbox<Record<string, unknown>>({
      operation: "execute",
      pluginName: step.pluginName,
      remoteUrl: pluginMeta.remoteUrl,
      input: validatedInput.data as Record<string, unknown>,
      state: state,
    }).pipe(
      Effect.catchAll((e) => {
        if (e instanceof StateExpiredError) {
          // Here we could implement the retry logic we discussed.
          // For the POC, we'll just fail.
          return Effect.fail(
            new PluginError({
              pluginName: step.pluginName,
              operation: "execute",
              message: "State expired during execution.",
              cause: e,
            })
          );
        }
        return Effect.fail(e);
      })
    );

    const validatedOutput = yield* SchemaValidator.validate(
      pluginMeta.outputSchema,
      output,
      `Step "${step.stepId}" output for plugin "${step.pluginName}"`
    );

    if (!validatedOutput.success) {
      return yield* Effect.fail(
        new PluginError({
          pluginName: step.pluginName,
          operation: "execute",
          message: `Plugin ${step.pluginName} execution failed with validation errors.`,
          context: {
            errors: validatedOutput.errors,
          },
        })
      );
    }

    return validatedOutput.data as Record<string, unknown>;
  }).pipe(
    Effect.withSpan(`pipeline-step-${step.stepId}`, {
      attributes: {
        pluginName: step.pluginName,
        stepId: step.stepId,
      },
    })
  );
