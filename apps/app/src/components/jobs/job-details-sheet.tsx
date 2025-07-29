import { JobWithSteps, JobMonitoringData, JobRunInfo } from '@usersdotfun/shared-types';
import { JobMonitoring } from './job-monitoring';
import { PipelineViewer } from './pipeline-viewer';
import { JobRuns } from './job-runs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

interface JobDetailsSheetProps {
  job: JobWithSteps | null;
  monitoringData?: JobMonitoringData;
  jobRuns?: JobRunInfo[];
  isOpen: boolean;
  isJobLoading: boolean;
  isMonitoringLoading: boolean;
  isRunsLoading: boolean;
  onClose: () => void;
}

export function JobDetailsSheet({
  job,
  monitoringData,
  jobRuns,
  isOpen,
  isJobLoading,
  isMonitoringLoading,
  isRunsLoading,
  onClose,
}: JobDetailsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-[600px] overflow-y-auto">
        {isJobLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse">Loading job details...</div>
          </div>
        ) : job ? (
          <>
            <SheetHeader>
              <SheetTitle>{job.name}</SheetTitle>
              <SheetDescription>
                Schedule: {job.schedule} | Status: {job.status}
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 py-4">
              {/* Source Configuration */}
              <div>
                <h5 className="font-semibold mb-2">Source Configuration</h5>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm"><strong>Plugin:</strong> {job.sourcePlugin}</p>
                  <p className="text-sm mt-2"><strong>Config:</strong></p>
                  <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(job.sourceConfig, null, 2)}
                  </pre>
                  <p className="text-sm mt-2"><strong>Search:</strong></p>
                  <pre className="text-xs mt-1 bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(job.sourceSearch, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Job Runs */}
              {jobRuns && (
                <JobRuns 
                  jobRuns={jobRuns} 
                  isLoading={isRunsLoading} 
                />
              )}

              {/* Pipeline Steps */}
              <PipelineViewer 
                job={job} 
                monitoringData={monitoringData} 
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-red-500">Job not found</div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
