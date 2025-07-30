import { z } from "zod";
import { webSocketEventSchema } from "../websocket";

// ============================================================================
// WEBSOCKET CLIENT-TO-SERVER COMMAND SCHEMAS
// ============================================================================

export const webSocketCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscribe'),
    eventType: z.string(),
  }),
  z.object({
    type: z.literal('unsubscribe'),
    eventType: z.string(),
  }),
  z.object({
    type: z.literal('ping'),
    timestamp: z.number().optional(),
  }),
]);

// ============================================================================
// WEBSOCKET SERVER-TO-CLIENT EVENT SCHEMAS
// ============================================================================

// Re-export the existing event schema from the main websocket schema
export const webSocketServerEventSchema = webSocketEventSchema;

// Connection-specific events (not in the main event schema)
export const webSocketConnectionEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('connection:established'),
    data: z.object({
      connectionId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('subscription:confirmed'),
    data: z.object({
      eventType: z.string(),
    }),
  }),
  z.object({
    type: z.literal('subscription:removed'),
    data: z.object({
      eventType: z.string(),
    }),
  }),
  z.object({
    type: z.literal('pong'),
    data: z.object({
      timestamp: z.string(),
    }),
  }),
]);

// Combined schema for all server-to-client messages
export const webSocketServerMessageSchema = z.union([
  webSocketServerEventSchema,
  webSocketConnectionEventSchema,
]);

// ============================================================================
// WEBSOCKET HEALTH CHECK SCHEMAS
// ============================================================================

export const webSocketHealthResponseSchema = z.object({
  status: z.literal('healthy'),
  connections: z.number(),
  subscriptions: z.record(z.string(), z.number()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type WebSocketCommand = z.infer<typeof webSocketCommandSchema>;
export type WebSocketServerEvent = z.infer<typeof webSocketServerEventSchema>;
export type WebSocketConnectionEvent = z.infer<typeof webSocketConnectionEventSchema>;
export type WebSocketServerMessage = z.infer<typeof webSocketServerMessageSchema>;
export type WebSocketHealthResponse = z.infer<typeof webSocketHealthResponseSchema>;

// Specific command types
export type SubscribeCommand = Extract<WebSocketCommand, { type: 'subscribe' }>;
export type UnsubscribeCommand = Extract<WebSocketCommand, { type: 'unsubscribe' }>;
export type PingCommand = Extract<WebSocketCommand, { type: 'ping' }>;

// Specific connection event types
export type ConnectionEstablishedEvent = Extract<WebSocketConnectionEvent, { type: 'connection:established' }>;
export type SubscriptionConfirmedEvent = Extract<WebSocketConnectionEvent, { type: 'subscription:confirmed' }>;
export type SubscriptionRemovedEvent = Extract<WebSocketConnectionEvent, { type: 'subscription:removed' }>;
export type PongEvent = Extract<WebSocketConnectionEvent, { type: 'pong' }>;
