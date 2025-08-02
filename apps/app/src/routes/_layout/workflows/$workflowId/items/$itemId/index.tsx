import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_layout/workflows/$workflowId/items/$itemId/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>Hello "/_layout/workflows/$workflowId/items/$itemId/"!</div>
  )
}
