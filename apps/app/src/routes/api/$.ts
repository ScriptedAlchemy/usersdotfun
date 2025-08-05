import { createServerFileRoute } from '@tanstack/react-start/server';
import { auth } from '~/lib/auth';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001'

async function proxyHandler({ request, params }: { request: Request; params: { _splat?: string } }) {
  const session = await auth.api.getSession({ headers: request.headers })
  const path = params._splat || ''

  // If no session for protected routes, return 401 immediately
  if (!session?.user) {
    return new Response(JSON.stringify({
      error: { message: 'Unauthorized - please sign in' }
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const gatewayUrl = `${GATEWAY_URL}/api/${path}`

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      // Always add auth headers when we have a session
      'x-user-id': session.user.id,
      'x-user-role': (session.user as any).role || 'user',
      'x-is-anonymous': (session.user as any).isAnonymous?.toString() || 'false',
    },
  }

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
    fetchOptions.body = request.body
      ; (fetchOptions as any).duplex = 'half'
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