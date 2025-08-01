import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retryPipelineStep } from '~/api/workflows';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { StatusBadge } from './status-badge';
import { toast } from 'sonner';
import type { PipelineStep } from '@usersdotfun/shared-types/types';
import { queryKeys } from '~/lib/query-keys';

interface StepDetailsProps {
  step: PipelineStep | {
    stepId: string;
    pluginName: string;
    status?: string;
    config?: any;
    input?: any;
    output?: any;
    error?: any;
    startedAt?: string;
    completedAt?: string;
  };
  jobId: string;
}

function JsonViewer({ data, label }: { data: any; label: string }) {
  if (!data) {
    return (
      <div className="text-gray-400 text-sm italic">
        No {label.toLowerCase()} data
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-96 whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function StepDetails({ step, jobId }: StepDetailsProps) {
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: () => {
      const stepId = 'id' in step ? step.id : undefined;
      if (!stepId) {
        throw new Error('Step ID is required for retry');
      }
      return retryPipelineStep(jobId, stepId);
    },
    onSuccess: () => {
      toast.success('Step retry initiated');
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.monitoring(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
    onError: (error) => {
      toast.error(`Failed to retry step: ${error.message}`);
    },
  });

  const hasId = 'id' in step;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">{step.stepId}</h4>
          <p className="text-xs text-gray-600">{step.pluginName}</p>
        </div>
        <div className="flex items-center gap-2">
          {step.status && <StatusBadge status={step.status} />}
          {step.status === 'failed' && hasId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => retryMutation.mutate()}
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? 'Retrying...' : 'Retry'}
            </Button>
          )}
        </div>
      </div>

      {(step.startedAt || step.completedAt) && (
        <div className="text-xs text-gray-500 space-y-1">
          {step.startedAt && (
            <p>Started: {new Date(step.startedAt).toLocaleString()}</p>
          )}
          {step.completedAt && (
            <p>Completed: {new Date(step.completedAt).toLocaleString()}</p>
          )}
        </div>
      )}

      {step.error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <h5 className="text-sm font-medium text-red-800 mb-2">Error</h5>
          <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto">
            {typeof step.error === 'string' ? step.error : JSON.stringify(step.error, null, 2)}
          </pre>
        </div>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config" className="space-y-2">
          <JsonViewer data={step.config} label="Config" />
        </TabsContent>
        
        <TabsContent value="input" className="space-y-2">
          <JsonViewer data={step.input} label="Input" />
        </TabsContent>
        
        <TabsContent value="output" className="space-y-2">
          <JsonViewer data={step.output} label="Output" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
