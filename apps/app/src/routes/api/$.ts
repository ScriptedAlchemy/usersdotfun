import { createServerFileRoute } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3001'

// In-memory cache with TTL
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry>()
const pendingRequests = new Map<string, Promise<Response>>()

// Cache TTL configurations (in milliseconds)
const CACHE_CONFIG = {
  'queues/status': 10000,      // 10 seconds for queue status
  'queues/workflows': 15000,        // 15 seconds for all jobs
  'jobs': 30000,               // 30 seconds for jobs list
  'default': 5000              // 5 seconds default
}

function getCacheTTL(path: string): number {
  for (const [pattern, ttl] of Object.entries(CACHE_CONFIG)) {
    if (path.includes(pattern)) {
      return ttl
    }
  }
  return CACHE_CONFIG.default
}

function getCacheKey(method: string, path: string, userId?: string): string {
  return `${method}:${path}:${userId || 'anonymous'}`
}

function isValidCacheEntry(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl
}

function shouldCache(method: string, path: string): boolean {
  // Only cache GET requests for specific endpoints
  if (method !== 'GET') return false
  
  const cachablePatterns = [
    'queues/status',
    'queues/workflows',
    'jobs',
    'queues/'
  ]
  
  return cachablePatterns.some(pattern => path.includes(pattern))
}

async function proxyHandler({ request, params }: { request: Request; params: { _splat?: string } }) {
  // Check for existing session (don't create new ones automatically)
  const session = await auth.api.getSession({ headers: request.headers })
  
  const path = params._splat || ''
  const method = request.method
  const userId = session?.user?.id
  const cacheKey = getCacheKey(method, path, userId)
  
  // Check cache for GET requests
  if (shouldCache(method, path)) {
    const cachedEntry = cache.get(cacheKey)
    if (cachedEntry && isValidCacheEntry(cachedEntry)) {
      return new Response(JSON.stringify(cachedEntry.data), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      })
    }
    
    // Check if request is already pending (deduplication)
    const pendingRequest = pendingRequests.get(cacheKey)
    if (pendingRequest) {
      return pendingRequest
    }
  }
  
  const gatewayUrl = `${GATEWAY_URL}/api/${path}`
  
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

  const executeRequest = async (): Promise<Response> => {
    try {
      const response = await fetch(gatewayUrl, fetchOptions)
      
      if (response.ok && shouldCache(method, path)) {
        const responseData = await response.json()
        
        // Cache the response
        const ttl = getCacheTTL(path)
        cache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now(),
          ttl
        })
        
        return new Response(JSON.stringify(responseData), {
          status: response.status,
          statusText: response.statusText,
          headers: { 
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS'
          }
        })
      }
      
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
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey)
    }
  }

  // For cacheable requests, add to pending requests map
  if (shouldCache(method, path)) {
    const requestPromise = executeRequest()
    pendingRequests.set(cacheKey, requestPromise)
    return requestPromise
  }

  return executeRequest()
}


// Cache cleanup - remove expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  let cleanedCount = 0
  for (const [key, entry] of cache.entries()) {
    if (!isValidCacheEntry(entry)) {
      cache.delete(key)
      cleanedCount++
    }
  }
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired cache entries`)
  }
}, 5 * 60 * 1000)

async function routeHandler(context: { request: Request; params: { _splat?: string } }) {
  // Handle regular proxy requests
  return proxyHandler(context)
}

export const ServerRoute = createServerFileRoute('/api/$').methods({
  GET: routeHandler,
  POST: routeHandler,
  PUT: routeHandler,
  DELETE: routeHandler,
  PATCH: routeHandler,
})
