import { z } from "zod";
import { pluginRunSchema, richWorkflowRunSchema } from "../runs";

export const getWorkflowRunResponseSchema = richWorkflowRunSchema;
export const listWorkflowRunsResponseSchema = z.array(richWorkflowRunSchema);

export const getPluginRunResponseSchema = pluginRunSchema;
export const listPluginRunsResponseSchema = z.array(pluginRunSchema);
