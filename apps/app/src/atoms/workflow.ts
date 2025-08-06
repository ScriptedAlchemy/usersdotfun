import {
  updateWorkflowSchema
} from "@usersdotfun/shared-types/schemas";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { z } from "zod";
import { workflowQueryOptions } from "~/lib/queries";

export type EditableWorkflow = z.infer<typeof updateWorkflowSchema>;

export const workflowIdAtom = atom<string | null>(null);

export const workflowDataAtom = atomWithQuery((get) => {
  const id = get(workflowIdAtom);
  if (!id) {
    return {
      queryKey: ["workflows", ""] as const,
      queryFn: async () => null,
      enabled: false,
    };
  }
  return workflowQueryOptions(id);
});

export const editableWorkflowAtom = atom((get) => {
  const workflowQuery = get(workflowDataAtom);
  if (workflowQuery.isLoading || !workflowQuery.data) return null;
  return updateWorkflowSchema.parse(workflowQuery.data);
});
