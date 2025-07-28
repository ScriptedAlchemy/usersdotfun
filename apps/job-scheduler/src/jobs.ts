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
  {
    id: "8e5d8f9b-4cf5-4fb9-b6a3-fce362da6d96",
    name: "open_crosspost",
    schedule: "*/5 * * * *",
    source: {
      plugin: "@usersdotfun/masa-source",
      config: { "apiKey": "PNXGZ4GqWTer9FAUuW2oa2W7aNfSd2GVTkkjBDTPfh3mUQhHi6sT5busrzCZmn3c" },
      search: "@open_crosspost #feature"
    },
    pipeline: {
      "id": "test-pipeline",
      "name": "Simple Transform Pipeline",
      "steps": [
        {
          "config": {
            "variables": {
              "template": "hello {{content}}"
            }
          },
          "stepId": "transform-1",
          "pluginName": "@curatedotfun/simple-transform"
        },
        {
          "config": {
            "variables": {
              "mappings": {
                "content": "goodbye {{content}}"
              }
            }
          },
          "stepId": "transform-2",
          "pluginName": "@curatedotfun/object-transform"
        },
        {
          "config": {
            "variables": {
              "template": "hello {{content}}"
            }
          },
          "stepId": "transform-3",
          "pluginName": "@curatedotfun/simple-transform"
        }
      ]
    }
  }
];

export const getJobDefinitionById = (jobId: string): Effect.Effect<JobDefinition, Error> => {
  const job = jobs.find(j => j.id === jobId);
  if (!job) {
    return Effect.fail(new Error(`Job with id ${jobId} not found`));
  }
  return Effect.succeed(job);
}
