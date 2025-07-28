import { Context, Effect, Option } from 'effect';

export interface StateService {
  readonly set: (key: string, value: unknown, ttlSeconds?: number) => Effect.Effect<void, Error>;
  readonly get: (key: string) => Effect.Effect<Option.Option<unknown>, Error>;
  readonly delete: (key: string) => Effect.Effect<void, Error>;
}

export const StateServiceTag = Context.GenericTag<StateService>('StateService');
