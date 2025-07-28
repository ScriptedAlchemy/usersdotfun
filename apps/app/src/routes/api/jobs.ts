import { json } from '@tanstack/react-start';
import { createServerFileRoute } from '@tanstack/react-start/server';
import { z } from "zod";
import { createJobSchema } from '~/types/jobs';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000'

export const ServerRoute = createServerFileRoute('/api/jobs')
  .methods({
    GET: async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/jobs`)
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
    POST: async ({ request }) => {
      try {
        const body = await request.json()
        const parsed = createJobSchema.parse(body)
        const res = await fetch(`${GATEWAY_URL}/api/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Gateway responded with an unknown error' }))
          return json({ error: `Gateway responded with ${res.status}`, details: errorData.error }, { status: res.status })
        }
        const data = await res.json()
        return json(data, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return json({ error: error.format() }, { status: 400 })
        }
        return json({ error: 'Failed to connect to gateway' }, { status: 500 })
      }
    }
  })
