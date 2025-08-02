import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_layout/workflows/$workflowId/runs/$runId/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>Hello "/_layout/workflows/$workflowId/runs/$runId/"!</div>
  )
}
