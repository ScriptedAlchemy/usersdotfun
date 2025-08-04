import type {
  PluginRun,
  RichWorkflowRun,
} from "@usersdotfun/shared-types/types";
import { Badge } from "~/components/ui/badge";

interface RunViewProps {
  runDetails: {
      run: RichWorkflowRun,
      pluginRuns: PluginRun[],
    };
}

export function RunView({ runDetails }: RunViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">Run Overview</h3>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div className="font-semibold">Status</div>
          <div>
            <Badge variant="outline">{runDetails.run.status}</Badge>
          </div>
          <div className="font-semibold">Triggered By</div>
          <div>{runDetails.run.user?.name ?? "N/A"}</div>
          <div className="font-semibold">Items Processed</div>
          <div>
            {runDetails.run.itemsProcessed} / {runDetails.run.itemsTotal}
          </div>
          <div className="font-semibold">Started At</div>
          <div>{new Date(runDetails.run.startedAt).toLocaleString()}</div>
          <div className="font-semibold">Completed At</div>
          <div>
            {runDetails.run.completedAt
              ? new Date(runDetails.run.completedAt).toLocaleString()
              : "N/A"}
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-medium">
          Plugin Runs ({runDetails.pluginRuns.length})
        </h3>
        <div className="mt-2 space-y-4">
          {runDetails.pluginRuns.map((pluginRun) => (
            <div key={pluginRun.id} className="border p-3 rounded-md">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">{pluginRun.stepId}</p>
                <Badge
                  variant={
                    pluginRun.status === "completed" ? "default" : "destructive"
                  }
                >
                  {pluginRun.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Plugin: {pluginRun.pluginId}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
