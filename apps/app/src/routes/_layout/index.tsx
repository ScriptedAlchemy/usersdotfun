import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, ListTodo, Workflow } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { allQueueJobsQueryOptions, workflowsQueryOptions } from "~/lib/queries";

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: workflows, isLoading: workflowsLoading } = useQuery(
    workflowsQueryOptions
  );
  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    ...allQueueJobsQueryOptions({ limit: 10 }),
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your workflow automation system
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Workflows</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create and manage your automated workflows
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {workflowsLoading
                  ? "Loading..."
                  : `${workflows?.length || 0} workflows`}
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/workflows">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Queues</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor and control your job queues
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {jobsLoading
                  ? "Loading..."
                  : `${recentJobs?.items?.length || 0} recent jobs`}
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/queues">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">System Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Overall system health and activity
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="default" className="bg-green-500">
                Operational
              </Badge>
              <div className="text-sm text-muted-foreground">
                All systems running
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/queues">View All Jobs</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading recent activity...
              </div>
            ) : !recentJobs?.items?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity found
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.items.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs text-muted-foreground">
                        {job.id.slice(0, 8)}...
                      </div>
                      <div className="text-sm">{job.name}</div>
                      {job.data.workflowId && (
                        <Link
                          to="/workflows/$workflowId"
                          params={{ workflowId: job.data.workflowId }}
                          className="text-xs text-primary hover:underline"
                        >
                          {job.data.workflowId.slice(0, 8)}...
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        {new Date(job.timestamp).toLocaleString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {job.attemptsMade} attempts
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
