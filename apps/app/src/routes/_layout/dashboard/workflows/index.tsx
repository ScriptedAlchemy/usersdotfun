import { createFileRoute, Link } from "@tanstack/react-router";
import { useWorkflowsQuery } from "~/hooks/use-api";
import { DataTable } from "~/components/common/data-table";
import { Button } from "~/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { WorkflowSheet } from "~/components/workflows/workflow-sheet";
import type { ColumnDef } from "@tanstack/react-table";
import type { RichWorkflow } from "@usersdotfun/shared-types/types";
import { Badge } from "~/components/ui/badge";

export const Route = createFileRoute("/_layout/dashboard/workflows/")({
  component: WorkflowsPage,
});

const columns: ColumnDef<RichWorkflow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const workflow = row.original;
      return (
        <Link
          to="/dashboard/workflows/$workflowId/runs"
          params={{ workflowId: workflow.id }}
          className="font-medium text-primary hover:underline"
        >
          {workflow.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "schedule",
    header: "Schedule",
    cell: ({ row }) => <code>{row.original.schedule || "N/A"}</code>,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
];

function WorkflowsPage() {
  const { data: workflows, isLoading } = useWorkflowsQuery();
  const [isSheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automated workflows.
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={workflows || []}
        isLoading={isLoading}
        filterColumnId="name"
        filterPlaceholder="Filter by name..."
      />

      <WorkflowSheet
        mode="create"
        isOpen={isSheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
