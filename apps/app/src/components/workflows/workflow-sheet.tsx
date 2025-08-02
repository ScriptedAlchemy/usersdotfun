import { CommonSheet } from "~/components/common/common-sheet";
import type { RichWorkflow } from "@usersdotfun/shared-types/types";
import { WorkflowForm } from "./workflow-form";
import { Workflow } from ".";

interface WorkflowSheetProps {
  mode: "create" | "edit" | "view";
  workflow?: RichWorkflow;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowSheet({
  mode,
  workflow,
  isOpen,
  onClose,
}: WorkflowSheetProps) {
  const title =
    mode === "create"
      ? "Create New Workflow"
      : mode === "edit"
      ? `Edit: ${workflow?.name}`
      : `View: ${workflow?.name}`;

  const description =
    mode === "create"
      ? "Define the details of your new workflow."
      : mode === "edit"
      ? "Update the workflow configuration."
      : "Review the details of the workflow.";

  return (
    <CommonSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      {/* We will conditionally render the view or form based on mode */}
      {(mode === "create" || mode === "edit") && (
        <WorkflowForm
          workflow={mode === "edit" ? workflow : undefined}
          onSuccess={onClose}
        />
      )}
      {mode === "view" && workflow && <Workflow id={workflow.id} />}
    </CommonSheet>
  );
}
