export interface ParsedQueueJobId {
  workflowId: string;
  prefix?: string;
  timestamp?: string;
  originalId: string;
}

/**
 * Parses queue item IDs to extract the actual job ID
 * Handles formats like:
 * - "repeat:fa0c8bf1d291e15d9fe0a56a2b311968:1753735500000"
 * - "delayed:workflowId:timestamp"
 * - "workflowId" (direct job ID)
 */
export function parseQueueJobId(queueItemId: string): ParsedQueueJobId {
  // Handle repeat jobs: "repeat:workflowId:timestamp"
  const repeatMatch = queueItemId.match(/^repeat:([^:]+):(.+)$/);
  if (repeatMatch) {
    return {
      workflowId: repeatMatch[1],
      prefix: 'repeat',
      timestamp: repeatMatch[2],
      originalId: queueItemId,
    };
  }

  // Handle delayed jobs: "delayed:workflowId:timestamp"
  const delayedMatch = queueItemId.match(/^delayed:([^:]+):(.+)$/);
  if (delayedMatch) {
    return {
      workflowId: delayedMatch[1],
      prefix: 'delayed',
      timestamp: delayedMatch[2],
      originalId: queueItemId,
    };
  }

  // Handle other prefixed formats: "prefix:workflowId"
  const prefixMatch = queueItemId.match(/^([^:]+):([^:]+)$/);
  if (prefixMatch) {
    return {
      workflowId: prefixMatch[2],
      prefix: prefixMatch[1],
      originalId: queueItemId,
    };
  }

  // Direct job ID (no prefix)
  return {
    workflowId: queueItemId,
    originalId: queueItemId,
  };
}

/**
 * Formats a queue job ID for display
 */
export function formatQueueJobId(parsedId: ParsedQueueJobId): string {
  if (parsedId.prefix) {
    return `${parsedId.prefix}:${parsedId.workflowId}`;
  }
  return parsedId.workflowId;
}
