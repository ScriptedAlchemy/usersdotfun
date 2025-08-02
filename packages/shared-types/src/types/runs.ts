import { z } from "zod";
import type {
  baseWorkflowRunSchema,
  pluginRunSchema,
  sourceItemSchema,
  workflowErrorSchema,
  workflowRunInfoSchema,
  workflowRunSchema,
} from "../schemas/runs";

export type WorkflowRun = z.infer<typeof workflowRunSchema>;
export type BaseWorkflowRun = z.infer<typeof baseWorkflowRunSchema>;
export type SourceItem = z.infer<typeof sourceItemSchema>;
export type PluginRun = z.infer<typeof pluginRunSchema>;
export type WorkflowRunInfo = z.infer<typeof workflowRunInfoSchema>;
export type WorkflowError = z.infer<typeof workflowErrorSchema>;
