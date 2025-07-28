import { Hono } from 'hono'
import { jobsRouter } from './routes/jobs'
import { loggerMiddleware } from './middleware/logger'
import { errorMiddleware } from './middleware/error'

const app = new Hono()

app.use('*', loggerMiddleware)
app.use('*', errorMiddleware)

app.get('/', (c) => c.text('Jobs API'))
app.route('/api/jobs', jobsRouter)

const port = parseInt(process.env.PORT || '3001')

console.log(`Server is running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
