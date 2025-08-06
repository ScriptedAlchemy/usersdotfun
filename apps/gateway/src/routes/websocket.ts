import {
  webSocketCommandSchema,
  webSocketHealthResponseSchema,
  webSocketServerMessageSchema,
} from '@usersdotfun/shared-types/schemas';
import type { WebSocketServerMessage } from '@usersdotfun/shared-types/types';
import type { ServerWebSocket } from 'bun';
import { Effect } from 'effect';
import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import { AppRuntime } from '../runtime';
import { WebSocketService } from '../services/websocket.service';
import type { AppType } from '../types/hono';

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

const app = new Hono<AppType>();

app.get(
  '/',
  upgradeWebSocket((c) => {
    const connectionId = crypto.randomUUID();
    return {
      onOpen: async (evt, ws) => {
        const connection = {
          id: connectionId,
          subscriptions: new Set<string>(),
          send: (message: WebSocketServerMessage) =>
            Effect.try(() => {
              ws.send(JSON.stringify(message));
            }),
        };

        const program = Effect.gen(function* () {
          const service = yield* WebSocketService;
          yield* service.addConnection(connection);
          yield* connection.send(
            webSocketServerMessageSchema.parse({
              type: 'connection:established',
              data: { connectionId },
            }),
          );
        });

        await AppRuntime.runPromise(program);
      },

      onMessage: async (evt, ws) => {
        try {
          const rawMessage = JSON.parse(evt.data.toString());
          const validationResult = webSocketCommandSchema.safeParse(rawMessage);

          if (!validationResult.success) {
            // Handle validation error
            return;
          }

          const message = validationResult.data;

          const program = Effect.gen(function* () {
            const service = yield* WebSocketService;
            switch (message.type) {
              case 'subscribe':
                yield* service.subscribe(connectionId, message.eventType);
                break;
              case 'unsubscribe':
                yield* service.unsubscribe(connectionId, message.eventType);
                break;
              case 'ping':
                ws.send(
                  JSON.stringify(
                    webSocketServerMessageSchema.parse({
                      type: 'pong',
                      data: { timestamp: Date.now().toString() },
                    }),
                  ),
                );
                break;
            }
          });

          await AppRuntime.runPromise(program);
        } catch (error) {
          // Handle message processing error
        }
      },

      onClose: async () => {
        const program = Effect.gen(function* () {
          const service = yield* WebSocketService;
          yield* service.removeConnection(connectionId);
        });
        await AppRuntime.runPromise(program);
      },

      onError: async (evt) => {
        const program = Effect.gen(function* () {
          const service = yield* WebSocketService;
          yield* service.removeConnection(connectionId);
        });
        await AppRuntime.runPromise(program);
      },
    };
  }),
);

app.get('/health', async (c) => {
  const program = Effect.gen(function* () {
    const service = yield* WebSocketService;
    const [connections, jobStatus, jobMonitoring, queueStatus] = yield* Effect.all([
      service.getConnectionCount(),
      service.getSubscriptionCount('job:status-changed'),
      service.getSubscriptionCount('job:monitoring-update'),
      service.getSubscriptionCount('queue:status-update'),
    ]);

    return {
      status: 'healthy' as const,
      connections,
      subscriptions: {
        'job:status-changed': jobStatus,
        'job:monitoring-update': jobMonitoring,
        'queue:status-update': queueStatus,
      },
    };
  });

  const healthData = await AppRuntime.runPromise(program);
  const validatedHealth = webSocketHealthResponseSchema.parse(healthData);
  return c.json(validatedHealth);
});

export default app;
export { websocket };
