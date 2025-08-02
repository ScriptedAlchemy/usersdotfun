import {
  createWorkflowSchema,
  richWorkflowSchema,
} from "@usersdotfun/shared-types/schemas";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { z } from "zod";
import {
  EditableWorkflow,
  editableWorkflowAtom,
  editableWorkflowSchema,
} from "~/atoms/workflow";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
} from "~/hooks/use-api";
import { WorkflowForm } from "./form";
import { JsonEditor } from "./json.js";

export function WorkflowEdit() {
  const [workflow, setEditableWorkflow] = useAtom(editableWorkflowAtom);
  const updateMutation = useUpdateWorkflowMutation();
  const createMutation = useCreateWorkflowMutation();

  const handleSuccess = () => {
    toast.success(`Workflow ${workflow ? "updated" : "created"} successfully!`);
  };

  const handleError = (error: Error) => {
    toast.error(
      `Failed to ${workflow ? "update" : "create"} workflow: ${error.message}`
    );
  };

  const onSubmit = (data: EditableWorkflow) => {
    if (workflow && 'id' in workflow) {
      updateMutation.mutate(
        { id: workflow.id as string, workflow: data },
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
    <Tabs defaultValue="form" className="w-full">
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
  const [editableWorkflow, setEditableWorkflow] = useAtom(editableWorkflowAtom);

  const editableData = editableWorkflow
    ? editableWorkflowSchema.parse(editableWorkflow)
    : {};

  return <WorkflowForm workflow={editableData} onSubmit={onSubmit} />;
}

function JsonEditorWithAtom({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [editableWorkflow, setEditableWorkflow] = useAtom(editableWorkflowAtom);

  return (
    <div>
      <JsonEditor
        value={editableWorkflow}
        onChange={setEditableWorkflow}
        schema={editableWorkflowSchema}
      />
      <div className="flex justify-end mt-4">
        <Button onClick={() => onSubmit(editableWorkflow)}>
          Save from JSON
        </Button>
      </div>
    </div>
  );
}
