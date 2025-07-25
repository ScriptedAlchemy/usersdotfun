import type { Pipeline } from '@usersdotfun/pipeline-runner';
import { Effect } from "effect";

export interface JobDefinition {
  id: string;
  name: string;
  schedule: string; // cron string
  source: {
    plugin: string;
    config: any;
    search: any;
  };
  pipeline: Pipeline;
}

export const jobs: JobDefinition[] = [
  // This is where you would define your jobs.
  // For now, it's an empty array.
  // We will populate this later or it can be populated by the user.
];

export const getJobDefinitionById = (jobId: string): Effect.Effect<JobDefinition, Error> => {
  const job = jobs.find(j => j.id === jobId);
  if (!job) {
    return Effect.fail(new Error(`Job with id ${jobId} not found`));
  }
  return Effect.succeed(job);
}
