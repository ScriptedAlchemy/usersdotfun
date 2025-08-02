import { createFileRoute, Link } from "@tanstack/react-router";
import { useWorkflowsQuery, useToggleWorkflowStatusMutation, useRunWorkflowNowMutation } from "~/hooks/use-api";
import { DataTable } from "~/components/common/data-table";
import { Button } from "~/components/ui/button";
import { PlusCircle, Play, Power } from "lucide-react";
import { useState } from "react";
import { WorkflowSheet } from "~/components/workflows/workflow-sheet";
import type { ColumnDef } from "@tanstack/react-table";
import type { RichWorkflow } from "@usersdotfun/shared-types/types";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_layout/workflows/")({
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
          to="/workflows/$workflowId/runs"
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
  {
    id: "actions",
    cell: function Cell({ row }) {
      const workflow = row.original;
      const toggleMutation = useToggleWorkflowStatusMutation();
      const runMutation = useRunWorkflowNowMutation();

      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.promise(toggleMutation.mutateAsync(workflow.id), {
                loading: "Toggling status...",
                success: "Status toggled successfully!",
                error: "Failed to toggle status.",
              });
            }}
          >
            <Power className="mr-2 h-4 w-4" />
            Toggle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.promise(runMutation.mutateAsync(workflow.id), {
                loading: "Triggering workflow...",
                success: "Workflow triggered successfully!",
                error: "Failed to trigger workflow.",
              });
            }}
          >
            <Play className="mr-2 h-4 w-4" />
            Run Now
          </Button>
        </div>
      );
    },
  },
];

function WorkflowsPage() {
  const { data: workflows, isLoading } = useWorkflowsQuery();
  const [isSheetOpen, setSheetOpen] = useState(false);

  console.log("workflows", workflows);

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
        columns={columns as ColumnDef<any>[]}
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
