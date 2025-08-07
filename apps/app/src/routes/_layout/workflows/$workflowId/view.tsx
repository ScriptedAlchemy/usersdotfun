import {
  createFileRoute,
  useLoaderData
} from "@tanstack/react-router";
import type { RichWorkflow } from "@usersdotfun/shared-types/types";
import { CodePreview } from "~/components/ui/code-preview";
import { workflowQueryOptions } from "~/lib/queries";

export const Route = createFileRoute("/_layout/workflows/$workflowId/view")({
  loader: ({ params: { workflowId }, context: { queryClient } }) =>
    queryClient.ensureQueryData(workflowQueryOptions(workflowId)),
  component: ViewWorkflowPage,
});

function ViewWorkflowPage() {
  const workflow = useLoaderData({ from: Route.id });

  if (!workflow) {
    return null;
  }

  return <WorkflowView workflow={workflow} />;
}

function WorkflowView({ workflow }: { workflow: RichWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h5 className="font-semibold">Workflow {workflow.id}</h5>
      </div>
      <div>
        <div className="p-3 rounded">
          <p className="text-sm">
            <strong>Plugin:</strong> {workflow.source.pluginId}
          </p>
          <p className="text-sm mt-2">
            <strong>Config:</strong>
          </p>
          <div className="mt-1">
            <CodePreview code={workflow.source.config} maxHeight="12rem" />
          </div>
          <p className="text-sm mt-2">
            <strong>Search:</strong>
          </p>
          <div className="mt-1">
            <CodePreview code={workflow.source.search} maxHeight="12rem" />
          </div>
        </div>
      </div>

      <div>
        <h5 className="font-semibold mb-2">Pipeline Steps</h5>
        <div className="space-y-4">
          {workflow.pipeline.steps.map((step, index) => (
            <div key={index} className="p-3 rounded">
              <p className="text-sm">
                <strong>Step {index + 1}:</strong> {step.stepId}
              </p>
              <p className="text-sm">
                <strong>Plugin:</strong> {step.pluginId}
              </p>
              <p className="text-sm mt-2">
                <strong>Config:</strong>
              </p>
              <div className="mt-1">
                <CodePreview code={step.config} maxHeight="10rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
