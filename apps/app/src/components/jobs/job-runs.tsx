import type { JobRunInfo } from '@usersdotfun/shared-types/types';
import { StatusBadge } from './status-badge';

interface JobRunsProps {
  jobRuns: JobRunInfo[];
  isLoading: boolean;
}

export function JobRuns({ jobRuns, isLoading }: JobRunsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse">Loading job runs...</div>
      </div>
    );
  }

  if (!jobRuns || jobRuns.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No job runs found
      </div>
    );
  }

  return (
    <div>
      <h5 className="font-semibold mb-2">Recent Runs</h5>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {jobRuns.slice(0, 10).map((run) => (
          <JobRunCard key={run.runId} run={run} />
        ))}
      </div>
    </div>
  );
}

interface JobRunCardProps {
  run: JobRunInfo;
}

function JobRunCard({ run }: JobRunCardProps) {
  const duration = run.completedAt 
    ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
    : null;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const progressPercentage = run.itemsTotal > 0 
    ? Math.round((run.itemsProcessed / run.itemsTotal) * 100)
    : 0;

  return (
    <div className="bg-gray-50 p-3 rounded text-xs border">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono">{run.runId.split(':').pop()}</span>
        <StatusBadge status={run.status} />
      </div>
      
      <div className="space-y-1 mb-2">
        <p>Started: {new Date(run.startedAt).toLocaleString()}</p>
        {run.completedAt && (
          <p>Completed: {new Date(run.completedAt).toLocaleString()}</p>
        )}
        {duration && (
          <p>Duration: {formatDuration(duration)}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span>Progress:</span>
          <span>{run.itemsProcessed}/{run.itemsTotal} ({progressPercentage}%)</span>
        </div>
        
        {run.itemsTotal > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
      </div>

      {run.state && (
        <details className="mt-2">
          <summary className="cursor-pointer font-medium">View State</summary>
          <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-24">
            {JSON.stringify(run.state, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
