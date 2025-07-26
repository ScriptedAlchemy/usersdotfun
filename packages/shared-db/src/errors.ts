import { Context, Data } from "effect";

export class DbError extends Data.TaggedError("DbError")<{
  readonly cause: unknown;
  readonly message?: string;
}> {}
