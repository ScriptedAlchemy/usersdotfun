import { z } from "zod";
import {
  baseWorkflowSchema,
  createWorkflowSchema,
  pipelineSchema,
  pipelineStepDefinitionSchema,
  pluginConfigSchema,
  richWorkflowSchema,
  sourceSchema,
  updateWorkflowSchema,
  workflowSchema
} from '../schemas/workflows';
import type {
  BaseWorkflowRun,
  PluginRun,
  SourceItem,
  WorkflowError,
  WorkflowRun,
  WorkflowRunInfo,
} from './runs';

// Reusable Definition Types
export type PluginConfig = z.infer<typeof pluginConfigSchema>;
export type PipelineStepDefinition = z.infer<typeof pipelineStepDefinitionSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Pipeline = z.infer<typeof pipelineSchema>;

// Core Domain Types
export type Workflow = z.infer<typeof workflowSchema>;

// API/Service Layer Types
export type CreateWorkflow = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof updateWorkflowSchema>;

// Extended Types
export type BaseWorkflow = z.infer<typeof baseWorkflowSchema>;
export type RichWorkflow = z.infer<typeof richWorkflowSchema>;

export type {
  BaseWorkflowRun, PluginRun,
  SourceItem,
  WorkflowError,
  WorkflowRun,
  WorkflowRunInfo
};

