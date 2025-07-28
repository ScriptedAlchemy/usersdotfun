import { Outlet, createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getJobs } from '~/api/jobs';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { type ColumnDef, type SortingState } from '@tanstack/react-table'
import { Job } from '~/types/jobs'
import { useState } from 'react'
import { StatusBadge } from '~/components/jobs/status-badge'
import { JobActions } from '~/components/jobs/job-actions'
import { JobDialog } from '~/components/jobs/job-dialog'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/jobs')({
  component: JobsComponent,
});

function JobsComponent() {
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading jobs: {error.message}</div>;

  return (
    <div className="p-2">
      <div className="flex justify-between mb-2">
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 border rounded"
          placeholder="Search all columns..."
        />
        <JobDialog>
          <Button>Create Job</Button>
        </JobDialog>
      </div>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
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
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="p-2 border-b">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-4" />
      <Outlet />
    </div>
  );
}
