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
