import {
  createFileRoute,
  Link,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { CommonSheet } from "~/components/common/common-sheet";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  useDeleteWorkflowRunMutation,
  useCancelWorkflowRunMutation,
  useRetryPluginRunMutation,
  workflowRunPluginRunsQueryOptions,
  workflowRunItemsQueryOptions,
} from "~/lib/queries";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { CodePreview } from "~/components/common/code-preview";
import {
  runDetailsQueryOptions,
  workflowQueryOptions,
  workflowRunsQueryOptions,
} from "~/lib/queries";
import {
  pluginRunStatusColors,
  workflowRunStatusColors,
} from "~/lib/status-colors";
import { toast } from "sonner";
import { PluginRun, SourceItem } from "@usersdotfun/shared-types/types";

export const Route = createFileRoute(
  "/_layout/workflows/$workflowId/runs/$runId"
)({
  component: RunDetailsPage,
  loader: async ({
    params: { workflowId, runId },
    context: { queryClient },
  }) => {
    const [runDetails] = await Promise.all([
      queryClient.ensureQueryData(runDetailsQueryOptions(runId)),
      queryClient.ensureQueryData(workflowQueryOptions(workflowId)),
      queryClient.ensureQueryData(workflowRunsQueryOptions(workflowId)),
    ]);
    return { runDetails };
  },
  pendingComponent: () => (
    <CommonSheet
      isOpen={true}
      onClose={() => {}}
      title="Loading..."
      description="Loading run details..."
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
      description="Failed to load run details"
      className="sm:max-w-4xl"
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load run details</AlertTitle>
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

function RunDetailsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { runDetails } = useLoaderData({ from: Route.id });
  const stopMutation = useCancelWorkflowRunMutation();
  const deleteMutation = useDeleteWorkflowRunMutation();
  const retryMutation = useRetryPluginRunMutation();

  // Query for source plugin runs (separate from pipeline runs)
  const { data: sourcePluginRuns, isLoading: sourceLoading } = useQuery(
    workflowRunPluginRunsQueryOptions(runDetails?.id || '', 'SOURCE')
  );

  // Query for items processed in this run
  const { data: runItems, isLoading: itemsLoading } = useQuery(
    workflowRunItemsQueryOptions(runDetails?.id || '')
  );

  // Query for pipeline plugin runs
  const { data: pipelinePluginRuns, isLoading: pipelineLoading } = useQuery(
    workflowRunPluginRunsQueryOptions(runDetails?.id || '', 'PIPELINE')
  );

  const onCancel = () => {
    if (runDetails) {
      stopMutation.mutate(runDetails.id, {
        onSuccess: () => handleClose(),
      });
    }
  };

  const onDelete = () => {
    if (runDetails) {
      deleteMutation.mutate(runDetails.id, {
        onSuccess: () => handleClose(),
      });
    }
  };

  const handleRetry = (itemId: string, pluginRunId: string) => {
    retryMutation.mutate({ itemId, pluginRunId }, {
      onSuccess: () => {
        toast.success('Plugin run queued for retry');
      },
      onError: (error) => {
        toast.error(`Failed to retry: ${error.message}`);
      }
    });
  };

  if (!runDetails) {
    return (
      <CommonSheet
        isOpen={true}
        onClose={() => window.history.back()}
        title="Error"
        description="Run details not found."
        className="sm:max-w-4xl"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Run not found</AlertTitle>
          <AlertDescription>
            The run you are looking for could not be found.
          </AlertDescription>
        </Alert>
      </CommonSheet>
    );
  }

  const handleClose = () => {
    navigate({
      to: "/workflows/$workflowId/runs",
      params: { workflowId: runDetails.workflowId },
    });
  };

  return (
    <CommonSheet
      isOpen={true}
      onClose={handleClose}
      title={`Run: ${runDetails.id.slice(0, 12)}...`}
      className="sm:max-w-4xl"
    >
      {runDetails.failureReason && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Run Failed</AlertTitle>
          <AlertDescription>{runDetails.failureReason}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        {/* Run Overview */}
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Run Overview</h3>
          <div className="flex gap-2">
            {runDetails.status === "RUNNING" && (
              <Button variant="destructive" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {runDetails.status === "PENDING" && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
            <Button asChild variant="outline">
              <Link
                to="/workflows/$workflowId/items"
                params={{ workflowId: runDetails.workflowId }}
              >
                View Items
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="font-semibold">Status</div>
          <div>
            <Badge variant={workflowRunStatusColors[runDetails.status]}>
              {runDetails.status}
            </Badge>
          </div>
          <div className="font-semibold">Triggered By</div>
          <div>{runDetails.user?.name ?? "N/A"}</div>
          <div className="font-semibold">Items Processed</div>
          <div>
            {runDetails.itemsProcessed || 0} / {runDetails.itemsTotal || 0}
          </div>
          <div className="font-semibold">Started At</div>
          <div>{new Date(runDetails.startedAt).toLocaleString()}</div>
          <div className="font-semibold">Completed At</div>
          <div>
            {runDetails.completedAt
              ? new Date(runDetails.completedAt).toLocaleString()
              : "N/A"}
          </div>
        </div>

        {/* Enhanced Plugin Runs Organization */}
        <Tabs defaultValue="source" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="source">Source</TabsTrigger>
            <TabsTrigger value="items">Items ({runItems?.length || 0})</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="source">
            <div className="space-y-4">
              <h4 className="font-medium">Source Plugin Runs</h4>
              {sourceLoading ? (
                <div className="text-center py-4">Loading source plugin runs...</div>
              ) : sourcePluginRuns?.pluginRuns?.length ? (
                <div className="space-y-3">
                  {sourcePluginRuns?.pluginRuns?.map((pluginRun: PluginRun) => (
                    <div key={pluginRun.id} className="border p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-sm">{pluginRun.stepId}</p>
                        <Badge variant={pluginRunStatusColors[pluginRun.status]}>
                          {pluginRun.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Plugin: {pluginRun.pluginId}
                      </p>
                      <Tabs defaultValue="output">
                        <TabsList>
                          <TabsTrigger value="input">Input</TabsTrigger>
                          <TabsTrigger value="output">Output</TabsTrigger>
                          <TabsTrigger value="config">Config</TabsTrigger>
                          {pluginRun.error && <TabsTrigger value="error">Error</TabsTrigger>}
                        </TabsList>
                        <TabsContent value="input">
                          <CodePreview code={pluginRun.input} maxHeight="12rem" />
                        </TabsContent>
                        <TabsContent value="output">
                          <CodePreview code={pluginRun.output} maxHeight="12rem" />
                        </TabsContent>
                        <TabsContent value="config">
                          <CodePreview code={pluginRun.config} maxHeight="12rem" />
                        </TabsContent>
                        {pluginRun.error && (
                          <TabsContent value="error">
                            <CodePreview code={pluginRun.error} maxHeight="12rem" />
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No source plugin runs found
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="items">
            <div className="space-y-4">
              <h4 className="font-medium">Items Processed in This Run</h4>
              {itemsLoading ? (
                <div className="text-center py-4">Loading items...</div>
              ) : runItems?.length ? (
                <div className="space-y-3">
                  {runItems.map((item: SourceItem) => (
                    <div key={item.id} className="border p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <Link
                          to="/workflows/$workflowId/items/$itemId"
                          params={{ 
                            workflowId: runDetails.workflowId, 
                            itemId: item.id 
                          }}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {item.id.slice(0, 12)}...
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {item.processedAt 
                            ? `Processed: ${new Date(item.processedAt).toLocaleString()}`
                            : 'Processing...'
                          }
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        External ID: {item.externalId}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No items found for this run
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="pipeline">
            <div className="space-y-4">
              <h4 className="font-medium">Pipeline Plugin Runs</h4>
              {pipelineLoading ? (
                <div className="text-center py-4">Loading pipeline plugin runs...</div>
              ) : pipelinePluginRuns?.pluginRuns?.length ? (
                <div className="space-y-3">
                  {pipelinePluginRuns.pluginRuns?.map((pluginRun: PluginRun) => (
                    <div key={pluginRun.id} className="border p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-sm">{pluginRun.stepId}</p>
                          {pluginRun.sourceItemId && (
                            <Link
                              to="/workflows/$workflowId/items/$itemId"
                              params={{ 
                                workflowId: runDetails.workflowId, 
                                itemId: pluginRun.sourceItemId 
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              Item: {pluginRun.sourceItemId.slice(0, 8)}...
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={pluginRunStatusColors[pluginRun.status]}>
                            {pluginRun.status}
                          </Badge>
                          {pluginRun.status === 'FAILED' && pluginRun.sourceItemId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(pluginRun.sourceItemId!, pluginRun.id)}
                              disabled={retryMutation.isPending}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Plugin: {pluginRun.pluginId}
                        {pluginRun.retryCount && pluginRun.retryCount !== '0' && (
                          <span className="ml-2">• Retry #{pluginRun.retryCount}</span>
                        )}
                      </p>
                      <Tabs defaultValue="input">
                        <TabsList>
                          <TabsTrigger value="input">Input</TabsTrigger>
                          <TabsTrigger value="output">Output</TabsTrigger>
                          <TabsTrigger value="config">Config</TabsTrigger>
                          {pluginRun.error && <TabsTrigger value="error">Error</TabsTrigger>}
                        </TabsList>
                        <TabsContent value="input">
                          <CodePreview code={pluginRun.input} maxHeight="12rem" />
                        </TabsContent>
                        <TabsContent value="output">
                          <CodePreview code={pluginRun.output} maxHeight="12rem" />
                        </TabsContent>
                        <TabsContent value="config">
                          <CodePreview code={pluginRun.config} maxHeight="12rem" />
                        </TabsContent>
                        {pluginRun.error && (
                          <TabsContent value="error">
                            <CodePreview code={pluginRun.error} maxHeight="12rem" />
                          </TabsContent>
                        )}
                      </Tabs>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No pipeline plugin runs found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CommonSheet>
  );
}
