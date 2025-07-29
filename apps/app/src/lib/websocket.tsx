import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { WebSocketEvent } from '@usersdotfun/shared-types';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
  unsubscribe: (eventType: string, callback: (data: any) => void) => void;
  send: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

export function WebSocketProvider({ children, url = '/api/ws' }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const queryClient = useQueryClient();

  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}${url}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        scheduleReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
    reconnectAttemptsRef.current++;

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
      connect();
    }, delay);
  };

  const handleMessage = (message: WebSocketEvent) => {
    const { type, data } = message;
    
    // Trigger server-side cache invalidation
    triggerServerCacheInvalidation(type);
    
    // Update React Query cache based on event type
    switch (type) {
      case 'job:status-changed':
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['all-queue-jobs'] });
        break;
      
      case 'job:deleted':
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['all-queue-jobs'] });
        queryClient.invalidateQueries({ queryKey: ['queues', 'overview'] });
        queryClient.invalidateQueries({ queryKey: ['queues', 'details'] });
        if (data.queueName) {
          queryClient.invalidateQueries({ queryKey: ['queues', 'details', data.queueName] });
        }
        break;
      
      case 'job:monitoring-update':
        queryClient.setQueryData(['job-monitoring', data.job.id], data);
        break;
      
      case 'job:run-started':
      case 'job:run-completed':
        queryClient.invalidateQueries({ queryKey: ['job-runs', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['job-monitoring', data.jobId] });
        queryClient.invalidateQueries({ queryKey: ['all-queue-jobs'] });
        break;
      
      case 'pipeline:step-completed':
      case 'pipeline:step-failed':
        queryClient.invalidateQueries({ queryKey: ['job-monitoring', data.jobId] });
        break;
      
      case 'queue:status-changed':
      case 'queue:status-update':
        queryClient.invalidateQueries({ queryKey: ['queues', 'overview'] });
        queryClient.invalidateQueries({ queryKey: ['queues', 'details'] });
        break;
      
      case 'queue:item-added':
      case 'queue:item-completed':
      case 'queue:item-failed':
        queryClient.invalidateQueries({ queryKey: ['queues', 'overview'] });
        queryClient.invalidateQueries({ queryKey: ['queues', 'details', data.queueName] });
        queryClient.invalidateQueries({ queryKey: ['all-queue-jobs'] });
        break;
      
      case 'queue:item-removed':
        // Use a slight delay to allow optimistic updates to complete first
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['queues', 'overview'] });
          queryClient.invalidateQueries({ queryKey: ['queues', 'details', data.queueName] });
          queryClient.invalidateQueries({ queryKey: ['all-queue-jobs'] });
          if (data.jobId) {
            queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
          }
        }, 100);
        break;
      
      case 'queue:paused':
      case 'queue:resumed':
      case 'queue:cleared':
        queryClient.invalidateQueries({ queryKey: ['queues', 'overview'] });
        queryClient.invalidateQueries({ queryKey: ['queues', 'details', data.queueName] });
        queryClient.invalidateQueries({ queryKey: ['all-queue-jobs'] });
        break;
      
      case 'queue:job-removed':
        // Delay invalidation to avoid interfering with optimistic updates
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['queues', 'overview'] });
          queryClient.invalidateQueries({ queryKey: ['queues', 'details', data.queueName] });
          // Only invalidate all-queue-jobs if there's no pending optimistic update
          const hasOptimisticUpdate = queryClient.isMutating({ mutationKey: ['removeQueueItem'] });
          if (!hasOptimisticUpdate) {
            queryClient.invalidateQueries({ queryKey: ['all-queue-jobs'] });
          }
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
          if (data.jobId) {
            queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
          }
        }, 200);
        break;
      
      case 'queue:job-retried':
        queryClient.invalidateQueries({ queryKey: ['queues', 'overview'] });
        queryClient.invalidateQueries({ queryKey: ['queues', 'details', data.queueName] });
        queryClient.invalidateQueries({ queryKey: ['all-queue-jobs'] });
        if (data.jobId) {
          queryClient.invalidateQueries({ queryKey: ['job', data.jobId] });
        }
        break;
    }

    // Notify subscribers
    const subscribers = subscribersRef.current.get(type);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket subscriber callback:', error);
        }
      });
    }
  };

  const triggerServerCacheInvalidation = async (eventType: string) => {
    try {
      await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType }),
      });
    } catch (error) {
      console.warn('Failed to invalidate server cache:', error);
    }
  };

  const subscribe = (eventType: string, callback: (data: any) => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(callback);

    return () => unsubscribe(eventType, callback);
  };

  const unsubscribe = (eventType: string, callback: (data: any) => void) => {
    const subscribers = subscribersRef.current.get(eventType);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        subscribersRef.current.delete(eventType);
      }
    }
  };

  const send = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const contextValue: WebSocketContextType = {
    isConnected,
    subscribe,
    unsubscribe,
    send,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export function useWebSocketSubscription(
  eventType: string,
  callback: (data: any) => void,
  deps: any[] = []
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, callback);
    return unsubscribe;
  }, [eventType, subscribe, ...deps]);
}
