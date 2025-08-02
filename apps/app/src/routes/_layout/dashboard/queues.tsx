import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { getQueueDetails, getQueuesOverview } from "~/api/queues";
import { QueueActions } from "~/components/queues/queue-actions";
import { QueueItemList } from "~/components/queues/queue-item-list";
import { QueuesDashboard } from "~/components/queues/queues-dashboard";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { signIn } from "~/lib/auth-client";
import { queryKeys } from "~/lib/query-keys";
import { useWebSocket, useWebSocketSubscription } from "~/lib/websocket";

const queuesSearchSchema = z.object({
  queue: z.string().optional(),
  statusFilter: z.string().optional(),
  queueFilter: z.string().optional(),
});

export const Route = createFileRoute("/_layout/dashboard/queues")({
  validateSearch: queuesSearchSchema,
  component: QueuesComponent,
});

function QueuesComponent() {
  const navigate = useNavigate({ from: "/queues" });
  const {
    queue: selectedQueue,
    statusFilter,
    queueFilter,
  } = Route.useSearch();
  const [selectedQueueName, setSelectedQueueName] = useState<string | null>(
    selectedQueue || null
  );
  const { isConnected } = useWebSocket();

  const {
    data: queuesData,
    isLoading: queuesLoading,
    error: queuesError,
  } = useQuery({
    queryKey: queryKeys.queues.overview(),
    queryFn: getQueuesOverview,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: isConnected ? false : 30000,
    refetchIntervalInBackground: false,
  });

  const { data: queueDetails, isLoading: detailsLoading } = useQuery({
    queryKey: queryKeys.queues.detail(selectedQueueName!),
    queryFn: () => getQueueDetails(selectedQueueName!),
    enabled: !!selectedQueueName,
    staleTime: 20000,
    gcTime: 3 * 60 * 1000,
    refetchInterval: isConnected ? false : 20000,
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

  const handleQueueSelect = (queueName: string) => {
    setSelectedQueueName(queueName);
  };

  const handleBackToOverview = () => {
    setSelectedQueueName(null);
  };

  if (queuesError) {
    return <AuthPrompt error={queuesError} />;
  }

  // Show detailed queue view
  if (selectedQueueName && queueDetails) {
    const selectedQueueOverview = queuesData?.queues[selectedQueueName];

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToOverview}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Button>
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {selectedQueueName.replace("-", " ")} Queue
            </h1>
            <p className="text-gray-600">
              Detailed queue monitoring and management
            </p>
          </div>
        </div>

        {selectedQueueOverview && (
          <Card>
            <CardHeader>
              <CardTitle>Queue Management</CardTitle>
            </CardHeader>
            <CardContent>
              <QueueActions
                queueName={selectedQueueName}
                isPaused={selectedQueueOverview.status === "paused"}
                failedCount={selectedQueueOverview.failed}
                totalCount={
                  selectedQueueOverview.waiting +
                  selectedQueueOverview.active +
                  selectedQueueOverview.delayed
                }
              />
            </CardContent>
          </Card>
        )}

        <QueueItemList
          queueName={selectedQueueName}
          items={queueDetails.items}
          isLoading={detailsLoading}
        />
      </div>
    );
  }

  // Show tabbed interface
  return (
    <div className="p-6">
      <QueuesDashboard onQueueSelect={handleQueueSelect} />
    </div>
  );
}
