import {
  createFileRoute,
  Link,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
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
  runDetailsQueryOptions,
  workflowQueryOptions,
  workflowRunsQueryOptions,
} from "~/lib/queries";
import {
  pluginRunStatusColors,
  workflowRunStatusColors,
} from "~/lib/status-colors";

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
      className="sm:max-w-3xl"
    >
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </CommonSheet>
  ),
  // Error component for the sheet
  errorComponent: ({ error, reset }) => (
    <CommonSheet
      isOpen={true}
      onClose={() => window.history.back()}
      title="Error"
      description="Failed to load run details"
      className="sm:max-w-3xl"
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

  if (!runDetails) {
    return (
      <CommonSheet
        isOpen={true}
        onClose={() => window.history.back()}
        title="Error"
        description="Run details not found."
        className="sm:max-w-3xl"
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

  const data = runDetails;

  return (
    <CommonSheet
      isOpen={true}
      onClose={handleClose}
      title={`Run: ${runDetails.id.slice(0, 12)}...`}
      className="sm:max-w-3xl"
    >
      {runDetails.failureReason && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Run Failed</AlertTitle>
          <AlertDescription>{runDetails.failureReason}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Run Overview</h3>
          <Button asChild variant="outline">
            <Link
              to="/workflows/$workflowId/items"
              params={{ workflowId: data.workflowId }}
            >
              View Items
            </Link>
          </Button>
        </div>
        <div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div className="font-semibold">Status</div>
            <div>
              <Badge variant={workflowRunStatusColors[data.status]}>
                {data.status}
              </Badge>
            </div>
            <div className="font-semibold">Triggered By</div>
            <div>{data.user?.name ?? "N/A"}</div>
            <div className="font-semibold">Items Processed</div>
            <div>
              {data.itemsProcessed} / {data.itemsTotal}
            </div>
            <div className="font-semibold">Started At</div>
            <div>{new Date(data.startedAt).toLocaleString()}</div>
            <div className="font-semibold">Completed At</div>
            <div>
              {data.completedAt
                ? new Date(data.completedAt).toLocaleString()
                : "N/A"}
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-medium">
            Plugin Runs ({data.pluginRuns.length})
          </h3>
          <div className="mt-2 space-y-4">
            {data.pluginRuns.map((pluginRun) => (
              <div key={pluginRun.id} className="border p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-sm">{pluginRun.stepId}</p>
                  <Badge variant={pluginRunStatusColors[pluginRun.status]}>
                    {pluginRun.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Plugin: {pluginRun.pluginId}
                </p>
                <Tabs defaultValue="input" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="input">Input</TabsTrigger>
                    <TabsTrigger value="output">Output</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                    <TabsTrigger value="error">Error</TabsTrigger>
                  </TabsList>
                  <TabsContent value="input">
                    <CodePreview code={pluginRun.input} maxHeight="16rem" />
                  </TabsContent>
                  <TabsContent value="output">
                    <CodePreview code={pluginRun.output} maxHeight="16rem" />
                  </TabsContent>
                  <TabsContent value="config">
                    <CodePreview code={pluginRun.config} maxHeight="16rem" />
                  </TabsContent>
                  <TabsContent value="error">
                    <CodePreview code={pluginRun.error} maxHeight="16rem" />
                  </TabsContent>
                </Tabs>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CommonSheet>
  );
}
