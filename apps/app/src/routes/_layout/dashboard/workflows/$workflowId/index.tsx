import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/dashboard/workflows/$workflowId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/dashboard/workflows/$workflowId/runs",
      params,
    });
  },
});
