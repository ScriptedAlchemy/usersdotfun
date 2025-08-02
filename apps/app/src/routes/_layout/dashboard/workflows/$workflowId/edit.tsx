import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useWorkflowQuery } from "~/hooks/use-api";
import { WorkflowSheet } from "~/components/workflows/workflow-sheet";

export const Route = createFileRoute("/_layout/dashboard/workflows/$workflowId/edit")({
  component: EditWorkflowPage,
});

function EditWorkflowPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId } = useParams({ from: "/_layout/dashboard/workflows/$workflowId/edit" });
  const { data: workflow, isLoading } = useWorkflowQuery(workflowId);

  const handleClose = () => {
    navigate({
      to: "/_layout/dashboard/workflows/$workflowId",
      params: { workflowId },
    });
  };

  if (isLoading) {
    // You can render a loading state here, but the sheet handles it too
    return null;
  }

  return (
    <WorkflowSheet
      mode="edit"
      workflow={workflow}
      isOpen={true}
      onClose={handleClose}
    />
  );
}
