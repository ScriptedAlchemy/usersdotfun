import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_layout/dashboard/workflows/$workflowId/_layout',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/dashboard/workflows/$workflowId/_layout"!</div>
}
