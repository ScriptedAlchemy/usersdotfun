import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteJob } from '~/api/jobs'
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

  return (
    <div className="flex gap-2">
      <JobSheet job={job}>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </JobSheet>
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
