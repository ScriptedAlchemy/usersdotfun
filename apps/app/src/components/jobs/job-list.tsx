import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import type { Job } from "@usersdotfun/shared-types/types";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { JobActions } from "./job-actions";
import { JobSheet } from "./job-sheet";
import { StatusBadge } from "./status-badge";

interface JobListProps {
  jobs: Job[];
  isLoading: boolean;
  error: Error | null;
  onJobSelect: (job: Job) => void;
}

function SkeletonRow({ columnCount }: { columnCount: number }) {
  return (
    <TableRow className="animate-pulse">
      {Array.from({ length: columnCount }).map((_, index) => (
        <TableCell key={index}>
          <div className="h-4 bg-gray-200 rounded"></div>
        </TableCell>
      ))}
    </TableRow>
  );
}

export function JobList({ jobs, isLoading, error, onJobSelect }: JobListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const handleRowClick = (job: Job) => {
    onJobSelect(job);
  };

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row.original);
          }}
          className="text-blue-800 hover:text-blue-600 text-left"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: "schedule",
      header: "Schedule",
    },
    {
      accessorKey: "sourcePlugin",
      header: "Source Plugin",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <JobActions job={row.original} />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: jobs ?? [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Error loading jobs: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 border rounded"
          placeholder="Search all columns..."
        />
        <JobSheet>
          <Button>Create Job</Button>
        </JobSheet>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: " 🔼",
                    desc: " 🔽",
                  }[header.column.getIsSorted() as string] ?? null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} columnCount={columns.length} />
              ))
            : table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
