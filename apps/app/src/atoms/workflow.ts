import {
  createWorkflowSchema,
  updateWorkflowSchema,
} from "@usersdotfun/shared-types/schemas";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { z } from "zod";
import { getWorkflow } from "~/api/workflows";

export const editableWorkflowSchema = z.union([
  createWorkflowSchema,
  updateWorkflowSchema,
]);

export type EditableWorkflow = z.infer<typeof editableWorkflowSchema>;

export const workflowIdAtom = atom<string | null>(null);

export const workflowDataAtom = atomWithQuery((get) => {
  const id = get(workflowIdAtom);
  return {
    queryKey: ["workflows", id],
    queryFn: async () => {
      if (!id) return null;
      const workflow = await getWorkflow(id);
      return workflow;
    },
    enabled: !!id,
  };
});

export const editableWorkflowAtom = atom((get) => {
  const workflow = get(workflowDataAtom).data;
  if (!workflow) return null;
  return updateWorkflowSchema.parse(workflow);
});
