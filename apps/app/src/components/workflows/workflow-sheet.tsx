import { CommonSheet } from "~/components/common/common-sheet";
import { Workflow } from ".";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useState, useEffect } from "react";
import { useSetAtom } from "jotai";
import { workflowIdAtom } from "~/atoms/workflow";

interface WorkflowSheetProps {
  mode: "create" | "edit" | "view";
  workflowId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkflowSheet({
  mode: initialMode,
  workflowId,
  isOpen,
  onClose,
}: WorkflowSheetProps) {
  const [mode, setMode] = useState(initialMode);
  const setWorkflowId = useSetAtom(workflowIdAtom);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      setWorkflowId(workflowId ?? null);
    }
  }, [isOpen, workflowId, setWorkflowId]);

  const title =
    mode === "create"
      ? "Create New Workflow"
      : mode === "edit"
      ? "Edit Workflow"
      : "View Workflow";

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
        <Workflow mode="create" />
      ) : (
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as "view" | "edit")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          <TabsContent value="view">
            <Workflow mode="view" />
          </TabsContent>
          <TabsContent value="edit">
            <Workflow mode="edit" />
          </TabsContent>
        </Tabs>
      )}
    </CommonSheet>
  );
}
