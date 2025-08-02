import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRunDetailsQuery, useWorkflowRunsQuery } from "~/hooks/use-api";
import { DataTable } from "~/components/common/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { WorkflowRun } from "@usersdotfun/shared-types/types";
import { Badge } from "~/components/ui/badge";
import { workflowRunStatusValues } from "@usersdotfun/shared-types/schemas";
import type { VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { RunDetailsSheet } from "~/components/runs/run-details-sheet";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute(
  "/_layout/workflows/$workflowId/runs",
)({
  component: WorkflowRunsPage,
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

const columns = (
  setSelectedRun: (run: WorkflowRun) => void,
): ColumnDef<WorkflowRun>[] => [
  {
    accessorKey: "id",
    header: "Run ID",
    cell: ({ row }) => {
      const run = row.original;
      return (
        <Button
          variant="link"
          onClick={() => setSelectedRun(run)}
          className="p-0 font-mono text-sm text-primary hover:underline"
        >
          {run.id.slice(0, 12)}...
        </Button>
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
  const { workflowId } = useParams({
    from: "/_layout/workflows/$workflowId/runs",
  });
  const { data: runs, isLoading } = useWorkflowRunsQuery(workflowId);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

  const { data: runDetails, isLoading: isLoadingDetails } = useRunDetailsQuery(
    selectedRun?.id ?? "",
  );

  return (
    <div>
      <DataTable
        columns={columns(setSelectedRun)}
        data={runs || []}
        isLoading={isLoading}
        filterColumnId="id"
        filterPlaceholder="Filter by Run ID..."
      />
      {selectedRun && (
        <RunDetailsSheet
          runDetails={runDetails}
          isOpen={!!selectedRun}
          onClose={() => setSelectedRun(null)}
          isLoading={isLoadingDetails}
        />
      )}
    </div>
  );
}
