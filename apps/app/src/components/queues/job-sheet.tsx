import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import type { JobData, JobStatus } from "@usersdotfun/shared-types/types";

interface JobSheetProps {
  job: JobStatus | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function JobSheet({ job, isOpen, onOpenChange }: JobSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-2xl">
        <SheetHeader>
          <SheetTitle>Job Details</SheetTitle>
          <SheetDescription>
            Detailed information about the selected job.
          </SheetDescription>
        </SheetHeader>
        {job && (
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">Job ID</h3>
              <p className="font-mono text-sm">{job.id}</p>
            </div>
            <div>
              <h3 className="font-semibold">Job Name</h3>
              <p>{job.name}</p>
            </div>
            {'workflowId' in job.data && (
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
              <p>{job.processedOn ? new Date(job.processedOn).toLocaleString() : 'N/A'}</p>
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
      </SheetContent>
    </Sheet>
  );
}
