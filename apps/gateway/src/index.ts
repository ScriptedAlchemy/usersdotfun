import { Hono } from 'hono'
import { jobsRouter } from './routes/jobs'

const app = new Hono()

app.get('/', (c) => c.text('Jobs API'))
app.route('/api/jobs', jobsRouter)

export default app