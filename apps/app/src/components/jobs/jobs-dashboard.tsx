import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { Job } from "@usersdotfun/shared-types/types";
import { useState } from "react";
import { getJobs } from "~/api/jobs";
import { JobActions } from "./job-actions";
import { JobSheet } from "./job-sheet";
import { StatusBadge } from "./status-badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { queryKeys } from "~/lib/query-keys";
import { useWebSocket, useWebSocketSubscription } from "~/lib/websocket";
import { Search, Plus, Activity, Clock, CheckCircle, XCircle } from "lucide-react";

interface JobsDashboardProps {
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

export function JobsDashboard({ onJobSelect }: JobsDashboardProps) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true }
  ]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { isConnected } = useWebSocket();

  const {
    data: jobs,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.jobs.lists(),
    queryFn: getJobs,
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: isConnected ? false : 60000,
    refetchIntervalInBackground: false,
  });

  useWebSocketSubscription("job:status-changed", (data) => {
    console.log("Job status changed:", data);
  });

  useWebSocketSubscription("job:created", (data) => {
    console.log("Job created:", data);
  });

  useWebSocketSubscription("job:deleted", (data) => {
    console.log("Job deleted:", data);
  });

  const handleRowClick = (job: Job) => {
    onJobSelect(job);
  };

  const getJobStats = () => {
    if (!jobs) return { total: 0, running: 0, completed: 0, failed: 0, pending: 0 };
    
    return jobs.reduce(
      (stats, job) => {
        stats.total++;
        switch (job.status) {
          case "running":
            stats.running++;
            break;
          case "completed":
            stats.completed++;
            break;
          case "failed":
            stats.failed++;
            break;
          case "pending":
            stats.pending++;
            break;
        }
        return stats;
      },
      { total: 0, running: 0, completed: 0, failed: 0, pending: 0 }
    );
  };

  const stats = getJobStats();

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "name",
      header: "Job Name",
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row.original);
          }}
          className="text-blue-600 hover:text-blue-800 hover:underline text-left font-medium"
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
      cell: ({ getValue }) => {
        const schedule = getValue() as string;
        return schedule ? (
          <Badge variant="outline" className="font-mono text-xs">
            {schedule}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">One-time</span>
        );
      },
    },
    {
      accessorKey: "sourcePlugin",
      header: "Source",
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="text-xs">
          {(getValue() as string).replace("@curatedotfun/", "")}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">
          {new Date(getValue() as string).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-600">
          {new Date(getValue() as string).toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Jobs Dashboard</h1>
          <p className="text-gray-600">Manage and monitor your job definitions</p>
        </div>
        <JobSheet>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Job
          </Button>
        </JobSheet>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
                <p className="text-sm text-gray-600">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Job Definitions</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-64"
                placeholder="Search jobs..."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer font-semibold"
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
          
          {!isLoading && table.getRowModel().rows.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No jobs found. Create your first job to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
