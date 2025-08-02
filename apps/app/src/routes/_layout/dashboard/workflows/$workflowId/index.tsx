import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/dashboard/workflows/$workflowId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/_layout/dashboard/workflows/$workflowId/runs",
      params,
    });
  },
});
