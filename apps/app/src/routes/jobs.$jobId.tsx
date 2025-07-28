import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { getJob, getJobs } from "~/api/jobs";
import { NotFound } from "~/components/NotFound";
import { Job } from '~/types/jobs';
import { useState } from 'react';
import { StatusBadge } from '~/components/jobs/status-badge';
import { JobActions } from '~/components/jobs/job-actions';
import { JobSheet } from '~/components/jobs/job-sheet';
import { Button } from '~/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

export const Route = createFileRoute("/jobs/$jobId")({
  loader: ({ context: { queryClient }, params: { jobId } }) =>
    queryClient.ensureQueryData({
      queryKey: ["job", jobId],
      queryFn: () => getJob(jobId),
    }),
  component: JobComponent,
  notFoundComponent: () => {
    return <NotFound>Job not found</NotFound>;
  },
});

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

function JobComponent() {
  const { jobId } = Route.useParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  });

  const {
    data: job,
    isLoading: jobLoading,
    error: jobError,
  } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
  });

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link
          to="/jobs/$jobId"
          params={{ jobId: row.original.id }}
          className="text-blue-800 hover:text-blue-600"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: 'schedule',
      header: 'Schedule',
    },
    {
      accessorKey: 'sourcePlugin',
      header: 'Source Plugin',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => <JobActions job={row.original} />,
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

  const stepsTable = useReactTable({
    data: job?.steps ?? [],
    columns: [
      {
        accessorKey: "stepId",
        header: "Step ID",
      },
      {
        accessorKey: "pluginName",
        header: "Plugin",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "input",
        header: "Input",
        cell: ({ getValue }) => (
          <pre className="text-xs overflow-auto max-w-xs">{JSON.stringify(getValue(), null, 2)}</pre>
        ),
      },
      {
        accessorKey: "output",
        header: "Output",
        cell: ({ getValue }) => (
          <pre className="text-xs overflow-auto max-w-xs">{JSON.stringify(getValue(), null, 2)}</pre>
        ),
      },
      {
        accessorKey: "error",
        header: "Error",
        cell: ({ getValue }) => (
          <pre className="text-xs overflow-auto max-w-xs">{JSON.stringify(getValue(), null, 2)}</pre>
        ),
      },
      {
        accessorKey: "startedAt",
        header: "Started",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "N/A",
      },
      {
        accessorKey: "completedAt",
        header: "Completed",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "N/A",
      },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  if (jobError) return <div>Error: {jobError.message}</div>;

  return (
    <div className="p-2">
      <div className="flex justify-between mb-2">
        <input
          value={globalFilter ?? ''}
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
                    asc: ' 🔼',
                    desc: ' 🔽',
                  }[header.column.getIsSorted() as string] ?? null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {jobsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} columnCount={columns.length} />
            ))
          ) : jobsError ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-red-500"
              >
                Error loading jobs: {jobsError.message}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Sheet open={!!job} onOpenChange={() => window.history.back()}>
        <SheetContent side="right" className="sm:max-w-[600px] overflow-y-auto">
          {jobLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse">Loading job details...</div>
            </div>
          ) : job ? (
            <>
              <SheetHeader>
                <SheetTitle>{job.name}</SheetTitle>
                <SheetDescription>
                  Schedule: {job.schedule} | Status: {job.status}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h5 className="font-semibold mb-2">Job Steps</h5>
                  <Table>
                    <TableHeader>
                      {stepsTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="text-xs">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {stepsTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="text-xs">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-red-500">Job not found</div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
