import { createServerFileRoute } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001'

async function proxyHandler({ request, params }: { request: Request; params: { _splat?: string } }) {
  // Check for existing session (don't create new ones automatically)
  const session = await auth.api.getSession({ headers: request.headers })
  
  const gatewayUrl = `${GATEWAY_URL}/api/${params._splat || ''}`
  
  const fetchOptions: RequestInit = {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
    },
  }

  // Only add user context if session exists
  if (session?.session && session?.user) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'x-user-id': session.user.id,
      'x-user-role': (session.user as any).role || 'user',
      'x-is-anonymous': (session.user as any).isAnonymous?.toString() || 'false',
    }
  }

  // Add body for non-GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    fetchOptions.body = request.body
    ;(fetchOptions as any).duplex = 'half'
  }

  try {
    const response = await fetch(gatewayUrl, fetchOptions)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch (error) {
    console.error('Gateway proxy error:', error)
    return new Response(JSON.stringify({ error: 'Gateway unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const ServerRoute = createServerFileRoute('/api/$').methods({
  GET: proxyHandler,
  POST: proxyHandler,
  PUT: proxyHandler,
  DELETE: proxyHandler,
  PATCH: proxyHandler,
})
