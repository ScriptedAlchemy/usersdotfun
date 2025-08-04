import { createFileRoute, useNavigate, useLoaderData } from "@tanstack/react-router";
import { getRunDetailsQuery } from "~/hooks/use-api";
import { CommonSheet } from "~/components/common/common-sheet";
import { Run } from "~/components/runs";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_layout/workflows/$workflowId/runs/$runId")({
  component: RunDetailsPage,
  loader: async ({ params: { runId }, context: { queryClient } }) => {
    const runDetails = await queryClient.fetchQuery(getRunDetailsQuery(runId));
    return { runDetails };
  },
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
      title={`Run: ${runDetails.id.slice(0, 12) || ""}...`}
      description="Detailed view of a specific workflow run."
      className="sm:max-w-3xl"
    >
      {runDetails.failureReason && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Run Failed</AlertTitle>
          <AlertDescription>
            {runDetails.failureReason}
          </AlertDescription>
        </Alert>
      )}
      <Run data={runDetails} />
    </CommonSheet>
  );
}
