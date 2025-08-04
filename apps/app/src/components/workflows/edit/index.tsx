import {
  createWorkflowSchema,
} from "@usersdotfun/shared-types/schemas";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { z } from "zod";
import {
  EditableWorkflow,
  editableWorkflowAtom,
  editableWorkflowSchema,
  workflowIdAtom,
} from "~/atoms/workflow";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
} from "~/hooks/use-api";
import { WorkflowForm } from "./form";
import { JsonEditor } from "~/components/common/json-editor";
import { useState, useEffect } from "react";

export function WorkflowEdit() {
  const [workflowId] = useAtom(workflowIdAtom);
  const updateMutation = useUpdateWorkflowMutation();
  const createMutation = useCreateWorkflowMutation();

  const handleSuccess = () => {
    toast.success(
      `Workflow ${workflowId ? "updated" : "created"} successfully!`
    );
  };

  const handleError = (error: Error) => {
    toast.error(
      `Failed to ${
        workflowId ? "update" : "create"
      } workflow: ${error.message}`
    );
  };

  const onSubmit = (data: EditableWorkflow) => {
    if (workflowId) {
      updateMutation.mutate(
        { id: workflowId, workflow: data },
        { onSuccess: handleSuccess, onError: handleError }
      );
    } else {
      createMutation.mutate(data as z.infer<typeof createWorkflowSchema>, {
        onSuccess: handleSuccess,
        onError: handleError,
      });
    }
  };

  return (
    <Tabs defaultValue="json" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="json">JSON</TabsTrigger>
        {/* <TabsTrigger value="form">Form</TabsTrigger> */}
      </TabsList>
      {/* <TabsContent value="form">
        <WorkflowFormWithAtom onSubmit={onSubmit} />
      </TabsContent> */}
      <TabsContent value="json">
        <JsonEditorWithAtom onSubmit={onSubmit} />
      </TabsContent>
    </Tabs>
  );
}

function WorkflowFormWithAtom({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [editableWorkflow] = useAtom(editableWorkflowAtom);

  const editableData = editableWorkflow
    ? editableWorkflowSchema.parse(editableWorkflow)
    : {};

  return <WorkflowForm workflow={editableData} onSubmit={onSubmit} />;
}

function JsonEditorWithAtom({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [initialWorkflow] = useAtom(editableWorkflowAtom);
  const [editedWorkflow, setEditedWorkflow] = useState(initialWorkflow);

  useEffect(() => {
    setEditedWorkflow(initialWorkflow);
  }, [initialWorkflow]);

  return (
    <div>
      <JsonEditor
        value={editedWorkflow}
        onChange={setEditedWorkflow}
        schema={editableWorkflowSchema}
      />
      <div className="flex justify-end mt-4">
        <Button onClick={() => onSubmit(editedWorkflow)}>Save from JSON</Button>
      </div>
    </div>
  );
}
