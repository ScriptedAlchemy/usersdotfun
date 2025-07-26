import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { fetchJobs } from '../utils/jobs'

export const Route = createFileRoute('/jobs')({
  loader: async () => fetchJobs(),
  component: JobsComponent,
})

function JobsComponent() {
  const jobs = Route.useLoaderData()

  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {jobs.map(
          (job) => {
            return (
              <li key={job.id} className="whitespace-nowrap">
                <Link
                  to="/jobs/$jobId"
                  params={{
                    jobId: job.id,
                  }}
                  className="block py-1 text-blue-800 hover:text-blue-600"
                  activeProps={{ className: 'text-black font-bold' }}
                >
                  <div>{job.name.substring(0, 20)}</div>
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
