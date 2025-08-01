import type { QueueItem, JobWithSteps, JobMonitoringData, JobRunInfo } from '@usersdotfun/shared-types/types';
import { CommonSheet } from '~/components/common/common-sheet';
import { JobMonitoring } from '~/components/workflows/job-monitoring';
import { PipelineViewer } from '~/components/workflows/pipeline-viewer';
import { JobRuns } from '~/components/workflows/job-runs';
import { Badge } from '~/components/ui/badge';
import { parseQueueJobId, formatQueueJobId } from '~/lib/queue-utils';

interface QueueItemDetailsSheetProps {
  queueItem: (QueueItem & { queueName: string; status: string }) | null;
  job?: JobWithSteps | null;
  monitoringData?: JobMonitoringData;
  jobRuns?: JobRunInfo[];
  isOpen: boolean;
  isQueueItemLoading?: boolean;
  isJobLoading?: boolean;
  isMonitoringLoading?: boolean;
  isRunsLoading?: boolean;
  jobError?: any;
  monitoringError?: any;
  runsError?: any;
  onClose: () => void;
}

export function QueueItemDetailsSheet({
  queueItem,
  job,
  monitoringData,
  jobRuns,
  isOpen,
  isQueueItemLoading = false,
  isJobLoading = false,
  isMonitoringLoading = false,
  isRunsLoading = false,
  jobError,
  monitoringError,
  runsError,
  onClose,
}: QueueItemDetailsSheetProps) {
  if (!queueItem) {
    return (
      <CommonSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Queue Item Details"
        isLoading={isQueueItemLoading}
        loadingText="Loading queue item details..."
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500">Queue item not found</div>
        </div>
      </CommonSheet>
    );
  }

  const parsedId = parseQueueJobId(queueItem.id);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'delayed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <CommonSheet
      isOpen={isOpen}
      onClose={onClose}
      title={queueItem.name || formatQueueJobId(parsedId)}
      description={`Queue: ${queueItem.queueName} | Status: ${queueItem.status}`}
      isLoading={isQueueItemLoading}
      loadingText="Loading queue item details..."
    >
      {/* Queue Item Information */}
      <div>
        <h5 className="font-semibold mb-3">Queue Item Details</h5>
        <div className="bg-gray-50 p-4 rounded space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Queue Item ID</p>
              <p className="text-sm font-mono">{queueItem.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Job ID</p>
              <p className="text-sm font-mono">{parsedId.jobId}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Queue</p>
              <Badge variant="outline" className="capitalize">
                {queueItem.queueName.replace('-', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <Badge className={getStatusColor(queueItem.status)}>
                {queueItem.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${queueItem.progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{queueItem.progress}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Attempts</p>
              <p className="text-sm">{queueItem.attemptsMade}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Priority</p>
              <p className="text-sm">{queueItem.priority}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-sm">{new Date(queueItem.timestamp).toLocaleString()}</p>
            </div>
          </div>

          {queueItem.processedOn && (
            <div>
              <p className="text-sm font-medium text-gray-600">Processed On</p>
              <p className="text-sm">{new Date(queueItem.processedOn).toLocaleString()}</p>
            </div>
          )}

          {queueItem.finishedOn && (
            <div>
              <p className="text-sm font-medium text-gray-600">Finished On</p>
              <p className="text-sm">{new Date(queueItem.finishedOn).toLocaleString()}</p>
            </div>
          )}

          {queueItem.failedReason && (
            <div>
              <p className="text-sm font-medium text-gray-600">Error</p>
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                {queueItem.failedReason}
              </p>
            </div>
          )}

          {queueItem.delay && (
            <div>
              <p className="text-sm font-medium text-gray-600">Delay</p>
              <p className="text-sm">{queueItem.delay}ms</p>
            </div>
          )}

          {parsedId.prefix && (
            <div>
              <p className="text-sm font-medium text-gray-600">Type</p>
              <Badge variant="outline">{parsedId.prefix}</Badge>
            </div>
          )}

          {parsedId.timestamp && (
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled Time</p>
              <p className="text-sm">{new Date(parseInt(parsedId.timestamp)).toLocaleString()}</p>
            </div>
          )}

          {queueItem.data && (
            <div>
              <p className="text-sm font-medium text-gray-600">Data</p>
              <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-32">
                {JSON.stringify(queueItem.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Job Details (if available) */}
      {isJobLoading ? (
        <div className="flex items-center justify-center h-16">
          <div className="animate-pulse text-sm">Loading job details...</div>
        </div>
      ) : jobError?.isNotFound ? (
        <div className="bg-orange-50 border border-orange-200 rounded p-3">
          <p className="text-sm text-orange-800">
            <strong>Job Not Found:</strong> The job associated with this queue item (ID: <span className="font-mono">{parsedId.jobId}</span>) has been deleted or is no longer available.
          </p>
          <p className="text-xs text-orange-600 mt-1">
            This is normal if the job was recently deleted. The queue item will be processed based on its current state.
          </p>
        </div>
      ) : jobError ? (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800">
            <strong>Error loading job details:</strong> {jobError.message}
          </p>
        </div>
      ) : job ? (
        <>
          {/* Job Configuration */}
          <div>
            <h5 className="font-semibold mb-3">Job Configuration</h5>
            <div className="bg-gray-50 p-4 rounded space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-sm">{job.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Schedule</p>
                  <p className="text-sm font-mono">{job.schedule}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Source Plugin</p>
                <p className="text-sm">{job.sourcePlugin}</p>
              </div>

              {job.sourceConfig && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Source Config</p>
                  <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(job.sourceConfig, null, 2)}
                  </pre>
                </div>
              )}

              {job.sourceSearch && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Source Search</p>
                  <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(job.sourceSearch, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Monitoring */}
          {isMonitoringLoading ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-pulse text-sm">Loading monitoring data...</div>
            </div>
          ) : monitoringError?.isNotFound ? (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <p className="text-sm text-orange-800">
                Monitoring data not available for this job.
              </p>
            </div>
          ) : monitoringError ? (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">
                <strong>Error loading monitoring data:</strong> {monitoringError.message}
              </p>
            </div>
          ) : monitoringData ? (
            <JobMonitoring 
              monitoringData={monitoringData} 
              isLoading={isMonitoringLoading} 
            />
          ) : null}

          {/* Job Runs */}
          {isRunsLoading ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-pulse text-sm">Loading job runs...</div>
            </div>
          ) : runsError?.isNotFound ? (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <p className="text-sm text-orange-800">
                No job runs found for this job.
              </p>
            </div>
          ) : runsError ? (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">
                <strong>Error loading job runs:</strong> {runsError.message}
              </p>
            </div>
          ) : jobRuns ? (
            <JobRuns 
              jobRuns={jobRuns} 
              isLoading={isRunsLoading} 
            />
          ) : null}

          {/* Pipeline Steps */}
          <PipelineViewer 
            job={job} 
            monitoringData={monitoringData} 
          />
        </>
      ) : parsedId.jobId !== queueItem.id ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            Job details not available. This queue item references job ID: <span className="font-mono">{parsedId.jobId}</span>
          </p>
        </div>
      ) : null}
    </CommonSheet>
  );
}
