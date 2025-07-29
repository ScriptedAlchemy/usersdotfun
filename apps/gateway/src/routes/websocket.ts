import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const app = new Hono();

interface WebSocketConnection {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  send: (message: any) => void;
}

class WebSocketManager {
  private connections = new Map<string, WebSocketConnection>();
  private subscriptions = new Map<string, Set<string>>();

  addConnection(id: string, connection: WebSocketConnection) {
    this.connections.set(id, connection);
    console.log(`WebSocket connection added: ${id}`);
  }

  removeConnection(id: string) {
    const connection = this.connections.get(id);
    if (connection) {
      // Remove from all subscriptions
      connection.subscriptions.forEach(eventType => {
        const subscribers = this.subscriptions.get(eventType);
        if (subscribers) {
          subscribers.delete(id);
          if (subscribers.size === 0) {
            this.subscriptions.delete(eventType);
          }
        }
      });
      this.connections.delete(id);
      console.log(`WebSocket connection removed: ${id}`);
    }
  }

  subscribe(connectionId: string, eventType: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.subscriptions.add(eventType);
      
      if (!this.subscriptions.has(eventType)) {
        this.subscriptions.set(eventType, new Set());
      }
      this.subscriptions.get(eventType)!.add(connectionId);
      
      console.log(`Connection ${connectionId} subscribed to ${eventType}`);
    }
  }

  unsubscribe(connectionId: string, eventType: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.subscriptions.delete(eventType);
      
      const subscribers = this.subscriptions.get(eventType);
      if (subscribers) {
        subscribers.delete(connectionId);
        if (subscribers.size === 0) {
          this.subscriptions.delete(eventType);
        }
      }
      
      console.log(`Connection ${connectionId} unsubscribed from ${eventType}`);
    }
  }

  broadcast(event: { type: string; data: any }) {
    const subscribers = this.subscriptions.get(event.type);
    if (subscribers) {
      subscribers.forEach(connectionId => {
        const connection = this.connections.get(connectionId);
        if (connection) {
          try {
            connection.send(event);
          } catch (error) {
            console.error(`Failed to send message to connection ${connectionId}:`, error);
            this.removeConnection(connectionId);
          }
        }
      });
    }
  }

  broadcastToUser(userId: string, event: { type: string; data: any }) {
    this.connections.forEach((connection, connectionId) => {
      if (connection.userId === userId) {
        try {
          connection.send(event);
        } catch (error) {
          console.error(`Failed to send message to user ${userId}:`, error);
          this.removeConnection(connectionId);
        }
      }
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getSubscriptionCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.size || 0;
  }
}

const wsManager = new WebSocketManager();

// Export the manager so other services can use it
export { wsManager };

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
      connection.send({
        type: 'connection:established',
        data: { connectionId }
      });
    },

    onMessage: async (evt: any, ws: any) => {
      try {
        const message = JSON.parse(evt.data.toString());
        
        switch (message.type) {
          case 'subscribe':
            if (message.eventType && connection) {
              wsManager.subscribe(connectionId, message.eventType);
              connection.send({
                type: 'subscription:confirmed',
                data: { eventType: message.eventType }
              });
            }
            break;

          case 'unsubscribe':
            if (message.eventType && connection) {
              wsManager.unsubscribe(connectionId, message.eventType);
              connection.send({
                type: 'subscription:removed',
                data: { eventType: message.eventType }
              });
            }
            break;

          case 'ping':
            connection?.send({
              type: 'pong',
              data: { timestamp: Date.now().toString() }
            });
            break;

          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
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
  return c.json({
    status: 'healthy',
    connections: wsManager.getConnectionCount(),
    subscriptions: {
      'job:status-changed': wsManager.getSubscriptionCount('job:status-changed'),
      'job:monitoring-update': wsManager.getSubscriptionCount('job:monitoring-update'),
      'queue:status-update': wsManager.getSubscriptionCount('queue:status-update'),
    }
  });
});

export default app;
export { websocket };
