import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  updateWorkflowSchema,
} from "@usersdotfun/shared-types/schemas";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EditableWorkflow,
} from "~/atoms/workflow";
import { CommonSheet } from "~/components/common/common-sheet";
import { JsonEditor } from "~/components/common/json-editor";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  useCreateWorkflowMutation,
} from "~/lib/queries";

export const Route = createFileRoute("/_layout/workflows/create")({
  component: CreateWorkflowPage,
});

function CreateWorkflowPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const handleClose = () => {
    navigate({
      to: "/workflows",
    });
  };

  return (
    <CommonSheet
      isOpen={true}
      onClose={handleClose}
      title="Create New Workflow"
      description="Define the details of your new workflow."
    >
      <WorkflowEdit />
    </CommonSheet>
  );
}

function WorkflowEdit() {
  const createMutation = useCreateWorkflowMutation();
  const navigate = useNavigate();

  const handleSuccess = () => {
    toast.success("Workflow created successfully!");
    navigate({ to: "/workflows" });
  };

  const handleError = (error: Error) => {
    toast.error(`Failed to create workflow: ${error.message}`);
  };

  const onSubmit = (data: EditableWorkflow) => {
    createMutation.mutate(data, {
      onSuccess: handleSuccess,
      onError: handleError,
    });
  };

  return (
    <Tabs defaultValue="json" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="json">
        <JsonEditorWithAtom onSubmit={onSubmit} />
      </TabsContent>
    </Tabs>
  );
}

function JsonEditorWithAtom({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [editedWorkflow, setEditedWorkflow] = useState<EditableWorkflow | null>({});

  return (
    <div>
      <JsonEditor
        value={editedWorkflow}
        onChange={(value) => setEditedWorkflow(value)}
        schema={updateWorkflowSchema}
      />
      <div className="flex justify-end mt-4">
        <Button onClick={() => onSubmit(editedWorkflow)}>Save from JSON</Button>
      </div>
    </div>
  );
}
