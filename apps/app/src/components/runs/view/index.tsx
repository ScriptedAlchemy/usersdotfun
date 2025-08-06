import type { RichWorkflowRun } from "@usersdotfun/shared-types/types";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import {
  workflowRunStatusColors,
  pluginRunStatusColors,
} from "~/lib/status-colors";

interface RunViewProps {
  data: RichWorkflowRun;
}

export function RunView({ data }: RunViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Run Overview</h3>
        <Button asChild variant="outline">
          <Link
            to="/workflows/$workflowId/items"
            params={{ workflowId: data.workflowId }}
          >
            View Items
          </Link>
        </Button>
      </div>
      <div>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div className="font-semibold">Status</div>
          <div>
            <Badge variant={workflowRunStatusColors[data.status]}>
              {data.status}
            </Badge>
          </div>
          <div className="font-semibold">Triggered By</div>
          <div>{data.user?.name ?? "N/A"}</div>
          <div className="font-semibold">Items Processed</div>
          <div>
            {data.itemsProcessed} / {data.itemsTotal}
          </div>
          <div className="font-semibold">Started At</div>
          <div>{new Date(data.startedAt).toLocaleString()}</div>
          <div className="font-semibold">Completed At</div>
          <div>
            {data.completedAt
              ? new Date(data.completedAt).toLocaleString()
              : "N/A"}
          </div>
        </div>
      </div>
      <div>
        <h3 className="font-medium">
          Plugin Runs ({data.pluginRuns.length})
        </h3>
        <div className="mt-2 space-y-4">
          {data.pluginRuns.map((pluginRun) => (
            <div key={pluginRun.id} className="border p-3 rounded-md">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">{pluginRun.stepId}</p>
                <Badge variant={pluginRunStatusColors[pluginRun.status]}>
                  {pluginRun.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Plugin: {pluginRun.pluginId}
              </p>
              <Tabs defaultValue="input" className="mt-4">
                <TabsList>
                  <TabsTrigger value="input">Input</TabsTrigger>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="config">Config</TabsTrigger>
                  <TabsTrigger value="error">Error</TabsTrigger>
                </TabsList>
                <TabsContent value="input">
                  <pre className="p-2 bg-gray-100 rounded-md text-xs">
                    {JSON.stringify(pluginRun.input, null, 2)}
                  </pre>
                </TabsContent>
                <TabsContent value="output">
                  <pre className="p-2 bg-gray-100 rounded-md text-xs">
                    {JSON.stringify(pluginRun.output, null, 2)}
                  </pre>
                </TabsContent>
                <TabsContent value="config">
                  <pre className="p-2 bg-gray-100 rounded-md text-xs">
                    {JSON.stringify(pluginRun.config, null, 2)}
                  </pre>
                </TabsContent>
                <TabsContent value="error">
                  <pre className="p-2 bg-gray-100 rounded-md text-xs">
                    {JSON.stringify(pluginRun.error, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
