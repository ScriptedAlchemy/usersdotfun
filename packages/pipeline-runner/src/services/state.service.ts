import type { StateService as RedisStateService } from "@usersdotfun/shared-queue";
import { Context } from 'effect';

export type StateService = RedisStateService;

export const StateServiceTag = Context.GenericTag<StateService>('StateService');
