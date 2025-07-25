import { Link, createFileRoute } from '@tanstack/react-router'
import { fetchProject } from '../utils/projects'
import { NotFound } from '~/components/NotFound'
import { ProjectErrorComponent } from '~/components/ProjectError'

export const Route = createFileRoute('/projects/$projectId')({
  loader: ({ params: { projectId } }) => fetchProject({ data: projectId }),
  errorComponent: ProjectErrorComponent,
  component: ProjectComponent,
  notFoundComponent: () => {
    return <NotFound>Project not found</NotFound>
  },
})

function ProjectComponent() {
  const project = Route.useLoaderData()

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{project.title}</h4>
      <div className="text-sm">{project.body}</div>
      <Link
        to="/projects/$projectId/deep"
        params={{
          projectId: project.id,
        }}
        activeProps={{ className: 'text-black font-bold' }}
        className="inline-block py-1 text-blue-800 hover:text-blue-600"
      >
        Deep View
      </Link>
    </div>
  )
}
