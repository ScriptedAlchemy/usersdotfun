
import { z } from "zod";
import { webSocketEventSchema, webSocketEventTypeEnum } from '../schemas/websocket';

export type WebSocketEvent = z.infer<typeof webSocketEventSchema>;
export type WebSocketEventType = z.infer<typeof webSocketEventTypeEnum>;
