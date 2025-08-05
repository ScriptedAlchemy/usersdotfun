import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { SourceItem } from "@usersdotfun/shared-types/types";
import { DataTable } from "~/components/common/data-table";
import { useWorkflowItemsQuery } from "~/hooks/use-api";

export const Route = createFileRoute("/_layout/workflows/$workflowId/items")({
  component: WorkflowItemsPage,
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
    cell: ({ row }) => {
      return (
        <pre className="text-xs bg-muted p-2 rounded-md">
          {JSON.stringify(row.original.data, null, 2)}
        </pre>
      );
    },
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
  const { workflowId } = useParams({
    from: "/_layout/workflows/$workflowId/items",
  });
  const { data: items, isLoading } = useWorkflowItemsQuery(workflowId);

  return (
    <div>
      <DataTable
        columns={columns}
        data={items || []}
        isLoading={isLoading}
        filterColumnId="id"
        filterPlaceholder="Filter by Item ID..."
      />
    </div>
  );
}
