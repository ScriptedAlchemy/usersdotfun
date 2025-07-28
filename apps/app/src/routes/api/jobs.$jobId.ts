import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { z } from 'zod'
import { updateJobSchema } from '~/types/jobs'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000'

export const ServerRoute = createServerFileRoute('/api/jobs/$jobId')
  .methods({
    GET: async ({ params }) => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/jobs/${params.jobId}`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Gateway responded with an unknown error' }))
          return json({ error: `Gateway responded with ${res.status}`, details: errorData.error }, { status: res.status })
        }
        const data = await res.json()
        return json(data)
      } catch (error) {
        return json({ error: 'Failed to connect to gateway' }, { status: 500 })
      }
    },
    PUT: async ({ request, params }) => {
      try {
        const body = await request.json()
        const parsed = updateJobSchema.parse(body)
        const res = await fetch(`${GATEWAY_URL}/api/jobs/${params.jobId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Gateway responded with an unknown error' }))
          return json({ error: `Gateway responded with ${res.status}`, details: errorData.error }, { status: res.status })
        }
        const data = await res.json()
        return json(data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json({ error: z.treeifyError(error) }, { status: 400 })
        }
        return json({ error: 'Failed to connect to gateway' }, { status: 500 })
      }
    },
    DELETE: async ({ params }) => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/jobs/${params.jobId}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Gateway responded with an unknown error' }))
          return json({ error: `Gateway responded with ${res.status}`, details: errorData.error }, { status: res.status })
        }
        return new Response(null, { status: 204 })
      } catch (error) {
        return json({ error: 'Failed to connect to gateway' }, { status: 500 })
      }
    }
  })
