import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useWorkflowRunsQuery } from "~/hooks/use-api";
import { DataTable } from "~/components/common/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { WorkflowRun } from "@usersdotfun/shared-types/types";
import { Badge } from "~/components/ui/badge";

export const Route = createFileRoute("/_layout/dashboard/workflows/$workflowId/runs")({
  component: WorkflowRunsPage,
});

const columns: ColumnDef<WorkflowRun>[] = [
  {
    accessorKey: "id",
    header: "Run ID",
    cell: ({ row }) => {
      const run = row.original;
      const { workflowId } = useParams({ from: "/_layout/dashboard/workflows/$workflowId/runs" });
      return (
        <Link
          to="/_layout/dashboard/workflows/$workflowId/runs/$runId"
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
      // TODO: Add color coding for status
      return <Badge variant="outline">{status}</Badge>;
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
  const { workflowId } = useParams({ from: "/_layout/dashboard/workflows/$workflowId/runs" });
  const { data: runs, isLoading } = useWorkflowRunsQuery(workflowId);

  return (
    <div>
      <DataTable
        columns={columns}
        data={runs || []}
        isLoading={isLoading}
        filterColumnId="id"
        filterPlaceholder="Filter by Run ID..."
      />
    </div>
  );
}
