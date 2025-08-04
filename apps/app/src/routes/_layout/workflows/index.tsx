import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useWorkflowsQuery,
  useToggleWorkflowStatusMutation,
  useRunWorkflowNowMutation,
  useDeleteWorkflowMutation,
} from "~/hooks/use-api";
import { DataTable } from "~/components/common/data-table";
import { Button } from "~/components/ui/button";
import { PlusCircle, Play, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { WorkflowSheet } from "~/components/workflows/workflow-sheet";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { RichWorkflow } from "@usersdotfun/shared-types/types";

export const Route = createFileRoute("/_layout/workflows/")({
  component: WorkflowsPage,
});

const columns = (
  openSheet: (mode: "view" | "edit", workflowId: string) => void,
): ColumnDef<RichWorkflow>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value: boolean) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    enableSorting: false,
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
      const navigate = useNavigate({ from: Route.path });
      const toggleMutation = useToggleWorkflowStatusMutation();
      const runMutation = useRunWorkflowNowMutation();

      const handleRunNow = async () => {
        const promise = runMutation.mutateAsync(workflow.id);
        toast.promise(promise, {
          loading: "Triggering workflow...",
          success: (data) => {
            navigate({
              to: "/workflows/$workflowId/runs/$runId",
              params: { workflowId: workflow.id, runId: data.id },
            });
            return "Workflow triggered successfully!";
          },
          error: "Failed to trigger workflow.",
        });
      };

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
            onClick={handleRunNow}
          >
            <Play className="mr-2 h-4 w-4" />
            Run Now
          </Button>
          <Link to="/workflows/$workflowId/runs" params={{ workflowId: workflow.id }}>
            <Button variant="outline" size="sm">
              View Runs
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openSheet("view", workflow.id)}>
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openSheet("edit", workflow.id)}>
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

function WorkflowsPage() {
  const { data: workflows, isLoading } = useWorkflowsQuery();
  const [sheetState, setSheetState] = useState<{
    mode: "create" | "view" | "edit";
    workflowId?: string;
    isOpen: boolean;
  }>({
    mode: "create",
    isOpen: false,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMutation = useDeleteWorkflowMutation();

  const openSheet = (
    mode: "create" | "view" | "edit",
    workflowId?: string,
  ) => {
    setSheetState({ mode, workflowId, isOpen: true });
  };

  const closeSheet = () => {
    setSheetState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDelete = async () => {
    const idsToDelete = Object.keys(rowSelection);
    await toast.promise(
      Promise.all(idsToDelete.map((id) => deleteMutation.mutateAsync(id))),
      {
        loading: "Deleting workflows...",
        success: "Workflows deleted successfully!",
        error: "Failed to delete workflows.",
      },
    );
    setRowSelection({});
    setDeleteDialogOpen(false);
  };

  const pageColumns = columns(openSheet);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automated workflows.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {Object.keys(rowSelection).length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({Object.keys(rowSelection).length})
            </Button>
          )}
          <Button onClick={() => openSheet("create")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      </div>

      <DataTable
        columns={pageColumns as ColumnDef<any>[]}
        data={workflows || []}
        isLoading={isLoading}
        filterColumnId="name"
        filterPlaceholder="Filter by name..."
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        getRowId={(row) => row.id}
        // onRowClick={(row) => openSheet("view", row)}
      />

      <WorkflowSheet
        mode={sheetState.mode}
        isOpen={sheetState.isOpen}
        onClose={closeSheet}
        workflowId={sheetState.workflowId}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected workflows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
