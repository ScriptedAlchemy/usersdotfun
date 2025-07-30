import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
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
import { getAllQueueJobs, getQueuesOverview, retryQueueItem, removeQueueItem } from '~/api/queues';
import { getJob, getJobMonitoringData, getJobRuns, cleanupOrphanedJobs } from '~/api/jobs';
import { queueItemSchema } from '@usersdotfun/shared-types/schemas';
import { z } from 'zod';

type QueueItem = z.infer<typeof queueItemSchema>;
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { ArrowUpDown, Search, Filter, Trash2, RotateCcw, Eraser } from 'lucide-react';
import { useWebSocket } from '~/lib/websocket';
import { toast } from 'sonner';
import { QueueItemDetailsSheet } from './queue-item-details-sheet';
import { parseQueueJobId } from '~/lib/queue-utils';
import { queryKeys } from '~/lib/query-keys';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';

type AllJobsItem = QueueItem & { queueName: string; status: string; originalJobId?: string };

interface AllJobsTableProps {
  className?: string;
}

export function AllJobsTable({ className }: AllJobsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [queueFilter, setQueueFilter] = useState<string>('all');
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedQueueItem, setSelectedQueueItem] = useState<AllJobsItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AllJobsItem | null>(null);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch queue jobs with filters
  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.queues.allJobs(), statusFilter, queueFilter],
    queryFn: () => getAllQueueJobs({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      queueName: queueFilter === 'all' ? undefined : queueFilter,
      limit: 200 
    }),
    staleTime: 25000,
    gcTime: 4 * 60 * 1000,
    refetchInterval: isConnected ? 90000 : 20000,
    refetchIntervalInBackground: false,
  });

  // Fetch available queues for filter dropdown
  const { data: queuesData } = useQuery({
    queryKey: queryKeys.queues.overview(),
    queryFn: getQueuesOverview,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch job details when a queue item is selected
  const actualJobId = selectedQueueItem?.originalJobId || (selectedQueueItem ? parseQueueJobId(selectedQueueItem.id).jobId : null);
  
  const { data: selectedJob, isLoading: jobLoading, error: jobError } = useQuery({
    queryKey: queryKeys.jobs.detail(actualJobId!),
    queryFn: () => getJob(actualJobId!),
    enabled: !!actualJobId && actualJobId !== selectedQueueItem?.id,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (job not found)
      if (error?.isNotFound) return false;
      return failureCount < 3;
    },
  });

  const { data: monitoringData, isLoading: monitoringLoading, error: monitoringError } = useQuery({
    queryKey: queryKeys.jobs.monitoring(actualJobId!),
    queryFn: () => getJobMonitoringData(actualJobId!),
    enabled: !!actualJobId && actualJobId !== selectedQueueItem?.id && !jobError?.isNotFound,
    staleTime: 15000,
    gcTime: 3 * 60 * 1000,
    refetchInterval: isConnected ? 60000 : 15000,
    refetchIntervalInBackground: false,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (job not found)
      if (error?.isNotFound) return false;
      return failureCount < 3;
    },
  });

  const { data: jobRuns, isLoading: runsLoading, error: runsError } = useQuery({
    queryKey: queryKeys.jobs.runs(actualJobId!),
    queryFn: () => getJobRuns(actualJobId!),
    enabled: !!actualJobId && actualJobId !== selectedQueueItem?.id && !jobError?.isNotFound,
    staleTime: 45000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: isConnected ? 90000 : 30000,
    refetchIntervalInBackground: false,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (job not found)
      if (error?.isNotFound) return false;
      return failureCount < 3;
    },
  });

  // Mutations for actions
  const retryMutation = useMutation({
    mutationFn: ({ queueName, itemId }: { queueName: string; itemId: string }) =>
      retryQueueItem(queueName, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
    },
  });

  const deleteMutation = useMutation({
    mutationKey: ['removeQueueItem'],
    mutationFn: ({ queueName, itemId }: { queueName: string; itemId: string }) =>
      removeQueueItem(queueName, itemId),
    onMutate: async ({ itemId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.queues.allJobs() });
      
      // Snapshot the previous value
      const previousJobs = queryClient.getQueryData([...queryKeys.queues.allJobs(), statusFilter, queueFilter]);
      
      // Optimistically update to remove the item
      queryClient.setQueryData([...queryKeys.queues.allJobs(), statusFilter, queueFilter], (old: any) => {
        if (!old?.jobs) return old;
        return {
          ...old,
          jobs: old.jobs.filter((job: AllJobsItem) => job.id !== itemId),
          total: Math.max(0, old.total - 1)
        };
      });

      // Close the details sheet if it's showing the deleted item
      if (selectedQueueItem?.id === itemId) {
        setSelectedQueueItem(null);
      }
      
      return { previousJobs };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousJobs) {
        queryClient.setQueryData([...queryKeys.queues.allJobs(), statusFilter, queueFilter], context.previousJobs);
      }
      console.error('Failed to delete queue item:', err);
    },
    onSuccess: (data, { itemId }) => {
      // Don't invalidate immediately - let the optimistic update stand
      // The WebSocket event will handle the final invalidation after server cache is updated
      console.log('Delete successful:', data.message);
      
      // Just update UI state
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      
      // Delay invalidation to allow server-side cache to update
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
      }, 500);
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: cleanupOrphanedJobs,
    onSuccess: (data) => {
      toast.success('Cleanup completed', {
        description: `Cleaned up ${data.cleaned} orphaned jobs`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
      setCleanupDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Failed to cleanup orphaned jobs', {
        description: error.message,
      });
    },
  });

  const handleRowClick = (queueItem: AllJobsItem) => {
    setSelectedQueueItem(queueItem);
  };

  const handleJobIdClick = (queueItem: AllJobsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const actualJobId = queueItem.originalJobId || parseQueueJobId(queueItem.id).jobId;
    navigate({ to: '/jobs', search: { jobId: actualJobId } });
  };

  const handleRetry = (queueItem: AllJobsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    retryMutation.mutate({
      queueName: queueItem.queueName,
      itemId: queueItem.id,
    });
  };

  const handleDelete = (queueItem: AllJobsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(queueItem);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({
        queueName: itemToDelete.queueName,
        itemId: itemToDelete.id,
      });
    }
  };

  const handleCleanup = () => {
    setCleanupDialogOpen(true);
  };

  const confirmCleanup = () => {
    cleanupMutation.mutate();
  };

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
      cell: ({ getValue, row }) => {
        const parsedId = parseQueueJobId(getValue());
        return (
          <button
            onClick={(e) => handleJobIdClick(row.original, e)}
            className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
            title={`Click to view job: ${parsedId.jobId}`}
          >
            {parsedId.prefix ? `${parsedId.prefix}:${parsedId.jobId}` : parsedId.jobId}
          </button>
        );
      },
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
            case 'delayed': return 'bg-purple-100 text-purple-800';
            case 'scheduled': return 'bg-indigo-100 text-indigo-800';
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
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const queueItem = row.original;
        const canRetry = ['failed', 'waiting'].includes(queueItem.status);
        
        return (
          <div className="flex items-center gap-1">
            {canRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleRetry(queueItem, e)}
                disabled={retryMutation.isPending}
                className="h-8 w-8 p-0"
                title="Retry job"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleDelete(queueItem, e)}
              disabled={deleteMutation.isPending}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
              title="Delete job"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    }),
  ];

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

  const availableQueues = queuesData ? Object.keys(queuesData.queues) : [];

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
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <CardTitle>All Queue Jobs</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanup}
                  disabled={cleanupMutation.isPending}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  {cleanupMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
                  ) : (
                    <Eraser className="h-4 w-4 mr-2" />
                  )}
                  Cleanup Orphaned
                </Button>
              </div>
            </div>
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
                <Select value={queueFilter} onValueChange={setQueueFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Queues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Queues</SelectItem>
                    {availableQueues.map((queueName) => (
                      <SelectItem key={queueName} value={queueName}>
                        {queueName.replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
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

      {/* Queue Item Details Sheet */}
      <QueueItemDetailsSheet
        queueItem={selectedQueueItem}
        job={selectedJob}
        monitoringData={monitoringData}
        jobRuns={jobRuns}
        isOpen={!!selectedQueueItem}
        isJobLoading={jobLoading}
        isMonitoringLoading={monitoringLoading}
        isRunsLoading={runsLoading}
        jobError={jobError}
        monitoringError={monitoringError}
        runsError={runsError}
        onClose={() => setSelectedQueueItem(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Queue Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this queue item? This action cannot be undone.
              {itemToDelete && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Item:</strong> {itemToDelete.name || itemToDelete.id}<br />
                  <strong>Queue:</strong> {itemToDelete.queueName}<br />
                  <strong>Status:</strong> {itemToDelete.status}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cleanup Orphaned Jobs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cleanup orphaned jobs? This will remove jobs that are no longer referenced by their queues.
              <div className="mt-2 p-2 bg-orange-50 rounded text-sm text-orange-800">
                <strong>Warning:</strong> This action cannot be undone. Only orphaned jobs will be removed.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCleanup}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={cleanupMutation.isPending}
            >
              {cleanupMutation.isPending ? 'Cleaning up...' : 'Cleanup Orphaned Jobs'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
