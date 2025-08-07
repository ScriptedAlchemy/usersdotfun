import { Hono } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authMiddleware } from './middleware/auth'
import { queuesRouter } from './routes/queues'
import websocketRoutes, { websocket } from './routes/websocket'
import { workflowsRouter } from './routes/workflows'
import { runsRouter } from './routes/runs'
import './types/hono'
import type { AppType } from './types/hono'

const app = new Hono<AppType>()

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

app.use('*', authMiddleware);
app.use('*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 100,
  keyGenerator: (c: any) => {
    const user = c.var.user;
    return user?.id || c.req.header('x-forwarded-for') || 'anonymous'
  }
}));

// Routes
app.get('/', (c) => c.text('Gateway API'))
app.route('/api/workflows', workflowsRouter)
app.route('/api/runs', runsRouter)
app.route('/api/queues', queuesRouter)
app.route('/api/ws', websocketRoutes)

const port = parseInt(process.env.PORT || '3001')
console.log(`Gateway running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
  websocket,
}
