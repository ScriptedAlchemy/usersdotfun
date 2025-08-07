import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreateWorkflowData } from "@usersdotfun/shared-db/src/services";
import {
  createWorkflowSchema
} from "@usersdotfun/shared-types/schemas";
import { useState } from "react";
import { toast } from "sonner";
import { JsonEditor } from "~/components/common/json-editor";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useCreateWorkflowMutation } from "~/lib/queries";

export const Route = createFileRoute("/_layout/workflows/create")({
  component: CreateWorkflowPage,
});

function CreateWorkflowPage() {
  return <WorkflowCreate />;
}

function WorkflowCreate() {
  const createMutation = useCreateWorkflowMutation();
  const navigate = useNavigate();

  const handleSuccess = () => {
    toast.success("Workflow created successfully!");
    navigate({ to: "/workflows" });
  };

  const handleError = (error: Error) => {
    toast.error(`Failed to create workflow: ${error.message}`);
  };

  const onSubmit = (data: CreateWorkflowData) => {
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
  const [editedWorkflow, setEditedWorkflow] =
    useState<CreateWorkflowData | null>(null);

  return (
    <div>
      <JsonEditor
        value={editedWorkflow}
        onChange={(value) => setEditedWorkflow(value)}
        schema={createWorkflowSchema}
      />
      <div className="flex justify-end mt-4">
        <Button onClick={() => onSubmit(editedWorkflow)}>Save from JSON</Button>
      </div>
    </div>
  );
}
