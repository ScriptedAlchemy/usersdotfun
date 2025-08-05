import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
  useParams,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { SourceItem } from "@usersdotfun/shared-types/types";
import { useState } from "react";
import { DataTable } from "~/components/common/data-table";
import { Button } from "~/components/ui/button";
import {
  workflowItemsQueryOptions,
  workflowQueryOptions,
} from "~/lib/queries";

export const Route = createFileRoute("/_layout/workflows/$workflowId/items")({
  component: WorkflowItemsPage,
  loader: async ({ params: { workflowId }, context: { queryClient } }) => {
    const [items, workflow] = await Promise.all([
      queryClient.ensureQueryData(workflowItemsQueryOptions(workflowId)),
      queryClient.ensureQueryData(workflowQueryOptions(workflowId)),
    ]);
    return { workflow, items };
  },
});

const columns: ColumnDef<SourceItem>[] = [
  {
    accessorKey: "id",
    header: "Item ID",
    cell: ({ row }) => {
      const item = row.original;
      const { workflowId } = useParams({
        from: "/_layout/workflows/$workflowId/items",
      });
      return (
        <Link
          to="/workflows/$workflowId/items/$itemId"
          params={{ workflowId, itemId: item.id }}
          className="font-mono text-sm text-primary hover:underline"
        >
          {item.id.slice(0, 12)}...
        </Link>
      );
    },
  },
  {
    accessorKey: "data",
    header: "Data",
    cell: function Cell({ row }) {
      const [isExpanded, setIsExpanded] = useState(false);
      const content = row.original.data?.content;
      const displayContent =
        typeof content === "string"
          ? content.slice(0, 50) + (content.length > 50 ? "..." : "")
          : "No content";

      return (
        <div>
          <div className="flex items-center justify-between">
            <span className="truncate pr-4">{displayContent}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
          {isExpanded && (
            <pre className="text-xs bg-muted p-2 rounded-md w-full mt-2">
              {JSON.stringify(row.original.data, null, 2)}
            </pre>
          )}
        </div>
      );
    },
    size: 400,
  },
  {
    accessorKey: "processedAt",
    header: "Processed At",
    cell: ({ row }) =>
      row.original.processedAt
        ? new Date(row.original.processedAt).toLocaleString()
        : "Pending",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
];

function WorkflowItemsPage() {
  const { workflow, items } = useLoaderData({
    from: "/_layout/workflows/$workflowId/items",
  });

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Workflow Items: {workflow?.name}
        </h1>
        <p className="text-muted-foreground">
          View and inspect the items processed by your workflow.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={items || []}
        filterColumnId="id"
        filterPlaceholder="Filter by Item ID..."
      />
      <Outlet />
    </div>
  );
}
