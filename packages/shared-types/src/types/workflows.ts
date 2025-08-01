import { z } from "zod";
import {
  createWorkflowSchema,
  pluginConfigSchema,
  pipelineStepDefinitionSchema,
  pluginRunSchema,
  sourceItemSchema,
  updateWorkflowSchema,
  workflowErrorSchema,
  workflowRunInfoSchema,
  workflowRunSchema,
  workflowSchema,
  richWorkflowSchema,
  baseWorkflowSchema,
  baseWorkflowRunSchema,
  sourceSchema,
  pipelineSchema
} from '../schemas/workflows';

// Reusable Definition Types
export type PluginConfig = z.infer<typeof pluginConfigSchema>;
export type PipelineStepDefinition = z.infer<typeof pipelineStepDefinitionSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Pipeline = z.infer<typeof pipelineSchema>;

// Core Domain Types
export type Workflow = z.infer<typeof workflowSchema>;
export type WorkflowRun = z.infer<typeof workflowRunSchema>;
export type SourceItem = z.infer<typeof sourceItemSchema>;
export type PluginRun = z.infer<typeof pluginRunSchema>;

// API/Service Layer Types
export type CreateWorkflow = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof updateWorkflowSchema>;
export type WorkflowRunInfo = z.infer<typeof workflowRunInfoSchema>;
export type WorkflowError = z.infer<typeof workflowErrorSchema>;

// Extended Types
export type BaseWorkflow = z.infer<typeof baseWorkflowSchema>;
export type BaseWorkflowRun = z.infer<typeof baseWorkflowRunSchema>;
export type RichWorkflow = z.infer<typeof richWorkflowSchema>;
