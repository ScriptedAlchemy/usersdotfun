import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
  useParams,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { WorkflowRun } from "@usersdotfun/shared-types/types";
import { DataTable } from "~/components/common/data-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  useDeleteWorkflowRunMutation,
  useCancelWorkflowRunMutation,
  workflowQueryOptions,
  workflowRunsQueryOptions,
} from "~/lib/queries";
import { workflowRunStatusColors } from "~/lib/status-colors";

export const Route = createFileRoute("/_layout/workflows/$workflowId/runs")({
  component: WorkflowRunsPage,
  loader: async ({ params: { workflowId }, context: { queryClient } }) => {
    const workflow = await queryClient.ensureQueryData(
      workflowQueryOptions(workflowId)
    );
    const runs = await queryClient.ensureQueryData(
      workflowRunsQueryOptions(workflowId)
    );
    return { workflow, runs };
  },
});

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
          preload="intent"
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
      return <Badge variant={workflowRunStatusColors[status]}>{status}</Badge>;
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
  {
    id: "actions",
    cell: function Cell({ row }) {
      const run = row.original;
      const { workflowId } = useParams({ from: "/_layout/workflows/$workflowId/runs" });
      const stopMutation = useCancelWorkflowRunMutation();
      const deleteMutation = useDeleteWorkflowRunMutation();

      const onStop = () => stopMutation.mutate(run.id);
      const onDelete = () => deleteMutation.mutate(run.id);

      return (
        <div className="flex gap-2">
          {run.status === "RUNNING" && (
            <Button variant="destructive" size="sm" onClick={onStop}>
              Stop
            </Button>
          )}
          {run.status === "PENDING" && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      );
    },
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
