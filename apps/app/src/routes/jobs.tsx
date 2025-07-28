import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { getJobs, getJob, getJobMonitoringData, getJobRuns } from '~/api/jobs';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
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

const jobsSearchSchema = z.object({
  jobId: z.string().optional(),
});

export const Route = createFileRoute('/jobs')({
  validateSearch: jobsSearchSchema,
  component: JobsComponent,
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

function JobsComponent() {
  const navigate = useNavigate({ from: '/jobs' });
  const { jobId } = Route.useSearch();
  
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: getJobs,
  });
  
  const { data: selectedJob, isLoading: jobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
  });

  const { data: monitoringData, isLoading: monitoringLoading } = useQuery({
    queryKey: ['job-monitoring', jobId],
    queryFn: () => getJobMonitoringData(jobId!),
    enabled: !!jobId,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const { data: jobRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['job-runs', jobId],
    queryFn: () => getJobRuns(jobId!),
    enabled: !!jobId,
  });
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handleRowClick = (job: Job) => {
    navigate({
      search: { jobId: job.id },
    });
  };

  const handleCloseSheet = () => {
    navigate({
      search: {},
    });
  };

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
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

  const stepsTable = useReactTable({
    data: selectedJob?.pipeline?.steps ?? [],
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
        accessorKey: "config",
        header: "Config",
        cell: ({ getValue }) => (
          <pre className="text-xs overflow-auto max-w-xs">{JSON.stringify(getValue(), null, 2)}</pre>
        ),
      },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

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
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} columnCount={columns.length} />
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-red-500"
              >
                Error loading jobs: {error.message}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow 
                key={row.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(row.original)}
              >
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

      <Sheet open={!!jobId} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent side="right" className="sm:max-w-[600px] overflow-y-auto">
          {jobLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse">Loading job details...</div>
            </div>
          ) : selectedJob ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedJob.name}</SheetTitle>
                <SheetDescription>
                  Schedule: {selectedJob.schedule} | Status: {selectedJob.status}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h5 className="font-semibold mb-2">Source Configuration</h5>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm"><strong>Plugin:</strong> {selectedJob.sourcePlugin}</p>
                    <p className="text-sm mt-2"><strong>Config:</strong></p>
                    <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(selectedJob.sourceConfig, null, 2)}
                    </pre>
                    <p className="text-sm mt-2"><strong>Search:</strong></p>
                    <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(selectedJob.sourceSearch, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {monitoringData && (
                  <div>
                    <h5 className="font-semibold mb-2">Queue Status</h5>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <h6 className="font-medium text-sm">Source Queue</h6>
                        <div className="text-xs space-y-1">
                          <p>Waiting: {monitoringData.queueStatus.sourceQueue.waiting}</p>
                          <p>Active: {monitoringData.queueStatus.sourceQueue.active}</p>
                          <p>Completed: {monitoringData.queueStatus.sourceQueue.completed}</p>
                          <p>Failed: {monitoringData.queueStatus.sourceQueue.failed}</p>
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <h6 className="font-medium text-sm">Pipeline Queue</h6>
                        <div className="text-xs space-y-1">
                          <p>Waiting: {monitoringData.queueStatus.pipelineQueue.waiting}</p>
                          <p>Active: {monitoringData.queueStatus.pipelineQueue.active}</p>
                          <p>Completed: {monitoringData.queueStatus.pipelineQueue.completed}</p>
                          <p>Failed: {monitoringData.queueStatus.pipelineQueue.failed}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {jobRuns && jobRuns.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-2">Recent Runs</h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {jobRuns.slice(0, 10).map((run) => (
                        <div key={run.runId} className="bg-gray-50 p-2 rounded text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-mono">{run.runId.split(':').pop()}</span>
                            <StatusBadge status={run.status} />
                          </div>
                          <div className="text-gray-600 mt-1">
                            <p>Started: {new Date(run.startedAt).toLocaleString()}</p>
                            <p>Items: {run.itemsProcessed}/{run.itemsTotal}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="font-semibold mb-2">Pipeline Steps</h5>
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
          ) : jobId ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-red-500">Job not found</div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
