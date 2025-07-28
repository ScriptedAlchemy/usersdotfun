import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '~/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '~/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Pause, 
  Play, 
  Trash2, 
  RotateCcw, 
  AlertTriangle 
} from 'lucide-react';
import { 
  pauseQueue, 
  resumeQueue, 
  clearQueue, 
  purgeFailedJobs 
} from '~/api/queues';

interface QueueActionsProps {
  queueName: string;
  isPaused: boolean;
  failedCount: number;
  totalCount: number;
  disabled?: boolean;
}

export function QueueActions({ 
  queueName, 
  isPaused, 
  failedCount, 
  totalCount, 
  disabled = false 
}: QueueActionsProps) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const pauseResumeMutation = useMutation({
    mutationFn: (action: 'pause' | 'resume') => 
      action === 'pause' ? pauseQueue(queueName) : resumeQueue(queueName),
    onSuccess: (data, action) => {
      toast.success(`Queue ${action}d`, {
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
    onError: (error: Error, action) => {
      toast.error(`Failed to ${action} queue`, {
        description: error.message,
      });
    },
    onSettled: () => setPendingAction(null),
  });

  const clearMutation = useMutation({
    mutationFn: () => clearQueue(queueName),
    onSuccess: (data) => {
      toast.success('Queue cleared', {
        description: `${data.affectedItems || 0} items removed`,
      });
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to clear queue', {
        description: error.message,
      });
    },
    onSettled: () => setPendingAction(null),
  });

  const purgeFailedMutation = useMutation({
    mutationFn: () => purgeFailedJobs(queueName),
    onSuccess: (data) => {
      toast.success('Failed jobs purged', {
        description: `${data.affectedItems || 0} failed jobs removed`,
      });
      queryClient.invalidateQueries({ queryKey: ['queues'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to purge failed jobs', {
        description: error.message,
      });
    },
    onSettled: () => setPendingAction(null),
  });

  const handlePauseResume = () => {
    const action = isPaused ? 'resume' : 'pause';
    setPendingAction(action);
    pauseResumeMutation.mutate(action);
  };

  const handleClear = () => {
    setPendingAction('clear');
    clearMutation.mutate();
  };

  const handlePurgeFailed = () => {
    setPendingAction('purge');
    purgeFailedMutation.mutate();
  };

  const isLoading = pendingAction !== null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Pause/Resume Button */}
      <Button
        variant={isPaused ? "default" : "outline"}
        size="sm"
        onClick={handlePauseResume}
        disabled={disabled || isLoading}
        className="flex items-center gap-1"
      >
        {isPaused ? (
          <>
            <Play className="h-3 w-3" />
            {pendingAction === 'resume' ? 'Resuming...' : 'Resume'}
          </>
        ) : (
          <>
            <Pause className="h-3 w-3" />
            {pendingAction === 'pause' ? 'Pausing...' : 'Pause'}
          </>
        )}
      </Button>

      {/* Clear Queue Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isLoading || totalCount === 0}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Clear Queue
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all pending jobs from the <strong>{queueName}</strong> queue.
              <br />
              <br />
              <strong>{totalCount}</strong> jobs will be permanently removed.
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="bg-red-600 hover:bg-red-700"
            >
              {pendingAction === 'clear' ? 'Clearing...' : 'Clear Queue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purge Failed Jobs Button */}
      {failedCount > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || isLoading}
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <RotateCcw className="h-3 w-3" />
              Purge Failed ({failedCount})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Purge Failed Jobs
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove all failed jobs from the <strong>{queueName}</strong> queue.
                <br />
                <br />
                <strong>{failedCount}</strong> failed jobs will be removed.
                <br />
                <br />
                This action cannot be undone. Consider retrying failed jobs first if they might succeed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePurgeFailed}
                className="bg-red-600 hover:bg-red-700"
              >
                {pendingAction === 'purge' ? 'Purging...' : 'Purge Failed Jobs'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
