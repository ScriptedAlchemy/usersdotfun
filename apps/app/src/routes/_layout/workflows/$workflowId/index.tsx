import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/workflows/$workflowId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/workflows/$workflowId/runs",
      params,
    });
  },
});
