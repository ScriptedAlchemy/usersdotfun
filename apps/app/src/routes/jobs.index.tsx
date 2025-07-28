import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/jobs/')({
  component: JobsIndexComponent,
})

function JobsIndexComponent() {
  return <div className="p-2">Select a job to view details.</div>
}
