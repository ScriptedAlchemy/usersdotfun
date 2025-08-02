import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type {
  Job
} from "@usersdotfun/shared-types/types";
import { useState } from "react";
import { z } from "zod";
import { getJob, getJobMonitoringData, getJobRuns } from "~/api/workflows";
import { getQueuesOverview } from "~/api/queues";
import { JobDetailsSheet } from "~/components/workflows/job-details-sheet";
import { JobsDashboard } from "~/components/workflows/workflows-dashboard";
import { Button } from "~/components/ui/button";
import { signIn } from "~/lib/auth-client";
import { queryKeys } from "~/lib/query-keys";
import { useWebSocket, useWebSocketSubscription } from "~/lib/websocket";

const jobsSearchSchema = z.object({
  workflowId: z.string().optional(),
  queueFilter: z.string().optional(),
  statusFilter: z.string().optional(),
});

export const Route = createFileRoute("/_layout/dashboard/workflows")({
  validateSearch: jobsSearchSchema,
  component: JobsComponent,
});

function AuthPrompt({ error }: { error: Error }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.anonymous();
    } catch (error) {
      console.error("Anonymous sign in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthError = error.message.includes("Authentication required");

  if (!isAuthError) {
    return (
      <div className="text-center text-red-500 p-8">
        Error loading jobs: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">
          To view jobs, you need to sign in or continue as a guest.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleAnonymousSignIn}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Signing in..." : "Continue as Guest"}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-500">or</span>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate({ to: "/" })}
          className="w-full"
        >
          Go to Sign In
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center max-w-md">
        As a guest, you can view jobs but some features may be limited. Create
        an account for full access.
      </p>
    </div>
  );
}

function JobsComponent() {
  const navigate = useNavigate({ from: "/workflows" });
  const { workflowId, queueFilter, statusFilter } = Route.useSearch();
  const { isConnected } = useWebSocket();

  const { data: selectedJob, isLoading: jobLoading } = useQuery({
    queryKey: queryKeys.jobs.detail(workflowId!),
    queryFn: () => getJob(workflowId!),
    enabled: !!workflowId,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: monitoringData, isLoading: monitoringLoading } = useQuery({
    queryKey: queryKeys.jobs.monitoring(workflowId!),
    queryFn: () => getJobMonitoringData(workflowId!),
    enabled: !!workflowId,
    staleTime: 15000,
    gcTime: 3 * 60 * 1000,
    refetchInterval: isConnected ? false : 30000,
    refetchIntervalInBackground: false,
  });

  const { data: jobRuns, isLoading: runsLoading } = useQuery({
    queryKey: queryKeys.jobs.runs(workflowId!),
    queryFn: () => getJobRuns(workflowId!),
    enabled: !!workflowId,
    staleTime: 45000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: isConnected ? false : 60000,
    refetchIntervalInBackground: false,
  });

  const { data: queuesData } = useQuery({
    queryKey: queryKeys.queues.overview(),
    queryFn: getQueuesOverview,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: isConnected ? false : 30000,
    refetchIntervalInBackground: false,
  });

  useWebSocketSubscription("job:status-changed", (data) => {
    console.log("Job status changed:", data);
  });

  useWebSocketSubscription("job:monitoring-update", (data) => {
    console.log("Job monitoring update:", data);
  });

  useWebSocketSubscription("queue:status-changed", (data) => {
    console.log("Queue status changed:", data);
  });

  const handleJobSelect = (job: Job) => {
    navigate({
      search: (prev) => ({ ...prev, workflowId: job.id }),
    });
  };

  const handleCloseSheet = () => {
    navigate({
      search: (prev) => ({ ...prev, workflowId: undefined }),
    });
  };

  return (
    <div className="p-6">
      <JobsDashboard onJobSelect={handleJobSelect} />

      <JobDetailsSheet
        job={selectedJob || null}
        monitoringData={monitoringData}
        jobRuns={jobRuns}
        isOpen={!!workflowId}
        isJobLoading={jobLoading}
        isMonitoringLoading={monitoringLoading}
        isRunsLoading={runsLoading}
        onClose={handleCloseSheet}
      />
    </div>
  );
}
