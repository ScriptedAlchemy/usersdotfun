import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { workflowIdAtom } from "~/atoms/workflow";
import { WorkflowSheet } from "~/components/workflows/workflow-sheet";
import { workflowQueryOptions } from "~/lib/queries";

export const Route = createFileRoute("/_layout/workflows/$workflowId/edit")({
  loader: ({ params: { workflowId }, context: { queryClient } }) =>
    queryClient.ensureQueryData(workflowQueryOptions(workflowId)),
  component: EditWorkflowPage,
});

function EditWorkflowPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId } = Route.useParams();
  const setWorkflowId = useSetAtom(workflowIdAtom);

  const handleClose = () => {
    navigate({
      to: "/workflows/$workflowId",
      params: { workflowId },
    });
  };

  return (
    <WorkflowSheet
      mode="edit"
      workflowId={workflowId}
      isOpen={true}
      onClose={handleClose}
    />
  );
}
