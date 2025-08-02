import {
  createFileRoute,
  Link,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import { useWorkflowQuery } from "~/hooks/use-api";
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/components/common/page-header";

export const Route = createFileRoute(
  "/_layout/workflows/$workflowId/_layout",
)({
  component: WorkflowLayout,
});

function WorkflowLayout() {
  const { workflowId } = useParams({
    from: "/_layout/workflows/$workflowId/_layout",
  });
  const { data: workflow, isLoading } = useWorkflowQuery(workflowId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!workflow) {
    return <div>Workflow not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={workflow.name}
        description={`Manage your workflow and view its runs.`}
      />
      <nav className="mb-4">
        <ul className="flex space-x-4">
          <li>
            <Link
              to="/workflows/$workflowId"
              params={{ workflowId }}
              className="text-blue-500 hover:underline"
              activeProps={{ className: "font-bold" }}
            >
              Details
            </Link>
          </li>
          <li>
            <Link
              to="/workflows/$workflowId/runs"
              params={{ workflowId }}
              className="text-blue-500 hover:underline"
              activeProps={{ className: "font-bold" }}
            >
              Runs
            </Link>
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}
