import { Link, createFileRoute } from '@tanstack/react-router'
import { fetchProject } from '../utils/projects'
import { ProjectErrorComponent } from '~/components/ProjectError'

export const Route = createFileRoute('/projects_/$projectId/deep')({
  loader: async ({ params: { projectId } }) =>
    fetchProject({
      data: projectId,
    }),
  errorComponent: ProjectErrorComponent,
  component: ProjectDeepComponent,
})

function ProjectDeepComponent() {
  const project = Route.useLoaderData()

  return (
    <div className="p-2 space-y-2">
      <Link
        to="/projects"
        className="block py-1 text-blue-800 hover:text-blue-600"
      >
        ← All Projects
      </Link>
      <h4 className="text-xl font-bold underline">{project.title}</h4>
      <div className="text-sm">{project.body}</div>
    </div>
  )
}
