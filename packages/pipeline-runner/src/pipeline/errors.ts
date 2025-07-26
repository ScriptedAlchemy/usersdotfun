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
    | "register";
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
