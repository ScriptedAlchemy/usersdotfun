export interface ParsedQueueJobId {
  jobId: string;
  prefix?: string;
  timestamp?: string;
  originalId: string;
}

/**
 * Parses queue item IDs to extract the actual job ID
 * Handles formats like:
 * - "repeat:fa0c8bf1d291e15d9fe0a56a2b311968:1753735500000"
 * - "delayed:jobId:timestamp"
 * - "jobId" (direct job ID)
 */
export function parseQueueJobId(queueItemId: string): ParsedQueueJobId {
  // Handle repeat jobs: "repeat:jobId:timestamp"
  const repeatMatch = queueItemId.match(/^repeat:([^:]+):(.+)$/);
  if (repeatMatch) {
    return {
      jobId: repeatMatch[1],
      prefix: 'repeat',
      timestamp: repeatMatch[2],
      originalId: queueItemId,
    };
  }

  // Handle delayed jobs: "delayed:jobId:timestamp"
  const delayedMatch = queueItemId.match(/^delayed:([^:]+):(.+)$/);
  if (delayedMatch) {
    return {
      jobId: delayedMatch[1],
      prefix: 'delayed',
      timestamp: delayedMatch[2],
      originalId: queueItemId,
    };
  }

  // Handle other prefixed formats: "prefix:jobId"
  const prefixMatch = queueItemId.match(/^([^:]+):([^:]+)$/);
  if (prefixMatch) {
    return {
      jobId: prefixMatch[2],
      prefix: prefixMatch[1],
      originalId: queueItemId,
    };
  }

  // Direct job ID (no prefix)
  return {
    jobId: queueItemId,
    originalId: queueItemId,
  };
}

/**
 * Formats a queue job ID for display
 */
export function formatQueueJobId(parsedId: ParsedQueueJobId): string {
  if (parsedId.prefix) {
    return `${parsedId.prefix}:${parsedId.jobId}`;
  }
  return parsedId.jobId;
}
