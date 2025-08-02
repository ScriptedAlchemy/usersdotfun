import { useAtom } from 'jotai';
import { getWorkflowAtom } from '~/atoms/workflow';
import { WorkflowView } from './view';
import { WorkflowEdit } from './edit';

export function Workflow({ id, mode }: { id?: string; mode: 'view' | 'edit' | 'create' }) {
  // For 'create' mode, we render the editor directly without fetching data.
  if (mode === 'create') {
    return <WorkflowEdit />;
  }

  // For 'view' and 'edit', an ID is required.
  if (!id) {
    return <div>Error: Workflow ID is missing.</div>;
  }

  // Use the Jotai atom to get the workflow data
  const workflowAtom = getWorkflowAtom(id);
  const [{ data: workflow, isPending, isError }] = useAtom(workflowAtom);

  if (isPending) return <div>Loading Workflow...</div>;
  if (isError) return <div>Error loading Workflow.</div>;

  // Render the correct component based on the mode
  return mode === 'edit' ? (
    <WorkflowEdit />
  ) : (
    <WorkflowView workflow={workflow} />
  );
}
