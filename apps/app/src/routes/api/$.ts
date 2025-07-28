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
  'queues/jobs': 15000,        // 15 seconds for all jobs
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
    'queues/jobs',
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
      console.log(`Cache hit for ${cacheKey}`)
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
      console.log(`Request deduplication for ${cacheKey}`)
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
        
        console.log(`Cached response for ${cacheKey} with TTL ${ttl}ms`)
        
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

// Cache invalidation patterns for WebSocket events
const CACHE_INVALIDATION_PATTERNS = {
  'queue:status-changed': ['queues/status', 'queues/'],
  'queue:item-added': ['queues/status', 'queues/jobs', 'queues/'],
  'queue:item-completed': ['queues/status', 'queues/jobs', 'queues/'],
  'queue:item-failed': ['queues/status', 'queues/jobs', 'queues/'],
  'queue:item-removed': ['queues/status', 'queues/jobs', 'queues/', 'jobs'],
  'queue:paused': ['queues/status', 'queues/'],
  'queue:resumed': ['queues/status', 'queues/'],
  'queue:cleared': ['queues/status', 'queues/jobs', 'queues/'],
  'job:status-changed': ['jobs', 'queues/jobs'],
  'job:run-started': ['jobs', 'queues/jobs'],
  'job:run-completed': ['jobs', 'queues/jobs'],
  'job:deleted': ['jobs', 'queues/jobs', 'queues/status', 'queues/'],
}

// Function to invalidate cache based on patterns
function invalidateCacheByPatterns(patterns: string[]) {
  let invalidatedCount = 0
  for (const [key, entry] of cache.entries()) {
    const path = key.split(':')[1] // Extract path from cache key
    if (patterns.some(pattern => path?.includes(pattern))) {
      cache.delete(key)
      invalidatedCount++
    }
  }
  if (invalidatedCount > 0) {
    console.log(`Invalidated ${invalidatedCount} cache entries`)
  }
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

// WebSocket event handler for cache invalidation
async function handleWebSocketCacheInvalidation({ request, params }: { request: Request; params: { _splat?: string } }) {
  if (request.method !== 'POST' || params._splat !== 'cache/invalidate') {
    return new Response('Not Found', { status: 404 })
  }

  try {
    const body = await request.json()
    const { eventType } = body

    const patterns = CACHE_INVALIDATION_PATTERNS[eventType as keyof typeof CACHE_INVALIDATION_PATTERNS]
    if (patterns) {
      invalidateCacheByPatterns(patterns)
      return new Response(JSON.stringify({ success: true, invalidated: patterns }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown event type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function routeHandler(context: { request: Request; params: { _splat?: string } }) {
  // Handle cache invalidation endpoint
  if (context.params._splat === 'cache/invalidate') {
    return handleWebSocketCacheInvalidation(context)
  }
  
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
