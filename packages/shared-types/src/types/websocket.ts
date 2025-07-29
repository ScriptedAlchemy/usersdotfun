import { z } from "zod";
import { webSocketEventSchema } from '../schemas/websocket';

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

export type WebSocketEvent = z.infer<typeof webSocketEventSchema>;
