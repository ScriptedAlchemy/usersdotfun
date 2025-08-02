import { CommonSheet } from "~/components/common/common-sheet";
import type { JobStatus } from "@usersdotfun/shared-types/types";

interface JobSheetProps {
  job: JobStatus | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JobSheet({ job, isOpen, onClose }: JobSheetProps) {
  return (
    <CommonSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Job Details"
      description="Detailed information about the selected job."
      className="sm:max-w-2xl"
    >
      {job && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Job ID</h3>
            <p className="font-mono text-sm">{job.id}</p>
          </div>
          <div>
            <h3 className="font-semibold">Job Name</h3>
            <p>{job.name}</p>
          </div>
          {"workflowId" in job.data && (
            <div>
              <h3 className="font-semibold">Workflow ID</h3>
              <p className="font-mono text-sm">{job.data.workflowId}</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold">Attempts Made</h3>
            <p>{job.attemptsMade}</p>
          </div>
          <div>
            <h3 className="font-semibold">Created At</h3>
            <p>{new Date(job.timestamp).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Processed At</h3>
            <p>
              {job.processedOn
                ? new Date(job.processedOn).toLocaleString()
                : "N/A"}
            </p>
          </div>
          {job.failedReason && (
            <div>
              <h3 className="font-semibold text-red-500">Failed Reason</h3>
              <p className="text-red-500">{job.failedReason}</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold">Data</h3>
            <pre className="mt-1 rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(job.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </CommonSheet>
  );
}
