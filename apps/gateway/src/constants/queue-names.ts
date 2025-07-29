export const QUEUE_NAMES = {
  SOURCE_JOBS: 'source-jobs',
  PIPELINE_JOBS: 'pipeline-jobs',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const VALID_QUEUE_NAMES = Object.values(QUEUE_NAMES);
