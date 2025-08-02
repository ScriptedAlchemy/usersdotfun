import { z } from "zod";
import { queueStatusSchema } from './queues';
import { pluginRunSchema, workflowRunInfoSchema } from './runs';

export const webSocketEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('plugin:run-completed'),
    data: pluginRunSchema,
  }),
  z.object({
    type: z.literal('plugin:run-failed'),
    data: pluginRunSchema,
  }),
  z.object({
    type: z.literal('workflow:run-started'),
    data: workflowRunInfoSchema,
  }),
  z.object({
    type: z.literal('workflow:run-completed'),
    data: workflowRunInfoSchema,
  }),
  z.object({
    type: z.literal('queue:status-update'),
    data: z.array(queueStatusSchema),
  }),
]);