import { auth } from './auth'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001'

export async function authenticatedFetch(request: Request, path: string, options?: RequestInit) {
  const session = await auth.api.getSession({ headers: request.headers })
  
  if (!session?.session) {
    throw new Error('Authentication required')
  }

  const cookieHeader = request.headers.get('cookie')
  
  return fetch(`${GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
      'Cookie': cookieHeader || '',
    }
  })
}

export function handleGatewayError(error: unknown) {
  if (error instanceof Error && error.message === 'Authentication required') {
    return { error: 'Authentication required', status: 401 }
  }
  return { error: 'Failed to connect to gateway', status: 500 }
}
