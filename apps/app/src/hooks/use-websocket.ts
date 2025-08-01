import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { type WebSocketEvent } from '@usersdotfun/shared-types/types';

export const useWebSocketInvalidator = (wsUrl: string) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      
      // TODO: event type enum in shared-types
      ws.send(JSON.stringify({ type: 'subscribe', eventType: 'workflow:run-started' }));
      ws.send(JSON.stringify({ type: 'subscribe', eventType: 'workflow:run-completed' }));
      ws.send(JSON.stringify({ type: 'subscribe', eventType: 'plugin:run-completed' }));
      ws.send(JSON.stringify({ type: 'subscribe', eventType: 'plugin:run-failed' }));
      ws.send(JSON.stringify({ type: 'subscribe', eventType: 'queue:status-update' }));
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketEvent;

        // Invalidate queries based on the event type
        switch (message.type) {
          case 'workflow:run-started':
          case 'workflow:run-completed':
            // A run's status changed, so refetch the list of runs for its parent workflow
            queryClient.invalidateQueries({ // TODO: use query keys
              queryKey: ['workflows', message.data.workflowId, 'runs'],
            });
            // Also invalidate the workflow list to update status counts
            queryClient.invalidateQueries({
              queryKey: ['workflows'],
            });
            break;

          case 'plugin:run-completed':
          case 'plugin:run-failed':
            // A step inside a run changed, so refetch the details for that specific run
            queryClient.invalidateQueries({
              queryKey: ['runs', message.data.workflowRunId, 'details'],
            });
            break;

          case 'queue:status-update':
            // The overall queue status has changed
            queryClient.invalidateQueries({ queryKey: ['queues', 'status'] });
            // Also invalidate all jobs list as queue changes might affect job visibility
            queryClient.invalidateQueries({ queryKey: ['queues', 'all-jobs'] });
            break;

          default:
            console.log('Unhandled WebSocket event:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [wsUrl, queryClient]);

  return { isConnected };
};
