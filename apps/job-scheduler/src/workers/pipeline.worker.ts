import { executePipeline } from '@usersdotfun/pipeline-runner';
import { JobService } from '@usersdotfun/shared-db';
import { QueueService, StateService, type PipelineJobData } from '@usersdotfun/shared-queue';
import { type Job } from 'bullmq';
import { Effect } from 'effect';

const processPipelineJob = (job: Job<PipelineJobData>) =>
  Effect.gen(function* () {
    const { jobDefinition, item, runId, itemIndex, sourceJobId } = job.data;
    const stateService = yield* StateService;
    const jobService = yield* JobService;

    yield* Effect.log(`Processing pipeline for item ${itemIndex} (run: ${runId}): ${JSON.stringify(item)}`);

    // Store pipeline item state
    yield* stateService.set(`pipeline-item:${runId}:${itemIndex}`, {
      runId,
      sourceJobId,
      itemIndex,
      status: 'processing',
      startedAt: new Date(),
      item,
    });

    try {
      const result = yield* executePipeline(
        jobDefinition.pipeline,
        item,
        {
          runId,
          itemIndex,
          sourceJobId,
          jobId: sourceJobId,
        }
      );

      yield* Effect.log(`Pipeline completed for item ${itemIndex} (run: ${runId}) with result: ${JSON.stringify(result)}`);

      // Update pipeline item state with success
      yield* stateService.set(`pipeline-item:${runId}:${itemIndex}`, {
        runId,
        sourceJobId,
        itemIndex,
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        item,
        result,
      });

    } catch (error) {
      yield* Effect.logError(`Pipeline failed for item ${itemIndex} (run: ${runId})`, error);

      // Update pipeline item state with failure
      yield* stateService.set(`pipeline-item:${runId}:${itemIndex}`, {
        runId,
        sourceJobId,
        itemIndex,
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
        item,
        error: error instanceof Error ? error.message : String(error),
      });

      yield* jobService.updateJob(sourceJobId, { status: 'failed' });
      return yield* Effect.fail(error);
    }
  });

export const createPipelineWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* queueService.createWorker('pipeline-jobs', (job: Job<PipelineJobData>) =>
    processPipelineJob(job)
  );
});


// {
//   "name": "open_crosspost",
//   "source": {
//     "plugin": "@curatedotfun/masa-source",
//     "config": {
//       "secrets": {
//         "apiKey": "{{MASA_API_KEY}}"
//       }
//     },
//     "search": { 
//       "type": "twitter-scraper",
//       "query": "@open_crosspost #feature",
//       "pageSize": 10
//     }
//   },
//   "pipeline": {
//     "id": "test-pipeline",
//     "name": "Simple Transform Pipeline",
//     "steps": [
//       {
//         "pluginName": "@curatedotfun/simple-transform",
//         "config": {
//           "variables": {
//             "template": "hello {{content}}"
//           }
//         },
//         "stepId": "transform-1"
//       },
//       {
//         "pluginName": "@curatedotfun/object-transform",
//         "config": {
//           "variables": {
//             "mappings": {
//               "content": "goodbye {{content}}"
//             }
//           }
//         },
//         "stepId": "transform-2"
//       },
//       {
//         "pluginName": "@curatedotfun/simple-transform",
//         "config": {
//           "variables": {
//             "template": "hello {{content}}"
//           }
//         },
//         "stepId": "transform-3"
//       }
//     ],
//     "env": {
//       "secrets": [
//         "MASA_API_KEY"
//       ]
//     }
//   }
// }