import {
  updateWorkflowSchema
} from "@usersdotfun/shared-types/schemas";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EditableWorkflow,
  editableWorkflowAtom,
  workflowIdAtom,
} from "~/atoms/workflow";
import { JsonEditor } from "~/components/common/json-editor";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
} from "~/lib/queries";
import { WorkflowForm } from "./form";

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
      `Failed to ${workflowId ? "update" : "create"} workflow: ${error.message}`
    );
  };

  const onSubmit = (data: EditableWorkflow) => {
    if (workflowId) {
      updateMutation.mutate(
        { id: workflowId, workflow: data },
        { onSuccess: handleSuccess, onError: handleError }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: handleSuccess,
        onError: handleError,
      });
    }
  };

  return (
    <Tabs defaultValue="json" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        {/* <TabsTrigger value="form">Form</TabsTrigger> */}
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      {/* <TabsContent value="form">
        <WorkflowFormWithAtom onSubmit={onSubmit} /> */}
      {/* </TabsContent> */}
      <TabsContent value="json">
        <JsonEditorWithAtom onSubmit={onSubmit} />
      </TabsContent>
    </Tabs>
  );
}

function WorkflowFormWithAtom({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [editableWorkflow] = useAtom(editableWorkflowAtom);

  const editableData = editableWorkflow
    ? updateWorkflowSchema.parse(editableWorkflow)
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
        schema={updateWorkflowSchema}
      />
      <div className="flex justify-end mt-4">
        <Button onClick={() => onSubmit(editedWorkflow)}>Save from JSON</Button>
      </div>
    </div>
  );
}
