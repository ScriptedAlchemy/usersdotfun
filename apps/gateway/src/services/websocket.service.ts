import { StateService } from "@usersdotfun/shared-queue";
import type {
  WebSocketEvent,
  WebSocketServerMessage,
} from "@usersdotfun/shared-types/types";
import { Context, Effect, Layer, Ref } from "effect";

interface WebSocketConnection {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  send: (message: WebSocketServerMessage) => Effect.Effect<void, Error>;
}

export interface WebSocketService {
  readonly addConnection: (
    connection: WebSocketConnection,
  ) => Effect.Effect<void>;
  readonly removeConnection: (id: string) => Effect.Effect<void>;
  readonly subscribe: (
    connectionId: string,
    eventType: string,
  ) => Effect.Effect<void>;
  readonly unsubscribe: (
    connectionId: string,
    eventType: string,
  ) => Effect.Effect<void>;
  readonly broadcast: (event: WebSocketEvent) => Effect.Effect<void>;
  readonly broadcastToUser: (
    userId: string,
    event: WebSocketEvent,
  ) => Effect.Effect<void>;
  readonly getConnectionCount: () => Effect.Effect<number>;
  readonly getSubscriptionCount: (
    eventType: string,
  ) => Effect.Effect<number>;
}

export const WebSocketService = Context.GenericTag<WebSocketService>(
  "WebSocketService"
);

export const WebSocketServiceLive = Layer.effect(
  WebSocketService,
  Effect.gen(function* () {
    const stateService = yield* StateService;
    
    // Use Ref to hold the state maps
    const connectionsRef = yield* Ref.make(
      new Map<string, WebSocketConnection>(),
    );
    const subscriptionsRef = yield* Ref.make(new Map<string, Set<string>>());

    const removeConnection = (id: string) =>
      Effect.gen(function* () {
        const connections = yield* Ref.get(connectionsRef);
        const connection = connections.get(id);
        if (!connection) {
          return;
        }

        // Update subscriptions - Fixed: Use Ref.update properly
        yield* Ref.update(subscriptionsRef, (subscriptions) => {
          const newSubscriptions = new Map(subscriptions);
          connection.subscriptions.forEach((eventType) => {
            const subscribers = newSubscriptions.get(eventType);
            if (subscribers) {
              const newSubscribers = new Set(subscribers);
              newSubscribers.delete(id);
              if (newSubscribers.size === 0) {
                newSubscriptions.delete(eventType);
              } else {
                newSubscriptions.set(eventType, newSubscribers);
              }
            }
          });
          return newSubscriptions;
        });

        // Update connections
        yield* Ref.update(connectionsRef, (conns) => {
          const newConns = new Map(conns);
          newConns.delete(id);
          return newConns;
        });

        yield* Effect.logInfo(`WebSocket connection removed: ${id}`);
      });

    // Helper function to create a resilient send effect
    const resilientSend = (
      connection: WebSocketConnection,
      event: WebSocketServerMessage,
    ) =>
      Effect.catchAll(connection.send(event), (error) =>
        Effect.logError(
          `Failed to send message to connection ${connection.id}`,
          error,
        ).pipe(Effect.andThen(removeConnection(connection.id))),
      );

    const addConnection = (connection: WebSocketConnection) =>
      Ref.update(connectionsRef, (connections) => {
        const newConnections = new Map(connections);
        newConnections.set(connection.id, connection);
        return newConnections;
      }).pipe(
        Effect.andThen(
          Effect.logInfo(`WebSocket connection added: ${connection.id}`),
        ),
      );

    const subscribe = (connectionId: string, eventType: string) =>
      Effect.gen(function* () {
        const connections = yield* Ref.get(connectionsRef);
        const connection = connections.get(connectionId);
        if (!connection) return;

        connection.subscriptions.add(eventType);
        
        yield* Ref.update(subscriptionsRef, (subscriptions) => {
          const newSubscriptions = new Map(subscriptions);
          if (!newSubscriptions.has(eventType)) {
            newSubscriptions.set(eventType, new Set());
          }
          const subscribers = new Set(newSubscriptions.get(eventType)!);
          subscribers.add(connectionId);
          newSubscriptions.set(eventType, subscribers);
          return newSubscriptions;
        });

        yield* Effect.logInfo(
          `Connection ${connectionId} subscribed to ${eventType}`,
        );
      });

    // Fixed unsubscribe logic
    const unsubscribe = (connectionId: string, eventType: string) =>
      Effect.gen(function* () {
        const connections = yield* Ref.get(connectionsRef);
        const connection = connections.get(connectionId);
        if (connection) {
          connection.subscriptions.delete(eventType);

          yield* Ref.update(subscriptionsRef, (subscriptions) => {
            const newSubscriptions = new Map(subscriptions);
            const subscribers = newSubscriptions.get(eventType);
            if (subscribers) {
              const newSubscribers = new Set(subscribers);
              newSubscribers.delete(connectionId);
              if (newSubscribers.size === 0) {
                newSubscriptions.delete(eventType);
              } else {
                newSubscriptions.set(eventType, newSubscribers);
              }
            }
            return newSubscriptions;
          });

          yield* Effect.logInfo(
            `Connection ${connectionId} unsubscribed from ${eventType}`
          );
        }
      });

    const broadcast = (event: WebSocketEvent) =>
      Effect.gen(function* () {
        const subscriptions = yield* Ref.get(subscriptionsRef);
        const connections = yield* Ref.get(connectionsRef);
        const subscribers = subscriptions.get(event.type);

        if (!subscribers) return;

        const effects = Array.from(subscribers)
          .map((id) => connections.get(id))
          .filter(
            (conn): conn is WebSocketConnection => conn !== undefined,
          )
          .map((conn) => resilientSend(conn, event));

        // Run all send effects in parallel, discarding results
        yield* Effect.forEach(effects, (effect) => effect, {
          concurrency: "unbounded",
          discard: true,
        });
      });

    const broadcastToUser = (userId: string, event: WebSocketEvent) =>
      Effect.gen(function* () {
        const connections = yield* Ref.get(connectionsRef);
        const userConnections = Array.from(connections.values()).filter(
          (conn) => conn.userId === userId,
        );

        const effects = userConnections.map((conn) =>
          resilientSend(conn, event),
        );

        yield* Effect.forEach(effects, (effect) => effect, {
          concurrency: "unbounded",
          discard: true,
        });
      });

    const getConnectionCount = () =>
      Ref.get(connectionsRef).pipe(Effect.map((conns) => conns.size));
      
    const getSubscriptionCount = (eventType: string) =>
      Ref.get(subscriptionsRef).pipe(
        Effect.map((subs) => subs.get(eventType)?.size || 0),
      );

    // Subscribe to Redis and broadcast events
    yield* stateService.subscribe((event) => Effect.runFork(broadcast(event)));
    yield* Effect.log("Subscribed to Redis for WebSocket events.");

    return {
      addConnection,
      removeConnection,
      subscribe,
      unsubscribe,
      broadcast,
      broadcastToUser,
      getConnectionCount,
      getSubscriptionCount,
    };
  }),
);
