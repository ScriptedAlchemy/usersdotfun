import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your dashboard. Manage your workflows and queues from here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Workflows</h2>
          <p className="text-muted-foreground mb-4">
            Create and manage your automated workflows.
          </p>
          <a
            href="/workflows"
            className="text-primary hover:underline"
          >
            View Workflows →
          </a>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Queues</h2>
          <p className="text-muted-foreground mb-4">
            Monitor and control your job queues.
          </p>
          <a
            href="/queues"
            className="text-primary hover:underline"
          >
            View Queues →
          </a>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <p className="text-muted-foreground mb-4">
            View performance metrics and insights.
          </p>
          <span className="text-muted-foreground text-sm">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
