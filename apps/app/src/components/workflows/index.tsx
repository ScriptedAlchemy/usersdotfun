import { useWorkflowQuery } from "~/hooks/use-api";
import { WorkflowView } from "./workflow-view";

export function Workflow({ id }: { id: string }) {
  const { data: workflow, isLoading } = useWorkflowQuery(id);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!workflow) {
    return <div>Workflow not found</div>;
  }

  return <WorkflowView workflow={workflow} />;
}
