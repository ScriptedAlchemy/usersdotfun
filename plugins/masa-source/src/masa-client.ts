import { Effect } from 'effect';
import type { MasaSearchResult } from './types';

export interface MasaApiSearchOptions {
  query: string;
  maxResults?: number;
  sinceDate?: string;
}

export interface MasaClientConfig {
  apiKey: string;
  baseUrl?: string; // Optional, with a default
}

/**
 * Client for interacting with the Masa API for social media scraping.
 */
export class MasaClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: MasaClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://data.masa.ai/api/v1";
    console.log("using the baseUrl", this.baseUrl);

    if (!this.apiKey) {
      // This should ideally be caught by config validation in the plugin
      console.warn(
        "Masa API key was not provided to MasaClient. API calls will fail.",
      );
    }
  }

  /**
   * Submit a search job to the Masa API.
   * @param searchType The type of scraper, e.g., "twitter".
   * @param query The search query.
   * @param maxResults Maximum number of results to return.
   * @returns Promise resolving to the UUID of the search job, or null on error.
   */
  public submitSearchJob(
    searchType: string,
    query: string,
    maxResults: number
  ): Effect.Effect<string, Error> {
    const url = `${this.baseUrl}/search/live/${searchType}`;
    const payload = {
      type: searchType,
      arguments: { query, max_results: maxResults },
    };

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Masa API error: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(`Masa API returned an error: ${JSON.stringify(data.error)}`);
        }
        if (!data.uuid) {
          throw new Error('Masa API did not return a UUID for the submitted job.');
        }
        return data.uuid;
      },
      catch: (error) =>
        error instanceof Error
          ? error
          : new Error('An unknown error occurred during job submission'),
    });
  }

  /**
   * Check the status of a Masa search job.
   * @param searchType The type of scraper used for the job.
   * @param uuid The UUID of the search job.
   * @returns Promise resolving to the status of the job.
   */
  public checkJobStatus(
    searchType: string,
    uuid: string
  ): Effect.Effect<string, Error> {
    const url = `${this.baseUrl}/search/live/${searchType}/status/${uuid}`;

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Masa API error: ${response.status} ${errorText}`
          );
        }
        const data = await response.json();
        if (!data.status) {
          throw new Error('Masa API did not return a status for the job.');
        }
        return data.status;
      },
      catch: (error) =>
        error instanceof Error
          ? error
          : new Error('An unknown error occurred while checking job status'),
    });
  }

  /**
   * Retrieve the results of a completed Masa search job.
   * @param searchType The type of scraper used for the job.
   * @param uuid The UUID of the search job.
   * @returns Promise resolving to an array of search results, or null on error.
   */
  public getJobResults(
    searchType: string,
    uuid: string
  ): Effect.Effect<MasaSearchResult[], Error> {
    const url = `${this.baseUrl}/search/live/${searchType}/result/${uuid}`;

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${this.apiKey}` },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Masa API error: ${response.status} ${errorText}`
          );
        }
        return await response.json();
      },
      catch: (error) =>
        error instanceof Error
          ? error
          : new Error('An unknown error occurred while fetching job results'),
    });
  }
}
