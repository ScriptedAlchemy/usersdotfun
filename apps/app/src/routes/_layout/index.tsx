import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
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
      </div>
    </div>
  );
}
