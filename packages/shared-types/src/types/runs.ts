import { z } from "zod";
import type {
  pluginRunSchema,
  richWorkflowRunSchema,
  richWorkflowRunSummarySchema,
  sourceItemSchema,
  workflowErrorSchema,
  workflowRunInfoSchema,
  workflowRunSchema,
} from "../schemas/runs";

export type WorkflowRun = z.infer<typeof workflowRunSchema>;
export type RichWorkflowRun = z.infer<typeof richWorkflowRunSchema>;
export type RichWorkflowRunSummary = z.infer<typeof richWorkflowRunSummarySchema>;
export type SourceItem = z.infer<typeof sourceItemSchema>;
export type PluginRun = z.infer<typeof pluginRunSchema>;
export type WorkflowRunInfo = z.infer<typeof workflowRunInfoSchema>;
export type WorkflowError = z.infer<typeof workflowErrorSchema>;
