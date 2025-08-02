import { createFileRoute } from "@tanstack/react-router";
import { useAllQueueJobsQuery, useQueuesStatusQuery } from "~/hooks/use-api";
import { DataTable } from "~/components/common/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { JobData } from "@usersdotfun/shared-types/types";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useState } from "react";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_layout/dashboard/queues/")({
  component: QueuesPage,
});

// Using `any` for now as the JobData type is a union and doesn't fit the table well.
// We can create a more specific type for the table later.
const columns: ColumnDef<any>[] = [
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
    cell: ({ row }) => row.original.processedOn ? new Date(row.original.processedOn).toLocaleString() : 'N/A',
  },
];

function QueueStatusCard({
  name,
  stats,
  onClick,
  isSelected,
}: {
  name: string;
  stats: { active: number; waiting: number; failed: number };
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
        <CardTitle className="capitalize">{name.replace(/-/g, " ")}</CardTitle>
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
  );
}

function QueuesPage() {
  const [selectedQueue, setSelectedQueue] = useState<string | undefined>(undefined);
  const { data: queuesStatus, isLoading: isLoadingStatus } = useQueuesStatusQuery();
  const { data: jobs, isLoading: isLoadingJobs } = useAllQueueJobsQuery({
    queueName: selectedQueue,
  });

  const handleQueueSelect = (queueName: string) => {
    setSelectedQueue((prev) => (prev === queueName ? undefined : queueName));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Queues</h1>
        <p className="text-muted-foreground">
          Monitor and manage all job queues.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Queue Status</h2>
        {isLoadingStatus ? (
          <p>Loading queue statuses...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {queuesStatus && Object.entries(queuesStatus).map(([name, stats]) => (
              <QueueStatusCard
                key={name}
                name={name}
                stats={stats}
                onClick={() => handleQueueSelect(name)}
                isSelected={selectedQueue === name}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {selectedQueue ? `${selectedQueue} Jobs` : "All Recent Jobs"}
        </h2>
        <DataTable
          columns={columns}
          data={jobs?.items || []}
          isLoading={isLoadingJobs}
          filterColumnId="id"
          filterPlaceholder="Filter by Job ID..."
        />
      </div>
    </div>
  );
}
