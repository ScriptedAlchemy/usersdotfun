import type { AsyncJobProgress, LastProcessedState } from '@usersdotfun/core-sdk';
import { Effect } from 'effect';
import type { MasaClient } from '../masa-client';
import type {
  IPlatformSearchService,
  MasaPlatformState,
  MasaSearchOptions,
  MasaSearchResult,
} from '../types';

const DEFAULT_PAGE_SIZE = 25;

export abstract class BasePollingService implements IPlatformSearchService {
  constructor(protected masaClient: MasaClient) {}

  protected abstract getPlatformName(): string;

  protected abstract submitJob(
    options: MasaSearchOptions,
    pageSize: number
  ): Effect.Effect<string, Error>;

  protected abstract getJobResults(
    jobId: string
  ): Effect.Effect<MasaSearchResult[], Error>;

  private mapMasaStatusToAsyncJobProgress(
    status: string | null
  ): AsyncJobProgress['status'] {
    if (!status) {
      return 'error';
    }
    switch (status.toLowerCase()) {
      case 'in progress':
        return 'processing';
      case 'result':
      case 'done':
      case 'completed':
        return 'done';
      case 'error':
      case 'failed':
        return 'error';
      default:
        console.warn(`Unknown Masa job status: ${status}`);
        return 'error';
    }
  }

  search(
    options: MasaSearchOptions,
    currentState: LastProcessedState<MasaPlatformState> | null
  ): Effect.Effect<{
    items: MasaSearchResult[];
    nextStateData: MasaPlatformState | null;
  }, Error> {
    const self = this;
    return Effect.gen(function* () {
      const currentAsyncJob = currentState?.data?.currentAsyncJob;
      const latestProcessedId = currentState?.data?.latestProcessedId as
        | string
        | undefined;

      if (
        currentAsyncJob &&
        currentAsyncJob.status !== 'done' &&
        currentAsyncJob.status !== 'error'
      ) {
        const jobStatus = yield* self.masaClient.checkJobStatus(
          self.getPlatformName(),
          currentAsyncJob.workflowId
        );

        const internalStatus = self.mapMasaStatusToAsyncJobProgress(jobStatus);

        if (internalStatus === 'done') {
          const items = yield* self.getJobResults(currentAsyncJob.workflowId);
          let newLatestProcessedId = latestProcessedId;
          if (items.length > 0) {
            const newestItem = items.reduce((prev, current) =>
              BigInt(current.id) > BigInt(prev.id) ? current : prev
            );
            newLatestProcessedId = newestItem.id;
          }

          const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
          if (items.length === pageSize) {
            const nextJobId = yield* self.submitJob(
              { ...options, sinceId: newLatestProcessedId },
              pageSize
            );
            const nextStateData: MasaPlatformState = {
              ...currentState?.data,
              latestProcessedId: newLatestProcessedId,
              currentAsyncJob: {
                workflowId: nextJobId,
                status: 'submitted',
                submittedAt: new Date().toISOString(),
              },
            };
            return { items, nextStateData };
          }

          const nextStateData: MasaPlatformState = {
            ...currentState?.data,
            latestProcessedId: newLatestProcessedId,
            currentAsyncJob: null,
          };
          return { items, nextStateData };
        } else if (internalStatus === 'error') {
          const nextStateData: MasaPlatformState = {
            ...currentState?.data,
            currentAsyncJob: null,
          };
          return { items: [], nextStateData };
        } else {
          const nextStateData: MasaPlatformState = {
            ...currentState?.data,
            currentAsyncJob: {
              ...currentAsyncJob,
              status: internalStatus,
              lastCheckedAt: new Date().toISOString(),
            },
          };
          return { items: [], nextStateData };
        }
      }

      const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
      const newJobId = yield* self.submitJob(options, pageSize);
      const newAsyncJob: AsyncJobProgress = {
        workflowId: newJobId,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      };
      const nextStateData: MasaPlatformState = {
        ...currentState?.data,
        latestProcessedId: latestProcessedId,
        currentAsyncJob: newAsyncJob,
      };
      return { items: [], nextStateData };
    });
  }
}
