import { Job, PipelineStep } from "@usersdotfun/shared-db";

export const fetchJobs = async (): Promise<Job[]> => {
  const res = await fetch('/api/jobs');
  return res.json();
};

export const fetchJob = async ({ data: jobId }: { data: string }): Promise<Job & { steps: PipelineStep[] }> => {
  const res = await fetch(`/api/jobs/${jobId}`);
  return res.json();
};
