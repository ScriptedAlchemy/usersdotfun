import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { workflowsQueryOptions, queuesStatusQueryOptions, allQueueJobsQueryOptions } from "~/lib/queries";
import { Plus, Play, Pause, Settings } from "lucide-react";

export const Route = createFileRoute("/_layout/workflows/")({
  component: WorkflowsOverview,
});

function WorkflowsOverview() {
  const { data: workflows, isLoading: workflowsLoading } = useQuery(workflowsQueryOptions);
  const { data: queuesStatus, isLoading: queuesLoading } = useQuery(queuesStatusQueryOptions);
  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    ...allQueueJobsQueryOptions({ limit: 5 }),
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Outlet />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automated workflows
          </p>
        </div>
        <Button asChild>
          <Link to="/workflows/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflowsLoading ? "..." : workflows?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflowsLoading ? "..." : workflows?.filter(w => w.status === 'ACTIVE').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queue Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobsLoading ? "..." : recentJobs?.items?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queuesLoading ? "..." : queuesStatus?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active queues</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          {workflowsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading workflows...
            </div>
          ) : !workflows?.length ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No workflows found</p>
              <Button asChild>
                <Link to="/workflows/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Workflow
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <Link
                        to="/workflows/$workflowId"
                        params={{ workflowId: workflow.id }}
                        className="font-medium hover:underline"
                      >
                        {workflow.name}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(workflow.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={workflow.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {workflow.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      {workflow.schedule || 'Manual'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          to="/workflows/$workflowId/runs"
                          params={{ workflowId: workflow.id }}
                        >
                          <Play className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          to="/workflows/$workflowId/edit"
                          params={{ workflowId: workflow.id }}
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
