import { createFileRoute, useNavigate, useLoaderData } from "@tanstack/react-router";
import { CommonSheet } from "~/components/common/common-sheet";
import type { JobStatus } from "@usersdotfun/shared-types/types";
import { allQueueJobsQueryOptions } from "~/lib/queries";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CodePreview } from "~/components/common/code-preview";

export const Route = createFileRoute("/_layout/queues/$jobId")({
  component: JobDetailsPage,
  loader: async ({ params: { jobId }, context: { queryClient } }) => {
    const jobs = await queryClient.ensureQueryData(allQueueJobsQueryOptions());
    const job = jobs?.items.find((j: JobStatus) => j.id === jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    return { job };
  },
  pendingComponent: () => (
    <CommonSheet
      isOpen={true}
      onClose={() => {}}
      title="Loading..."
      description="Loading job details..."
      className="sm:max-w-2xl"
    >
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </CommonSheet>
  ),
  errorComponent: ({ error, reset }) => (
    <CommonSheet
      isOpen={true}
      onClose={() => window.history.back()}
      title="Error"
      description="Failed to load job details"
      className="sm:max-w-2xl"
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load job details</AlertTitle>
        <AlertDescription className="mb-4">
          {error.message || "An unexpected error occurred"}
        </AlertDescription>
        <Button onClick={reset} variant="outline">
          Try Again
        </Button>
      </Alert>
    </CommonSheet>
  ),
});

function JobDetailsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { job } = useLoaderData({ from: Route.id });

  const handleClose = () => {
    navigate({
      to: "/queues",
    });
  };

  return (
    <CommonSheet
      isOpen={true}
      onClose={handleClose}
      title="Job Details"
      description="Detailed information about the selected job."
      className="sm:max-w-2xl"
    >
      {job && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Job ID</h3>
            <p className="font-mono text-sm">{job.id}</p>
          </div>
          <div>
            <h3 className="font-semibold">Job Name</h3>
            <p>{job.name}</p>
          </div>
          {"workflowId" in job.data && (
            <div>
              <h3 className="font-semibold">Workflow ID</h3>
              <p className="font-mono text-sm">{job.data.workflowId}</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold">Attempts Made</h3>
            <p>{job.attemptsMade}</p>
          </div>
          <div>
            <h3 className="font-semibold">Created At</h3>
            <p>{new Date(job.timestamp).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Processed At</h3>
            <p>
              {job.processedOn
                ? new Date(job.processedOn).toLocaleString()
                : "N/A"}
            </p>
          </div>
          {job.failedReason && (
            <div>
              <h3 className="font-semibold text-red-500">Failed Reason</h3>
              <p className="text-red-500">{job.failedReason}</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold">Data</h3>
            <CodePreview code={job.data} className="mt-1" />
          </div>
        </div>
      )}
    </CommonSheet>
  );
}
