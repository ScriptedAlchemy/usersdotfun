import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Job } from "@usersdotfun/shared-types/types";
import { toast } from "sonner";
import { deleteJob, retryJob } from "~/api/workflows";
import { Button } from "~/components/ui/button";
import { queryKeys } from "~/lib/query-keys";
import { JobSheet } from "./job-sheet";

export function JobActions({ job }: { job: Job }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(job.id),
    onSuccess: () => {
      toast.success("Job deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
    },
    onError: (error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryJob(job.id),
    onSuccess: () => {
      toast.success("Job retry initiated");
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.detail(job.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs.monitoring(job.id),
      });
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
      {(job.status === "failed" || job.status === "completed") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => retryMutation.mutate()}
          disabled={retryMutation.isPending}
        >
          {retryMutation.isPending ? "Retrying..." : "Retry"}
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => deleteMutation.mutate()}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
