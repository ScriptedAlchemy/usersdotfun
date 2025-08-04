import { useAtom } from "jotai";
import { workflowDataAtom } from "~/atoms/workflow";
import { WorkflowView } from "./view";
import { WorkflowEdit } from "./edit";

export function Workflow({
  mode,
}: {
  mode: "view" | "edit" | "create";
}) {
  if (mode === "create") {
    return <WorkflowEdit />;
  }

  const [{ data: workflow, isPending, isError }] = useAtom(workflowDataAtom);

  if (isPending) return <div>Loading Workflow...</div>;
  if (isError) return <div>Error loading Workflow.</div>;
  if (!workflow) return <div>No workflow found.</div>;

  return mode === "edit" ? (
    <WorkflowEdit />
  ) : (
    <WorkflowView workflow={workflow} />
  );
}
