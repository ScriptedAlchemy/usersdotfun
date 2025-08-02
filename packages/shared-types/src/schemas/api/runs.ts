import { z } from "zod";
import { pluginRunSchema, workflowRunSchema } from "../runs";

export const getWorkflowRunResponseSchema = workflowRunSchema;
export const listWorkflowRunsResponseSchema = z.array(workflowRunSchema);

export const getPluginRunResponseSchema = pluginRunSchema;
export const listPluginRunsResponseSchema = z.array(pluginRunSchema);
