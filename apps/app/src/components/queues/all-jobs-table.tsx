import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { getAllQueueJobs } from '~/api/queues';
import { QueueItem } from '@usersdotfun/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { ArrowUpDown, Search, Filter } from 'lucide-react';
import { useWebSocket } from '~/lib/websocket';

type AllJobsItem = QueueItem & { queueName: string; status: string };

const columnHelper = createColumnHelper<AllJobsItem>();

const columns = [
  columnHelper.accessor('id', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Job ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-mono text-sm">{getValue()}</span>
    ),
  }),
  columnHelper.accessor('name', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue()}</span>
    ),
  }),
  columnHelper.accessor('queueName', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Queue
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <Badge variant="outline" className="capitalize">
        {getValue().replace('-', ' ')}
      </Badge>
    ),
  }),
  columnHelper.accessor('status', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => {
      const status = getValue();
      const getStatusColor = () => {
        switch (status) {
          case 'active': return 'bg-blue-100 text-blue-800';
          case 'waiting': return 'bg-yellow-100 text-yellow-800';
          case 'completed': return 'bg-green-100 text-green-800';
          case 'failed': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      };
      return (
        <Badge className={getStatusColor()}>
          {status}
        </Badge>
      );
    },
  }),
  columnHelper.accessor('progress', {
    header: 'Progress',
    cell: ({ getValue }) => {
      const progress = getValue();
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
      );
    },
  }),
  columnHelper.accessor('attemptsMade', {
    header: 'Attempts',
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue()}</span>
    ),
  }),
  columnHelper.accessor('timestamp', {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-auto p-0 font-semibold"
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-sm text-gray-600">
        {new Date(getValue()).toLocaleString()}
      </span>
    ),
  }),
  columnHelper.accessor('failedReason', {
    header: 'Error',
    cell: ({ getValue }) => {
      const error = getValue();
      return error ? (
        <span className="text-sm text-red-600 truncate max-w-32" title={error}>
          {error}
        </span>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  }),
];

interface AllJobsTableProps {
  className?: string;
}

export function AllJobsTable({ className }: AllJobsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const { isConnected } = useWebSocket();

  const { data, isLoading, error } = useQuery({
    queryKey: ['all-queue-jobs', statusFilter],
    queryFn: () => getAllQueueJobs(statusFilter === 'all' ? undefined : statusFilter, 200),
    staleTime: 25000, // Consider data fresh for 25 seconds
    gcTime: 4 * 60 * 1000, // Keep in cache for 4 minutes
    refetchInterval: isConnected ? 90000 : 20000, // 1.5 min if WebSocket connected, 20s if not
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });

  const table = useReactTable({
    data: data?.jobs || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-500">Error loading jobs: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Queue Jobs</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search jobs..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {data && (
          <p className="text-sm text-gray-600">
            Showing {table.getFilteredRowModel().rows.length} of {data.total} jobs
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold">
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-gray-50"
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No jobs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
