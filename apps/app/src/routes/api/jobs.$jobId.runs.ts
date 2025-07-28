import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000'

export const ServerRoute = createServerFileRoute('/api/jobs/$jobId/runs')
  .methods({
    GET: async ({ params }) => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/jobs/${params.jobId}/runs`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Gateway responded with an unknown error' }))
          return json({ error: `Gateway responded with ${res.status}`, details: errorData.error }, { status: res.status })
        }
        const data = await res.json()
        return json(data)
      } catch (error) {
        return json({ error: 'Failed to connect to gateway' }, { status: 500 })
      }
    }
  })
