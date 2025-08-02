import { z } from "zod";
import {
  webSocketCommandSchema,
  webSocketConnectionEventSchema,
  webSocketHealthResponseSchema,
  webSocketServerEventSchema,
  webSocketServerMessageSchema,
} from '../../schemas/api/websocket';

// ============================================================================
// WEBSOCKET API TYPES
// ============================================================================

export type WebSocketCommand = z.infer<typeof webSocketCommandSchema>;
export type WebSocketServerEvent = z.infer<typeof webSocketServerEventSchema>;
export type WebSocketConnectionEvent = z.infer<typeof webSocketConnectionEventSchema>;
export type WebSocketServerMessage = z.infer<typeof webSocketServerMessageSchema>;
export type WebSocketHealthResponse = z.infer<typeof webSocketHealthResponseSchema>;

// ============================================================================
// SPECIFIC COMMAND TYPES
// ============================================================================

export type SubscribeCommand = Extract<WebSocketCommand, { type: 'subscribe' }>;
export type UnsubscribeCommand = Extract<WebSocketCommand, { type: 'unsubscribe' }>;
export type PingCommand = Extract<WebSocketCommand, { type: 'ping' }>;

// ============================================================================
// SPECIFIC CONNECTION EVENT TYPES
// ============================================================================

export type ConnectionEstablishedEvent = Extract<WebSocketConnectionEvent, { type: 'connection:established' }>;
export type SubscriptionConfirmedEvent = Extract<WebSocketConnectionEvent, { type: 'subscription:confirmed' }>;
export type SubscriptionRemovedEvent = Extract<WebSocketConnectionEvent, { type: 'subscription:removed' }>;
export type PongEvent = Extract<WebSocketConnectionEvent, { type: 'pong' }>;
