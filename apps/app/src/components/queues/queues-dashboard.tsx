import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { QueueOverview } from "@usersdotfun/shared-types/types";
import { getQueuesOverview } from "~/api/queues";
import { QueueOverviewComponent } from "./queue-overview";
import { AllJobsTable } from "./all-jobs-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { queryKeys } from "~/lib/query-keys";
import { useWebSocket, useWebSocketSubscription } from "~/lib/websocket";
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Pause,
  Play,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface QueuesDashboardProps {
  onQueueSelect?: (queueName: string) => void;
}

export function QueuesDashboard({ onQueueSelect }: QueuesDashboardProps) {
  const navigate = useNavigate();
  const { isConnected } = useWebSocket();

  const {
    data: queuesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.queues.overview(),
    queryFn: getQueuesOverview,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: isConnected ? false : 30000,
    refetchIntervalInBackground: false,
  });

  useWebSocketSubscription("queue:status-changed", (data) => {
    console.log("Queue status changed:", data);
  });

  useWebSocketSubscription("queue:item-added", (data) => {
    console.log("Queue item added:", data);
  });

  useWebSocketSubscription("queue:item-completed", (data) => {
    console.log("Queue item completed:", data);
  });

  useWebSocketSubscription("queue:item-failed", (data) => {
    console.log("Queue item failed:", data);
  });

  const getSystemStats = () => {
    if (!queuesData?.queues) {
      return {
        totalQueues: 0,
        activeQueues: 0,
        pausedQueues: 0,
        totalJobs: 0,
        activeJobs: 0,
        waitingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        delayedJobs: 0,
      };
    }

    const queues = Object.values(queuesData.queues);
    
    return queues.reduce(
      (stats, queue) => {
        stats.totalQueues++;
        if (queue.status === "paused") {
          stats.pausedQueues++;
        } else {
          stats.activeQueues++;
        }
        
        stats.totalJobs += queue.waiting + queue.active + queue.delayed;
        stats.activeJobs += queue.active;
        stats.waitingJobs += queue.waiting;
        stats.completedJobs += queue.completed;
        stats.failedJobs += queue.failed;
        stats.delayedJobs += queue.delayed;
        
        return stats;
      },
      {
        totalQueues: 0,
        activeQueues: 0,
        pausedQueues: 0,
        totalJobs: 0,
        activeJobs: 0,
        waitingJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        delayedJobs: 0,
      }
    );
  };

  const handleQueueSelect = (queueName: string) => {
    if (onQueueSelect) {
      onQueueSelect(queueName);
    } else {
      navigate({ to: "/queues", search: { queue: queueName } });
    }
  };

  const stats = getSystemStats();

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Error loading queues: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Queue Management Dashboard</h1>
        <p className="text-gray-600">Monitor and manage job queues across the system</p>
      </div>

      {/* Queue Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <QueueOverviewComponent
            queues={queuesData?.queues || {}}
            isLoading={isLoading}
            onQueueSelect={handleQueueSelect}
          />
        </CardContent>
      </Card>

      {/* Recent Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Queue Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <AllJobsTable />
        </CardContent>
      </Card>
    </div>
  );
}
