import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { type ColumnDef, type SortingState } from '@tanstack/react-table';
import { QueueItem } from '@usersdotfun/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '~/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  MoreHorizontal, 
  RotateCcw, 
  Trash2, 
  ExternalLink, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { retryQueueItem, removeQueueItem } from '~/api/queues';

interface QueueItemWithStatus extends QueueItem {
  status: 'waiting' | 'active' | 'failed' | 'delayed';
}

interface QueueItemListProps {
  queueName: string;
  items: {
    waiting: QueueItem[];
    active: QueueItem[];
    failed: QueueItem[];
    delayed: QueueItem[];
  };
  isLoading: boolean;
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

export function QueueItemList({ queueName, items, isLoading }: QueueItemListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  const retryMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => retryQueueItem(queueName, itemId),
    onSuccess: (data, { itemId }) => {
      toast.success('Item retried', {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    },
    onError: (error: Error, { itemId }) => {
      toast.error('Failed to retry item', {
        description: error.message,
      });
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => removeQueueItem(queueName, itemId),
    onSuccess: (data, { itemId }) => {
      toast.success('Item removed', {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    },
    onError: (error: Error, { itemId }) => {
      toast.error('Failed to remove item', {
        description: error.message,
      });
      setPendingActions(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    },
  });

  const handleRetry = (itemId: string) => {
    setPendingActions(prev => new Set(prev).add(itemId));
    retryMutation.mutate({ itemId });
  };

  const handleRemove = (itemId: string) => {
    setPendingActions(prev => new Set(prev).add(itemId));
    removeMutation.mutate({ itemId });
  };

  const handleViewJob = (jobId: string) => {
    navigate({ to: '/jobs', search: { jobId } });
  };

  const getStatusBadge = (status: 'waiting' | 'active' | 'failed' | 'delayed') => {
    const variants = {
      waiting: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      delayed: 'bg-yellow-100 text-yellow-800',
    };

    const icons = {
      waiting: <Clock className="h-3 w-3" />,
      active: <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />,
      failed: <AlertCircle className="h-3 w-3" />,
      delayed: <Clock className="h-3 w-3" />,
    };

    return (
      <Badge className={`${variants[status]} flex items-center gap-1`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Combine all items with their status
  const allItems: QueueItemWithStatus[] = [
    ...items.active.map(item => ({ ...item, status: 'active' as const })),
    ...items.waiting.map(item => ({ ...item, status: 'waiting' as const })),
    ...items.delayed.map(item => ({ ...item, status: 'delayed' as const })),
    ...items.failed.map(item => ({ ...item, status: 'failed' as const })),
  ];

  const columns: ColumnDef<QueueItemWithStatus>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          {row.original.jobId && (
            <span className="text-xs text-gray-500">Job: {row.original.jobId}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => getStatusBadge(getValue() as any),
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ getValue }) => {
        const progress = getValue() as number;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{progress}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'attemptsMade',
      header: 'Attempts',
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue() as number}</span>
      ),
    },
    {
      accessorKey: 'timestamp',
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="text-sm">
          {new Date(getValue() as number).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        const isPending = pendingActions.has(item.id);
        
        return (
          <div className="flex items-center gap-1">
            {item.jobId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewJob(item.jobId!);
                }}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(item.status === 'failed' || item.status === 'delayed') && (
                  <DropdownMenuItem
                    onClick={() => handleRetry(item.id)}
                    disabled={isPending}
                  >
                    <RotateCcw className="h-3 w-3 mr-2" />
                    Retry
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: allItems,
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queue Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((_, index) => (
                  <TableHead key={index}>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} columnCount={columns.length} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (allItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queue Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No items in queue
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Queue Items ({allItems.length})</CardTitle>
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="p-2 border rounded text-sm"
            placeholder="Search items..."
          />
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
