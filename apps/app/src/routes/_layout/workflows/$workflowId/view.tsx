import { createFileRoute, useNavigate, useLoaderData } from "@tanstack/react-router";
import type { RichWorkflow } from "@usersdotfun/shared-types/types";
import { CommonSheet } from "~/components/common/common-sheet";
import { workflowQueryOptions } from "~/lib/queries";

export const Route = createFileRoute("/_layout/workflows/$workflowId/view")({
  loader: ({ params: { workflowId }, context: { queryClient } }) =>
    queryClient.ensureQueryData(workflowQueryOptions(workflowId)),
  component: ViewWorkflowPage,
});

function ViewWorkflowPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId } = Route.useParams();
  const workflow = useLoaderData({ from: Route.id });

  const handleClose = () => {
    navigate({
      to: "/workflows",
    });
  };

  if (!workflow) {
    return null;
  }

  return (
    <CommonSheet
      isOpen={true}
      onClose={handleClose}
      title="View Workflow"
      description="Review the details of the workflow."
    >
      <WorkflowView workflow={workflow} />
    </CommonSheet>
  );
}

function WorkflowView({ workflow }: { workflow: RichWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h5 className="font-semibold">Workflow {workflow.id}</h5>
      </div>
      <div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm">
            <strong>Plugin:</strong> {workflow.source.pluginId}
          </p>
          <p className="text-sm mt-2">
            <strong>Config:</strong>
          </p>
          <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
            {JSON.stringify(workflow.source.config, null, 2)}
          </pre>
          <p className="text-sm mt-2">
            <strong>Search:</strong>
          </p>
          <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
            {JSON.stringify(workflow.source.search, null, 2)}
          </pre>
        </div>
      </div>

      <div>
        <h5 className="font-semibold mb-2">Pipeline Steps</h5>
        <div className="space-y-4">
          {workflow.pipeline.steps.map((step, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded">
              <p className="text-sm">
                <strong>Step {index + 1}:</strong> {step.stepId}
              </p>
              <p className="text-sm">
                <strong>Plugin:</strong> {step.pluginId}
              </p>
              <p className="text-sm mt-2">
                <strong>Config:</strong>
              </p>
              <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(step.config, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
