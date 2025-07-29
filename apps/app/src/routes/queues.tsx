
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getQueuesOverview, getQueueDetails } from '~/api/queues';
import { QueueOverviewComponent } from '~/components/queues/queue-overview';
import { QueueActions } from '~/components/queues/queue-actions';
import { QueueItemList } from '~/components/queues/queue-item-list';
import { AllJobsTable } from '~/components/queues/all-jobs-table';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useWebSocketSubscription, useWebSocket } from '~/lib/websocket';
import { signIn } from '~/lib/auth-client';
import { queryKeys } from '~/lib/query-keys';

const queuesSearchSchema = z.object({
  queue: z.string().optional(),
});

export const Route = createFileRoute('/queues')({
  validateSearch: queuesSearchSchema,
  component: QueuesComponent,
});

function AuthPrompt({ error }: { error: Error }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.anonymous();
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthError = error.message.includes('Authentication required');

  if (!isAuthError) {
    return (
      <div className="text-center text-red-500 p-8">
        Error loading queues: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">
          To view queues, you need to sign in or continue as a guest.
        </p>
      </div>
      
      <div className="space-y-3">
        <Button 
          onClick={handleAnonymousSignIn} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Signing in...' : 'Continue as Guest'}
        </Button>
        
        <div className="text-center">
          <span className="text-sm text-gray-500">or</span>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => navigate({ to: '/' })}
          className="w-full"
        >
          Go to Sign In
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 text-center max-w-md">
        As a guest, you can view queues but some features may be limited. 
        Create an account for full access.
      </p>
    </div>
  );
}

function QueuesComponent() {
  const { queue: selectedQueue } = Route.useSearch();
  const [selectedQueueName, setSelectedQueueName] = useState<string | null>(selectedQueue || null);
  const { isConnected } = useWebSocket();

  // Fetch queues overview with WebSocket-aware polling
  const { data: queuesData, isLoading: queuesLoading, error: queuesError } = useQuery({
    queryKey: queryKeys.queues.overview(),
    queryFn: getQueuesOverview,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    // Minimal polling as fallback only when WebSocket is disconnected
    refetchInterval: isConnected ? false : 30000,
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });

  // Fetch detailed queue data when a queue is selected
  const { data: queueDetails, isLoading: detailsLoading } = useQuery({
    queryKey: queryKeys.queues.detail(selectedQueueName!),
    queryFn: () => getQueueDetails(selectedQueueName!),
    enabled: !!selectedQueueName,
    staleTime: 20000, // Consider data fresh for 20 seconds
    gcTime: 3 * 60 * 1000, // Keep in cache for 3 minutes
    // Minimal polling as fallback only when WebSocket is disconnected
    refetchInterval: isConnected ? false : 20000,
    refetchIntervalInBackground: false,
  });

  // WebSocket subscriptions for real-time updates
  useWebSocketSubscription('queue:status-changed', (data) => {
    console.log('Queue status changed:', data);
    // Cache invalidation handled in WebSocket provider
  });

  useWebSocketSubscription('queue:item-added', (data) => {
    console.log('Queue item added:', data);
  });

  useWebSocketSubscription('queue:item-completed', (data) => {
    console.log('Queue item completed:', data);
  });

  useWebSocketSubscription('queue:item-failed', (data) => {
    console.log('Queue item failed:', data);
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
        {/* Header with back button */}
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
              {selectedQueueName.replace('-', ' ')} Queue
            </h1>
            <p className="text-gray-600">
              Detailed queue monitoring and management
            </p>
          </div>
        </div>

        {/* Queue Actions */}
        {selectedQueueOverview && (
          <Card>
            <CardHeader>
              <CardTitle>Queue Management</CardTitle>
            </CardHeader>
            <CardContent>
              <QueueActions
                queueName={selectedQueueName}
                isPaused={selectedQueueOverview.status === 'paused'}
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

        {/* Queue Items */}
        <QueueItemList
          queueName={selectedQueueName}
          items={queueDetails.items}
          isLoading={detailsLoading}
        />
      </div>
    );
  }

  // Show overview of all queues
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Queue Monitoring</h1>
        <p className="text-gray-600">
          Monitor and manage job queues across the system
        </p>
      </div>

      {/* Queue Overview Cards */}
      <QueueOverviewComponent
        queues={queuesData?.queues || {}}
        isLoading={queuesLoading}
        onQueueSelect={handleQueueSelect}
      />

      {/* Global Queue Stats */}
      {queuesData && Object.keys(queuesData.queues).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(queuesData.queues).map(([queueName, queue]) => (
                <div key={queueName} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {queue.waiting + queue.active + queue.delayed}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {queueName.replace('-', ' ')} Total
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
              Last updated: {queuesData.timestamp ? new Date(queuesData.timestamp).toLocaleString() : 'Unknown'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Jobs Table */}
      <AllJobsTable />
    </div>
  );
}
