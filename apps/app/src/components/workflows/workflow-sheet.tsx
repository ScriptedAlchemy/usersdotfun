import { CommonSheet } from "~/components/common/common-sheet";
import type { RichWorkflow } from "@usersdotfun/shared-types/types";
import { Workflow } from ".";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { editableWorkflowAtom } from "~/atoms/workflow";

interface WorkflowSheetProps {
  mode: "create" | "edit" | "view";
  workflow?: RichWorkflow;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowSheet({
  mode: initialMode,
  workflow,
  isOpen,
  onClose,
}: WorkflowSheetProps) {
  const [mode, setMode] = useState(initialMode);
  const [, setEditableWorkflow] = useAtom(editableWorkflowAtom);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (mode === "edit") {
      setEditableWorkflow(workflow ?? null);
    }
  }, [mode, workflow, setEditableWorkflow]);

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
      {initialMode === "create" ? (
        <Workflow id={workflow?.id} mode="create" />
      ) : (
        <Tabs value={mode} onValueChange={(value) => setMode(value as "view" | "edit")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          <TabsContent value="view">
            <Workflow id={workflow?.id} mode="view" />
          </TabsContent>
          <TabsContent value="edit">
            <Workflow id={workflow?.id} mode="edit" />
          </TabsContent>
        </Tabs>
      )}
    </CommonSheet>
  );
}
