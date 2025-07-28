import { Context, Effect, Option } from 'effect';

export interface StateService {
  readonly get: (jobId: string) => Effect.Effect<Option.Option<unknown>, Error>;
  readonly set: (key: string, value: unknown) => Effect.Effect<void, Error>;
  readonly delete: (key: string) => Effect.Effect<void, Error>;
  readonly getJobRun: (jobId: string, runId: string) => Effect.Effect<Option.Option<unknown>, Error>;
  readonly getJobRuns: (jobId: string) => Effect.Effect<string[], Error>;
  readonly getPipelineItem: (runId: string, itemIndex: number) => Effect.Effect<Option.Option<unknown>, Error>;
  readonly exists: (jobId: string) => Effect.Effect<boolean, Error>;
  readonly getKeys: (pattern: string) => Effect.Effect<string[], Error>;
  readonly addToRunHistory: (jobId: string, runId: string) => Effect.Effect<void, Error>;
  readonly getRunHistory: (jobId: string) => Effect.Effect<string[], Error>;
}

export const StateServiceTag = Context.GenericTag<StateService>('StateService');
