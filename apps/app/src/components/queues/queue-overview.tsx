import { QueueOverview } from '@usersdotfun/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, XCircle, Pause, Play } from 'lucide-react';

interface QueueOverviewProps {
  queues: Record<string, QueueOverview>;
  isLoading: boolean;
  onQueueSelect?: (queueName: string) => void;
}

export function QueueOverviewComponent({ queues, isLoading, onQueueSelect }: QueueOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const queueEntries = Object.entries(queues);

  if (queueEntries.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-gray-500">No queue data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {queueEntries.map(([queueName, queue]) => (
        <QueueCard
          key={queueName}
          queueName={queueName}
          queue={queue}
          onClick={() => onQueueSelect?.(queueName)}
        />
      ))}
    </div>
  );
}

interface QueueCardProps {
  queueName: string;
  queue: QueueOverview;
  onClick?: () => void;
}

function QueueCard({ queueName, queue, onClick }: QueueCardProps) {
  const getStatusIcon = () => {
    if (queue.status === 'paused') return <Pause className="h-4 w-4" />;
    return <Play className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (queue.status === 'paused') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const totalJobs = queue.waiting + queue.active + queue.delayed;
  const hasActivity = totalJobs > 0 || queue.failed > 0;

  return (
    <Card 
      className={`transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold capitalize">
            {queueName.replace('-', ' ')}
          </CardTitle>
          <Badge className={`${getStatusColor()} flex items-center gap-1`}>
            {getStatusIcon()}
            {queue.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Queue Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Waiting</span>
              <span className="font-medium">{queue.waiting}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active</span>
              <span className="font-medium text-blue-600">{queue.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Delayed</span>
              <span className="font-medium text-yellow-600">{queue.delayed}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-medium text-green-600">{queue.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="font-medium text-red-600">{queue.failed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-medium">{totalJobs}</span>
            </div>
          </div>
        </div>

        {/* Activity Indicator */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Activity</span>
            <div className="flex items-center gap-1">
              {hasActivity ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Active</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>Idle</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
