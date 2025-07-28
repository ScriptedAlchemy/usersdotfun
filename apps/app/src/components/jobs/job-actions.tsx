import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteJob, retryJob } from '~/api/jobs'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import { JobSheet } from './job-sheet'
import { Job } from '~/types/jobs'

export function JobActions({ job }: { job: Job }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(job.id),
    onSuccess: () => {
      toast.success('Job deleted')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryJob(job.id),
    onSuccess: () => {
      toast.success('Job retry initiated')
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', job.id] })
      queryClient.invalidateQueries({ queryKey: ['job-monitoring', job.id] })
    },
    onError: (error) => {
      toast.error(`Failed to retry job: ${error.message}`);
    },
  });

  return (
    <div className="flex gap-2">
      <JobSheet job={job}>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </JobSheet>
      {(job.status === 'failed' || job.status === 'completed') && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => retryMutation.mutate()}
          disabled={retryMutation.isPending}
        >
          {retryMutation.isPending ? 'Retrying...' : 'Retry'}
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
      </Button>
    </div>
  );
}
