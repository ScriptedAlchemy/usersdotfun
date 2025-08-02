import type { RichWorkflow } from "@usersdotfun/shared-types/types";

interface WorkflowViewProps {
  workflow: RichWorkflow;
}

export function WorkflowView({ workflow }: WorkflowViewProps) {
  return (
    <div className="space-y-6 py-4">
      <div>
        <h5 className="font-semibold mb-2">Source Configuration</h5>
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
