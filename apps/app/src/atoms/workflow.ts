import { createWorkflowSchema, updateWorkflowSchema } from '@usersdotfun/shared-types/schemas';
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { z } from 'zod';
import { getWorkflow } from '~/api/workflows';

export const editableWorkflowSchema = z.union([
  createWorkflowSchema,
  updateWorkflowSchema,
]);

export type EditableWorkflow = z.infer<typeof editableWorkflowSchema>;

// This atom will hold the current state of the workflow being edited
export const editableWorkflowAtom = atom<z.infer<typeof editableWorkflowSchema> | null>(null);

// Atom for fetching a single workflow
export const getWorkflowAtom = (id: string) =>
  atomWithQuery(() => ({
    queryKey: ['workflows', id],
    queryFn: () => getWorkflow(id),
    enabled: !!id,
  }));
