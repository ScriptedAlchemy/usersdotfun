import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/_dashboard"!</div>
}
