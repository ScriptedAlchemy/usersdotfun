import { JobWithSteps, JobMonitoringData, PipelineStep } from '@usersdotfun/shared-types';
import { StatusBadge } from './status-badge';
import { StepDetails } from './step-details';

interface PipelineViewerProps {
  job: JobWithSteps;
  monitoringData?: JobMonitoringData;
}

export function PipelineViewer({ job, monitoringData }: PipelineViewerProps) {
  const hasDbSteps = job.steps && job.steps.length > 0;
  const hasRealtimeSteps = monitoringData?.pipelineSteps && monitoringData.pipelineSteps.length > 0;
  const hasDefinitionSteps = job.pipeline?.steps && job.pipeline.steps.length > 0;

  if (!hasDbSteps && !hasRealtimeSteps && !hasDefinitionSteps) {
    return (
      <div className="text-center text-gray-500 py-8">
        No pipeline steps found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h5 className="font-semibold mb-4">Pipeline Steps</h5>
      
      {/* Database Steps */}
      {hasDbSteps && (
        <div className="mb-6">
          <h6 className="font-medium text-sm mb-3 text-gray-700">Database Steps</h6>
          <div className="space-y-4">
            {job.steps.map((step) => (
              <StepDetails 
                key={step.id} 
                step={{
                  id: step.id,
                  stepId: step.stepId,
                  pluginName: step.pluginName,
                  status: step.status,
                  config: step.config,
                  input: step.input,
                  output: step.output,
                  error: step.error,
                  startedAt: step.startedAt || undefined,
                  completedAt: step.completedAt || undefined,
                }} 
                jobId={job.id} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Real-time Pipeline Steps from Redis */}
      {hasRealtimeSteps && (
        <div className="mb-6">
          <h6 className="font-medium text-sm mb-3 text-gray-700">
            Real-time Pipeline Items ({monitoringData!.pipelineSteps.length})
          </h6>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {monitoringData!.pipelineSteps.map((pipelineStep: any) => (
              <PipelineItemCard 
                key={`${pipelineStep.runId}-${pipelineStep.itemIndex}`} 
                pipelineStep={pipelineStep} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Definition Steps */}
      {hasDefinitionSteps && (
        <div>
          <h6 className="font-medium text-sm mb-3 text-gray-700">Pipeline Definition</h6>
          <div className="space-y-4">
            {job.pipeline.steps.map((step: any, index: number) => (
              <StepDetails 
                key={`def-${index}`} 
                step={{
                  stepId: step.stepId || `step-${index}`,
                  pluginName: step.pluginName || 'Unknown',
                  config: step.config,
                  status: 'defined'
                }} 
                jobId={job.id} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PipelineItemCardProps {
  pipelineStep: any;
}

function PipelineItemCard({ pipelineStep }: PipelineItemCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">
            Item {pipelineStep.itemIndex} - Run: {pipelineStep.runId.split(':').pop()}
          </h4>
          <p className="text-xs text-gray-600">Source Job: {pipelineStep.sourceJobId}</p>
        </div>
        <StatusBadge status={pipelineStep.status} />
      </div>
      
      {(pipelineStep.startedAt || pipelineStep.completedAt) && (
        <div className="text-xs text-gray-500 space-y-1 mb-3">
          {pipelineStep.startedAt && (
            <p>Started: {new Date(pipelineStep.startedAt).toLocaleString()}</p>
          )}
          {pipelineStep.completedAt && (
            <p>Completed: {new Date(pipelineStep.completedAt).toLocaleString()}</p>
          )}
        </div>
      )}

      {pipelineStep.error && (
        <div className="bg-red-100 border border-red-300 rounded p-2 mb-3">
          <h5 className="text-xs font-medium text-red-800 mb-1">Error</h5>
          <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto">
            {typeof pipelineStep.error === 'string' ? pipelineStep.error : JSON.stringify(pipelineStep.error, null, 2)}
          </pre>
        </div>
      )}

      <details className="mt-2">
        <summary className="text-xs cursor-pointer font-medium">View Item Data</summary>
        <div className="mt-2 space-y-2">
          <div>
            <h6 className="text-xs font-medium mb-1">Input Item:</h6>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
              {JSON.stringify(pipelineStep.item, null, 2)}
            </pre>
          </div>
          {pipelineStep.result && (
            <div>
              <h6 className="text-xs font-medium mb-1">Result:</h6>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                {JSON.stringify(pipelineStep.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
