import { createFileRoute, useNavigate, useLoaderData } from "@tanstack/react-router";
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
  useUpdateWorkflowMutation,
  workflowQueryOptions,
} from "~/lib/queries";

export const Route = createFileRoute("/_layout/workflows/$workflowId/edit")({
  loader: ({ params: { workflowId }, context: { queryClient } }) =>
    queryClient.ensureQueryData(workflowQueryOptions(workflowId)),
  component: EditWorkflowPage,
});

function EditWorkflowPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId } = Route.useParams();
  const workflow = useLoaderData({ from: Route.id });

  const handleClose = () => {
    navigate({
      to: "/workflows/$workflowId",
      params: { workflowId },
    });
  };

  if (!workflow) {
    return null;
  }

  return (
    <CommonSheet
      isOpen={true}
      onClose={handleClose}
      title="Edit Workflow"
      description="Update the workflow configuration."
    >
      <WorkflowEdit workflow={workflow} />
    </CommonSheet>
  );
}

function WorkflowEdit({ workflow }: { workflow: EditableWorkflow }) {
  const { workflowId } = Route.useParams();
  const updateMutation = useUpdateWorkflowMutation();
  const navigate = useNavigate();

  const handleSuccess = () => {
    toast.success("Workflow updated successfully!");
    navigate({ to: "/workflows/$workflowId", params: { workflowId } });
  };

  const handleError = (error: Error) => {
    toast.error(`Failed to update workflow: ${error.message}`);
  };

  const onSubmit = (data: EditableWorkflow) => {
    updateMutation.mutate(
      { id: workflowId, workflow: data },
      { onSuccess: handleSuccess, onError: handleError }
    );
  };

  return (
    <Tabs defaultValue="json" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="json">
        <JsonEditorWithAtom workflow={workflow} onSubmit={onSubmit} />
      </TabsContent>
    </Tabs>
  );
}

function JsonEditorWithAtom({
  workflow,
  onSubmit,
}: {
  workflow: EditableWorkflow;
  onSubmit: (data: any) => void;
}) {
  const [editedWorkflow, setEditedWorkflow] =
    useState<EditableWorkflow | null>(workflow);

  useEffect(() => {
    setEditedWorkflow(workflow);
  }, [workflow]);

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
