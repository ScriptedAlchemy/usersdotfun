import { z } from "zod";
import { CreateJob, Job, JobMonitoringData, jobMonitoringDataSchema, JobRunInfo, jobRunInfoSchema, jobSchema, JobWithSteps, jobWithStepsSchema, UpdateJob } from '../types/jobs';

const API_BASE_URL = '/api';

async function handleResponse<T>(response: Response, schema: z.Schema<T>): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  const data = await response.json();
  console.log("got response", data)
  return schema.parse(data);
}

export const getJobs = async (): Promise<Job[]> => {
  const res = await fetch(`${API_BASE_URL}/jobs`);
  return handleResponse(res, z.array(jobSchema));
};

export const getJob = async (id: string): Promise<JobWithSteps> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}`);
  return handleResponse(res, jobWithStepsSchema);
};

export const createJob = async (job: CreateJob): Promise<Job> => {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  return handleResponse(res, jobSchema);
};

export const updateJob = async (id: string, job: UpdateJob): Promise<Job> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  return handleResponse(res, jobSchema);
};

export const deleteJob = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete job');
  }
};

export const getJobMonitoringData = async (id: string): Promise<JobMonitoringData> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/monitoring`);
  return handleResponse(res, jobMonitoringDataSchema);
};

export const getJobStatus = async (id: string): Promise<{
  status: string;
  queuePosition?: number;
  estimatedStartTime?: Date;
  currentRun?: JobRunInfo;
}> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/status`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to get job status');
  }
  return res.json();
};

export const getJobRuns = async (id: string): Promise<JobRunInfo[]> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/runs`);
  return handleResponse(res, z.array(jobRunInfoSchema));
};

export const getJobRunDetails = async (id: string, runId: string): Promise<{
  run: JobRunInfo;
  pipelineItems: any[];
}> => {
  const res = await fetch(`${API_BASE_URL}/jobs/${id}/runs/${runId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to get job run details');
  }
  return res.json();
};
