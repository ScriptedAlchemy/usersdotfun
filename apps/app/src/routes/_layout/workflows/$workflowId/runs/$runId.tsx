import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { CommonSheet } from "~/components/common/common-sheet";
import { Run } from "~/components/runs";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  getRunDetailsQuery,
  getWorkflowQuery,
  getWorkflowRunsQuery,
} from "~/hooks/use-api";

export const Route = createFileRoute(
  "/_layout/workflows/$workflowId/runs/$runId"
)({
  component: RunDetailsPage,
  loader: async ({
    params: { workflowId, runId },
    context: { queryClient },
  }) => {
    const [runDetails] = await Promise.all([
      queryClient.fetchQuery(getRunDetailsQuery(runId)),
      queryClient.ensureQueryData(getWorkflowQuery(workflowId)),
      queryClient.ensureQueryData(getWorkflowRunsQuery(workflowId)),
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
      description="Detailed view of a specific workflow run."
      className="sm:max-w-3xl"
    >
      {runDetails.failureReason && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Run Failed</AlertTitle>
          <AlertDescription>{runDetails.failureReason}</AlertDescription>
        </Alert>
      )}
      <Run data={runDetails} />
    </CommonSheet>
  );
}
