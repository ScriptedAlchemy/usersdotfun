import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import { getWebSocketManager, type WebSocketConnection } from '../services/websocket-manager.service';
import {
  webSocketCommandSchema,
  webSocketServerMessageSchema,
  webSocketHealthResponseSchema,
} from '@usersdotfun/shared-types';

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const app = new Hono();
const wsManager = getWebSocketManager();

app.get('/', upgradeWebSocket((c) => {
  const connectionId = crypto.randomUUID();
  let connection: WebSocketConnection | null = null;

  return {
    onOpen: async (evt: any, ws: any) => {
      console.log(`WebSocket opened: ${connectionId}`);
      
      connection = {
        id: connectionId,
        subscriptions: new Set(),
        send: (message: any) => {
          ws.send(JSON.stringify(message));
        }
      };

      wsManager.addConnection(connectionId, connection);

      // Send connection confirmation
      connection.send(webSocketServerMessageSchema.parse({
        type: 'connection:established',
        data: { connectionId }
      }));
    },

    onMessage: async (evt: any, ws: any) => {
      try {
        const rawMessage = JSON.parse(evt.data.toString());
        
        // Validate the incoming command
        const validationResult = webSocketCommandSchema.safeParse(rawMessage);
        if (!validationResult.success) {
          console.error('Invalid WebSocket command:', validationResult.error);
          connection?.send(webSocketServerMessageSchema.parse({
            type: 'error',
            data: { 
              message: 'Invalid command format',
              details: validationResult.error.issues
            }
          }));
          return;
        }

        const message = validationResult.data;
        
        switch (message.type) {
          case 'subscribe':
            if (message.eventType && connection) {
              wsManager.subscribe(connectionId, message.eventType);
              connection.send(webSocketServerMessageSchema.parse({
                type: 'subscription:confirmed',
                data: { eventType: message.eventType }
              }));
            }
            break;

          case 'unsubscribe':
            if (message.eventType && connection) {
              wsManager.unsubscribe(connectionId, message.eventType);
              connection.send(webSocketServerMessageSchema.parse({
                type: 'subscription:removed',
                data: { eventType: message.eventType }
              }));
            }
            break;

          case 'ping':
            connection?.send(webSocketServerMessageSchema.parse({
              type: 'pong',
              data: { timestamp: Date.now().toString() }
            }));
            break;

          default:
            console.log('Unknown message type:', (message as any).type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        connection?.send(webSocketServerMessageSchema.parse({
          type: 'error',
          data: { 
            message: 'Failed to process message',
            details: error instanceof Error ? error.message : 'Unknown error'
          }
        }));
      }
    },

    onClose: () => {
      console.log(`WebSocket closed: ${connectionId}`);
      wsManager.removeConnection(connectionId);
    },

    onError: (evt: any, ws: any) => {
      console.error(`WebSocket error for ${connectionId}:`, evt);
      wsManager.removeConnection(connectionId);
    }
  };
}));

// Health check endpoint
app.get('/health', (c) => {
  const healthData = {
    status: 'healthy' as const,
    connections: wsManager.getConnectionCount(),
    subscriptions: {
      'job:status-changed': wsManager.getSubscriptionCount('job:status-changed'),
      'job:monitoring-update': wsManager.getSubscriptionCount('job:monitoring-update'),
      'queue:status-update': wsManager.getSubscriptionCount('queue:status-update'),
    }
  };
  
  const validatedHealth = webSocketHealthResponseSchema.parse(healthData);
  return c.json(validatedHealth);
});

export default app;
export { websocket };
