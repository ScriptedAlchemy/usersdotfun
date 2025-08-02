import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { DataTable } from "~/components/common/data-table";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAllQueueJobsQuery, useQueuesStatusQuery } from "~/hooks/use-api";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_layout/queues/")({
  component: QueuesPage,
  validateSearch: z.object({
    queueName: z.string().optional(),
  }),
});

import { Link } from "@tanstack/react-router";
import type { JobStatus } from "@usersdotfun/shared-types/types";
import { MoreHorizontal, Pause, Play, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { JobSheet } from "~/components/queues/job-sheet";
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
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import { useClearQueueMutation, usePauseQueueMutation, useRemoveQueueJobMutation, useResumeQueueMutation } from "~/hooks/use-api";

const columns = (
  openSheet: (job: JobStatus) => void,
): ColumnDef<JobStatus>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "Job ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
  },
  {
    accessorKey: "name",
    header: "Job Name",
  },
  {
    accessorKey: "data.workflowId",
    header: "Workflow ID",
    cell: ({ row }) => (
      <Link
        to="/workflows/$workflowId"
        params={{ workflowId: row.original.data.workflowId }}
        className="font-mono text-xs text-blue-500 hover:underline"
      >
        {row.original.data.workflowId}
      </Link>
    ),
  },
  {
    accessorKey: "attemptsMade",
    header: "Attempts",
  },
  {
    accessorKey: "timestamp",
    header: "Created At",
    cell: ({ row }) => new Date(row.original.timestamp).toLocaleString(),
  },
  {
    accessorKey: "processedOn",
    header: "Processed At",
    cell: ({ row }) => (row.original.processedOn ? new Date(row.original.processedOn).toLocaleString() : 'N/A'),
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const job = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openSheet(job)}>
              View
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function QueueStatusCard({
  name,
  stats,
  onClick,
  isSelected,
}: {
  name: string;
  stats: { active: number; waiting: number; failed: number, paused: boolean };
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer hover:border-primary",
        isSelected && "border-primary bg-muted"
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="capitalize">{name.replace(/-/g, " ")}</CardTitle>
          <Badge variant={stats.paused ? "secondary" : "default"}>
            {stats.paused ? "Paused" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex justify-between text-sm">
        <div className="flex flex-col items-center">
          <span className="font-bold">{stats.waiting}</span>
          <span className="text-muted-foreground">Waiting</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold">{stats.active}</span>
          <span className="text-muted-foreground">Active</span>
        </div>
        <div className="flex flex-col items-center text-red-500">
          <span className="font-bold">{stats.failed}</span>
          <span className="text-muted-foreground">Failed</span>
        </div>
      </CardContent>
    </Card>
  )
}

function QueuesPage() {
  const { queueName: selectedQueue } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: queuesStatus, isLoading: isLoadingStatus } = useQueuesStatusQuery() as { data: { name: string, active: number, waiting: number, failed: number, paused: boolean }[], isLoading: boolean };
  const { data: jobs, isLoading: isLoadingJobs } = useAllQueueJobsQuery({
    queueName: selectedQueue,
  }) as { data: { items: JobStatus[], total: number }, isLoading: boolean };
  const [rowSelection, setRowSelection] = useState({});
  const [selectedJob, setSelectedJob] = useState<JobStatus | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMutation = useRemoveQueueJobMutation();
  const pauseMutation = usePauseQueueMutation();
  const resumeMutation = useResumeQueueMutation();
  const clearMutation = useClearQueueMutation();

  const openSheet = (job: JobStatus) => {
    setSelectedJob(job);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setSelectedJob(null);
  };

  const handleQueueSelect = (queueName: string) => {
    navigate({
      search: (prev) => ({ ...prev, queueName: prev.queueName === queueName ? undefined : queueName }),
    });
  };

  const handleDelete = async () => {
    const idsToDelete = Object.keys(rowSelection);
    if (!selectedQueue) return;
    await toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          deleteMutation.mutateAsync({ queueName: selectedQueue, jobId: id })
        )
      ),
      {
        loading: "Deleting jobs...",
        success: "Jobs deleted successfully!",
        error: "Failed to delete jobs.",
      }
    );
    setRowSelection({});
    setDeleteDialogOpen(false);
  };

  const handleClear = async () => {
    if (!selectedQueue) return;
    await toast.promise(
      clearMutation.mutateAsync({ queueName: selectedQueue, jobType: 'all' }),
      {
        loading: "Clearing queue...",
        success: "Queue cleared successfully!",
        error: "Failed to clear queue.",
      }
    );
  };

  const pageColumns = columns(openSheet);

  return (
    <>
      <JobSheet
        job={selectedJob}
        isOpen={isSheetOpen}
        onClose={closeSheet}
      />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Queues</h1>
            <p className="text-muted-foreground">
              Monitor and manage all job queues.
            </p>
          </div>
        </div>

        <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Queue Status</h2>
        {isLoadingStatus ? (
          <p>Loading queue statuses...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {queuesStatus?.map((status) => (
              <QueueStatusCard
                key={status.name}
                name={status.name}
                stats={status}
                onClick={() => handleQueueSelect(status.name)}
                isSelected={selectedQueue === status.name}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {selectedQueue ? `${selectedQueue} Jobs` : "All Recent Jobs"}
          </h2>
          <div className="flex items-center space-x-2">
            {selectedQueue && (
              <>
                {Object.keys(rowSelection).length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({Object.keys(rowSelection).length})
                  </Button>
                )}
                {queuesStatus?.find(q => q.name === selectedQueue)?.paused ? (
                  <Button onClick={() => resumeMutation.mutateAsync(selectedQueue)}>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={() => pauseMutation.mutateAsync(selectedQueue)}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button variant="outline" onClick={handleClear}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
        <DataTable
          columns={pageColumns}
          data={jobs?.items || []}
          isLoading={isLoadingJobs}
          filterColumnId="id"
          filterPlaceholder="Filter by Job ID..."
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          getRowId={(row) => row.id}
        />
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected jobs.
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
    </>
  );
}
