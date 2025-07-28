import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { rateLimiter } from 'hono-rate-limiter'
import { authMiddleware } from './middleware/auth'
import { jobsRouter } from './routes/jobs'
import './types/hono' // Import type declarations

const app = new Hono()

// Global middleware stack
app.use('*', logger())

app.use('*', cors({
  origin: [
    'http://localhost:3000', 
    process.env.APP_URL || 'https://yourapp.com'
  ],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

app.use('*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  keyGenerator: (c) => {
    const user = c.get('user') as any
    return user?.id || c.req.header('x-forwarded-for') || 'anonymous'
  }
}))

app.use('*', authMiddleware)

// Routes
app.get('/', (c) => c.text('Jobs API'))
app.route('/api/jobs', jobsRouter)

const port = parseInt(process.env.PORT || '3001')
console.log(`Gateway running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
