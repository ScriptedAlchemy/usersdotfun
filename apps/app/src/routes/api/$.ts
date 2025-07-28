import { createServerFileRoute } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001'

async function proxyHandler({ request, params }: { request: Request; params: { _splat?: string } }) {
  // Validate session before proxying
  const session = await auth.api.getSession({ headers: request.headers })
  
  if (!session?.session) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Forward to Hono gateway with validated session
  const gatewayUrl = `${GATEWAY_URL}/api/${params._splat || ''}`
  
  try {
    const response = await fetch(gatewayUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'x-user-id': session.user.id,
        'x-user-role': (session.user as any).role || 'user',
      },
      body: request.body,
    })

    // Return the response as-is, preserving status and headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch (error) {
    console.error('Gateway proxy error:', error)
    return new Response(JSON.stringify({ error: 'Failed to connect to gateway' }), {
      status: 500,
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
