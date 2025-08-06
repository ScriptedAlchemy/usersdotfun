import type {
  AsyncJobProgress,
  LastProcessedState
} from "@usersdotfun/core-sdk";
import type { MasaApiSearchOptions, MasaClient } from "../../masa-client";
import type { IPlatformSearchService, MasaPlatformState, MasaSearchOptions, MasaSearchResult } from "../../types";
import { TwitterOptionsSchema } from "./config";
import { buildTwitterQuery } from "./query-builder";

const DEFAULT_PAGE_SIZE = 25;

export class TwitterSearchService implements IPlatformSearchService {
  private masaClient: MasaClient;

  constructor(masaClient: MasaClient) {
    this.masaClient = masaClient;
  }

  async initialize(): Promise<void> {
    console.log("TwitterSearchService initialized.");
  }

  async search(
    options: MasaSearchOptions,
    currentState: LastProcessedState<MasaPlatformState> | null,
  ): Promise<{
    items: MasaSearchResult[];
    nextStateData: MasaPlatformState | null;
  }> {
    // Validate and cast the options to Twitter-specific options
    const platformOptions = TwitterOptionsSchema.parse(options);
    console.log(
      "TwitterSearchService: search called with options:",
      platformOptions,
    );
    if (currentState) {
      console.log(
        "TwitterSearchService: current state:",
        JSON.stringify(currentState, null, 2),
      );
    }

    const currentAsyncJob = currentState?.data?.currentAsyncJob;
    const latestProcessedId = currentState?.data?.latestProcessedId as
      | string
      | undefined;

    // Process state data (async jobs)
    if (
      currentAsyncJob &&
      currentAsyncJob.status !== "done" &&
      currentAsyncJob.status !== "error" &&
      currentAsyncJob.status !== "timeout"
    ) {
      console.log(
        `TwitterSearchService: Checking status for existing job ${currentAsyncJob.workflowId}`,
      );
      const jobStatus = await this.masaClient.checkJobStatus(
        "twitter",
        currentAsyncJob.workflowId,
      );

      if (jobStatus === "done") {
        console.log(
          `TwitterSearchService: Job ${currentAsyncJob.workflowId} is done. Fetching results.`,
        );
        const results = await this.masaClient.getJobResults(
          "twitter",
          currentAsyncJob.workflowId,
        );
        const items = results || [];

        // Determine the new latestProcessedId from these items
        let newLatestProcessedId = latestProcessedId;
        if (items.length > 0) {
          // The API returns tweets from oldest to newest when using since_id.
          // We want the ID of the newest tweet to use as the since_id for the next request.
          const newestItem = items.reduce((prev, current) =>
            BigInt(current.id) > BigInt(prev.id) ? current : prev,
          );
          newLatestProcessedId = newestItem.id;
        }

        const pageSize = platformOptions.pageSize || DEFAULT_PAGE_SIZE;
        if (items.length === pageSize) {
          console.log(`TwitterSearchService: Full page of results (${items.length}). Submitting next job with sinceId: ${newLatestProcessedId}.`);
          const nextQuery = buildTwitterQuery({ ...platformOptions, sinceId: newLatestProcessedId });
          const nextJobId = await this.masaClient.submitSearchJob("twitter", nextQuery, pageSize);
          
          const nextStateData: MasaPlatformState = {
            ...currentState?.data,
            latestProcessedId: newLatestProcessedId,
            currentAsyncJob: {
              workflowId: nextJobId,
              status: "submitted",
              submittedAt: new Date().toISOString(),
            },
          };
          return { items, nextStateData };
        }

        // If not paginating, clear the job
        const nextStateData: MasaPlatformState = {
          ...currentState?.data, // Preserve other potential state fields
          latestProcessedId: newLatestProcessedId,
          currentAsyncJob: null, // Clear the completed job
        };

        console.log(
          `TwitterSearchService: Returning ${items.length} items. Next state:`,
          JSON.stringify(nextStateData, null, 2),
        );

        return { items, nextStateData };
      } else if (
        jobStatus === "error" ||
        jobStatus === "error(fetching_status)" ||
        jobStatus === null
      ) {
        console.error(
          `TwitterSearchService: Job ${currentAsyncJob.workflowId} failed or status check error.`,
        );
        // Clear the failed job so a new one can be submitted on the next polling cycle
        const nextStateData: MasaPlatformState = {
          ...currentState?.data,
          currentAsyncJob: null,
        };
        return { items: [], nextStateData };
      } else {
        // Still pending or processing
        console.log(
          `TwitterSearchService: Job ${currentAsyncJob.workflowId} status: ${jobStatus}.`,
        );
        const nextStateData: MasaPlatformState = {
          ...currentState?.data,
          currentAsyncJob: {
            ...currentAsyncJob,
            status: jobStatus as AsyncJobProgress["status"],
            lastCheckedAt: new Date().toISOString(),
          },
        };
        return { items: [], nextStateData };
      }
    }

    // No active jobs, or previous job finished/errored - Submit a new job
    console.log(
      "TwitterSearchService: No active job or previous job completed/errored. Submitting new job.",
    );

    // Use latestProcessedId as sinceId for the query builder
    const queryOptionsForBuilder = { ...platformOptions };
    if (latestProcessedId) {
      queryOptionsForBuilder.sinceId = latestProcessedId;
    }
    const query = buildTwitterQuery(queryOptionsForBuilder); // TODO: take natural language and convert correctly https://github.com/igorbrigadir/twitter-advanced-search 
    const maxResults = platformOptions.pageSize || DEFAULT_PAGE_SIZE;

    const masaApiOpts: MasaApiSearchOptions = { query, maxResults };

    const newJobId = await this.masaClient.submitSearchJob(
      "twitter",
      masaApiOpts.query,
      masaApiOpts.maxResults || DEFAULT_PAGE_SIZE,
    );

    if (newJobId) {
      console.log(
        `TwitterSearchService: New job submitted with ID: ${newJobId}`,
      );
      const newAsyncJob: AsyncJobProgress = {
        workflowId: newJobId,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };
      const nextStateData: MasaPlatformState = {
        ...currentState?.data, // Preserve other state fields like latestProcessedId from previous successful chunk
        latestProcessedId: latestProcessedId, // Carry over the ID that bounded this search
        currentAsyncJob: newAsyncJob,
      };
      return { items: [], nextStateData };
    } else {
      console.error("TwitterSearchService: Failed to submit new search job.");
      // Create a job progress state reflecting the submission error
      const errorAsyncJob: AsyncJobProgress = {
        workflowId: "submission_failed_" + Date.now(), // Placeholder ID
        status: "error",
        submittedAt: new Date().toISOString(),
        errorMessage: "Failed to submit job to Masa API",
      };
      const nextStateData: MasaPlatformState = {
        ...currentState?.data,
        latestProcessedId: latestProcessedId,
        currentAsyncJob: errorAsyncJob,
      };
      return { items: [], nextStateData };
    }
  }

  async shutdown(): Promise<void> {
    console.log("TwitterSearchService shutdown.");
  }
}
