import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { fetchProjects } from '../utils/projects'

export const Route = createFileRoute('/projects')({
  loader: async () => fetchProjects(),
  component: ProjectsComponent,
})

function ProjectsComponent() {
  const projects = Route.useLoaderData()

  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {[...projects, { id: 'i-do-not-exist', title: 'Non-existent Project' }].map(
          (project) => {
            return (
              <li key={project.id} className="whitespace-nowrap">
                <Link
                  to="/projects/$projectId"
                  params={{
                    projectId: project.id,
                  }}
                  className="block py-1 text-blue-800 hover:text-blue-600"
                  activeProps={{ className: 'text-black font-bold' }}
                >
                  <div>{project.title.substring(0, 20)}</div>
                </Link>
              </li>
            )
          },
        )}
      </ul>
      <hr />
      <Outlet />
    </div>
  )
}
