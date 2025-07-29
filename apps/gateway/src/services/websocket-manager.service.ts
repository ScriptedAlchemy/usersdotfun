interface WebSocketConnection {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  send: (message: any) => void;
}

export class WebSocketManager {
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

let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

export { type WebSocketConnection };
