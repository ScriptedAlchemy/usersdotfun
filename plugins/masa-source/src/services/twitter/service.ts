import { Effect } from 'effect';
import type { MasaSearchOptions, MasaSearchResult } from '../../types';
import { BasePollingService } from '../base-polling.service';
import { prepareTwitterArgs, TwitterOptionsSchema } from './config';
import { buildTwitterQuery } from './query-builder';

export class TwitterSearchService extends BasePollingService {
  protected getPlatformName(): string {
    return 'twitter';
  }

  protected submitJob(
    options: MasaSearchOptions,
    pageSize: number
  ): Effect.Effect<string, Error> {
    const platformArgs = prepareTwitterArgs(options);
    const validatedArgs = TwitterOptionsSchema.parse(platformArgs);
    const query = buildTwitterQuery(validatedArgs);
    return this.masaClient.submitSearchJob(
      this.getPlatformName(),
      query,
      pageSize
    );
  }

  protected getJobResults(
    jobId: string
  ): Effect.Effect<MasaSearchResult[], Error> {
    return this.masaClient.getJobResults(this.getPlatformName(), jobId);
  }
}
