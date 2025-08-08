import {
  createFileRoute,
  useLoaderData,
  useNavigate,
  Link,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { CommonSheet } from "~/components/common/common-sheet";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { CodePreview } from "~/components/common/code-preview";
import { 
  workflowItemsQueryOptions,
  useItemPluginRunsQuery,
  useItemWorkflowRunsQuery,
  useRetryPluginRunMutation,
} from "~/lib/queries";
import { 
  pluginRunStatusColors, 
  workflowRunStatusColors 
} from "~/lib/status-colors";
import { toast } from "sonner";

// Type definitions
type PluginRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED" | "RETRYING";
type WorkflowRunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "PARTIAL_SUCCESS" | "CANCELLED";

interface PluginRun {
  id: string;
  stepId: string;
  pluginId: string;
  status: PluginRunStatus;
  input?: any;
  output?: any;
  config?: any;
  error?: any;
  sourceItemId?: string;
  retryCount?: string;
  workflowRunId: string;
  type?: 'SOURCE' | 'PIPELINE';
  workflowRun?: {
    id: string;
    workflowId: string;
    status: string;
    startedAt: string;
    workflow?: {
      id: string;
      name: string;
    };
  };
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  status: WorkflowRunStatus;
  startedAt: string;
  user?: {
    name: string;
  };
  workflow?: {
    id: string;
    name: string;
  };
}

export const Route = createFileRoute(
  "/_layout/workflows/$workflowId/items/$itemId"
)({
  component: ItemDetailsPage,
  loader: async ({
    params: { workflowId, itemId },
    context: { queryClient },
  }) => {
    const items = await queryClient.ensureQueryData(
      workflowItemsQueryOptions(workflowId)
    );
    const item = items?.find((i) => i.id === itemId);

    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    return { item, workflowId };
  },
  pendingComponent: () => (
    <CommonSheet
      isOpen={true}
      onClose={() => {}}
      title="Loading..."
      description="Loading item details..."
      className="sm:max-w-4xl"
    >
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </CommonSheet>
  ),
  errorComponent: ({ error, reset }) => (
    <CommonSheet
      isOpen={true}
      onClose={() => window.history.back()}
      title="Error"
      description="Failed to load item details"
      className="sm:max-w-4xl"
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load item details</AlertTitle>
        <AlertDescription className="mb-4">
          {error.message || "An unexpected error occurred"}
        </AlertDescription>
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
      </Alert>
    </CommonSheet>
  ),
});

function ItemDetailsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { item, workflowId } = useLoaderData({ from: Route.id });
  const retryMutation = useRetryPluginRunMutation();

  // Query for plugin runs for this item in this workflow
  const { data: pluginRuns, isLoading: pluginRunsLoading } = useItemPluginRunsQuery(
    item.id, 
    workflowId
  );

  // Query for all workflow runs this item has been part of
  const { data: workflowRuns, isLoading: workflowRunsLoading } = useItemWorkflowRunsQuery(
    item.id
  );

  const handleClose = () => {
    navigate({
      to: "/workflows/$workflowId/items",
      params: { workflowId },
    });
  };

  const handleRetry = (pluginRunId: string) => {
    retryMutation.mutate({ itemId: item.id, pluginRunId }, {
      onSuccess: () => {
        toast.success('Plugin run queued for retry');
      },
      onError: (error) => {
        toast.error(`Failed to retry: ${error.message}`);
      }
    });
  };

  return (
    <CommonSheet
      isOpen={true}
      onClose={handleClose}
      title={`Item: ${item.id.slice(0, 12)}...`}
      className="sm:max-w-4xl"
    >
      <div className="space-y-6">
        {/* Item Overview */}
        <div>
          <h3 className="font-medium mb-2">Item Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="font-semibold">External ID</div>
            <div className="font-mono text-xs">{item.externalId}</div>
            <div className="font-semibold">Processed At</div>
            <div>
              {item.processedAt
                ? new Date(item.processedAt).toLocaleString()
                : "Not processed"}
            </div>
            <div className="font-semibold">Created At</div>
            <div>{new Date(item.createdAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Enhanced Item Information */}
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">Item Data</TabsTrigger>
            <TabsTrigger value="plugin-runs">
              Plugin Runs ({pluginRuns?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="workflow-runs">
              Workflow Runs ({workflowRuns?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="data">
            <div>
              <h4 className="font-medium mb-2">Raw Item Data</h4>
              <CodePreview code={item.data} maxHeight="20rem" />
            </div>
          </TabsContent>
          
          <TabsContent value="plugin-runs">
            <div className="space-y-4">
              <h4 className="font-medium">Plugin Runs for This Item</h4>
              {pluginRunsLoading ? (
                <div className="text-center py-4">Loading plugin runs...</div>
              ) : pluginRuns?.length ? (
                <div className="space-y-3">
                  {pluginRuns.map((pluginRun: PluginRun) => (
                    <div key={pluginRun.id} className="border p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{pluginRun.stepId}</p>
                            <Badge variant={pluginRun.type === 'SOURCE' ? 'secondary' : 'outline'}>
                              {pluginRun.type || 'PIPELINE'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Plugin: {pluginRun.pluginId}
                          </p>
                          {pluginRun.workflowRun && (
                            <Link
                              to="/workflows/$workflowId/runs/$runId"
                              params={{ 
                                workflowId: pluginRun.workflowRun.workflowId, 
                                runId: pluginRun.workflowRunId 
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              Run: {pluginRun.workflowRunId.slice(0, 8)}...
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={pluginRunStatusColors[pluginRun.status]}>
                            {pluginRun.status}
                          </Badge>
                          {pluginRun.status === 'FAILED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(pluginRun.id)}
                              disabled={retryMutation.isPending}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {pluginRun.retryCount && pluginRun.retryCount !== '0' && (
                        <div className="text-xs text-amber-600 mb-2">
                          Retry attempt #{pluginRun.retryCount}
                        </div>
                      )}
                      
                      <Tabs defaultValue="input">
                        <TabsList>
                          <TabsTrigger value="input">Input</TabsTrigger>
                          <TabsTrigger value="output">Output</TabsTrigger>
                          <TabsTrigger value="config">Config</TabsTrigger>
                          {pluginRun.error && <TabsTrigger value="error">Error</TabsTrigger>}
                        </TabsList>
                        <TabsContent value="input">
                          <CodePreview code={pluginRun.input} maxHeight="10rem" />
                        </TabsContent>
                        <TabsContent value="output">
                          <CodePreview code={pluginRun.output} maxHeight="10rem" />
                        </TabsContent>
                        <TabsContent value="config">
                          <CodePreview code={pluginRun.config} maxHeight="10rem" />
                        </TabsContent>
                        {pluginRun.error && (
                          <TabsContent value="error">
                            <CodePreview code={pluginRun.error} maxHeight="10rem" />
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No plugin runs found for this item
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="workflow-runs">
            <div className="space-y-4">
              <h4 className="font-medium">Workflow Runs This Item Participated In</h4>
              {workflowRunsLoading ? (
                <div className="text-center py-4">Loading workflow runs...</div>
              ) : workflowRuns?.length ? (
                <div className="space-y-3">
                  {workflowRuns.map((workflowRun: WorkflowRun) => (
                    <div key={workflowRun.id} className="border p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <Link
                            to="/workflows/$workflowId/runs/$runId"
                            params={{ 
                              workflowId: workflowRun.workflowId, 
                              runId: workflowRun.id 
                            }}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {workflowRun.id.slice(0, 12)}...
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            Triggered by: {workflowRun.user?.name || 'System'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={workflowRunStatusColors[workflowRun.status]}>
                            {workflowRun.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(workflowRun.startedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {workflowRun.workflow && (
                        <div className="text-xs text-muted-foreground">
                          Workflow: {workflowRun.workflow.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  This item hasn't been part of any workflow runs
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CommonSheet>
  );
}
