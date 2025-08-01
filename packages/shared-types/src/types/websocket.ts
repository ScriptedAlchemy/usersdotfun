
	import { z } from "zod";
	import { webSocketEventSchema } from '../schemas/websocket';
	
	export type WebSocketEvent = z.infer<typeof webSocketEventSchema>;