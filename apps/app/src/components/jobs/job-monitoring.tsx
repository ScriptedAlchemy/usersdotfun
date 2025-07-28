import { JobMonitoringData, JobStatus } from '@usersdotfun/shared-types';
import { StatusBadge } from './status-badge';

interface JobMonitoringProps {
  monitoringData: JobMonitoringData;
  isLoading: boolean;
}

export function JobMonitoring({ monitoringData, isLoading }: JobMonitoringProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Status */}
      <div>
        <h5 className="font-semibold mb-2">Queue Status</h5>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <h6 className="font-medium text-sm">Source Queue</h6>
            <div className="text-xs space-y-1">
              <p>Waiting: {monitoringData.queueStatus.sourceQueue.waiting}</p>
              <p>Active: {monitoringData.queueStatus.sourceQueue.active}</p>
              <p>Completed: {monitoringData.queueStatus.sourceQueue.completed}</p>
              <p>Failed: {monitoringData.queueStatus.sourceQueue.failed}</p>
              <p>Delayed: {monitoringData.queueStatus.sourceQueue.delayed}</p>
              <p>Paused: {monitoringData.queueStatus.sourceQueue.paused ? 'Yes' : 'No'}</p>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <h6 className="font-medium text-sm">Pipeline Queue</h6>
            <div className="text-xs space-y-1">
              <p>Waiting: {monitoringData.queueStatus.pipelineQueue.waiting}</p>
              <p>Active: {monitoringData.queueStatus.pipelineQueue.active}</p>
              <p>Completed: {monitoringData.queueStatus.pipelineQueue.completed}</p>
              <p>Failed: {monitoringData.queueStatus.pipelineQueue.failed}</p>
              <p>Delayed: {monitoringData.queueStatus.pipelineQueue.delayed}</p>
              <p>Paused: {monitoringData.queueStatus.pipelineQueue.paused ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Jobs */}
      {(monitoringData.activeJobs.sourceJobs.length > 0 || monitoringData.activeJobs.pipelineJobs.length > 0) && (
        <div>
          <h5 className="font-semibold mb-2">Active Jobs</h5>
          
          {monitoringData.activeJobs.sourceJobs.length > 0 && (
            <div className="mb-4">
              <h6 className="font-medium text-sm mb-2">Source Jobs</h6>
              <div className="space-y-2">
                {monitoringData.activeJobs.sourceJobs.map((job) => (
                  <ActiveJobCard key={job.id} job={job} type="source" />
                ))}
              </div>
            </div>
          )}

          {monitoringData.activeJobs.pipelineJobs.length > 0 && (
            <div>
              <h6 className="font-medium text-sm mb-2">Pipeline Jobs</h6>
              <div className="space-y-2">
                {monitoringData.activeJobs.pipelineJobs.map((job) => (
                  <ActiveJobCard key={job.id} job={job} type="pipeline" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current State */}
      {monitoringData.currentState && (
        <div>
          <h5 className="font-semibold mb-2">Current State</h5>
          <div className="bg-gray-50 p-3 rounded">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(monitoringData.currentState, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActiveJobCardProps {
  job: JobStatus;
  type: 'source' | 'pipeline';
}

function ActiveJobCard({ job, type }: ActiveJobCardProps) {
  const bgColor = type === 'source' ? 'bg-blue-50' : 'bg-green-50';
  const progressColor = type === 'source' ? 'bg-blue-600' : 'bg-green-600';

  return (
    <div className={`${bgColor} p-3 rounded`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-xs">{job.id}</span>
        <span className="text-xs">Progress: {job.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className={`${progressColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${job.progress}%` }}
        ></div>
      </div>
      <div className="text-xs space-y-1">
        <p>Name: {job.name}</p>
        <p>Attempts: {job.attemptsMade}</p>
        <p>Started: {new Date(job.timestamp).toLocaleString()}</p>
        {job.processedOn && <p>Processing: {new Date(job.processedOn).toLocaleString()}</p>}
        {job.failedReason && <p className="text-red-600">Error: {job.failedReason}</p>}
      </div>
      {job.data && (
        <details className="mt-2">
          <summary className="text-xs cursor-pointer">Job Data</summary>
          <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
            {JSON.stringify(job.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
