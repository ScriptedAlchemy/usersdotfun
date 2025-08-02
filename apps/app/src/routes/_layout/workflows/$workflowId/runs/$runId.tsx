import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useRunDetailsQuery } from "~/hooks/use-api";
import { RunDetailsSheet } from "~/components/runs/run-details-sheet";

export const Route = createFileRoute("/_layout/workflows/$workflowId/runs/$runId")({
  component: RunDetailsPage,
});

function RunDetailsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId, runId } = useParams({ from: "/_layout/workflows/$workflowId/runs/$runId" });
  const { data: runDetails, isLoading } = useRunDetailsQuery(runId);

  const handleClose = () => {
    navigate({
      to: "/_layout/workflows/$workflowId/runs",
      params: { workflowId },
    });
  };

  return (
    <RunDetailsSheet
      runDetails={runDetails}
      isOpen={true}
      onClose={handleClose}
      isLoading={isLoading}
    />
  );
}
