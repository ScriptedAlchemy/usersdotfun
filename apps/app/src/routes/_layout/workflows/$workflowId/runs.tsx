import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
  useParams,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { workflowRunStatusValues } from "@usersdotfun/shared-types/schemas";
import type { WorkflowRun } from "@usersdotfun/shared-types/types";
import type { VariantProps } from "class-variance-authority";
import { DataTable } from "~/components/common/data-table";
import { Badge } from "~/components/ui/badge";
import { getWorkflowQuery, getWorkflowRunsQuery } from "~/hooks/use-api";

export const Route = createFileRoute("/_layout/workflows/$workflowId/runs")({
  component: WorkflowRunsPage,
  loader: async ({ params: { workflowId }, context: { queryClient } }) => {
    const workflow = await queryClient.fetchQuery(getWorkflowQuery(workflowId));
    const runs = await queryClient.fetchQuery(getWorkflowRunsQuery(workflowId));
    return { workflow, runs };
  },
});

const statusColors: Record<
  (typeof workflowRunStatusValues)[number],
  VariantProps<typeof Badge>["variant"]
> = {
  started: "default",
  running: "secondary",
  completed: "success",
  failed: "destructive",
  partially_completed: "warning",
  polling: "outline",
};

const columns: ColumnDef<WorkflowRun>[] = [
  {
    accessorKey: "id",
    header: "Run ID",
    cell: ({ row }) => {
      const run = row.original;
      const { workflowId } = useParams({
        from: "/_layout/workflows/$workflowId/runs",
      });
      return (
        <Link
          to="/workflows/$workflowId/runs/$runId"
          params={{ workflowId, runId: run.id }}
          className="font-mono text-sm text-primary hover:underline"
        >
          {run.id.slice(0, 12)}...
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return <Badge variant={statusColors[status]}>{status}</Badge>;
    },
  },
  {
    accessorKey: "startedAt",
    header: "Started At",
    cell: ({ row }) => new Date(row.original.startedAt).toLocaleString(),
  },
  {
    accessorKey: "completedAt",
    header: "Completed At",
    cell: ({ row }) =>
      row.original.completedAt
        ? new Date(row.original.completedAt).toLocaleString()
        : "N/A",
  },
];

function WorkflowRunsPage() {
  const { workflow, runs } = useLoaderData({
    from: "/_layout/workflows/$workflowId/runs",
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Workflow Runs: {workflow?.name}
        </h1>
        <p className="text-muted-foreground">
          View and inspect the execution history of your workflow.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={runs || []}
        filterColumnId="id"
        filterPlaceholder="Filter by Run ID..."
      />
      <Outlet />
    </div>
  );
}
