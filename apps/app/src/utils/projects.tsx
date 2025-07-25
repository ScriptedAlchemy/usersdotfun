import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

export type ProjectType = {
  id: string
  title: string
  body: string
}

export const fetchProject = createServerFn()
  .validator((d: string) => d)
  .handler(async ({ data }) => {
    console.info(`Fetching project with id ${data}...`)
    const res = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${data}`,
    )
    if (!res.ok) {
      if (res.status === 404) {
        throw notFound()
      }

      throw new Error('Failed to fetch project')
    }

    const project = (await res.json()) as ProjectType

    return project
  })

export const fetchProjects = createServerFn().handler(async () => {
  console.info('Fetching projects...')
  const res = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!res.ok) {
    throw new Error('Failed to fetch projects')
  }

  const projects = (await res.json()) as Array<ProjectType>

  return projects.slice(0, 10)
})
